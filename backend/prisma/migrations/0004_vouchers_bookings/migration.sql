-- Add Voucher promos, discount columns on Order, and InstallationBooking table

ALTER TABLE "Order" ADD COLUMN "discountVnd" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "voucherCode" TEXT;

CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "descriptionVi" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "minOrderVnd" INTEGER NOT NULL DEFAULT 0,
    "maxDiscountVnd" INTEGER,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

CREATE TABLE "InstallationBooking" (
    "id" TEXT NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "customerId" TEXT,
    "orderCode" TEXT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "vehicleInfo" TEXT NOT NULL,
    "garageBranch" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "bookingDate" TEXT NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstallationBooking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InstallationBooking_bookingCode_key" ON "InstallationBooking"("bookingCode");
CREATE INDEX "InstallationBooking_bookingDate_garageBranch_idx" ON "InstallationBooking"("bookingDate", "garageBranch");
CREATE INDEX "InstallationBooking_customerId_idx" ON "InstallationBooking"("customerId");
CREATE INDEX "InstallationBooking_phone_idx" ON "InstallationBooking"("phone");
