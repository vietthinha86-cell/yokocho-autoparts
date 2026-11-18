import type {
  AdminUserRecord,
  AutoPartProduct,
  CustomerGarageVehicle,
  CustomerProfileRecord,
  InventoryLogRecord,
  OrderRecord,
  ProductReviewRecord,
  ReviewStatus,
  VehicleBuildCombo,
  VehicleFitment,
} from "../types.ts";

export interface StoredAdminAccount extends AdminUserRecord {
  passwordHash: string;
}

export interface StoredCustomerAccount extends CustomerProfileRecord {
  passwordHash: string;
}

export function toPublicCustomer(account: StoredCustomerAccount): CustomerProfileRecord {
  const { passwordHash: _ignored, ...safe } = account;
  void _ignored;
  return safe;
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
  listOrdersByCustomer(customerId: string, phone?: string): Promise<OrderRecord[]>;
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
  countCustomers(): Promise<number>;
  findCustomerByIdentifier(identifier: string): Promise<StoredCustomerAccount | null>;
  findCustomerById(id: string): Promise<StoredCustomerAccount | null>;
  createCustomer(account: StoredCustomerAccount): Promise<CustomerProfileRecord>;
  updateCustomer(
    id: string,
    patch: {
      fullName?: string;
      phone?: string | null;
      email?: string | null;
      shippingAddress?: string | null;
      passwordHash?: string;
      garageVehicles?: CustomerGarageVehicle[];
    },
  ): Promise<CustomerProfileRecord | null>;
  listInventoryLogs(limit?: number): Promise<InventoryLogRecord[]>;
  listReviews(filter?: {
    productId?: string;
    status?: ReviewStatus | "all";
  }): Promise<ProductReviewRecord[]>;
  createReview(review: ProductReviewRecord): Promise<ProductReviewRecord>;
  updateReviewStatus(
    id: string,
    status: ReviewStatus,
    adminNote?: string,
  ): Promise<ProductReviewRecord | null>;
  deleteReview(id: string): Promise<boolean>;
  close?(): Promise<void>;
}

