-- CreateEnum
CREATE TYPE "PosProvider" AS ENUM ('SQUARE', 'CLOVER', 'TOAST');

-- CreateEnum
CREATE TYPE "PosStatus" AS ENUM ('PENDING', 'CONNECTED', 'ERROR', 'DISCONNECTED');

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "sprintStartDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PosConnection" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "provider" "PosProvider" NOT NULL,
    "status" "PosStatus" NOT NULL DEFAULT 'PENDING',
    "externalMerchantId" TEXT,
    "connectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT,
    "actorId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PosConnection_restaurantId_key" ON "PosConnection"("restaurantId");

-- CreateIndex
CREATE INDEX "AuditLog_restaurantId_idx" ON "AuditLog"("restaurantId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- AddForeignKey
ALTER TABLE "PosConnection" ADD CONSTRAINT "PosConnection_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
