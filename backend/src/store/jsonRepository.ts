import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { normalizeEmail, normalizePhone } from "../auth/adminAuth.ts";
import {
  AUTO_PARTS_CATALOG,
  DEFAULT_DEMO_CUSTOMER_SEED,
  DEFAULT_DEMO_ORDERS,
  DEFAULT_INSTALLATION_BOOKINGS,
  DEFAULT_PRODUCT_REVIEWS,
  DEFAULT_VOUCHERS,
  VEHICLE_COMBOS,
  VEHICLE_FITMENTS,
} from "../data/catalog.ts";
import type {
  AdminUserRecord,
  AutoPartProduct,
  BookingStatus,
  CustomerGarageVehicle,
  CustomerProfileRecord,
  GarageBranchId,
  InstallationBookingRecord,
  InventoryLogRecord,
  OrderRecord,
  ProductReviewRecord,
  ReviewStatus,
  VehicleBuildCombo,
  VehicleFitment,
  VoucherRecord,
} from "../types.ts";
import {
  toPublicCustomer,
  type GarageRepository,
  type StoredAdminAccount,
  type StoredCustomerAccount,
} from "./repository.ts";

interface JsonStoreState {
  products: AutoPartProduct[];
  fitments: VehicleFitment[];
  combos: VehicleBuildCombo[];
  orders: OrderRecord[];
  admins: StoredAdminAccount[];
  customers: StoredCustomerAccount[];
  inventoryLogs: InventoryLogRecord[];
  reviews: ProductReviewRecord[];
  vouchers: VoucherRecord[];
  bookings: InstallationBookingRecord[];
}

export class JsonRepository implements GarageRepository {
  readonly driverName = "json" as const;
  private readonly filePath: string;
  private state: JsonStoreState;

  constructor(filePath: string) {
    this.filePath = filePath;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    this.state = this.load();
  }

  private createDefaultAdmin(): StoredAdminAccount {
    const username = process.env.ADMIN_USERNAME?.trim() || "admin";
    const plainPassword = process.env.ADMIN_PASSWORD?.trim() || "yokocho2026";
    return {
      id: "admin-default",
      username,
      passwordHash: bcrypt.hashSync(plainPassword, 8),
      displayName: "Chủ Xưởng Phố Đèn Đỏ",
      role: "admin",
      createdAt: new Date().toISOString(),
    };
  }

  private createDefaultDemoCustomer(): StoredCustomerAccount {
    return {
      id: DEFAULT_DEMO_CUSTOMER_SEED.id,
      fullName: DEFAULT_DEMO_CUSTOMER_SEED.fullName,
      phone: DEFAULT_DEMO_CUSTOMER_SEED.phone,
      email: DEFAULT_DEMO_CUSTOMER_SEED.email,
      passwordHash: bcrypt.hashSync(DEFAULT_DEMO_CUSTOMER_SEED.defaultPassword, 8),
      shippingAddress: DEFAULT_DEMO_CUSTOMER_SEED.shippingAddress,
      garageVehicles: DEFAULT_DEMO_CUSTOMER_SEED.garageVehicles.map((v) => ({ ...v })),
      createdAt: DEFAULT_DEMO_CUSTOMER_SEED.createdAt,
      updatedAt: DEFAULT_DEMO_CUSTOMER_SEED.createdAt,
    };
  }

  private load(): JsonStoreState {
    const baseState: JsonStoreState = {
      products: AUTO_PARTS_CATALOG.map((p) => ({ ...p, specs: { ...p.specs } })),
      fitments: VEHICLE_FITMENTS.map((f) => ({ ...f })),
      combos: VEHICLE_COMBOS.map((c) => ({ ...c })),
      orders: DEFAULT_DEMO_ORDERS.map((o) => ({
        ...o,
        items: o.items.map((i) => ({ ...i })),
      })),
      admins: [this.createDefaultAdmin()],
      customers: [this.createDefaultDemoCustomer()],
      inventoryLogs: [],
      reviews: DEFAULT_PRODUCT_REVIEWS.map((r) => ({ ...r })),
      vouchers: DEFAULT_VOUCHERS.map((v) => ({ ...v })),
      bookings: DEFAULT_INSTALLATION_BOOKINGS.map((b) => ({ ...b })),
    };

    if (!fs.existsSync(this.filePath)) {
      return baseState;
    }

    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;

      // Support legacy array format (v1-v4 orders.runtime.json) cleanly
      if (Array.isArray(parsed)) {
        return {
          ...baseState,
          orders: parsed as OrderRecord[],
        };
      }

      if (parsed && typeof parsed === "object") {
        const obj = parsed as Partial<JsonStoreState>;
        const loadedOrders = Array.isArray(obj.orders) ? obj.orders : baseState.orders;
        const ordersWithDemo = Array.isArray(obj.customers)
          ? loadedOrders
          : [
              ...loadedOrders,
              ...DEFAULT_DEMO_ORDERS.filter(
                (demo) => !loadedOrders.some((o) => o.orderCode === demo.orderCode),
              ),
            ];
        return {
          products: Array.isArray(obj.products) && obj.products.length > 0 ? obj.products : baseState.products,
          fitments: Array.isArray(obj.fitments) && obj.fitments.length > 0 ? obj.fitments : baseState.fitments,
          combos: Array.isArray(obj.combos) && obj.combos.length > 0 ? obj.combos : baseState.combos,
          orders: ordersWithDemo,
          admins: Array.isArray(obj.admins) && obj.admins.length > 0 ? obj.admins : baseState.admins,
          customers:
            Array.isArray(obj.customers) && obj.customers.length > 0
              ? obj.customers
              : baseState.customers,
          inventoryLogs: Array.isArray(obj.inventoryLogs) ? obj.inventoryLogs : [],
          reviews: Array.isArray(obj.reviews) ? obj.reviews : baseState.reviews,
          vouchers: Array.isArray(obj.vouchers) ? obj.vouchers : baseState.vouchers,
          bookings: Array.isArray(obj.bookings) ? obj.bookings : baseState.bookings,
        };
      }
      return baseState;
    } catch {
      return baseState;
    }
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }

  async listFitments(): Promise<VehicleFitment[]> {
    return this.state.fitments;
  }

  async listCombos(): Promise<VehicleBuildCombo[]> {
    return this.state.combos;
  }

  async listProducts(): Promise<AutoPartProduct[]> {
    return this.state.products;
  }

  async findProductBySlugOrId(slugOrId: string): Promise<AutoPartProduct | null> {
    return (
      this.state.products.find((p) => p.slug === slugOrId || p.id === slugOrId) ?? null
    );
  }

  async createProduct(
    product: AutoPartProduct,
    actor = "admin",
  ): Promise<AutoPartProduct> {
    this.state.products.unshift(product);
    this.state.inventoryLogs.unshift({
      id: crypto.randomUUID(),
      productId: product.id,
      sku: product.sku,
      deltaQty: product.stockQty,
      previousQty: 0,
      newQty: product.stockQty,
      reason: "Tạo mới phụ tùng trên hệ thống",
      actor,
      createdAt: new Date().toISOString(),
    });
    this.save();
    return product;
  }

  async updateProduct(
    id: string,
    patch: Partial<AutoPartProduct>,
    actor = "admin",
    reason = "Cập nhật thông tin & tồn kho",
  ): Promise<AutoPartProduct | null> {
    const idx = this.state.products.findIndex((p) => p.id === id || p.slug === id);
    if (idx === -1) return null;

    const current = this.state.products[idx];
    const updated: AutoPartProduct = {
      ...current,
      ...patch,
      specs: patch.specs ? { ...current.specs, ...patch.specs } : current.specs,
    };
    this.state.products[idx] = updated;

    if (typeof patch.stockQty === "number" && patch.stockQty !== current.stockQty) {
      this.state.inventoryLogs.unshift({
        id: crypto.randomUUID(),
        productId: updated.id,
        sku: updated.sku,
        deltaQty: updated.stockQty - current.stockQty,
        previousQty: current.stockQty,
        newQty: updated.stockQty,
        reason,
        actor,
        createdAt: new Date().toISOString(),
      });
    }

    this.save();
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const before = this.state.products.length;
    this.state.products = this.state.products.filter((p) => p.id !== id && p.slug !== id);
    const removed = this.state.products.length < before;
    if (removed) {
      this.save();
    }
    return removed;
  }

  async listOrders(limit = 50): Promise<OrderRecord[]> {
    return this.state.orders.slice(0, limit);
  }

  async listOrdersByCustomer(
    customerId: string,
    phone?: string,
  ): Promise<OrderRecord[]> {
    const normalizedPhone = phone ? normalizePhone(phone) : "";
    return this.state.orders.filter((order) => {
      if (order.customerId && order.customerId === customerId) {
        return true;
      }
      if (normalizedPhone && normalizePhone(order.phone) === normalizedPhone) {
        return true;
      }
      return false;
    });
  }

  async findOrderByCode(orderCode: string): Promise<OrderRecord | null> {
    const normalized = orderCode.trim().toUpperCase();
    return (
      this.state.orders.find((o) => o.orderCode.toUpperCase() === normalized) ?? null
    );
  }

  async createOrder(order: OrderRecord): Promise<OrderRecord> {
    const stored: OrderRecord = {
      ...order,
      paymentStatus: order.paymentStatus ?? "unpaid",
    };
    this.state.orders.unshift(stored);
    this.save();
    return stored;
  }

  async updateOrderStatus(
    orderCode: string,
    status: OrderRecord["status"],
  ): Promise<OrderRecord | null> {
    const normalized = orderCode.trim().toUpperCase();
    const idx = this.state.orders.findIndex(
      (o) => o.orderCode.toUpperCase() === normalized,
    );
    if (idx === -1) return null;
    const updated: OrderRecord = {
      ...this.state.orders[idx],
      status,
    };
    this.state.orders[idx] = updated;
    this.save();
    return updated;
  }

  async markOrderPaid(orderCode: string, paymentRef: string): Promise<OrderRecord | null> {
    const normalized = orderCode.trim().toUpperCase();
    const idx = this.state.orders.findIndex(
      (o) => o.orderCode.toUpperCase() === normalized,
    );
    if (idx === -1) return null;
    const current = this.state.orders[idx];
    const updated: OrderRecord = {
      ...current,
      paymentStatus: "paid",
      paymentRef,
      status: current.status === "pending_confirm" ? "packed" : current.status,
    };
    this.state.orders[idx] = updated;
    this.save();
    return updated;
  }

  async findAdminByUsername(username: string): Promise<StoredAdminAccount | null> {
    const normalized = username.trim().toLowerCase();
    return (
      this.state.admins.find((a) => a.username.toLowerCase() === normalized) ?? null
    );
  }

  async upsertAdminUser(
    username: string,
    passwordHash: string,
    displayName: string,
    role = "admin",
  ): Promise<AdminUserRecord> {
    const normalized = username.trim().toLowerCase();
    const existingIdx = this.state.admins.findIndex(
      (a) => a.username.toLowerCase() === normalized,
    );
    if (existingIdx >= 0) {
      this.state.admins[existingIdx] = {
        ...this.state.admins[existingIdx],
        passwordHash,
        displayName,
        role,
      };
      this.save();
      const { passwordHash: _ignored, ...safe } = this.state.admins[existingIdx];
      void _ignored;
      return safe;
    }

    const created: StoredAdminAccount = {
      id: crypto.randomUUID(),
      username: normalized,
      passwordHash,
      displayName,
      role,
      createdAt: new Date().toISOString(),
    };
    this.state.admins.push(created);
    this.save();
    const { passwordHash: _ignored, ...safe } = created;
    void _ignored;
    return safe;
  }

  async listInventoryLogs(limit = 30): Promise<InventoryLogRecord[]> {
    return this.state.inventoryLogs.slice(0, limit);
  }

  async listReviews(
    filter: { productId?: string; status?: ReviewStatus | "all" } = {},
  ): Promise<ProductReviewRecord[]> {
    return this.state.reviews
      .filter((r) => {
        if (filter.productId && r.productId !== filter.productId) return false;
        if (filter.status && filter.status !== "all" && r.status !== filter.status) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async createReview(review: ProductReviewRecord): Promise<ProductReviewRecord> {
    this.state.reviews.unshift(review);
    this.save();
    return review;
  }

  async updateReviewStatus(
    id: string,
    status: ReviewStatus,
    adminNote?: string,
  ): Promise<ProductReviewRecord | null> {
    const idx = this.state.reviews.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const updated: ProductReviewRecord = {
      ...this.state.reviews[idx],
      status,
      adminNote: adminNote !== undefined ? adminNote : this.state.reviews[idx].adminNote,
    };
    this.state.reviews[idx] = updated;
    this.save();
    return updated;
  }

  async deleteReview(id: string): Promise<boolean> {
    const before = this.state.reviews.length;
    this.state.reviews = this.state.reviews.filter((r) => r.id !== id);
    const removed = this.state.reviews.length < before;
    if (removed) {
      this.save();
    }
    return removed;
  }

  async countCustomers(): Promise<number> {
    return this.state.customers.length;
  }

  async findCustomerByIdentifier(
    identifier: string,
  ): Promise<StoredCustomerAccount | null> {
    const emailNorm = normalizeEmail(identifier);
    const phoneNorm = normalizePhone(identifier);
    return (
      this.state.customers.find((c) => {
        if (c.email && normalizeEmail(c.email) === emailNorm) return true;
        if (phoneNorm && c.phone && normalizePhone(c.phone) === phoneNorm) return true;
        return false;
      }) ?? null
    );
  }

  async findCustomerById(id: string): Promise<StoredCustomerAccount | null> {
    return this.state.customers.find((c) => c.id === id) ?? null;
  }

  async createCustomer(account: StoredCustomerAccount): Promise<CustomerProfileRecord> {
    this.state.customers.unshift(account);
    this.save();
    return toPublicCustomer(account);
  }

  async updateCustomer(
    id: string,
    patch: {
      fullName?: string;
      phone?: string | null;
      email?: string | null;
      shippingAddress?: string | null;
      passwordHash?: string;
      garageVehicles?: CustomerGarageVehicle[];
    },
  ): Promise<CustomerProfileRecord | null> {
    const idx = this.state.customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;

    const current = this.state.customers[idx];
    const updated: StoredCustomerAccount = {
      ...current,
      fullName: patch.fullName ?? current.fullName,
      phone: patch.phone === null ? undefined : (patch.phone ?? current.phone),
      email: patch.email === null ? undefined : (patch.email ?? current.email),
      shippingAddress:
        patch.shippingAddress === null
          ? undefined
          : (patch.shippingAddress ?? current.shippingAddress),
      passwordHash: patch.passwordHash ?? current.passwordHash,
      garageVehicles: patch.garageVehicles ?? current.garageVehicles,
      updatedAt: new Date().toISOString(),
    };
    this.state.customers[idx] = updated;
    this.save();
    return toPublicCustomer(updated);
  }

  async listVouchers(options?: { activeOnly?: boolean }): Promise<VoucherRecord[]> {
    const now = Date.now();
    return this.state.vouchers
      .filter((v) => {
        if (!options?.activeOnly) return true;
        if (!v.active) return false;
        if (v.expiresAt && new Date(v.expiresAt).getTime() < now) return false;
        if (typeof v.usageLimit === "number" && v.usedCount >= v.usageLimit) return false;
        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async findVoucherByCode(code: string): Promise<VoucherRecord | null> {
    const normalized = code.trim().toUpperCase();
    return this.state.vouchers.find((v) => v.code.toUpperCase() === normalized) ?? null;
  }

  async createVoucher(voucher: VoucherRecord): Promise<VoucherRecord> {
    this.state.vouchers.unshift(voucher);
    this.save();
    return voucher;
  }

  async updateVoucher(
    id: string,
    patch: Partial<
      Pick<
        VoucherRecord,
        | "title"
        | "descriptionVi"
        | "discountType"
        | "discountValue"
        | "minOrderVnd"
        | "maxDiscountVnd"
        | "usageLimit"
        | "active"
        | "expiresAt"
      >
    >,
  ): Promise<VoucherRecord | null> {
    const idx = this.state.vouchers.findIndex((v) => v.id === id || v.code === id);
    if (idx === -1) return null;
    const updated: VoucherRecord = {
      ...this.state.vouchers[idx],
      ...patch,
    };
    this.state.vouchers[idx] = updated;
    this.save();
    return updated;
  }

  async incrementVoucherUsage(code: string): Promise<void> {
    const normalized = code.trim().toUpperCase();
    const idx = this.state.vouchers.findIndex((v) => v.code.toUpperCase() === normalized);
    if (idx === -1) return;
    this.state.vouchers[idx] = {
      ...this.state.vouchers[idx],
      usedCount: this.state.vouchers[idx].usedCount + 1,
    };
    this.save();
  }

  async deleteVoucher(id: string): Promise<boolean> {
    const before = this.state.vouchers.length;
    this.state.vouchers = this.state.vouchers.filter((v) => v.id !== id && v.code !== id);
    const removed = this.state.vouchers.length < before;
    if (removed) this.save();
    return removed;
  }

  async listBookings(
    filter: {
      date?: string;
      branch?: GarageBranchId;
      status?: BookingStatus | "all";
    } = {},
  ): Promise<InstallationBookingRecord[]> {
    return this.state.bookings
      .filter((b) => {
        if (filter.date && b.bookingDate !== filter.date) return false;
        if (filter.branch && b.garageBranch !== filter.branch) return false;
        if (filter.status && filter.status !== "all" && b.status !== filter.status) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async listBookingsByCustomer(
    customerId: string,
    phone?: string,
  ): Promise<InstallationBookingRecord[]> {
    const normalizedPhone = phone ? normalizePhone(phone) : "";
    return this.state.bookings
      .filter((b) => {
        if (b.customerId && b.customerId === customerId) return true;
        if (normalizedPhone && normalizePhone(b.phone) === normalizedPhone) return true;
        return false;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  async findBookingByCode(bookingCode: string): Promise<InstallationBookingRecord | null> {
    const normalized = bookingCode.trim().toUpperCase();
    return (
      this.state.bookings.find((b) => b.bookingCode.toUpperCase() === normalized) ?? null
    );
  }

  async createBooking(
    booking: InstallationBookingRecord,
  ): Promise<InstallationBookingRecord> {
    this.state.bookings.unshift(booking);
    this.save();
    return booking;
  }

  async updateBookingStatus(
    bookingCode: string,
    status: BookingStatus,
  ): Promise<InstallationBookingRecord | null> {
    const normalized = bookingCode.trim().toUpperCase();
    const idx = this.state.bookings.findIndex(
      (b) => b.bookingCode.toUpperCase() === normalized,
    );
    if (idx === -1) return null;
    const updated: InstallationBookingRecord = {
      ...this.state.bookings[idx],
      status,
      updatedAt: new Date().toISOString(),
    };
    this.state.bookings[idx] = updated;
    this.save();
    return updated;
  }
}

