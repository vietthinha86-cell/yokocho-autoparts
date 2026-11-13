import cors from "cors";
import express from "express";
import path from "node:path";
import {
  createRequireAdminAuth,
  signAdminToken,
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
import type { GarageRepository } from "./store/repository.ts";
import type {
  AutoPartProduct,
  OrderItemInput,
  OrderItemRecord,
  OrderRecord,
  PartCategory,
  StockStatus,
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

function generateOrderCode(): string {
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  const timePart = Date.now().toString().slice(-4);
  return `YKC-${timePart}-${randomPart}`;
}

function readParam(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
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
  const notifier = new NotificationDispatcher();

  app.use(cors());
  app.use(
    express.json({
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

      const catalog = await repo.listProducts();
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
        if (query) {
          const haystack = [
            part.nameVi,
            part.nameJp,
            part.sku,
            part.oemRef,
            part.brand,
            part.specs.socket ?? "",
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(query)) {
            return false;
          }
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
      const shippingFeeVnd =
        subtotalVnd >= FREE_SHIPPING_THRESHOLD_VND ? 0 : STANDARD_SHIPPING_FEE_VND;
      const order: OrderRecord = {
        orderCode: generateOrderCode(),
        customerName,
        phone,
        vehicleInfo: vehicleInfo || "Chưa cung cấp dòng xe",
        shippingAddress,
        note,
        items: orderItems,
        subtotalVnd,
        shippingFeeVnd,
        totalVnd: subtotalVnd + shippingFeeVnd,
        paymentStatus: "unpaid",
        status: "pending_confirm",
        createdAt: new Date().toISOString(),
      };

      const created = await repo.createOrder(order);
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

  // --- Admin Operations & Dashboard Endpoints (Issues #2, #3, #7) ---
  app.get("/api/admin/overview", requireAdmin, async (_req, res, next) => {
    try {
      const [products, orders, inventoryLogs] = await Promise.all([
        repo.listProducts(),
        repo.listOrders(100),
        repo.listInventoryLogs(15),
      ]);

      const totalRevenueVnd = orders.reduce((sum, o) => sum + o.totalVnd, 0);
      const pendingOrders = orders.filter((o) => o.status === "pending_confirm").length;
      const paidOrders = orders.filter((o) => o.paymentStatus === "paid").length;
      const lowStockProducts = products.filter(
        (p) => p.stockStatus !== "in_stock" || p.stockQty <= 4,
      ).length;

      res.json({
        storageDriver: repo.driverName,
        stats: {
          totalProducts: products.length,
          lowStockProducts,
          totalOrders: orders.length,
          pendingOrders,
          paidOrders,
          totalRevenueVnd,
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
