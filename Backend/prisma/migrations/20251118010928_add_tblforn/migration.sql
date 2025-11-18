/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "TBLUSER" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "login" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TBLUSER_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TBLFORN" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "segment" TEXT,
    "channel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TBLFORN_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TBLUSER_email_key" ON "TBLUSER"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TBLUSER_login_key" ON "TBLUSER"("login");
