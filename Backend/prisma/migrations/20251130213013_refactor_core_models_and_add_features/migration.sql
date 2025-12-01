/*
  Warnings:

  - You are about to drop the column `storeScope` on the `TBLEXECTAREFA` table. All the data in the column will be lost.
  - You are about to drop the column `jbpId` on the `TBLINITIATIVE` table. All the data in the column will be lost.
  - You are about to drop the column `storeScope` on the `TBLJBPITEM` table. All the data in the column will be lost.
  - Added the required column `storeId` to the `TBLEXECTAREFA` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `TBLVENDASRESUMO` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('PENDENTE', 'VALIDADO_IA', 'REJEITADO');

-- CreateEnum
CREATE TYPE "WorkflowAction" AS ENUM ('APROVACAO_SOLICITADA', 'APROVADO', 'REPROVADO', 'COMENTARIO_ADICIONADO');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- DropForeignKey
ALTER TABLE "TBLINITIATIVE" DROP CONSTRAINT "TBLINITIATIVE_jbpId_fkey";

-- AlterTable
ALTER TABLE "TBLCAMPANHA" ADD COLUMN     "initiativeId" INTEGER;

-- AlterTable
ALTER TABLE "TBLEXECTAREFA" DROP COLUMN "storeScope",
ADD COLUMN     "storeId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "TBLINITIATIVE" DROP COLUMN "jbpId";

-- AlterTable
ALTER TABLE "TBLJBP" ADD COLUMN     "initiativeId" INTEGER,
ADD COLUMN     "walletId" INTEGER;

-- AlterTable
ALTER TABLE "TBLJBPITEM" DROP COLUMN "storeScope";

-- AlterTable
ALTER TABLE "TBLVENDASRESUMO" ADD COLUMN     "productId" INTEGER NOT NULL,
ADD COLUMN     "storeId" INTEGER;

-- CreateTable
CREATE TABLE "TBLSTORE" (
    "id" SERIAL NOT NULL,
    "retailId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT,
    "cluster" TEXT,
    "city" TEXT,
    "state" TEXT,

    CONSTRAINT "TBLSTORE_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TBLJBPITEM_STORE" (
    "jbpItemId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,

    CONSTRAINT "TBLJBPITEM_STORE_pkey" PRIMARY KEY ("jbpItemId","storeId")
);

-- CreateTable
CREATE TABLE "TBLDAILY_SALES" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "productId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "retailId" INTEGER NOT NULL,
    "sellOutValue" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,

    CONSTRAINT "TBLDAILY_SALES_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TBLPROOF" (
    "id" SERIAL NOT NULL,
    "jbpItemId" INTEGER NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "status" "ProofStatus" NOT NULL DEFAULT 'PENDENTE',
    "aiConfidence" DOUBLE PRECISION,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TBLPROOF_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TBLWALLET" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "totalBudget" DOUBLE PRECISION NOT NULL,
    "consumedBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TBLWALLET_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TBLAUDITLOG" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "action" "AuditAction" NOT NULL,
    "tableName" TEXT NOT NULL,
    "recordId" INTEGER NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,

    CONSTRAINT "TBLAUDITLOG_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TBLWORKFLOW_HISTORY" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "relatedTable" TEXT NOT NULL,
    "recordId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" "WorkflowAction" NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "reason" TEXT,

    CONSTRAINT "TBLWORKFLOW_HISTORY_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TBLSTORE_retailId_code_key" ON "TBLSTORE"("retailId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "TBLDAILY_SALES_date_productId_storeId_key" ON "TBLDAILY_SALES"("date", "productId", "storeId");

-- CreateIndex
CREATE UNIQUE INDEX "TBLWALLET_supplierId_name_year_key" ON "TBLWALLET"("supplierId", "name", "year");

-- CreateIndex
CREATE INDEX "TBLAUDITLOG_tableName_recordId_idx" ON "TBLAUDITLOG"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "TBLWORKFLOW_HISTORY_relatedTable_recordId_idx" ON "TBLWORKFLOW_HISTORY"("relatedTable", "recordId");

-- CreateIndex
CREATE INDEX "TBLPROD_brand_idx" ON "TBLPROD"("brand");

-- CreateIndex
CREATE INDEX "TBLPROD_category_idx" ON "TBLPROD"("category");

-- AddForeignKey
ALTER TABLE "TBLJBP" ADD CONSTRAINT "TBLJBP_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "TBLINITIATIVE"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLJBP" ADD CONSTRAINT "TBLJBP_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "TBLWALLET"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLCAMPANHA" ADD CONSTRAINT "TBLCAMPANHA_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "TBLINITIATIVE"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLEXECTAREFA" ADD CONSTRAINT "TBLEXECTAREFA_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "TBLSTORE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLVENDASRESUMO" ADD CONSTRAINT "TBLVENDASRESUMO_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TBLPROD"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLVENDASRESUMO" ADD CONSTRAINT "TBLVENDASRESUMO_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "TBLSTORE"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLSTORE" ADD CONSTRAINT "TBLSTORE_retailId_fkey" FOREIGN KEY ("retailId") REFERENCES "TBLRETAIL"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLJBPITEM_STORE" ADD CONSTRAINT "TBLJBPITEM_STORE_jbpItemId_fkey" FOREIGN KEY ("jbpItemId") REFERENCES "TBLJBPITEM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLJBPITEM_STORE" ADD CONSTRAINT "TBLJBPITEM_STORE_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "TBLSTORE"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLDAILY_SALES" ADD CONSTRAINT "TBLDAILY_SALES_productId_fkey" FOREIGN KEY ("productId") REFERENCES "TBLPROD"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLDAILY_SALES" ADD CONSTRAINT "TBLDAILY_SALES_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "TBLSTORE"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLDAILY_SALES" ADD CONSTRAINT "TBLDAILY_SALES_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TBLFORN"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLDAILY_SALES" ADD CONSTRAINT "TBLDAILY_SALES_retailId_fkey" FOREIGN KEY ("retailId") REFERENCES "TBLRETAIL"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLPROOF" ADD CONSTRAINT "TBLPROOF_jbpItemId_fkey" FOREIGN KEY ("jbpItemId") REFERENCES "TBLJBPITEM"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLWALLET" ADD CONSTRAINT "TBLWALLET_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TBLFORN"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLAUDITLOG" ADD CONSTRAINT "TBLAUDITLOG_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TBLUSER"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLWORKFLOW_HISTORY" ADD CONSTRAINT "TBLWORKFLOW_HISTORY_userId_fkey" FOREIGN KEY ("userId") REFERENCES "TBLUSER"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
