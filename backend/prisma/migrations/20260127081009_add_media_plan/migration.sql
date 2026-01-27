-- CreateEnum
CREATE TYPE "MediaPlanStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "ApprovalType" ADD VALUE 'MEDIA_PLAN';

-- CreateTable
CREATE TABLE "media_plans" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "MediaPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "totalBudget" DECIMAL(15,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_plan_items" (
    "id" TEXT NOT NULL,
    "mediaPlanId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "budget" DECIMAL(15,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "targetReach" INTEGER,
    "targetClicks" INTEGER,
    "targetLeads" INTEGER,
    "targetCPL" DECIMAL(10,2),
    "targetCPC" DECIMAL(10,2),
    "targetROAS" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'planned',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_plans_projectId_idx" ON "media_plans"("projectId");

-- CreateIndex
CREATE INDEX "media_plans_status_idx" ON "media_plans"("status");

-- CreateIndex
CREATE INDEX "media_plan_items_mediaPlanId_idx" ON "media_plan_items"("mediaPlanId");

-- CreateIndex
CREATE INDEX "event_attendees_userId_idx" ON "event_attendees"("userId");

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_plans" ADD CONSTRAINT "media_plans_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_plans" ADD CONSTRAINT "media_plans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_plan_items" ADD CONSTRAINT "media_plan_items_mediaPlanId_fkey" FOREIGN KEY ("mediaPlanId") REFERENCES "media_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
