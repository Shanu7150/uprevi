-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'BOOKED', 'WON', 'LOST');

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "stripeConnectId" TEXT;

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "restaurantName" TEXT,
    "message" TEXT,
    "source" TEXT NOT NULL DEFAULT 'marketing_audit_form',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "ghlSynced" BOOLEAN NOT NULL DEFAULT false,
    "ghlContactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_email_idx" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
