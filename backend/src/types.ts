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

export interface OrderItemInput {
  productId: string;
  quantity: number;
  selectedKelvin?: string;
}

export interface OrderItemRecord extends OrderItemInput {
  sku: string;
  nameVi: string;
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
  status: "pending_confirm" | "packed" | "shipping" | "completed";
  createdAt: string;
}
