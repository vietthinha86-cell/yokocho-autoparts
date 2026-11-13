export type PartCategory =
  | "bi-led"
  | "bi-fog"
  | "tail-light"
  | "chassis-brake"
  | "jdm-aero";

export type StockStatus = "in_stock" | "low_stock" | "jdm_preorder";

export interface TechnicalSpec {
  wattage?: string;
  kelvin?: string[];
  socket?: string;
  lumens?: string;
  voltage?: string;
  warrantyMonths: number;
  origin: string;
}

export interface AutoPartProduct {
  id: string;
  slug: string;
  sku: string;
  oemRef: string;
  nameVi: string;
  nameJp: string;
  kanjiMark?: string;
  brand: string;
  category: PartCategory;
  priceVnd: number;
  originalPriceVnd?: number;
  stockStatus: StockStatus;
  stockQty: number;
  image: string;
  badgeText: string;
  compatibleVehicles: string[];
  specs: TechnicalSpec;
  summaryVi: string;
  highlights: string[];
}

export interface VehicleFitment {
  make: string;
  model: string;
  years: string[];
  recommendedSockets: string[];
}

export interface VehicleBuildCombo {
  id: string;
  vehicleTitle: string;
  jpSubtitle: string;
  driverStyle: string;
  image: string;
  recommendedMode: string;
  descriptionVi: string;
  productIds: string[];
  bundleDiscountPct: number;
}

export interface CartItem {
  product: AutoPartProduct;
  quantity: number;
  selectedKelvin: string;
}

export interface OrderItemRecord {
  productId: string;
  sku: string;
  nameVi: string;
  quantity: number;
  selectedKelvin?: string;
  unitPriceVnd: number;
  lineTotalVnd: number;
}

export interface OrderRecord {
  orderCode: string;
  customerName: string;
  phone: string;
  vehicleInfo: string;
  shippingAddress: string;
  note?: string;
  items: OrderItemRecord[];
  subtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  paymentStatus?: "unpaid" | "paid";
  paymentRef?: string;
  status: "pending_confirm" | "packed" | "shipping" | "completed";
  createdAt: string;
}

export interface AdminProfile {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

export interface AdminOverviewResponse {
  storageDriver: "postgresql" | "json";
  stats: {
    totalProducts: number;
    lowStockProducts: number;
    totalOrders: number;
    pendingOrders: number;
    paidOrders: number;
    totalRevenueVnd: number;
  };
  recentNotifications: Array<{
    channel: string;
    event: string;
    orderCode: string;
    message: string;
    sentAt: string;
    delivered: boolean;
  }>;
  recentInventoryLogs: Array<{
    id: string;
    productId: string;
    sku: string;
    deltaQty: number;
    previousQty: number;
    newQty: number;
    reason: string;
    actor: string;
    createdAt: string;
  }>;
}
