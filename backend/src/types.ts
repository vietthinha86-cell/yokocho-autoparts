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
  videoPreviewUrl?: string;
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
  customerId?: string;
  customerName: string;
  phone: string;
  vehicleInfo: string;
  shippingAddress: string;
  note?: string;
  items: OrderItemRecord[];
  subtotalVnd: number;
  discountVnd?: number;
  voucherCode?: string;
  shippingFeeVnd: number;
  totalVnd: number;
  paymentStatus?: "unpaid" | "paid";
  paymentRef?: string;
  status: "pending_confirm" | "packed" | "shipping" | "completed";
  createdAt: string;
}

export interface CustomerGarageVehicle {
  id: string;
  make: string;
  model: string;
  year: string;
  nickname?: string;
  note?: string;
}

export interface CustomerProfileRecord {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  shippingAddress?: string;
  garageVehicles: CustomerGarageVehicle[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserRecord {
  id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export interface InventoryLogRecord {
  id: string;
  productId: string;
  sku: string;
  deltaQty: number;
  previousQty: number;
  newQty: number;
  reason: string;
  actor: string;
  createdAt: string;
}

export type ReviewStatus = "pending" | "approved" | "rejected";
export type BeamModeChoice = "3000k" | "4300k" | "6000k" | "combo";

export interface ProductReviewRecord {
  id: string;
  productId: string;
  customerId?: string;
  customerName: string;
  vehicleInfo: string;
  rating: number;
  title: string;
  comment: string;
  beamMode?: BeamModeChoice;
  photoUrl?: string;
  verifiedPurchase: boolean;
  orderCode?: string;
  status: ReviewStatus;
  adminNote?: string;
  createdAt: string;
}

export type VoucherDiscountType = "percent" | "fixed";

export interface VoucherRecord {
  id: string;
  code: string;
  title: string;
  descriptionVi: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  minOrderVnd: number;
  maxDiscountVnd?: number;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

export type GarageBranchId = "hcm_q7" | "hcm_binhthanh" | "hn_caugiay";

export type InstallationServiceType =
  | "bi_led_retrofit"
  | "bi_fog_install"
  | "tail_light_plug"
  | "combo_full_night"
  | "beam_alignment";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "in_bay"
  | "completed"
  | "cancelled";

export interface InstallationBookingRecord {
  id: string;
  bookingCode: string;
  customerId?: string;
  orderCode?: string;
  customerName: string;
  phone: string;
  vehicleInfo: string;
  garageBranch: GarageBranchId;
  serviceType: InstallationServiceType;
  bookingDate: string;
  timeSlot: string;
  note?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}
