-- CreateTable
CREATE TABLE "shares" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shares_articleId_idx" ON "shares"("articleId");

-- CreateIndex
CREATE INDEX "shares_articleId_platform_idx" ON "shares"("articleId", "platform");

-- AddForeignKey
ALTER TABLE "shares" ADD CONSTRAINT "shares_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
