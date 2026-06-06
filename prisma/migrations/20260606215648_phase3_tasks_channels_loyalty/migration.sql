-- CreateEnum
CREATE TYPE "TaskOwner" AS ENUM ('UPREVI', 'CLIENT');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('TODO', 'APPROVAL', 'MILESTONE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'AWAITING_CLIENT', 'DONE');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner" "TaskOwner" NOT NULL DEFAULT 'UPREVI',
    "type" "TaskType" NOT NULL DEFAULT 'TODO',
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelRevenue" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "channel" "SalesChannel" NOT NULL,
    "revenue" DECIMAL(10,2) NOT NULL,
    "orders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyConfig" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "pointsPerDollar" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyReward" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_restaurantId_idx" ON "Task"("restaurantId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "ChannelRevenue_restaurantId_idx" ON "ChannelRevenue"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelRevenue_restaurantId_date_channel_key" ON "ChannelRevenue"("restaurantId", "date", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyConfig_restaurantId_key" ON "LoyaltyConfig"("restaurantId");

-- CreateIndex
CREATE INDEX "LoyaltyReward_restaurantId_idx" ON "LoyaltyReward"("restaurantId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelRevenue" ADD CONSTRAINT "ChannelRevenue_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyConfig" ADD CONSTRAINT "LoyaltyConfig_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
