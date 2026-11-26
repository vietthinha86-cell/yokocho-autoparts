import cors from "cors";
import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import {
  adviseGarageAi,
  clearAiDiagnosticsCache,
  generateAdminProductDraft,
  getAiEngineStatus,
  matchesSmartProductQuery,
  testLiveAiConnection,
  type AiModePreference,
  type DrivingProfile,
} from "./ai/akariAdvisor.ts";
import { maskSecret, upsertEnvVars } from "./envLoader.ts";
import {
  createRequireAdminAuth,
  createRequireCustomerAuth,
  extractOptionalCustomer,
  hashPassword,
  normalizeEmail,
  normalizePhone,
  signAdminToken,
  signCustomerToken,
  verifyPassword,
} from "./auth/adminAuth.ts";
import { createSignedMediaUpload } from "./integrations/mediaSigner.ts";
import {
  extractOrderCodeFromMemo,
  NotificationDispatcher,
  verifyWebhookSignature,
} from "./integrations/notifications.ts";
import { JsonRepository } from "./store/jsonRepository.ts";
import { PrismaRepository } from "./store/prismaRepository.ts";
import { toPublicCustomer, type GarageRepository } from "./store/repository.ts";
import type {
  AutoPartProduct,
  BeamModeChoice,
  BookingStatus,
  CustomerGarageVehicle,
  GarageBranchId,
  InstallationBookingRecord,
  InstallationServiceType,
  OrderItemInput,
  OrderItemRecord,
  OrderRecord,
  PartCategory,
  ProductReviewRecord,
  ReviewStatus,
  StockStatus,
  VoucherDiscountType,
  VoucherRecord,
} from "./types.ts";

export interface AppOptions {
  ordersFilePath?: string;
  repository?: GarageRepository;
  jwtSecret?: string;
  webhookSecret?: string;
}

const FREE_SHIPPING_THRESHOLD_VND = 3_000_000;
const STANDARD_SHIPPING_FEE_VND = 45_000;
const VALID_CATEGORIES: PartCategory[] = [
  "bi-led",
  "bi-fog",
  "tail-light",
  "chassis-brake",
  "jdm-aero",
];
const VALID_STOCK_STATUS: StockStatus[] = ["in_stock", "low_stock", "jdm_preorder"];
const VALID_ORDER_STATUS: OrderRecord["status"][] = [
  "pending_confirm",
  "packed",
  "shipping",
  "completed",
];
const VALID_REVIEW_STATUS: ReviewStatus[] = ["pending", "approved", "rejected"];
const VALID_BEAM_MODES: BeamModeChoice[] = ["3000k", "4300k", "6000k", "combo"];
const VALID_BRANCHES: GarageBranchId[] = ["hcm_q7", "hcm_binhthanh", "hn_caugiay"];
const VALID_SERVICE_TYPES: InstallationServiceType[] = [
  "bi_led_retrofit",
  "bi_fog_install",
  "tail_light_plug",
  "combo_full_night",
  "beam_alignment",
];
const VALID_BOOKING_STATUS: BookingStatus[] = [
  "pending",
  "confirmed",
  "in_bay",
  "completed",
  "cancelled",
];
const BOOKING_TIME_SLOTS = ["09:00", "11:00", "14:00", "16:30", "19:00"] as const;
const MAX_BAYS_PER_SLOT = 2;

function generateBookingCode(): string {
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const timePart = Date.now().toString().slice(-4);
  return `BK-${timePart}-${randomPart}`;
}

function evaluateVoucher(
  voucher: VoucherRecord | null,
  subtotalVnd: number,
):
  | { valid: true; voucher: VoucherRecord; discountVnd: number }
  | { valid: false; error: string } {
  if (!voucher) {
    return { valid: false, error: "Mã giảm giá không tồn tại trên hệ thống." };
  }
  if (!voucher.active) {
    return { valid: false, error: `Mã ${voucher.code} hiện đang tạm ngưng.` };
  }
  if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < Date.now()) {
    return { valid: false, error: `Mã ${voucher.code} đã hết hạn sử dụng.` };
  }
  if (typeof voucher.usageLimit === "number" && voucher.usedCount >= voucher.usageLimit) {
    return { valid: false, error: `Mã ${voucher.code} đã hết lượt sử dụng.` };
  }
  if (subtotalVnd < voucher.minOrderVnd) {
    return {
      valid: false,
      error: `Mã ${voucher.code} áp dụng cho đơn từ ${new Intl.NumberFormat("vi-VN").format(voucher.minOrderVnd)}₫.`,
    };
  }
  let discountVnd = 0;
  if (voucher.discountType === "percent") {
    discountVnd = Math.round((subtotalVnd * voucher.discountValue) / 100);
    if (typeof voucher.maxDiscountVnd === "number" && voucher.maxDiscountVnd > 0) {
      discountVnd = Math.min(discountVnd, voucher.maxDiscountVnd);
    }
  } else {
    discountVnd = voucher.discountValue;
  }
  discountVnd = Math.max(0, Math.min(subtotalVnd, discountVnd));
  return { valid: true, voucher, discountVnd };
}

function sanitizeReviewPhotoUrl(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("/images/")) return trimmed;
  if (trimmed.startsWith("https://") && trimmed.length <= 500) return trimmed;
  if (
    /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed) &&
    trimmed.length <= 700_000
  ) {
    return trimmed;
  }
  return undefined;
}

function generateOrderCode(): string {
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const timePart = Date.now().toString().slice(-4);
  return `YKC-${timePart}-${randomPart}`;
}

function readParam(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

function sanitizeGarageVehicle(raw: unknown): CustomerGarageVehicle | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const make = typeof obj.make === "string" ? obj.make.trim().slice(0, 40) : "";
  const model = typeof obj.model === "string" ? obj.model.trim().slice(0, 60) : "";
  const year = typeof obj.year === "string" ? obj.year.trim().slice(0, 16) : "";
  if (!make || !model) return null;
  return {
    id:
      typeof obj.id === "string" && obj.id.trim()
        ? obj.id.trim().slice(0, 48)
        : `veh-${crypto.randomUUID().slice(0, 8)}`,
    make,
    model,
    year: year || "Mọi đời",
    nickname:
      typeof obj.nickname === "string" && obj.nickname.trim()
        ? obj.nickname.trim().slice(0, 60)
        : undefined,
    note:
      typeof obj.note === "string" && obj.note.trim()
        ? obj.note.trim().slice(0, 160)
        : undefined,
  };
}

function sanitizeGarageList(raw: unknown): CustomerGarageVehicle[] {
  if (!Array.isArray(raw)) return [];
  const items: CustomerGarageVehicle[] = [];
  for (const entry of raw) {
    const clean = sanitizeGarageVehicle(entry);
    if (clean) items.push(clean);
    if (items.length >= 10) break;
  }
  return items;
}

export function createApp(options: AppOptions = {}) {
  const app = express();

  let repo: GarageRepository;
  if (options.repository) {
    repo = options.repository;
  } else if (!options.ordersFilePath && process.env.DATABASE_URL?.trim()) {
    repo = new PrismaRepository();
  } else {
    const filePath =
      options.ordersFilePath ??
      path.resolve(process.cwd(), "data", "store.runtime.json");
    repo = new JsonRepository(filePath);
  }

  const requireAdmin = createRequireAdminAuth(options.jwtSecret);
  const requireCustomer = createRequireCustomerAuth(options.jwtSecret);
  const notifier = new NotificationDispatcher();

  app.use(cors());
  app.use(
    express.json({
      limit: "6mb",
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: string }).rawBody = buf.toString("utf8");
      },
    }),
  );

  // --- Public Storefront & Catalog Endpoints ---
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "akari-yokocho-autoparts-api",
      storageDriver: repo.driverName,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/fitments", async (_req, res, next) => {
    try {
      const items = await repo.listFitments();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/combos", async (_req, res, next) => {
    try {
      const items = await repo.listCombos();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/products", async (req, res, next) => {
    try {
      const category =
        typeof req.query.category === "string" ? req.query.category.trim() : "";
      const make =
        typeof req.query.make === "string" ? req.query.make.trim().toLowerCase() : "";
      const kelvin =
        typeof req.query.kelvin === "string" ? req.query.kelvin.trim().toLowerCase() : "";
      const stock =
        typeof req.query.stock === "string" ? req.query.stock.trim() : "";
      const minPrice = Number(req.query.minPrice);
      const maxPrice = Number(req.query.maxPrice);
      const sort = typeof req.query.sort === "string" ? req.query.sort.trim() : "";
      const query =
        typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";

      const [catalog, fitments] = await Promise.all([
        repo.listProducts(),
        repo.listFitments(),
      ]);
      const filtered = catalog.filter((part) => {
        if (category && category !== "all" && part.category !== category) {
          return false;
        }
        if (
          make &&
          !part.compatibleVehicles.some((v) => v.toLowerCase() === make)
        ) {
          return false;
        }
        if (kelvin) {
          const hasKelvin = (part.specs.kelvin ?? []).some((k) =>
            k.toLowerCase().includes(kelvin),
          );
          if (!hasKelvin) return false;
        }
        if (stock && stock !== "all" && part.stockStatus !== stock) {
          return false;
        }
        if (Number.isFinite(minPrice) && minPrice > 0 && part.priceVnd < minPrice) {
          return false;
        }
        if (Number.isFinite(maxPrice) && maxPrice > 0 && part.priceVnd > maxPrice) {
          return false;
        }
        if (query && !matchesSmartProductQuery(part, query, fitments)) {
          return false;
        }
        return true;
      });

      const sorted = [...filtered];
      if (sort === "price_asc") {
        sorted.sort((a, b) => a.priceVnd - b.priceVnd);
      } else if (sort === "price_desc") {
        sorted.sort((a, b) => b.priceVnd - a.priceVnd);
      }

      res.json({
        total: sorted.length,
        items: sorted,
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/products/:slug", async (req, res, next) => {
    try {
      const product = await repo.findProductBySlugOrId(req.params.slug);
      if (!product) {
        res.status(404).json({ error: "Không tìm thấy phụ tùng theo mã yêu cầu." });
        return;
      }
      res.json({ item: product });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/orders", async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const customerName =
        typeof body.customerName === "string" ? body.customerName.trim() : "";
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      const vehicleInfo =
        typeof body.vehicleInfo === "string" ? body.vehicleInfo.trim() : "";
      const shippingAddress =
        typeof body.shippingAddress === "string" ? body.shippingAddress.trim() : "";
      const note = typeof body.note === "string" ? body.note.trim() : undefined;
      const rawItems = Array.isArray(body.items)
        ? (body.items as OrderItemInput[])
        : [];

      if (!customerName || !phone || !shippingAddress) {
        res.status(400).json({
          error:
            "Vui lòng nhập đầy đủ tên khách hàng, số điện thoại và địa chỉ giao hàng.",
        });
        return;
      }

      if (rawItems.length === 0) {
        res.status(400).json({ error: "Giỏ hàng đang trống." });
        return;
      }

      const catalog = await repo.listProducts();
      const orderItems: OrderItemRecord[] = [];
      for (const item of rawItems) {
        const product = catalog.find((p) => p.id === item.productId);
        const quantity = Number(item.quantity);
        if (
          !product ||
          !Number.isInteger(quantity) ||
          quantity <= 0 ||
          quantity > 50
        ) {
          res.status(400).json({
            error: `Sản phẩm hoặc số lượng không hợp lệ (${String(item.productId)}).`,
          });
          return;
        }
        orderItems.push({
          productId: product.id,
          sku: product.sku,
          nameVi: product.nameVi,
          quantity,
          selectedKelvin: item.selectedKelvin,
          unitPriceVnd: product.priceVnd,
          lineTotalVnd: product.priceVnd * quantity,
        });
      }

      const subtotalVnd = orderItems.reduce(
        (sum, item) => sum + item.lineTotalVnd,
        0,
      );
      const rawVoucherCode =
        typeof body.voucherCode === "string" && body.voucherCode.trim()
          ? body.voucherCode.trim().toUpperCase()
          : undefined;
      let appliedVoucherCode: string | undefined;
      let discountVnd = 0;
      if (rawVoucherCode) {
        const foundVoucher = await repo.findVoucherByCode(rawVoucherCode);
        const evalResult = evaluateVoucher(foundVoucher, subtotalVnd);
        if (!evalResult.valid) {
          res.status(400).json({ error: evalResult.error });
          return;
        }
        appliedVoucherCode = evalResult.voucher.code;
        discountVnd = evalResult.discountVnd;
      }

      const shippingFeeVnd =
        subtotalVnd >= FREE_SHIPPING_THRESHOLD_VND ? 0 : STANDARD_SHIPPING_FEE_VND;
      const optionalCustomer = extractOptionalCustomer(req, options.jwtSecret);
      const order: OrderRecord = {
        orderCode: generateOrderCode(),
        customerId: optionalCustomer?.sub,
        customerName,
        phone,
        vehicleInfo: vehicleInfo || "Chưa cung cấp dòng xe",
        shippingAddress,
        note,
        items: orderItems,
        subtotalVnd,
        discountVnd,
        voucherCode: appliedVoucherCode,
        shippingFeeVnd,
        totalVnd: Math.max(0, subtotalVnd - discountVnd + shippingFeeVnd),
        paymentStatus: "unpaid",
        status: "pending_confirm",
        createdAt: new Date().toISOString(),
      };

      const created = await repo.createOrder(order);
      if (appliedVoucherCode) {
        await repo.incrementVoucherUsage(appliedVoucherCode);
      }
      void notifier.notifyOrderCreated(created);
      res.status(201).json({ item: created });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/orders/:orderCode", async (req, res, next) => {
    try {
      const order = await repo.findOrderByCode(req.params.orderCode);
      if (!order) {
        res.status(404).json({ error: "Không tìm thấy đơn hàng với mã này." });
        return;
      }
      res.json({ item: order });
    } catch (err) {
      next(err);
    }
  });

  // --- Public Vouchers & Validation (Phase 3.5) ---
  app.get("/api/vouchers/public", async (_req, res, next) => {
    try {
      const items = await repo.listVouchers({ activeOnly: true });
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/vouchers/validate", async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
      const subtotalVnd = Number(body.subtotalVnd ?? 0);
      if (!code) {
        res.status(400).json({ error: "Vui lòng nhập mã giảm giá." });
        return;
      }
      if (!Number.isFinite(subtotalVnd) || subtotalVnd <= 0) {
        res.status(400).json({ error: "Giá trị tạm tính không hợp lệ." });
        return;
      }
      const voucher = await repo.findVoucherByCode(code);
      const evalResult = evaluateVoucher(voucher, subtotalVnd);
      if (!evalResult.valid) {
        res.status(400).json({ valid: false, error: evalResult.error });
        return;
      }
      res.json({
        valid: true,
        voucher: evalResult.voucher,
        discountVnd: evalResult.discountVnd,
        finalSubtotalVnd: Math.max(0, subtotalVnd - evalResult.discountVnd),
      });
    } catch (err) {
      next(err);
    }
  });

  // --- Garage Installation Booking Slots & Reservations (Phase 3.5) ---
  app.get("/api/bookings/slots", async (req, res, next) => {
    try {
      const rawDate =
        typeof req.query.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date.trim())
          ? req.query.date.trim()
          : new Date().toISOString().slice(0, 10);
      const rawBranch =
        typeof req.query.branch === "string" ? req.query.branch.trim() : "hcm_q7";
      const branch: GarageBranchId = VALID_BRANCHES.includes(rawBranch as GarageBranchId)
        ? (rawBranch as GarageBranchId)
        : "hcm_q7";

      const existing = await repo.listBookings({ date: rawDate, branch });
      const activeBookings = existing.filter((b) => b.status !== "cancelled");

      const slots = BOOKING_TIME_SLOTS.map((timeSlot) => {
        const bookedCount = activeBookings.filter((b) => b.timeSlot === timeSlot).length;
        const remainingBays = Math.max(0, MAX_BAYS_PER_SLOT - bookedCount);
        return {
          timeSlot,
          bookedCount,
          remainingBays,
          available: remainingBays > 0,
        };
      });

      res.json({
        date: rawDate,
        branch,
        maxBaysPerSlot: MAX_BAYS_PER_SLOT,
        slots,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/bookings", async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const customerName =
        typeof body.customerName === "string" ? body.customerName.trim().slice(0, 80) : "";
      const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
      const phone = normalizePhone(rawPhone);
      const vehicleInfo =
        typeof body.vehicleInfo === "string" ? body.vehicleInfo.trim().slice(0, 100) : "";
      const garageBranch =
        typeof body.garageBranch === "string" ? body.garageBranch.trim() : "";
      const serviceType =
        typeof body.serviceType === "string" ? body.serviceType.trim() : "";
      const bookingDate =
        typeof body.bookingDate === "string" ? body.bookingDate.trim() : "";
      const timeSlot = typeof body.timeSlot === "string" ? body.timeSlot.trim() : "";
      const orderCode =
        typeof body.orderCode === "string" && body.orderCode.trim()
          ? body.orderCode.trim().toUpperCase().slice(0, 40)
          : undefined;
      const note =
        typeof body.note === "string" && body.note.trim()
          ? body.note.trim().slice(0, 260)
          : undefined;

      if (!customerName || phone.length < 9 || !vehicleInfo) {
        res.status(400).json({
          error: "Vui lòng nhập đầy đủ Họ tên, Số điện thoại hợp lệ và Dòng xe lắp đặt.",
        });
        return;
      }
      if (!VALID_BRANCHES.includes(garageBranch as GarageBranchId)) {
        res.status(400).json({ error: "Cơ sở xưởng lắp đặt không hợp lệ." });
        return;
      }
      if (!VALID_SERVICE_TYPES.includes(serviceType as InstallationServiceType)) {
        res.status(400).json({ error: "Hạng mục dịch vụ lắp đặt không hợp lệ." });
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
        res.status(400).json({ error: "Ngày hẹn phải đúng định dạng YYYY-MM-DD." });
        return;
      }
      if (!BOOKING_TIME_SLOTS.includes(timeSlot as (typeof BOOKING_TIME_SLOTS)[number])) {
        res.status(400).json({ error: "Khung giờ hẹn không hợp lệ." });
        return;
      }

      const sameDayBookings = await repo.listBookings({
        date: bookingDate,
        branch: garageBranch as GarageBranchId,
      });
      const bookedInSlot = sameDayBookings.filter(
        (b) => b.timeSlot === timeSlot && b.status !== "cancelled",
      ).length;
      if (bookedInSlot >= MAX_BAYS_PER_SLOT) {
        res.status(409).json({
          error: `Khung giờ ${timeSlot} ngày ${bookingDate} đã kín khoang lắp. Vui lòng chọn khung giờ khác.`,
        });
        return;
      }

      const optionalCustomer = extractOptionalCustomer(req, options.jwtSecret);
      const now = new Date().toISOString();
      const booking: InstallationBookingRecord = {
        id: `bk-${crypto.randomUUID().slice(0, 8)}`,
        bookingCode: generateBookingCode(),
        customerId: optionalCustomer?.sub,
        orderCode,
        customerName,
        phone,
        vehicleInfo,
        garageBranch: garageBranch as GarageBranchId,
        serviceType: serviceType as InstallationServiceType,
        bookingDate,
        timeSlot,
        note,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };

      const created = await repo.createBooking(booking);
      res.status(201).json({ item: created });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/bookings/:bookingCode", async (req, res, next) => {
    try {
      const booking = await repo.findBookingByCode(req.params.bookingCode);
      if (!booking) {
        res.status(404).json({ error: "Không tìm thấy lịch hẹn lắp đặt với mã này." });
        return;
      }
      res.json({ item: booking });
    } catch (err) {
      next(err);
    }
  });

  // --- Customer Reviews & Real Installation Photos (Phase 3 v8) ---
  app.get("/api/reviews", async (req, res, next) => {
    try {
      const productId =
        typeof req.query.productId === "string" ? req.query.productId.trim() : undefined;
      const items = await repo.listReviews({
        productId: productId || undefined,
        status: "approved",
      });
      const total = items.length;
      const averageRating =
        total > 0
          ? Number(
              (items.reduce((sum, item) => sum + item.rating, 0) / total).toFixed(1),
            )
          : 5.0;
      const verifiedCount = items.filter((item) => item.verifiedPurchase).length;
      res.json({ items, total, averageRating, verifiedCount });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/reviews", async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const productIdInput =
        typeof body.productId === "string" ? body.productId.trim() : "";
      const customerName =
        typeof body.customerName === "string" ? body.customerName.trim() : "";
      const vehicleInfo =
        typeof body.vehicleInfo === "string" ? body.vehicleInfo.trim() : "";
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const comment = typeof body.comment === "string" ? body.comment.trim() : "";
      const rating = Number(body.rating);
      const beamModeRaw =
        typeof body.beamMode === "string" ? body.beamMode.trim() : undefined;
      const beamMode =
        beamModeRaw && VALID_BEAM_MODES.includes(beamModeRaw as BeamModeChoice)
          ? (beamModeRaw as BeamModeChoice)
          : undefined;
      const orderCodeRaw =
        typeof body.orderCode === "string" && body.orderCode.trim()
          ? body.orderCode.trim().toUpperCase()
          : undefined;

      if (!productIdInput || !customerName || !vehicleInfo || comment.length < 8) {
        res.status(400).json({
          error:
            "Vui lòng chọn sản phẩm, nhập tên, dòng xe và cảm nhận tối thiểu 8 ký tự.",
        });
        return;
      }

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        res.status(400).json({ error: "Số sao đánh giá phải từ 1 đến 5." });
        return;
      }

      const product = await repo.findProductBySlugOrId(productIdInput);
      if (!product) {
        res.status(404).json({ error: "Sản phẩm đánh giá không tồn tại." });
        return;
      }

      const hasInvalidPhoto =
        typeof body.photoUrl === "string" &&
        body.photoUrl.trim().length > 0 &&
        !sanitizeReviewPhotoUrl(body.photoUrl);
      if (hasInvalidPhoto) {
        res.status(400).json({
          error: "Ảnh đính kèm phải là ảnh JPEG/PNG/WebP hợp lệ (dưới 500KB).",
        });
        return;
      }

      const matchedOrder = orderCodeRaw
        ? await repo.findOrderByCode(orderCodeRaw)
        : null;
      const optionalCustomer = extractOptionalCustomer(req, options.jwtSecret);

      const review: ProductReviewRecord = {
        id: `rev-${crypto.randomUUID().slice(0, 8)}`,
        productId: product.id,
        customerId: optionalCustomer?.sub,
        customerName: customerName.slice(0, 60),
        vehicleInfo: vehicleInfo.slice(0, 80),
        rating,
        title: (title || `Đánh giá thực tế trên ${vehicleInfo}`).slice(0, 120),
        comment: comment.slice(0, 800),
        beamMode,
        photoUrl: sanitizeReviewPhotoUrl(body.photoUrl),
        verifiedPurchase: Boolean(matchedOrder),
        orderCode: matchedOrder?.orderCode ?? orderCodeRaw,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const created = await repo.createReview(review);
      res.status(201).json({ item: created });
    } catch (err) {
      next(err);
    }
  });

  // --- Payment VietQR Webhook (Issue #4) ---
  app.post("/api/payments/webhook", async (req, res, next) => {
    try {
      const reqWithRaw = req as express.Request & { rawBody?: string };
      const rawBody = reqWithRaw.rawBody ?? JSON.stringify(req.body ?? {});
      const sigHeader = req.header("x-webhook-signature");

      if (!verifyWebhookSignature(rawBody, sigHeader, options.webhookSecret)) {
        res.status(401).json({ error: "Chữ ký webhook thanh toán không hợp lệ." });
        return;
      }

      const body = req.body as Record<string, unknown>;
      const rawMemo =
        (typeof body.orderCode === "string" && body.orderCode) ||
        (typeof body.content === "string" && body.content) ||
        (typeof body.description === "string" && body.description) ||
        "";
      const orderCode = extractOrderCodeFromMemo(rawMemo);
      if (!orderCode) {
        res.status(400).json({
          error: "Không tìm thấy mã đơn YKC-... trong nội dung giao dịch.",
        });
        return;
      }

      const order = await repo.findOrderByCode(orderCode);
      if (!order) {
        res.status(404).json({ error: `Đơn ${orderCode} không tồn tại.` });
        return;
      }

      const transferAmount = Number(body.transferAmount ?? body.amount ?? order.totalVnd);
      if (!Number.isFinite(transferAmount) || transferAmount < order.totalVnd) {
        res.status(400).json({
          error: `Số tiền chuyển (${transferAmount}) nhỏ hơn tổng đơn (${order.totalVnd}).`,
        });
        return;
      }

      const paymentRef =
        typeof body.referenceCode === "string" && body.referenceCode.trim()
          ? body.referenceCode.trim()
          : `VIETQR-${Date.now()}`;

      const updated = await repo.markOrderPaid(order.orderCode, paymentRef);
      if (updated) {
        await notifier.notifyPaymentConfirmed(updated, paymentRef);
      }

      res.json({ ok: true, item: updated });
    } catch (err) {
      next(err);
    }
  });

  // --- Admin Auth Endpoints (Issue #2) ---
  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const username = typeof body.username === "string" ? body.username.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";

      if (!username || !password) {
        res.status(400).json({ error: "Vui lòng nhập tên đăng nhập và mật khẩu." });
        return;
      }

      const admin = await repo.findAdminByUsername(username);
      if (!admin || !verifyPassword(password, admin.passwordHash)) {
        res.status(401).json({ error: "Sai tên đăng nhập hoặc mật khẩu." });
        return;
      }

      const token = signAdminToken(
        {
          sub: admin.id,
          username: admin.username,
          displayName: admin.displayName,
          role: admin.role,
        },
        options.jwtSecret,
      );

      res.json({
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          displayName: admin.displayName,
          role: admin.role,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/auth/me", requireAdmin, (_req, res) => {
    res.json({ admin: res.locals.admin });
  });

  // --- Customer Auth, Profile, My Garage & Order History (v9) ---
  app.post("/api/customer/register", async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const fullName =
        typeof body.fullName === "string" ? body.fullName.trim().slice(0, 80) : "";
      const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
      const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const shippingAddress =
        typeof body.shippingAddress === "string" && body.shippingAddress.trim()
          ? body.shippingAddress.trim().slice(0, 220)
          : undefined;
      const vehicleSummary =
        typeof body.vehicleInfo === "string" ? body.vehicleInfo.trim() : "";

      const phone = rawPhone ? normalizePhone(rawPhone) : undefined;
      const email = rawEmail ? normalizeEmail(rawEmail) : undefined;

      if (!fullName || password.length < 6) {
        res.status(400).json({
          error: "Vui lòng nhập họ tên và mật khẩu tối thiểu 6 ký tự.",
        });
        return;
      }

      if (!phone && !email) {
        res.status(400).json({
          error: "Vui lòng nhập ít nhất Số điện thoại hoặc Email để đăng ký.",
        });
        return;
      }

      if (phone && (phone.length < 9 || phone.length > 13)) {
        res.status(400).json({ error: "Số điện thoại không hợp lệ." });
        return;
      }

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: "Email không đúng định dạng." });
        return;
      }

      if (phone && (await repo.findCustomerByIdentifier(phone))) {
        res.status(409).json({
          error: "Số điện thoại này đã được đăng ký. Vui lòng đăng nhập.",
        });
        return;
      }

      if (email && (await repo.findCustomerByIdentifier(email))) {
        res.status(409).json({
          error: "Email này đã được đăng ký. Vui lòng đăng nhập.",
        });
        return;
      }

      const initialVehicles = sanitizeGarageList(body.garageVehicles);
      if (initialVehicles.length === 0 && vehicleSummary) {
        const parts = vehicleSummary.split(/\s+/);
        initialVehicles.push({
          id: `veh-${crypto.randomUUID().slice(0, 8)}`,
          make: parts[0] || "Xe cá nhân",
          model: parts.slice(1).join(" ") || vehicleSummary,
          year: "Đang dùng",
        });
      }

      const now = new Date().toISOString();
      const customer = await repo.createCustomer({
        id: `cust-${crypto.randomUUID().slice(0, 8)}`,
        fullName,
        phone,
        email,
        passwordHash: hashPassword(password),
        shippingAddress,
        garageVehicles: initialVehicles,
        createdAt: now,
        updatedAt: now,
      });

      const token = signCustomerToken(
        {
          sub: customer.id,
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
        },
        options.jwtSecret,
      );

      res.status(201).json({ token, customer });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/customer/login", async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const rawIdentifier =
        (typeof body.identifier === "string" && body.identifier) ||
        (typeof body.phone === "string" && body.phone) ||
        (typeof body.email === "string" && body.email) ||
        "";
      const identifier = rawIdentifier.trim();
      const password = typeof body.password === "string" ? body.password : "";

      if (!identifier || !password) {
        res.status(400).json({
          error: "Vui lòng nhập Email hoặc Số điện thoại và mật khẩu.",
        });
        return;
      }

      const account = await repo.findCustomerByIdentifier(identifier);
      if (!account || !verifyPassword(password, account.passwordHash)) {
        res.status(401).json({
          error: "Sai Email/Số điện thoại hoặc mật khẩu.",
        });
        return;
      }

      const customer = toPublicCustomer(account);
      const token = signCustomerToken(
        {
          sub: customer.id,
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
        },
        options.jwtSecret,
      );

      res.json({ token, customer });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/customer/me", requireCustomer, async (_req, res, next) => {
    try {
      const payload = res.locals.customer as { sub: string };
      const account = await repo.findCustomerById(payload.sub);
      if (!account) {
        res.status(401).json({ error: "Tài khoản khách hàng không tồn tại." });
        return;
      }
      const customer = toPublicCustomer(account);
      const [orders, bookings] = await Promise.all([
        repo.listOrdersByCustomer(customer.id, customer.phone),
        repo.listBookingsByCustomer(customer.id, customer.phone),
      ]);
      res.json({ customer, orders, bookings });
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/customer/me", requireCustomer, async (req, res, next) => {
    try {
      const payload = res.locals.customer as { sub: string };
      const current = await repo.findCustomerById(payload.sub);
      if (!current) {
        res.status(404).json({ error: "Không tìm thấy tài khoản." });
        return;
      }

      const body = req.body as Record<string, unknown>;
      const patch: {
        fullName?: string;
        phone?: string | null;
        email?: string | null;
        shippingAddress?: string | null;
        passwordHash?: string;
        garageVehicles?: CustomerGarageVehicle[];
      } = {};

      if (typeof body.fullName === "string") {
        const trimmed = body.fullName.trim().slice(0, 80);
        if (!trimmed) {
          res.status(400).json({ error: "Họ tên không được để trống." });
          return;
        }
        patch.fullName = trimmed;
      }

      if (body.phone !== undefined) {
        const cleanPhone =
          typeof body.phone === "string" && body.phone.trim()
            ? normalizePhone(body.phone)
            : null;
        if (cleanPhone && (cleanPhone.length < 9 || cleanPhone.length > 13)) {
          res.status(400).json({ error: "Số điện thoại không hợp lệ." });
          return;
        }
        if (cleanPhone) {
          const existing = await repo.findCustomerByIdentifier(cleanPhone);
          if (existing && existing.id !== current.id) {
            res.status(409).json({ error: "Số điện thoại đã thuộc về tài khoản khác." });
            return;
          }
        }
        patch.phone = cleanPhone;
      }

      if (body.email !== undefined) {
        const cleanEmail =
          typeof body.email === "string" && body.email.trim()
            ? normalizeEmail(body.email)
            : null;
        if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          res.status(400).json({ error: "Email không hợp lệ." });
          return;
        }
        if (cleanEmail) {
          const existing = await repo.findCustomerByIdentifier(cleanEmail);
          if (existing && existing.id !== current.id) {
            res.status(409).json({ error: "Email đã thuộc về tài khoản khác." });
            return;
          }
        }
        patch.email = cleanEmail;
      }

      const nextPhone = patch.phone === undefined ? current.phone : patch.phone;
      const nextEmail = patch.email === undefined ? current.email : patch.email;
      if (!nextPhone && !nextEmail) {
        res.status(400).json({
          error: "Cần giữ lại ít nhất Số điện thoại hoặc Email cho tài khoản.",
        });
        return;
      }

      if (body.shippingAddress !== undefined) {
        patch.shippingAddress =
          typeof body.shippingAddress === "string" && body.shippingAddress.trim()
            ? body.shippingAddress.trim().slice(0, 220)
            : null;
      }

      if (body.garageVehicles !== undefined) {
        patch.garageVehicles = sanitizeGarageList(body.garageVehicles);
      }

      if (typeof body.newPassword === "string" && body.newPassword.length > 0) {
        const currentPassword =
          typeof body.currentPassword === "string" ? body.currentPassword : "";
        if (!verifyPassword(currentPassword, current.passwordHash)) {
          res.status(400).json({ error: "Mật khẩu hiện tại không đúng." });
          return;
        }
        if (body.newPassword.length < 6) {
          res.status(400).json({ error: "Mật khẩu mới phải tối thiểu 6 ký tự." });
          return;
        }
        patch.passwordHash = hashPassword(body.newPassword);
      }

      const updated = await repo.updateCustomer(current.id, patch);
      if (!updated) {
        res.status(404).json({ error: "Cập nhật tài khoản thất bại." });
        return;
      }
      res.json({ customer: updated });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/customer/orders", requireCustomer, async (_req, res, next) => {
    try {
      const payload = res.locals.customer as { sub: string };
      const account = await repo.findCustomerById(payload.sub);
      if (!account) {
        res.status(401).json({ error: "Tài khoản không tồn tại." });
        return;
      }
      const items = await repo.listOrdersByCustomer(account.id, account.phone);
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/customer/garage", requireCustomer, async (req, res, next) => {
    try {
      const payload = res.locals.customer as { sub: string };
      const account = await repo.findCustomerById(payload.sub);
      if (!account) {
        res.status(404).json({ error: "Không tìm thấy tài khoản." });
        return;
      }
      const vehicle = sanitizeGarageVehicle(req.body);
      if (!vehicle) {
        res.status(400).json({ error: "Vui lòng nhập Hãng xe và Dòng xe." });
        return;
      }
      const nextList = [
        vehicle,
        ...account.garageVehicles.filter((v) => v.id !== vehicle.id),
      ].slice(0, 10);
      const updated = await repo.updateCustomer(account.id, {
        garageVehicles: nextList,
      });
      res.status(201).json({ customer: updated });
    } catch (err) {
      next(err);
    }
  });

  app.delete(
    "/api/customer/garage/:vehicleId",
    requireCustomer,
    async (req, res, next) => {
      try {
        const payload = res.locals.customer as { sub: string };
        const account = await repo.findCustomerById(payload.sub);
        if (!account) {
          res.status(404).json({ error: "Không tìm thấy tài khoản." });
          return;
        }
        const vehicleId = readParam(req.params.vehicleId);
        const nextList = account.garageVehicles.filter((v) => v.id !== vehicleId);
        const updated = await repo.updateCustomer(account.id, {
          garageVehicles: nextList,
        });
        res.json({ customer: updated });
      } catch (err) {
        next(err);
      }
    },
  );

  // --- Admin Operations & Dashboard Endpoints (Issues #2, #3, #7) ---
  app.get("/api/admin/overview", requireAdmin, async (_req, res, next) => {
    try {
      const [
        products,
        orders,
        inventoryLogs,
        allReviews,
        totalCustomers,
        allVouchers,
        allBookings,
      ] = await Promise.all([
        repo.listProducts(),
        repo.listOrders(100),
        repo.listInventoryLogs(15),
        repo.listReviews({ status: "all" }),
        repo.countCustomers(),
        repo.listVouchers(),
        repo.listBookings({ status: "all" }),
      ]);

      const totalRevenueVnd = orders.reduce((sum, o) => sum + o.totalVnd, 0);
      const pendingOrders = orders.filter((o) => o.status === "pending_confirm").length;
      const paidOrders = orders.filter((o) => o.paymentStatus === "paid").length;
      const lowStockProducts = products.filter(
        (p) => p.stockStatus !== "in_stock" || p.stockQty <= 4,
      ).length;
      const pendingReviews = allReviews.filter((r) => r.status === "pending").length;
      const approvedReviews = allReviews.filter((r) => r.status === "approved").length;
      const activeVouchers = allVouchers.filter((v) => v.active).length;
      const pendingBookings = allBookings.filter((b) => b.status === "pending").length;

      res.json({
        storageDriver: repo.driverName,
        stats: {
          totalProducts: products.length,
          lowStockProducts,
          totalOrders: orders.length,
          pendingOrders,
          paidOrders,
          totalRevenueVnd,
          pendingReviews,
          approvedReviews,
          totalCustomers,
          activeVouchers,
          pendingBookings,
          totalBookings: allBookings.length,
        },
        recentNotifications: notifier.history.slice(0, 10),
        recentInventoryLogs: inventoryLogs,
      });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/admin/products", requireAdmin, async (_req, res, next) => {
    try {
      const items = await repo.listProducts();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const nameVi = typeof body.nameVi === "string" ? body.nameVi.trim() : "";
      const sku = typeof body.sku === "string" ? body.sku.trim() : "";
      const slug =
        typeof body.slug === "string" && body.slug.trim()
          ? body.slug.trim()
          : nameVi
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
      const category =
        typeof body.category === "string" &&
        VALID_CATEGORIES.includes(body.category as PartCategory)
          ? (body.category as PartCategory)
          : "bi-led";
      const stockStatus =
        typeof body.stockStatus === "string" &&
        VALID_STOCK_STATUS.includes(body.stockStatus as StockStatus)
          ? (body.stockStatus as StockStatus)
          : "in_stock";
      const priceVnd = Number(body.priceVnd);
      const stockQty = Number(body.stockQty ?? 5);

      if (!nameVi || !sku || !Number.isFinite(priceVnd) || priceVnd <= 0) {
        res.status(400).json({
          error: "Thiếu thông tin bắt buộc (tên sản phẩm, SKU hoặc giá bán hợp lệ).",
        });
        return;
      }

      const actor = (res.locals.admin as { username?: string } | undefined)?.username ?? "admin";
      const specsRaw =
        body.specs && typeof body.specs === "object"
          ? (body.specs as Record<string, unknown>)
          : {};
      const product: AutoPartProduct = {
        id:
          typeof body.id === "string" && body.id.trim()
            ? body.id.trim()
            : `part-${Date.now().toString(36)}`,
        slug,
        sku,
        oemRef: typeof body.oemRef === "string" ? body.oemRef.trim() : "JDM-CUSTOM",
        nameVi,
        nameJp: typeof body.nameJp === "string" ? body.nameJp.trim() : "赤灯特製",
        kanjiMark:
          typeof body.kanjiMark === "string" ? body.kanjiMark.trim() : "光",
        brand: typeof body.brand === "string" ? body.brand.trim() : "Akari Yokocho",
        category,
        priceVnd: Math.round(priceVnd),
        originalPriceVnd: Number.isFinite(Number(body.originalPriceVnd))
          ? Math.round(Number(body.originalPriceVnd))
          : undefined,
        stockStatus,
        stockQty: Number.isInteger(stockQty) && stockQty >= 0 ? stockQty : 5,
        image:
          typeof body.image === "string" && body.image.trim()
            ? body.image.trim()
            : "/images/biled-projector.jpg",
        badgeText:
          typeof body.badgeText === "string" && body.badgeText.trim()
            ? body.badgeText.trim()
            : "MỚI NHẬP KHO",
        compatibleVehicles: Array.isArray(body.compatibleVehicles)
          ? body.compatibleVehicles.filter((v): v is string => typeof v === "string")
          : ["Toyota", "Honda", "Mazda"],
        specs: {
          wattage: typeof specsRaw.wattage === "string" ? specsRaw.wattage : "65W",
          kelvin: Array.isArray(specsRaw.kelvin)
            ? specsRaw.kelvin.filter((k): k is string => typeof k === "string")
            : ["5500K"],
          socket: typeof specsRaw.socket === "string" ? specsRaw.socket : "Plug & Play",
          lumens: typeof specsRaw.lumens === "string" ? specsRaw.lumens : "12.000 Lm",
          warrantyMonths: Number.isFinite(Number(specsRaw.warrantyMonths))
            ? Number(specsRaw.warrantyMonths)
            : 24,
          origin:
            typeof specsRaw.origin === "string" ? specsRaw.origin : "Yokocho Spec",
        },
        summaryVi:
          typeof body.summaryVi === "string" && body.summaryVi.trim()
            ? body.summaryVi.trim()
            : `${nameVi} - Phụ tùng hiệu suất đêm tiêu chuẩn JDM.`,
        highlights: Array.isArray(body.highlights)
          ? body.highlights.filter((h): h is string => typeof h === "string")
          : ["Cắm giắc zin chuẩn xe", "Bảo hành điện tử 1 đổi 1"],
        videoPreviewUrl:
          typeof body.videoPreviewUrl === "string" ? body.videoPreviewUrl.trim() : undefined,
      };

      const created = await repo.createProduct(product, actor);
      res.status(201).json({ item: created });
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const patch: Partial<AutoPartProduct> = {};

      if (typeof body.nameVi === "string" && body.nameVi.trim()) {
        patch.nameVi = body.nameVi.trim();
      }
      if (typeof body.priceVnd === "number" && body.priceVnd > 0) {
        patch.priceVnd = Math.round(body.priceVnd);
      }
      if (
        typeof body.stockQty === "number" &&
        Number.isInteger(body.stockQty) &&
        body.stockQty >= 0
      ) {
        patch.stockQty = body.stockQty;
      }
      if (
        typeof body.stockStatus === "string" &&
        VALID_STOCK_STATUS.includes(body.stockStatus as StockStatus)
      ) {
        patch.stockStatus = body.stockStatus as StockStatus;
      }
      if (typeof body.badgeText === "string") {
        patch.badgeText = body.badgeText.trim();
      }
      if (typeof body.image === "string" && body.image.trim()) {
        patch.image = body.image.trim();
      }

      const actor = (res.locals.admin as { username?: string } | undefined)?.username ?? "admin";
      const reason =
        typeof body.reason === "string" && body.reason.trim()
          ? body.reason.trim()
          : "Cập nhật từ Admin Dashboard";

      const updated = await repo.updateProduct(
        readParam(req.params.id),
        patch,
        actor,
        reason,
      );
      if (!updated) {
        res.status(404).json({ error: "Không tìm thấy sản phẩm để cập nhật." });
        return;
      }
      res.json({ item: updated });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res, next) => {
    try {
      const removed = await repo.deleteProduct(readParam(req.params.id));
      if (!removed) {
        res.status(404).json({ error: "Không tìm thấy sản phẩm để xóa." });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/admin/orders", requireAdmin, async (_req, res, next) => {
    try {
      const items = await repo.listOrders(100);
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  app.patch(
    "/api/admin/orders/:orderCode/status",
    requireAdmin,
    async (req, res, next) => {
      try {
        const body = req.body as Record<string, unknown>;
        const nextStatus = typeof body.status === "string" ? body.status : "";
        if (!VALID_ORDER_STATUS.includes(nextStatus as OrderRecord["status"])) {
          res.status(400).json({ error: "Trạng thái đơn hàng không hợp lệ." });
          return;
        }

        const updated = await repo.updateOrderStatus(
          readParam(req.params.orderCode),
          nextStatus as OrderRecord["status"],
        );
        if (!updated) {
          res.status(404).json({ error: "Không tìm thấy đơn hàng." });
          return;
        }
        res.json({ item: updated });
      } catch (err) {
        next(err);
      }
    },
  );

  // --- Signed Media Upload Endpoint (Issue #3) ---
  app.post("/api/admin/media/sign", requireAdmin, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const filename = typeof body.filename === "string" ? body.filename : "";
    const contentType =
      typeof body.contentType === "string" ? body.contentType : "image/webp";
    const folder = typeof body.folder === "string" ? body.folder : undefined;

    if (!filename.trim()) {
      res.status(400).json({ error: "Thiếu tên file upload." });
      return;
    }

    const descriptor = createSignedMediaUpload({ filename, contentType, folder });
    res.json({ item: descriptor });
  });

  // --- Admin Review Moderation Endpoints (v8) ---
  app.get("/api/admin/reviews", requireAdmin, async (req, res, next) => {
    try {
      const rawStatus =
        typeof req.query.status === "string" ? req.query.status.trim() : "all";
      const all = await repo.listReviews({ status: "all" });
      const filterStatus =
        rawStatus === "pending" || rawStatus === "approved" || rawStatus === "rejected"
          ? (rawStatus as ReviewStatus)
          : "all";
      const items =
        filterStatus === "all" ? all : all.filter((r) => r.status === filterStatus);
      res.json({
        items,
        counts: {
          all: all.length,
          pending: all.filter((r) => r.status === "pending").length,
          approved: all.filter((r) => r.status === "approved").length,
          rejected: all.filter((r) => r.status === "rejected").length,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/admin/reviews/:id/status", requireAdmin, async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const status = typeof body.status === "string" ? body.status.trim() : "";
      if (!VALID_REVIEW_STATUS.includes(status as ReviewStatus)) {
        res.status(400).json({ error: "Trạng thái kiểm duyệt không hợp lệ." });
        return;
      }
      const adminNote =
        typeof body.adminNote === "string" ? body.adminNote.trim().slice(0, 200) : undefined;
      const updated = await repo.updateReviewStatus(
        readParam(req.params.id),
        status as ReviewStatus,
        adminNote,
      );
      if (!updated) {
        res.status(404).json({ error: "Không tìm thấy đánh giá cần kiểm duyệt." });
        return;
      }
      res.json({ item: updated });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/admin/reviews/:id", requireAdmin, async (req, res, next) => {
    try {
      const removed = await repo.deleteReview(readParam(req.params.id));
      if (!removed) {
        res.status(404).json({ error: "Không tìm thấy đánh giá cần xóa." });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // --- Admin Vouchers CRUD (Phase 3.5) ---
  app.get("/api/admin/vouchers", requireAdmin, async (_req, res, next) => {
    try {
      const items = await repo.listVouchers();
      res.json({ items });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/vouchers", requireAdmin, async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const code =
        typeof body.code === "string"
          ? body.code
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9_-]/g, "")
              .slice(0, 24)
          : "";
      const title =
        typeof body.title === "string" ? body.title.trim().slice(0, 100) : "";
      const descriptionVi =
        typeof body.descriptionVi === "string" && body.descriptionVi.trim()
          ? body.descriptionVi.trim().slice(0, 220)
          : title;
      const discountType: VoucherDiscountType =
        body.discountType === "percent" ? "percent" : "fixed";
      const discountValue = Number(body.discountValue);
      const minOrderVnd = Math.max(0, Math.round(Number(body.minOrderVnd ?? 0) || 0));
      const maxDiscountRaw = Number(body.maxDiscountVnd);
      const maxDiscountVnd =
        Number.isFinite(maxDiscountRaw) && maxDiscountRaw > 0
          ? Math.round(maxDiscountRaw)
          : undefined;
      const usageLimitRaw = Number(body.usageLimit);
      const usageLimit =
        Number.isInteger(usageLimitRaw) && usageLimitRaw > 0 ? usageLimitRaw : undefined;
      const expiresAt =
        typeof body.expiresAt === "string" && body.expiresAt.trim()
          ? new Date(body.expiresAt).toISOString()
          : undefined;

      if (!code || code.length < 3 || !title) {
        res.status(400).json({
          error: "Vui lòng nhập mã voucher (tối thiểu 3 ký tự A-Z/0-9) và tiêu đề.",
        });
        return;
      }
      if (
        discountType === "percent" &&
        (!Number.isFinite(discountValue) || discountValue < 1 || discountValue > 90)
      ) {
        res.status(400).json({ error: "Mức giảm theo % phải nằm trong khoảng 1–90%." });
        return;
      }
      if (
        discountType === "fixed" &&
        (!Number.isFinite(discountValue) || discountValue < 10_000)
      ) {
        res.status(400).json({ error: "Mức giảm tiền mặt tối thiểu là 10.000₫." });
        return;
      }

      if (await repo.findVoucherByCode(code)) {
        res.status(409).json({ error: `Mã giảm giá ${code} đã tồn tại.` });
        return;
      }

      const created = await repo.createVoucher({
        id: `vch-${crypto.randomUUID().slice(0, 8)}`,
        code,
        title,
        descriptionVi,
        discountType,
        discountValue: Math.round(discountValue),
        minOrderVnd,
        maxDiscountVnd,
        usageLimit,
        usedCount: 0,
        active: body.active !== false,
        expiresAt,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json({ item: created });
    } catch (err) {
      next(err);
    }
  });

  app.patch("/api/admin/vouchers/:id", requireAdmin, async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const patch: Partial<VoucherRecord> = {};
      if (typeof body.active === "boolean") patch.active = body.active;
      if (typeof body.title === "string" && body.title.trim()) {
        patch.title = body.title.trim().slice(0, 100);
      }
      if (typeof body.descriptionVi === "string" && body.descriptionVi.trim()) {
        patch.descriptionVi = body.descriptionVi.trim().slice(0, 220);
      }
      if (typeof body.minOrderVnd === "number" && body.minOrderVnd >= 0) {
        patch.minOrderVnd = Math.round(body.minOrderVnd);
      }
      if (typeof body.usageLimit === "number" && body.usageLimit > 0) {
        patch.usageLimit = Math.round(body.usageLimit);
      }

      const updated = await repo.updateVoucher(readParam(req.params.id), patch);
      if (!updated) {
        res.status(404).json({ error: "Không tìm thấy mã giảm giá cần cập nhật." });
        return;
      }
      res.json({ item: updated });
    } catch (err) {
      next(err);
    }
  });

  app.delete("/api/admin/vouchers/:id", requireAdmin, async (req, res, next) => {
    try {
      const removed = await repo.deleteVoucher(readParam(req.params.id));
      if (!removed) {
        res.status(404).json({ error: "Không tìm thấy mã giảm giá cần xóa." });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  // --- Admin Installation Bookings Management (Phase 3.5) ---
  app.get("/api/admin/bookings", requireAdmin, async (req, res, next) => {
    try {
      const rawStatus =
        typeof req.query.status === "string" ? req.query.status.trim() : "all";
      const all = await repo.listBookings({ status: "all" });
      const items =
        VALID_BOOKING_STATUS.includes(rawStatus as BookingStatus)
          ? all.filter((b) => b.status === rawStatus)
          : all;
      res.json({
        items,
        counts: {
          all: all.length,
          pending: all.filter((b) => b.status === "pending").length,
          confirmed: all.filter((b) => b.status === "confirmed").length,
          in_bay: all.filter((b) => b.status === "in_bay").length,
          completed: all.filter((b) => b.status === "completed").length,
          cancelled: all.filter((b) => b.status === "cancelled").length,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  app.patch(
    "/api/admin/bookings/:bookingCode/status",
    requireAdmin,
    async (req, res, next) => {
      try {
        const body = req.body as Record<string, unknown>;
        const nextStatus = typeof body.status === "string" ? body.status.trim() : "";
        if (!VALID_BOOKING_STATUS.includes(nextStatus as BookingStatus)) {
          res.status(400).json({ error: "Trạng thái lịch lắp đặt không hợp lệ." });
          return;
        }
        const updated = await repo.updateBookingStatus(
          readParam(req.params.bookingCode),
          nextStatus as BookingStatus,
        );
        if (!updated) {
          res.status(404).json({ error: "Không tìm thấy lịch hẹn lắp đặt." });
          return;
        }
        res.json({ item: updated });
      } catch (err) {
        next(err);
      }
    },
  );

  async function readAdminAiConfigSnapshot() {
    const status = await getAiEngineStatus();
    return {
      ...status,
      geminiKeyPreview: maskSecret(process.env.GEMINI_API_KEY),
      geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
      openaiKeyPreview: maskSecret(process.env.OPENAI_API_KEY),
      openaiBaseUrl:
        process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
      openaiModel: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      ollamaBaseUrl:
        process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434",
      ollamaModel: process.env.OLLAMA_MODEL?.trim() || "",
      ollamaVisionModel: process.env.OLLAMA_VISION_MODEL?.trim() || "",
    };
  }

  // --- AKARI AI Engine Status, Admin Settings & Night Advisor ---
  app.get("/api/ai/status", async (_req, res, next) => {
    try {
      const status = await getAiEngineStatus();
      res.json({ item: status });
    } catch (err) {
      next(err);
    }
  });

  app.get("/api/admin/ai-config", requireAdmin, async (_req, res, next) => {
    try {
      res.json({ item: await readAdminAiConfigSnapshot() });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/ai-config", requireAdmin, async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const updates: Record<string, string | undefined> = {};

      const validModes: AiModePreference[] = [
        "auto",
        "gemini",
        "openai",
        "ollama",
        "local",
      ];
      if (
        typeof body.aiProvider === "string" &&
        validModes.includes(body.aiProvider as AiModePreference)
      ) {
        updates.AI_PROVIDER = body.aiProvider;
      }

      if (body.clearGeminiKey === true) {
        updates.GEMINI_API_KEY = "";
      } else if (
        typeof body.geminiApiKey === "string" &&
        body.geminiApiKey.trim().length > 0
      ) {
        updates.GEMINI_API_KEY = body.geminiApiKey.trim();
      }
      if (typeof body.geminiModel === "string" && body.geminiModel.trim()) {
        updates.GEMINI_MODEL = body.geminiModel.trim();
      }

      if (body.clearOpenaiKey === true) {
        updates.OPENAI_API_KEY = "";
      } else if (
        typeof body.openaiApiKey === "string" &&
        body.openaiApiKey.trim().length > 0
      ) {
        updates.OPENAI_API_KEY = body.openaiApiKey.trim();
      }
      if (typeof body.openaiBaseUrl === "string" && body.openaiBaseUrl.trim()) {
        updates.OPENAI_BASE_URL = body.openaiBaseUrl.trim();
      }
      if (typeof body.openaiModel === "string" && body.openaiModel.trim()) {
        updates.OPENAI_MODEL = body.openaiModel.trim();
      }

      if (typeof body.ollamaBaseUrl === "string" && body.ollamaBaseUrl.trim()) {
        updates.OLLAMA_BASE_URL = body.ollamaBaseUrl.trim();
      }
      if (typeof body.ollamaModel === "string") {
        updates.OLLAMA_MODEL = body.ollamaModel.trim();
      }
      if (typeof body.ollamaVisionModel === "string") {
        updates.OLLAMA_VISION_MODEL = body.ollamaVisionModel.trim();
      }

      upsertEnvVars(updates);
      clearAiDiagnosticsCache();
      res.json({ item: await readAdminAiConfigSnapshot() });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/admin/ai-test", requireAdmin, async (_req, res, next) => {
    try {
      const result = await testLiveAiConnection();
      res.json({ item: result });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/ai/advise", async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const message = typeof body.message === "string" ? body.message.trim() : "";
      const vehicleMake =
        typeof body.vehicleMake === "string" ? body.vehicleMake.trim() : undefined;
      const drivingProfileRaw =
        typeof body.drivingProfile === "string" ? body.drivingProfile : undefined;
      const validProfiles: DrivingProfile[] = [
        "city",
        "mountain_rain",
        "highway",
        "showcar",
      ];
      const drivingProfile =
        drivingProfileRaw && validProfiles.includes(drivingProfileRaw as DrivingProfile)
          ? (drivingProfileRaw as DrivingProfile)
          : undefined;
      const budgetRaw = Number(body.budgetVnd);
      const budgetVnd =
        Number.isFinite(budgetRaw) && budgetRaw > 0 ? budgetRaw : undefined;
      const imageBase64 =
        typeof body.imageBase64 === "string" && body.imageBase64.trim()
          ? body.imageBase64.trim()
          : undefined;
      const imageMimeType =
        typeof body.imageMimeType === "string" ? body.imageMimeType : undefined;
      const imageFilename =
        typeof body.imageFilename === "string" ? body.imageFilename : undefined;

      if (!message && !imageBase64 && !drivingProfile) {
        res.status(400).json({
          error:
            "Vui lòng nhập câu hỏi, chọn phong cách lái xe hoặc tải ảnh chóa đèn để AI tư vấn.",
        });
        return;
      }

      const [products, fitments] = await Promise.all([
        repo.listProducts(),
        repo.listFitments(),
      ]);

      const result = await adviseGarageAi({
        message,
        vehicleMake,
        drivingProfile,
        budgetVnd,
        imageBase64,
        imageMimeType,
        imageFilename,
        products,
        fitments,
      });

      res.json({ item: result });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/ai/admin-generate", requireAdmin, async (req, res, next) => {
    try {
      const body = req.body as Record<string, unknown>;
      const nameVi = typeof body.nameVi === "string" ? body.nameVi.trim() : "";
      if (!nameVi) {
        res.status(400).json({ error: "Vui lòng nhập tên sản phẩm để AI tạo thông số." });
        return;
      }
      const category =
        typeof body.category === "string" &&
        VALID_CATEGORIES.includes(body.category as PartCategory)
          ? (body.category as PartCategory)
          : "bi-led";
      const wattage = typeof body.wattage === "string" ? body.wattage : undefined;
      const priceVnd = Number.isFinite(Number(body.priceVnd))
        ? Number(body.priceVnd)
        : undefined;

      const draft = await generateAdminProductDraft({
        nameVi,
        category,
        wattage,
        priceVnd,
      });
      res.json({ item: draft });
    } catch (err) {
      next(err);
    }
  });

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      void _next;
      console.error("API error:", err);
      res.status(500).json({ error: "Lỗi xử lý máy chủ API." });
    },
  );

  return app;
}
