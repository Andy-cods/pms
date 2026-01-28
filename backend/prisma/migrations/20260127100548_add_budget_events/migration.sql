-- CreateEnum
CREATE TYPE "BudgetEventType" AS ENUM ('ALLOC', 'SPEND', 'ADJUST');

-- CreateTable
CREATE TABLE "budget_events" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "mediaPlanId" TEXT,
    "stage" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "BudgetEventType" NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "budget_events_projectId_idx" ON "budget_events"("projectId");

-- CreateIndex
CREATE INDEX "budget_events_mediaPlanId_idx" ON "budget_events"("mediaPlanId");

-- CreateIndex
CREATE INDEX "budget_events_createdById_idx" ON "budget_events"("createdById");

-- AddForeignKey
ALTER TABLE "budget_events" ADD CONSTRAINT "budget_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_events" ADD CONSTRAINT "budget_events_mediaPlanId_fkey" FOREIGN KEY ("mediaPlanId") REFERENCES "media_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_events" ADD CONSTRAINT "budget_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
