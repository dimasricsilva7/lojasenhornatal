-- CreateTable
CREATE TABLE "SocialProof" (
    "id" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "name" TEXT,
    "city" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialProof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialProof_active_sortOrder_idx" ON "SocialProof"("active", "sortOrder");
