-- CreateTable
CREATE TABLE "AtacadoLead" (
    "id" TEXT NOT NULL,
    "campaign" TEXT NOT NULL DEFAULT 'atacado-panetone',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "buyerType" TEXT NOT NULL DEFAULT 'empresa',
    "company" TEXT,
    "city" TEXT,
    "items" JSONB NOT NULL,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "sinalCents" INTEGER NOT NULL DEFAULT 0,
    "totalPieces" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "adminNote" TEXT,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "fbclid" TEXT,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AtacadoLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtacadoLead_campaign_createdAt_idx" ON "AtacadoLead"("campaign", "createdAt");

-- CreateIndex
CREATE INDEX "AtacadoLead_status_idx" ON "AtacadoLead"("status");
