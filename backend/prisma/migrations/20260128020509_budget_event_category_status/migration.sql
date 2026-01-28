-- CreateEnum
CREATE TYPE "BudgetEventCategory" AS ENUM ('FIXED_AD', 'AD_SERVICE', 'CONTENT', 'DESIGN', 'MEDIA', 'OTHER');

-- CreateEnum
CREATE TYPE "BudgetEventStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- AlterTable
ALTER TABLE "budget_events" ADD COLUMN     "category" "BudgetEventCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "status" "BudgetEventStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "budget_events_status_idx" ON "budget_events"("status");

-- CreateIndex
CREATE INDEX "budget_events_category_idx" ON "budget_events"("category");
