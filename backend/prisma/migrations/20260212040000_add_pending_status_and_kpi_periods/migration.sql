-- AlterEnum: Add PENDING to TaskStatus
ALTER TYPE "TaskStatus" ADD VALUE 'PENDING';

-- AlterTable: Add KPI period columns
ALTER TABLE "project_kpis" ADD COLUMN     "periodEnd" TIMESTAMP(3),
ADD COLUMN     "periodLabel" TEXT,
ADD COLUMN     "periodStart" TIMESTAMP(3),
ADD COLUMN     "targetDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "project_kpis_projectId_periodLabel_idx" ON "project_kpis"("projectId", "periodLabel");
