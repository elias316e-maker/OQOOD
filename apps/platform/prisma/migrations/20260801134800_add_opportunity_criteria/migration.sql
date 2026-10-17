/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `archivedAt` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `archivedById` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `cancellationReason` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledById` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `changesRequestReason` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `changesRequestedAt` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `changesRequestedById` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `costCenterReference` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryLocation` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `departmentReference` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedAt` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedById` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `reviewStartedAt` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `reviewStartedById` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `submittedAt` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `submittedById` on the `ProcurementRequest` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `ProcurementRequest` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "OpportunityCriterionCategory" AS ENUM ('TECHNICAL', 'FINANCIAL', 'COMMERCIAL', 'COMPLIANCE', 'DOCUMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "OpportunityCriterionScoringMethod" AS ENUM ('PASS_FAIL', 'NUMERIC', 'PERCENTAGE', 'MANUAL');

-- DropForeignKey
ALTER TABLE "ProcurementRequest" DROP CONSTRAINT "ProcurementRequest_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "ProcurementRequest" DROP CONSTRAINT "ProcurementRequest_archivedById_fkey";

-- DropForeignKey
ALTER TABLE "ProcurementRequest" DROP CONSTRAINT "ProcurementRequest_cancelledById_fkey";

-- DropForeignKey
ALTER TABLE "ProcurementRequest" DROP CONSTRAINT "ProcurementRequest_changesRequestedById_fkey";

-- DropForeignKey
ALTER TABLE "ProcurementRequest" DROP CONSTRAINT "ProcurementRequest_rejectedById_fkey";

-- DropForeignKey
ALTER TABLE "ProcurementRequest" DROP CONSTRAINT "ProcurementRequest_reviewStartedById_fkey";

-- DropForeignKey
ALTER TABLE "ProcurementRequest" DROP CONSTRAINT "ProcurementRequest_submittedById_fkey";

-- DropForeignKey
ALTER TABLE "ProcurementRequest" DROP CONSTRAINT "ProcurementRequest_updatedById_fkey";

-- DropIndex
DROP INDEX "ProcurementRequest_workspaceId_assignedToId_idx";

-- DropIndex
DROP INDEX "ProcurementRequest_workspaceId_createdAt_idx";

-- DropIndex
DROP INDEX "ProcurementRequest_workspaceId_requestedById_idx";

-- AlterTable
ALTER TABLE "ProcurementRequest" DROP COLUMN "approvedAt",
DROP COLUMN "approvedById",
DROP COLUMN "archivedAt",
DROP COLUMN "archivedById",
DROP COLUMN "cancellationReason",
DROP COLUMN "cancelledAt",
DROP COLUMN "cancelledById",
DROP COLUMN "changesRequestReason",
DROP COLUMN "changesRequestedAt",
DROP COLUMN "changesRequestedById",
DROP COLUMN "costCenterReference",
DROP COLUMN "deliveryLocation",
DROP COLUMN "departmentReference",
DROP COLUMN "rejectedAt",
DROP COLUMN "rejectedById",
DROP COLUMN "rejectionReason",
DROP COLUMN "reviewStartedAt",
DROP COLUMN "reviewStartedById",
DROP COLUMN "submittedAt",
DROP COLUMN "submittedById",
DROP COLUMN "updatedById";

-- CreateTable
CREATE TABLE "OpportunityCriterion" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "OpportunityCriterionCategory" NOT NULL,
    "scoringMethod" "OpportunityCriterionScoringMethod" NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL,
    "minimumScore" DECIMAL(5,2),
    "required" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "businessPartnerId" TEXT,

    CONSTRAINT "OpportunityCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpportunityCriterion_opportunityId_active_displayOrder_idx" ON "OpportunityCriterion"("opportunityId", "active", "displayOrder");

-- CreateIndex
CREATE INDEX "OpportunityCriterion_opportunityId_category_idx" ON "OpportunityCriterion"("opportunityId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityCriterion_opportunityId_name_key" ON "OpportunityCriterion"("opportunityId", "name");

-- CreateIndex
CREATE INDEX "Document_previousVersionId_idx" ON "Document"("previousVersionId");

-- CreateIndex
CREATE INDEX "ProcurementRequest_createdById_idx" ON "ProcurementRequest"("createdById");

-- CreateIndex
CREATE INDEX "ProcurementRequest_requestedById_idx" ON "ProcurementRequest"("requestedById");

-- CreateIndex
CREATE INDEX "ProcurementRequest_assignedToId_idx" ON "ProcurementRequest"("assignedToId");

-- AddForeignKey
ALTER TABLE "OpportunityCriterion" ADD CONSTRAINT "OpportunityCriterion_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityCriterion" ADD CONSTRAINT "OpportunityCriterion_businessPartnerId_fkey" FOREIGN KEY ("businessPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
