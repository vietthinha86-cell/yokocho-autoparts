import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  AUTO_PARTS_CATALOG,
  DEFAULT_PRODUCT_REVIEWS,
  VEHICLE_COMBOS,
  VEHICLE_FITMENTS,
} from "../data/catalog.ts";
import type {
  AdminUserRecord,
  AutoPartProduct,
  InventoryLogRecord,
  OrderRecord,
  ProductReviewRecord,
  ReviewStatus,
  VehicleBuildCombo,
  VehicleFitment,
} from "../types.ts";
import type { GarageRepository, StoredAdminAccount } from "./repository.ts";

interface JsonStoreState {
  products: AutoPartProduct[];
  fitments: VehicleFitment[];
  combos: VehicleBuildCombo[];
  orders: OrderRecord[];
  admins: StoredAdminAccount[];
  inventoryLogs: InventoryLogRecord[];
  reviews: ProductReviewRecord[];
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

  private load(): JsonStoreState {
    const baseState: JsonStoreState = {
      products: AUTO_PARTS_CATALOG.map((p) => ({ ...p, specs: { ...p.specs } })),
      fitments: VEHICLE_FITMENTS.map((f) => ({ ...f })),
      combos: VEHICLE_COMBOS.map((c) => ({ ...c })),
      orders: [],
      admins: [this.createDefaultAdmin()],
      inventoryLogs: [],
      reviews: DEFAULT_PRODUCT_REVIEWS.map((r) => ({ ...r })),
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
        return {
          products: Array.isArray(obj.products) && obj.products.length > 0 ? obj.products : baseState.products,
          fitments: Array.isArray(obj.fitments) && obj.fitments.length > 0 ? obj.fitments : baseState.fitments,
          combos: Array.isArray(obj.combos) && obj.combos.length > 0 ? obj.combos : baseState.combos,
          orders: Array.isArray(obj.orders) ? obj.orders : [],
          admins: Array.isArray(obj.admins) && obj.admins.length > 0 ? obj.admins : baseState.admins,
          inventoryLogs: Array.isArray(obj.inventoryLogs) ? obj.inventoryLogs : [],
          reviews: Array.isArray(obj.reviews) ? obj.reviews : baseState.reviews,
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
}

