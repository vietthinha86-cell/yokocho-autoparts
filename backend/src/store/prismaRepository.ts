import { Prisma, PrismaClient } from "@prisma/client";
import { normalizeEmail, normalizePhone } from "../auth/adminAuth.ts";
import type {
  AdminUserRecord,
  AutoPartProduct,
  BeamModeChoice,
  CustomerGarageVehicle,
  CustomerProfileRecord,
  InventoryLogRecord,
  OrderRecord,
  PartCategory,
  ProductReviewRecord,
  ReviewStatus,
  StockStatus,
  TechnicalSpec,
  VehicleBuildCombo,
  VehicleFitment,
} from "../types.ts";
import {
  toPublicCustomer,
  type GarageRepository,
  type StoredAdminAccount,
  type StoredCustomerAccount,
} from "./repository.ts";

type PrismaProductRow = Awaited<ReturnType<PrismaClient["product"]["findMany"]>>[number];
type PrismaOrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;
type PrismaReviewRow = Awaited<ReturnType<PrismaClient["productReview"]["findMany"]>>[number];
type PrismaCustomerRow = Awaited<ReturnType<PrismaClient["customerUser"]["findMany"]>>[number];

function mapCustomer(row: PrismaCustomerRow): StoredCustomerAccount {
  const vehicles = Array.isArray(row.garageVehiclesJson)
    ? ((row.garageVehiclesJson as unknown) as CustomerGarageVehicle[])
    : [];
  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    passwordHash: row.passwordHash,
    shippingAddress: row.shippingAddress ?? undefined,
    garageVehicles: vehicles,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapReview(row: PrismaReviewRow): ProductReviewRecord {
  return {
    id: row.id,
    productId: row.productId,
    customerId: row.customerId ?? undefined,
    customerName: row.customerName,
    vehicleInfo: row.vehicleInfo,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    beamMode: (row.beamMode as BeamModeChoice | null) ?? undefined,
    photoUrl: row.photoUrl ?? undefined,
    verifiedPurchase: row.verifiedPurchase,
    orderCode: row.orderCode ?? undefined,
    status: row.status as ReviewStatus,
    adminNote: row.adminNote ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapProduct(row: PrismaProductRow): AutoPartProduct {
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    oemRef: row.oemRef,
    nameVi: row.nameVi,
    nameJp: row.nameJp,
    kanjiMark: row.kanjiMark ?? undefined,
    brand: row.brand,
    category: row.category as PartCategory,
    priceVnd: row.priceVnd,
    originalPriceVnd: row.originalPriceVnd ?? undefined,
    stockStatus: row.stockStatus as StockStatus,
    stockQty: row.stockQty,
    image: row.image,
    badgeText: row.badgeText,
    compatibleVehicles: row.compatibleVehicles,
    specs: (row.specsJson as unknown) as TechnicalSpec,
    summaryVi: row.summaryVi,
    highlights: row.highlights,
    videoPreviewUrl: row.videoPreviewUrl ?? undefined,
  };
}

function mapOrder(row: PrismaOrderWithItems): OrderRecord {
  return {
    orderCode: row.orderCode,
    customerId: row.customerId ?? undefined,
    customerName: row.customerName,
    phone: row.phone,
    vehicleInfo: row.vehicleInfo,
    shippingAddress: row.shippingAddress,
    note: row.note ?? undefined,
    subtotalVnd: row.subtotalVnd,
    shippingFeeVnd: row.shippingFeeVnd,
    totalVnd: row.totalVnd,
    paymentStatus: (row.paymentStatus as "unpaid" | "paid") ?? "unpaid",
    paymentRef: row.paymentRef ?? undefined,
    status: row.status as OrderRecord["status"],
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((item) => ({
      productId: item.productId,
      sku: item.sku,
      nameVi: item.nameVi,
      quantity: item.quantity,
      selectedKelvin: item.selectedKelvin ?? undefined,
      unitPriceVnd: item.unitPriceVnd,
      lineTotalVnd: item.lineTotalVnd,
    })),
  };
}

export class PrismaRepository implements GarageRepository {
  readonly driverName = "postgresql" as const;
  private readonly prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? new PrismaClient();
  }

  async listFitments(): Promise<VehicleFitment[]> {
    const rows = await this.prisma.vehicleFitment.findMany({
      orderBy: [{ make: "asc" }, { model: "asc" }],
    });
    return rows.map((r) => ({
      make: r.make,
      model: r.model,
      years: r.years,
      recommendedSockets: r.recommendedSockets,
    }));
  }

  async listCombos(): Promise<VehicleBuildCombo[]> {
    return this.prisma.vehicleBuildCombo.findMany();
  }

  async listProducts(): Promise<AutoPartProduct[]> {
    const rows = await this.prisma.product.findMany({
      orderBy: { createdAt: "asc" },
    });
    return rows.map(mapProduct);
  }

  async findProductBySlugOrId(slugOrId: string): Promise<AutoPartProduct | null> {
    const row = await this.prisma.product.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    });
    return row ? mapProduct(row) : null;
  }

  async createProduct(
    product: AutoPartProduct,
    actor = "admin",
  ): Promise<AutoPartProduct> {
    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.product.create({
        data: {
          id: product.id,
          slug: product.slug,
          sku: product.sku,
          oemRef: product.oemRef,
          nameVi: product.nameVi,
          nameJp: product.nameJp,
          kanjiMark: product.kanjiMark ?? null,
          brand: product.brand,
          category: product.category,
          priceVnd: product.priceVnd,
          originalPriceVnd: product.originalPriceVnd ?? null,
          stockStatus: product.stockStatus,
          stockQty: product.stockQty,
          image: product.image,
          badgeText: product.badgeText,
          compatibleVehicles: product.compatibleVehicles,
          specsJson: (product.specs as unknown) as Prisma.InputJsonValue,
          summaryVi: product.summaryVi,
          highlights: product.highlights,
          videoPreviewUrl: product.videoPreviewUrl ?? null,
        },
      });
      await tx.dailyInventoryLog.create({
        data: {
          productId: row.id,
          sku: row.sku,
          deltaQty: row.stockQty,
          previousQty: 0,
          newQty: row.stockQty,
          reason: "Tạo mới phụ tùng trên hệ thống",
          actor,
        },
      });
      return row;
    });

    return mapProduct(created);
  }

  async updateProduct(
    id: string,
    patch: Partial<AutoPartProduct>,
    actor = "admin",
    reason = "Cập nhật thông tin & tồn kho",
  ): Promise<AutoPartProduct | null> {
    const current = await this.prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!current) return null;

    const mergedSpecs: TechnicalSpec = patch.specs
      ? { ...((current.specsJson as unknown) as TechnicalSpec), ...patch.specs }
      : ((current.specsJson as unknown) as TechnicalSpec);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.product.update({
        where: { id: current.id },
        data: {
          slug: patch.slug ?? current.slug,
          sku: patch.sku ?? current.sku,
          oemRef: patch.oemRef ?? current.oemRef,
          nameVi: patch.nameVi ?? current.nameVi,
          nameJp: patch.nameJp ?? current.nameJp,
          kanjiMark: patch.kanjiMark !== undefined ? patch.kanjiMark : current.kanjiMark,
          brand: patch.brand ?? current.brand,
          category: patch.category ?? current.category,
          priceVnd: patch.priceVnd ?? current.priceVnd,
          originalPriceVnd:
            patch.originalPriceVnd !== undefined
              ? patch.originalPriceVnd
              : current.originalPriceVnd,
          stockStatus: patch.stockStatus ?? current.stockStatus,
          stockQty: patch.stockQty ?? current.stockQty,
          image: patch.image ?? current.image,
          badgeText: patch.badgeText ?? current.badgeText,
          compatibleVehicles: patch.compatibleVehicles ?? current.compatibleVehicles,
          specsJson: (mergedSpecs as unknown) as Prisma.InputJsonValue,
          summaryVi: patch.summaryVi ?? current.summaryVi,
          highlights: patch.highlights ?? current.highlights,
          videoPreviewUrl:
            patch.videoPreviewUrl !== undefined
              ? patch.videoPreviewUrl
              : current.videoPreviewUrl,
        },
      });

      if (typeof patch.stockQty === "number" && patch.stockQty !== current.stockQty) {
        await tx.dailyInventoryLog.create({
          data: {
            productId: row.id,
            sku: row.sku,
            deltaQty: row.stockQty - current.stockQty,
            previousQty: current.stockQty,
            newQty: row.stockQty,
            reason,
            actor,
          },
        });
      }

      return row;
    });

    return mapProduct(updated);
  }

  async deleteProduct(id: string): Promise<boolean> {
    const existing = await this.prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!existing) return false;
    await this.prisma.product.delete({ where: { id: existing.id } });
    return true;
  }

  async listOrders(limit = 50): Promise<OrderRecord[]> {
    const rows = await this.prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(mapOrder);
  }

  async listOrdersByCustomer(
    customerId: string,
    phone?: string,
  ): Promise<OrderRecord[]> {
    const normalizedPhone = phone ? normalizePhone(phone) : "";
    const orClauses: Prisma.OrderWhereInput[] = [{ customerId }];
    if (normalizedPhone) {
      orClauses.push({ phone: normalizedPhone });
    }
    const rows = await this.prisma.order.findMany({
      where: { OR: orClauses },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map(mapOrder);
  }

  async findOrderByCode(orderCode: string): Promise<OrderRecord | null> {
    const row = await this.prisma.order.findFirst({
      where: {
        orderCode: {
          equals: orderCode.trim(),
          mode: "insensitive",
        },
      },
      include: { items: true },
    });
    return row ? mapOrder(row) : null;
  }

  async createOrder(order: OrderRecord): Promise<OrderRecord> {
    const created = await this.prisma.order.create({
      data: {
        orderCode: order.orderCode,
        customerId: order.customerId ?? null,
        customerName: order.customerName,
        phone: order.phone,
        vehicleInfo: order.vehicleInfo,
        shippingAddress: order.shippingAddress,
        note: order.note ?? null,
        subtotalVnd: order.subtotalVnd,
        shippingFeeVnd: order.shippingFeeVnd,
        totalVnd: order.totalVnd,
        paymentStatus: order.paymentStatus ?? "unpaid",
        paymentRef: order.paymentRef ?? null,
        status: order.status,
        items: {
          create: order.items.map((item) => ({
            productId: item.productId,
            sku: item.sku,
            nameVi: item.nameVi,
            quantity: item.quantity,
            selectedKelvin: item.selectedKelvin ?? null,
            unitPriceVnd: item.unitPriceVnd,
            lineTotalVnd: item.lineTotalVnd,
          })),
        },
      },
      include: { items: true },
    });
    return mapOrder(created);
  }

  async updateOrderStatus(
    orderCode: string,
    status: OrderRecord["status"],
  ): Promise<OrderRecord | null> {
    const existing = await this.findOrderByCode(orderCode);
    if (!existing) return null;
    const updated = await this.prisma.order.update({
      where: { orderCode: existing.orderCode },
      data: { status },
      include: { items: true },
    });
    return mapOrder(updated);
  }

  async markOrderPaid(orderCode: string, paymentRef: string): Promise<OrderRecord | null> {
    const existing = await this.findOrderByCode(orderCode);
    if (!existing) return null;
    const updated = await this.prisma.order.update({
      where: { orderCode: existing.orderCode },
      data: {
        paymentStatus: "paid",
        paymentRef,
        status: existing.status === "pending_confirm" ? "packed" : existing.status,
      },
      include: { items: true },
    });
    return mapOrder(updated);
  }

  async findAdminByUsername(username: string): Promise<StoredAdminAccount | null> {
    const row = await this.prisma.adminUser.findFirst({
      where: { username: { equals: username.trim(), mode: "insensitive" } },
    });
    if (!row) return null;
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.passwordHash,
      displayName: row.displayName,
      role: row.role,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async upsertAdminUser(
    username: string,
    passwordHash: string,
    displayName: string,
    role = "admin",
  ): Promise<AdminUserRecord> {
    const row = await this.prisma.adminUser.upsert({
      where: { username: username.trim().toLowerCase() },
      update: { passwordHash, displayName, role },
      create: {
        username: username.trim().toLowerCase(),
        passwordHash,
        displayName,
        role,
      },
    });
    return {
      id: row.id,
      username: row.username,
      displayName: row.displayName,
      role: row.role,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listInventoryLogs(limit = 30): Promise<InventoryLogRecord[]> {
    const rows = await this.prisma.dailyInventoryLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      sku: r.sku,
      deltaQty: r.deltaQty,
      previousQty: r.previousQty,
      newQty: r.newQty,
      reason: r.reason,
      actor: r.actor,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async listReviews(
    filter: { productId?: string; status?: ReviewStatus | "all" } = {},
  ): Promise<ProductReviewRecord[]> {
    const where: Prisma.ProductReviewWhereInput = {};
    if (filter.productId) where.productId = filter.productId;
    if (filter.status && filter.status !== "all") where.status = filter.status;
    const rows = await this.prisma.productReview.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapReview);
  }

  async createReview(review: ProductReviewRecord): Promise<ProductReviewRecord> {
    const row = await this.prisma.productReview.create({
      data: {
        id: review.id,
        productId: review.productId,
        customerId: review.customerId ?? null,
        customerName: review.customerName,
        vehicleInfo: review.vehicleInfo,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        beamMode: review.beamMode ?? null,
        photoUrl: review.photoUrl ?? null,
        verifiedPurchase: review.verifiedPurchase,
        orderCode: review.orderCode ?? null,
        status: review.status,
        adminNote: review.adminNote ?? null,
        createdAt: new Date(review.createdAt),
      },
    });
    return mapReview(row);
  }

  async updateReviewStatus(
    id: string,
    status: ReviewStatus,
    adminNote?: string,
  ): Promise<ProductReviewRecord | null> {
    const existing = await this.prisma.productReview.findUnique({ where: { id } });
    if (!existing) return null;
    const updated = await this.prisma.productReview.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote !== undefined ? adminNote : existing.adminNote,
      },
    });
    return mapReview(updated);
  }

  async deleteReview(id: string): Promise<boolean> {
    const existing = await this.prisma.productReview.findUnique({ where: { id } });
    if (!existing) return false;
    await this.prisma.productReview.delete({ where: { id } });
    return true;
  }

  async countCustomers(): Promise<number> {
    return this.prisma.customerUser.count();
  }

  async findCustomerByIdentifier(
    identifier: string,
  ): Promise<StoredCustomerAccount | null> {
    const emailNorm = normalizeEmail(identifier);
    const phoneNorm = normalizePhone(identifier);
    const orClauses: Prisma.CustomerUserWhereInput[] = [];
    if (emailNorm.includes("@")) {
      orClauses.push({ email: { equals: emailNorm, mode: "insensitive" } });
    }
    if (phoneNorm) {
      orClauses.push({ phone: phoneNorm });
    }
    if (orClauses.length === 0) return null;
    const row = await this.prisma.customerUser.findFirst({
      where: { OR: orClauses },
    });
    return row ? mapCustomer(row) : null;
  }

  async findCustomerById(id: string): Promise<StoredCustomerAccount | null> {
    const row = await this.prisma.customerUser.findUnique({ where: { id } });
    return row ? mapCustomer(row) : null;
  }

  async createCustomer(account: StoredCustomerAccount): Promise<CustomerProfileRecord> {
    const row = await this.prisma.customerUser.create({
      data: {
        id: account.id,
        fullName: account.fullName,
        phone: account.phone ?? null,
        email: account.email ?? null,
        passwordHash: account.passwordHash,
        shippingAddress: account.shippingAddress ?? null,
        garageVehiclesJson: (account.garageVehicles as unknown) as Prisma.InputJsonValue,
      },
    });
    return toPublicCustomer(mapCustomer(row));
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
    const existing = await this.prisma.customerUser.findUnique({ where: { id } });
    if (!existing) return null;
    const row = await this.prisma.customerUser.update({
      where: { id },
      data: {
        fullName: patch.fullName ?? existing.fullName,
        phone: patch.phone !== undefined ? patch.phone : existing.phone,
        email: patch.email !== undefined ? patch.email : existing.email,
        shippingAddress:
          patch.shippingAddress !== undefined
            ? patch.shippingAddress
            : existing.shippingAddress,
        passwordHash: patch.passwordHash ?? existing.passwordHash,
        garageVehiclesJson:
          patch.garageVehicles !== undefined
            ? ((patch.garageVehicles as unknown) as Prisma.InputJsonValue)
            : (existing.garageVehiclesJson as Prisma.InputJsonValue),
      },
    });
    return toPublicCustomer(mapCustomer(row));
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

