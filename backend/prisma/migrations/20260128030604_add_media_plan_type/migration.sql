-- CreateEnum
CREATE TYPE "MediaPlanType" AS ENUM ('ADS', 'DESIGN', 'CONTENT');

-- AlterTable
ALTER TABLE "media_plans" ADD COLUMN     "type" "MediaPlanType" NOT NULL DEFAULT 'ADS';

-- CreateIndex
CREATE INDEX "media_plans_projectId_type_idx" ON "media_plans"("projectId", "type");
