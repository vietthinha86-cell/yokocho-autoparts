import type {
  AdminUserRecord,
  AutoPartProduct,
  InventoryLogRecord,
  OrderRecord,
  VehicleBuildCombo,
  VehicleFitment,
} from "../types.ts";

export interface StoredAdminAccount extends AdminUserRecord {
  passwordHash: string;
}

export interface GarageRepository {
  readonly driverName: "postgresql" | "json";
  listFitments(): Promise<VehicleFitment[]>;
  listCombos(): Promise<VehicleBuildCombo[]>;
  listProducts(): Promise<AutoPartProduct[]>;
  findProductBySlugOrId(slugOrId: string): Promise<AutoPartProduct | null>;
  createProduct(product: AutoPartProduct, actor?: string): Promise<AutoPartProduct>;
  updateProduct(
    id: string,
    patch: Partial<AutoPartProduct>,
    actor?: string,
    reason?: string,
  ): Promise<AutoPartProduct | null>;
  deleteProduct(id: string): Promise<boolean>;
  listOrders(limit?: number): Promise<OrderRecord[]>;
  findOrderByCode(orderCode: string): Promise<OrderRecord | null>;
  createOrder(order: OrderRecord): Promise<OrderRecord>;
  updateOrderStatus(
    orderCode: string,
    status: OrderRecord["status"],
  ): Promise<OrderRecord | null>;
  markOrderPaid(orderCode: string, paymentRef: string): Promise<OrderRecord | null>;
  findAdminByUsername(username: string): Promise<StoredAdminAccount | null>;
  upsertAdminUser(
    username: string,
    passwordHash: string,
    displayName: string,
    role?: string,
  ): Promise<AdminUserRecord>;
  listInventoryLogs(limit?: number): Promise<InventoryLogRecord[]>;
  close?(): Promise<void>;
}

