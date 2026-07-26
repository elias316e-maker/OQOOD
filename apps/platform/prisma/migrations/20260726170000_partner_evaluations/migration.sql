CREATE TABLE "PartnerEvaluation" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "businessPartnerId" TEXT NOT NULL,
  "timelinessScore" INTEGER NOT NULL,
  "qualityScore" INTEGER NOT NULL,
  "responsivenessScore" INTEGER NOT NULL,
  "financialScore" INTEGER NOT NULL,
  "overallScore" DECIMAL(5,2) NOT NULL,
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartnerEvaluation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PartnerEvaluation_scores_range" CHECK (
    "timelinessScore" BETWEEN 1 AND 5 AND "qualityScore" BETWEEN 1 AND 5
    AND "responsivenessScore" BETWEEN 1 AND 5 AND "financialScore" BETWEEN 1 AND 5
  )
);
CREATE INDEX "PartnerEvaluation_contractId_createdAt_idx" ON "PartnerEvaluation"("contractId","createdAt");
CREATE INDEX "PartnerEvaluation_businessPartnerId_createdAt_idx" ON "PartnerEvaluation"("businessPartnerId","createdAt");
ALTER TABLE "PartnerEvaluation" ADD CONSTRAINT "PartnerEvaluation_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerEvaluation" ADD CONSTRAINT "PartnerEvaluation_businessPartnerId_fkey" FOREIGN KEY ("businessPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerEvaluation" ADD CONSTRAINT "PartnerEvaluation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
