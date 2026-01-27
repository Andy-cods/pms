-- CreateTable
CREATE TABLE "stage_histories" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromStage" "ProjectStage",
    "toStage" "ProjectStage" NOT NULL,
    "fromProgress" INTEGER NOT NULL DEFAULT 0,
    "toProgress" INTEGER NOT NULL DEFAULT 0,
    "changedById" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stage_histories_projectId_idx" ON "stage_histories"("projectId");

-- CreateIndex
CREATE INDEX "stage_histories_createdAt_idx" ON "stage_histories"("createdAt");

-- AddForeignKey
ALTER TABLE "stage_histories" ADD CONSTRAINT "stage_histories_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
