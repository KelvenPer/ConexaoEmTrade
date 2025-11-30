/*
  Warnings:

  - Made the column `sector` on table `TBLACCESSPOLICY` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "UserSector" ADD VALUE 'GLOBAL';
