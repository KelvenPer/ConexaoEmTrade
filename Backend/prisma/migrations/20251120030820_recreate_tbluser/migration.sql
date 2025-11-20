/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `TBLUSER` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TBLUSER" DROP COLUMN "updatedAt",
ALTER COLUMN "login" DROP NOT NULL;
