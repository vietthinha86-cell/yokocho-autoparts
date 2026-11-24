import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import {
  AUTO_PARTS_CATALOG,
  DEFAULT_DEMO_CUSTOMER_SEED,
  DEFAULT_DEMO_ORDERS,
  DEFAULT_PRODUCT_REVIEWS,
  VEHICLE_COMBOS,
  VEHICLE_FITMENTS,
} from "../src/data/catalog.ts";
import { loadProjectEnv } from "../src/envLoader.ts";
import type {
  AutoPartProduct,
  OrderRecord,
  ProductReviewRecord,
} from "../src/types.ts";
import type { StoredCustomerAccount } from "../src/store/repository.ts";

loadProjectEnv(true);

async function syncRuntimeJsonSnapshot(prisma: PrismaClient): Promise<void> {
  const runtimePath = path.resolve(import.meta.dirname, "../data/store.runtime.json");
  if (!fs.existsSync(runtimePath)) {
    return;
  }
  try {
    const raw = fs.readFileSync(runtimePath, "utf8");
    const parsed = JSON.parse(raw) as {
      products?: AutoPartProduct[];
      orders?: OrderRecord[];
      customers?: StoredCustomerAccount[];
      reviews?: ProductReviewRecord[];
    };

    if (Array.isArray(parsed.products)) {
      for (const product of parsed.products) {
        await prisma.product.upsert({
          where: { id: product.id },
          update: {},
          create: {
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
          },
        });
      }
    }

    if (Array.isArray(parsed.customers)) {
      for (const customer of parsed.customers) {
        await prisma.customerUser.upsert({
          where: { id: customer.id },
          update: {},
          create: {
            id: customer.id,
            fullName: customer.fullName,
            phone: customer.phone ?? null,
            email: customer.email ?? null,
            passwordHash: customer.passwordHash,
            shippingAddress: customer.shippingAddress ?? null,
            garageVehiclesJson: (customer.garageVehicles as unknown) as Prisma.InputJsonValue,
          },
        });
      }
    }

    if (Array.isArray(parsed.orders)) {
      for (const order of parsed.orders) {
        await prisma.order.upsert({
          where: { orderCode: order.orderCode },
          update: {},
          create: {
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
            createdAt: new Date(order.createdAt),
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
        });
      }
    }

    if (Array.isArray(parsed.reviews)) {
      for (const rev of parsed.reviews) {
        await prisma.productReview.upsert({
          where: { id: rev.id },
          update: {},
          create: {
            id: rev.id,
            productId: rev.productId,
            customerId: rev.customerId ?? null,
            customerName: rev.customerName,
            vehicleInfo: rev.vehicleInfo,
            rating: rev.rating,
            title: rev.title,
            comment: rev.comment,
            beamMode: rev.beamMode ?? null,
            photoUrl: rev.photoUrl ?? null,
            verifiedPurchase: rev.verifiedPurchase,
            orderCode: rev.orderCode ?? null,
            status: rev.status,
            adminNote: rev.adminNote ?? null,
            createdAt: new Date(rev.createdAt),
          },
        });
      }
    }
  } catch (err) {
    console.warn("Runtime JSON sync skipped:", err instanceof Error ? err.message : err);
  }
}

export async function seedDatabase(externalPrisma?: PrismaClient): Promise<void> {
  const prisma = externalPrisma ?? new PrismaClient();
  console.log("==> Seeding Akari Yokocho PostgreSQL database...");

  for (const product of AUTO_PARTS_CATALOG) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
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
      },
      create: {
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
      },
    });
  }

  for (const fitment of VEHICLE_FITMENTS) {
    await prisma.vehicleFitment.upsert({
      where: {
        make_model: {
          make: fitment.make,
          model: fitment.model,
        },
      },
      update: {
        years: fitment.years,
        recommendedSockets: fitment.recommendedSockets,
      },
      create: {
        make: fitment.make,
        model: fitment.model,
        years: fitment.years,
        recommendedSockets: fitment.recommendedSockets,
      },
    });
  }

  for (const combo of VEHICLE_COMBOS) {
    await prisma.vehicleBuildCombo.upsert({
      where: { id: combo.id },
      update: {
        vehicleTitle: combo.vehicleTitle,
        jpSubtitle: combo.jpSubtitle,
        driverStyle: combo.driverStyle,
        image: combo.image,
        recommendedMode: combo.recommendedMode,
        descriptionVi: combo.descriptionVi,
        productIds: combo.productIds,
        bundleDiscountPct: combo.bundleDiscountPct,
      },
      create: {
        id: combo.id,
        vehicleTitle: combo.vehicleTitle,
        jpSubtitle: combo.jpSubtitle,
        driverStyle: combo.driverStyle,
        image: combo.image,
        recommendedMode: combo.recommendedMode,
        descriptionVi: combo.descriptionVi,
        productIds: combo.productIds,
        bundleDiscountPct: combo.bundleDiscountPct,
      },
    });
  }

  const adminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD?.trim() || "yokocho2026";
  const passwordHash = bcrypt.hashSync(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: { passwordHash, displayName: "Chủ Xưởng Phố Đèn Đỏ", role: "admin" },
    create: {
      username: adminUsername,
      passwordHash,
      displayName: "Chủ Xưởng Phố Đèn Đỏ",
      role: "admin",
    },
  });

  for (const rev of DEFAULT_PRODUCT_REVIEWS) {
    await prisma.productReview.upsert({
      where: { id: rev.id },
      update: {},
      create: {
        id: rev.id,
        productId: rev.productId,
        customerId: rev.customerId ?? null,
        customerName: rev.customerName,
        vehicleInfo: rev.vehicleInfo,
        rating: rev.rating,
        title: rev.title,
        comment: rev.comment,
        beamMode: rev.beamMode ?? null,
        photoUrl: rev.photoUrl ?? null,
        verifiedPurchase: rev.verifiedPurchase,
        orderCode: rev.orderCode ?? null,
        status: rev.status,
        adminNote: rev.adminNote ?? null,
        createdAt: new Date(rev.createdAt),
      },
    });
  }

  const demoCustHash = bcrypt.hashSync(DEFAULT_DEMO_CUSTOMER_SEED.defaultPassword, 10);
  await prisma.customerUser.upsert({
    where: { id: DEFAULT_DEMO_CUSTOMER_SEED.id },
    update: {},
    create: {
      id: DEFAULT_DEMO_CUSTOMER_SEED.id,
      fullName: DEFAULT_DEMO_CUSTOMER_SEED.fullName,
      phone: DEFAULT_DEMO_CUSTOMER_SEED.phone,
      email: DEFAULT_DEMO_CUSTOMER_SEED.email,
      passwordHash: demoCustHash,
      shippingAddress: DEFAULT_DEMO_CUSTOMER_SEED.shippingAddress,
      garageVehiclesJson: (DEFAULT_DEMO_CUSTOMER_SEED.garageVehicles as unknown) as Prisma.InputJsonValue,
    },
  });

  for (const demoOrder of DEFAULT_DEMO_ORDERS) {
    await prisma.order.upsert({
      where: { orderCode: demoOrder.orderCode },
      update: {},
      create: {
        orderCode: demoOrder.orderCode,
        customerId: demoOrder.customerId ?? null,
        customerName: demoOrder.customerName,
        phone: demoOrder.phone,
        vehicleInfo: demoOrder.vehicleInfo,
        shippingAddress: demoOrder.shippingAddress,
        note: demoOrder.note ?? null,
        subtotalVnd: demoOrder.subtotalVnd,
        shippingFeeVnd: demoOrder.shippingFeeVnd,
        totalVnd: demoOrder.totalVnd,
        paymentStatus: demoOrder.paymentStatus ?? "unpaid",
        paymentRef: demoOrder.paymentRef ?? null,
        status: demoOrder.status,
        createdAt: new Date(demoOrder.createdAt),
        items: {
          create: demoOrder.items.map((item) => ({
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
    });
  }

  await syncRuntimeJsonSnapshot(prisma);

  console.log(
    `==> Seeded ${AUTO_PARTS_CATALOG.length} products, ${VEHICLE_FITMENTS.length} fitments, ${VEHICLE_COMBOS.length} combos, ${DEFAULT_PRODUCT_REVIEWS.length} reviews, demo customer, and admin '${adminUsername}'.`,
  );

  if (!externalPrisma) {
    await prisma.$disconnect();
  }
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === path.resolve(import.meta.filename);

if (isDirectExecution) {
  seedDatabase().catch((err) => {
    console.error("Seed error:", err);
    process.exitCode = 1;
  });
}
