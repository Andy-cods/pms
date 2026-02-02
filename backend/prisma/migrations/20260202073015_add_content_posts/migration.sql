-- CreateEnum
CREATE TYPE "ContentPostStatus" AS ENUM ('IDEA', 'DRAFT', 'REVIEW', 'APPROVED', 'REVISION_REQUESTED', 'SCHEDULED', 'PUBLISHED', 'CANCELLED');

-- CreateTable
CREATE TABLE "content_posts" (
    "id" TEXT NOT NULL,
    "mediaPlanItemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "postType" TEXT NOT NULL,
    "status" "ContentPostStatus" NOT NULL DEFAULT 'IDEA',
    "scheduledDate" TIMESTAMP(3),
    "publishedDate" TIMESTAMP(3),
    "postUrl" TEXT,
    "assigneeId" TEXT,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_post_revisions" (
    "id" TEXT NOT NULL,
    "contentPostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "revisionNote" TEXT,
    "revisedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_post_revisions_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add contentPostId to files
ALTER TABLE "files" ADD COLUMN "contentPostId" TEXT;

-- CreateIndex
CREATE INDEX "content_posts_mediaPlanItemId_idx" ON "content_posts"("mediaPlanItemId");

-- CreateIndex
CREATE INDEX "content_posts_status_idx" ON "content_posts"("status");

-- CreateIndex
CREATE INDEX "content_posts_scheduledDate_idx" ON "content_posts"("scheduledDate");

-- CreateIndex
CREATE INDEX "content_posts_assigneeId_idx" ON "content_posts"("assigneeId");

-- CreateIndex
CREATE INDEX "content_posts_mediaPlanItemId_status_idx" ON "content_posts"("mediaPlanItemId", "status");

-- CreateIndex
CREATE INDEX "content_post_revisions_contentPostId_idx" ON "content_post_revisions"("contentPostId");

-- CreateIndex
CREATE INDEX "files_contentPostId_idx" ON "files"("contentPostId");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_contentPostId_fkey" FOREIGN KEY ("contentPostId") REFERENCES "content_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_mediaPlanItemId_fkey" FOREIGN KEY ("mediaPlanItemId") REFERENCES "media_plan_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_posts" ADD CONSTRAINT "content_posts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_post_revisions" ADD CONSTRAINT "content_post_revisions_contentPostId_fkey" FOREIGN KEY ("contentPostId") REFERENCES "content_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_post_revisions" ADD CONSTRAINT "content_post_revisions_revisedById_fkey" FOREIGN KEY ("revisedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
