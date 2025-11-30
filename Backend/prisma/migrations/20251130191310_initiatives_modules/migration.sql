-- CreateEnum
CREATE TYPE "InitiativeType" AS ENUM ('MARKETING', 'TRADE', 'RETAIL_MEDIA', 'ECOMMERCE', 'COMERCIAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ModuleCode" ADD VALUE 'RETAIL_MEDIA';
ALTER TYPE "ModuleCode" ADD VALUE 'ECOMMERCE';

-- CreateTable
CREATE TABLE "TBLINITIATIVE" (
    "id" SERIAL NOT NULL,
    "jbpId" INTEGER,
    "supplierId" INTEGER,
    "retailId" INTEGER,
    "type" "InitiativeType" NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "channel" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'planejada',
    "totalBudget" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TBLINITIATIVE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TBLINITIATIVE_PRODUCT" (
    "id" SERIAL NOT NULL,
    "initiativeId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "goalMetric" TEXT,
    "goalValue" DOUBLE PRECISION,
    "allocatedValue" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "TBLINITIATIVE_PRODUCT_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TBLINITIATIVE_ASSET" (
    "id" SERIAL NOT NULL,
    "initiativeId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "plannedValue" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "TBLINITIATIVE_ASSET_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TBLINITIATIVE" ADD CONSTRAINT "TBLINITIATIVE_jbpId_fkey" FOREIGN KEY ("jbpId") REFERENCES "TBLJBP"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLINITIATIVE" ADD CONSTRAINT "TBLINITIATIVE_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TBLFORN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLINITIATIVE" ADD CONSTRAINT "TBLINITIATIVE_retailId_fkey" FOREIGN KEY ("retailId") REFERENCES "TBLRETAIL"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLINITIATIVE_PRODUCT" ADD CONSTRAINT "TBLINITIATIVE_PRODUCT_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "TBLINITIATIVE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLINITIATIVE_PRODUCT" ADD CONSTRAINT "TBLINITIATIVE_PRODUCT_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TBLPROD"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLINITIATIVE_ASSET" ADD CONSTRAINT "TBLINITIATIVE_ASSET_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "TBLINITIATIVE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLINITIATIVE_ASSET" ADD CONSTRAINT "TBLINITIATIVE_ASSET_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "TBLATV"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
