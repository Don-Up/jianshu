-- CreateTable
CREATE TABLE "reading_history" (
    "id" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "reading_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reading_history_userId_viewedAt_idx" ON "reading_history"("userId", "viewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "reading_history_userId_articleId_key" ON "reading_history"("userId", "articleId");

-- AddForeignKey
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
