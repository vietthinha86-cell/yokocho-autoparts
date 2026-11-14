import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  AUTO_PARTS_CATALOG,
  DEFAULT_PRODUCT_REVIEWS,
  VEHICLE_COMBOS,
  VEHICLE_FITMENTS,
} from "../src/data/catalog.ts";

try {
  process.loadEnvFile?.();
} catch {
  // .env file is optional when DATABASE_URL is injected via environment
}

const prisma = new PrismaClient();

async function main() {
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

  console.log(
    `==> Seeded ${AUTO_PARTS_CATALOG.length} products, ${VEHICLE_FITMENTS.length} fitments, ${VEHICLE_COMBOS.length} combos, ${DEFAULT_PRODUCT_REVIEWS.length} reviews, and admin '${adminUsername}'.`,
  );
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
