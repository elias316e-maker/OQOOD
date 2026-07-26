CREATE TYPE "ContractAmendmentStatus" AS ENUM (
  'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED'
);

CREATE TABLE "ContractAmendment" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "ContractAmendmentStatus" NOT NULL DEFAULT 'DRAFT',
  "valueChange" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "previousTotal" DECIMAL(18,2) NOT NULL,
  "resultingTotal" DECIMAL(18,2) NOT NULL,
  "previousEndDate" TIMESTAMP(3),
  "newEndDate" TIMESTAMP(3),
  "contractSnapshot" JSONB NOT NULL,
  "createdById" TEXT NOT NULL,
  "approvedById" TEXT,
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContractAmendment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContractAmendment_contractId_number_key"
  ON "ContractAmendment"("contractId", "number");
CREATE INDEX "ContractAmendment_contractId_status_idx"
  ON "ContractAmendment"("contractId", "status");

ALTER TABLE "ContractAmendment" ADD CONSTRAINT "ContractAmendment_contractId_fkey"
  FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContractAmendment" ADD CONSTRAINT "ContractAmendment_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContractAmendment" ADD CONSTRAINT "ContractAmendment_approvedById_fkey"
  FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
