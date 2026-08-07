/*
  Warnings:

  - You are about to drop the column `businessPartnerId` on the `OpportunityCriterion` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OpportunityCriterion" DROP CONSTRAINT "OpportunityCriterion_businessPartnerId_fkey";

-- AlterTable
ALTER TABLE "OpportunityCriterion" DROP COLUMN "businessPartnerId";

-- CreateTable
CREATE TABLE "OfferCriterionScore" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "score" DECIMAL(7,2),
    "passed" BOOLEAN,
    "notes" TEXT,
    "evaluatedById" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferCriterionScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferCriterionScore_offerId_evaluatedAt_idx" ON "OfferCriterionScore"("offerId", "evaluatedAt");

-- CreateIndex
CREATE INDEX "OfferCriterionScore_criterionId_idx" ON "OfferCriterionScore"("criterionId");

-- CreateIndex
CREATE INDEX "OfferCriterionScore_evaluatedById_idx" ON "OfferCriterionScore"("evaluatedById");

-- CreateIndex
CREATE UNIQUE INDEX "OfferCriterionScore_offerId_criterionId_key" ON "OfferCriterionScore"("offerId", "criterionId");

-- AddForeignKey
ALTER TABLE "OfferCriterionScore" ADD CONSTRAINT "OfferCriterionScore_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCriterionScore" ADD CONSTRAINT "OfferCriterionScore_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "OpportunityCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCriterionScore" ADD CONSTRAINT "OfferCriterionScore_evaluatedById_fkey" FOREIGN KEY ("evaluatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
