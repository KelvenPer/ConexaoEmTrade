-- CreateEnum
CREATE TYPE "UserSector" AS ENUM ('MARKETING', 'TRADE_MARKETING', 'COMERCIAL', 'ANALITICA');

-- CreateEnum
CREATE TYPE "ModuleCode" AS ENUM ('DASHBOARD', 'MARKETING', 'TRADE', 'COMERCIAL', 'ANALYTICS', 'CONFIG', 'CONTRACTS');

-- CreateEnum
CREATE TYPE "PermissionLevel" AS ENUM ('VIEW', 'MANAGE');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "TBLUSER" ADD COLUMN     "sector" "UserSector" NOT NULL DEFAULT 'MARKETING';

-- CreateTable
CREATE TABLE "TBLACCESSPOLICY" (
    "id" SERIAL NOT NULL,
    "role" "UserRole" NOT NULL,
    "accessChannel" "AccessChannel" NOT NULL,
    "sector" "UserSector",
    "module" "ModuleCode" NOT NULL,
    "permission" "PermissionLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TBLACCESSPOLICY_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TBLACCESSPOLICY_role_accessChannel_sector_module_permission_key" ON "TBLACCESSPOLICY"("role", "accessChannel", "sector", "module", "permission");
