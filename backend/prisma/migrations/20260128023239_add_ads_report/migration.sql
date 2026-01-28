-- CreateEnum
CREATE TYPE "AdsReportPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "AdsPlatform" AS ENUM ('FACEBOOK', 'GOOGLE', 'TIKTOK', 'OTHER');

-- CreateEnum
CREATE TYPE "AdsReportSource" AS ENUM ('MANUAL', 'ZAPIER');

-- CreateTable
CREATE TABLE "ads_reports" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "period" "AdsReportPeriod" NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cpc" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cpm" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cpa" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "roas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adSpend" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "platform" "AdsPlatform" NOT NULL,
    "campaignName" TEXT,
    "source" "AdsReportSource" NOT NULL DEFAULT 'MANUAL',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ads_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ads_reports_projectId_idx" ON "ads_reports"("projectId");

-- CreateIndex
CREATE INDEX "ads_reports_reportDate_idx" ON "ads_reports"("reportDate");

-- CreateIndex
CREATE INDEX "ads_reports_platform_idx" ON "ads_reports"("platform");

-- CreateIndex
CREATE INDEX "ads_reports_period_idx" ON "ads_reports"("period");

-- AddForeignKey
ALTER TABLE "ads_reports" ADD CONSTRAINT "ads_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ads_reports" ADD CONSTRAINT "ads_reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
