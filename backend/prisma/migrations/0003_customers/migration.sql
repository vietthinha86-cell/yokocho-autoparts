-- Add CustomerUser accounts and link customerId on Order & ProductReview
CREATE TABLE "CustomerUser" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "shippingAddress" TEXT,
    "garageVehiclesJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerUser_phone_key" ON "CustomerUser"("phone");
CREATE UNIQUE INDEX "CustomerUser_email_key" ON "CustomerUser"("email");

ALTER TABLE "Order" ADD COLUMN "customerId" TEXT;
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_phone_idx" ON "Order"("phone");

ALTER TABLE "ProductReview" ADD COLUMN "customerId" TEXT;
