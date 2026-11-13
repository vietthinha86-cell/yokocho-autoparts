-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "oemRef" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameJp" TEXT NOT NULL,
    "kanjiMark" TEXT,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priceVnd" INTEGER NOT NULL,
    "originalPriceVnd" INTEGER,
    "stockStatus" TEXT NOT NULL,
    "stockQty" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "badgeText" TEXT NOT NULL,
    "compatibleVehicles" TEXT[],
    "specsJson" JSONB NOT NULL,
    "summaryVi" TEXT NOT NULL,
    "highlights" TEXT[],
    "videoPreviewUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleFitment" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "years" TEXT[],
    "recommendedSockets" TEXT[],

    CONSTRAINT "VehicleFitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleBuildCombo" (
    "id" TEXT NOT NULL,
    "vehicleTitle" TEXT NOT NULL,
    "jpSubtitle" TEXT NOT NULL,
    "driverStyle" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "recommendedMode" TEXT NOT NULL,
    "descriptionVi" TEXT NOT NULL,
    "productIds" TEXT[],
    "bundleDiscountPct" INTEGER NOT NULL,

    CONSTRAINT "VehicleBuildCombo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicleInfo" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "note" TEXT,
    "subtotalVnd" INTEGER NOT NULL,
    "shippingFeeVnd" INTEGER NOT NULL,
    "totalVnd" INTEGER NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid',
    "paymentRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_confirm',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "selectedKelvin" TEXT,
    "unitPriceVnd" INTEGER NOT NULL,
    "lineTotalVnd" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyInventoryLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "deltaQty" INTEGER NOT NULL,
    "previousQty" INTEGER NOT NULL,
    "newQty" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyInventoryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleFitment_make_model_key" ON "VehicleFitment"("make", "model");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

