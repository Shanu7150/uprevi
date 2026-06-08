-- CreateEnum
CREATE TYPE "PromotionTrigger" AS ENUM ('MANUAL', 'WEATHER', 'EVENT', 'GAMEDAY', 'SLOW_DAY');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'DISMISSED', 'ENDED');

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "status" "PromotionStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "triggerType" "PromotionTrigger" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "RevenuePrediction" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "predictedRevenue" DECIMAL(10,2) NOT NULL,
    "baselineRevenue" DECIMAL(10,2) NOT NULL,
    "liftPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "drivers" JSONB NOT NULL DEFAULT '[]',
    "headline" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenuePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpsellRule" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "triggerItemId" TEXT NOT NULL,
    "suggestedItemId" TEXT NOT NULL,
    "timesShown" INTEGER NOT NULL DEFAULT 0,
    "timesConverted" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpsellRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RevenuePrediction_restaurantId_idx" ON "RevenuePrediction"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenuePrediction_restaurantId_date_key" ON "RevenuePrediction"("restaurantId", "date");

-- CreateIndex
CREATE INDEX "UpsellRule_restaurantId_idx" ON "UpsellRule"("restaurantId");

-- CreateIndex
CREATE INDEX "UpsellRule_triggerItemId_idx" ON "UpsellRule"("triggerItemId");

-- CreateIndex
CREATE UNIQUE INDEX "UpsellRule_restaurantId_triggerItemId_suggestedItemId_key" ON "UpsellRule"("restaurantId", "triggerItemId", "suggestedItemId");

-- AddForeignKey
ALTER TABLE "RevenuePrediction" ADD CONSTRAINT "RevenuePrediction_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellRule" ADD CONSTRAINT "UpsellRule_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellRule" ADD CONSTRAINT "UpsellRule_triggerItemId_fkey" FOREIGN KEY ("triggerItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpsellRule" ADD CONSTRAINT "UpsellRule_suggestedItemId_fkey" FOREIGN KEY ("suggestedItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
