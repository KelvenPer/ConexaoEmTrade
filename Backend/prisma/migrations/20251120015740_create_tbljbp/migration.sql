-- CreateTable
CREATE TABLE "TBLJBP" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "strategy" TEXT,
    "kpiSummary" TEXT,
    "totalBudget" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,

    CONSTRAINT "TBLJBP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TBLJBPITEM" (
    "id" SERIAL NOT NULL,
    "jbpId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "description" TEXT,
    "initiativeType" TEXT NOT NULL DEFAULT 'JBP',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "storeScope" TEXT,
    "unit" TEXT,
    "quantity" INTEGER,
    "negotiatedUnitPrice" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "TBLJBPITEM_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TBLJBP" ADD CONSTRAINT "TBLJBP_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "TBLFORN"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLJBPITEM" ADD CONSTRAINT "TBLJBPITEM_jbpId_fkey" FOREIGN KEY ("jbpId") REFERENCES "TBLJBP"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TBLJBPITEM" ADD CONSTRAINT "TBLJBPITEM_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "TBLATV"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
