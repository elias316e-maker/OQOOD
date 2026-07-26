CREATE TYPE "ContractStatus" AS ENUM (
  'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_FOR_SIGNATURE',
  'ACTIVE', 'SUSPENDED', 'COMPLETED', 'TERMINATED', 'CANCELLED', 'ARCHIVED'
);

CREATE TABLE "Contract" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "projectId" TEXT,
  "opportunityId" TEXT NOT NULL,
  "sourceOfferId" TEXT NOT NULL,
  "businessPartnerId" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
  "currency" TEXT NOT NULL DEFAULT 'SAR',
  "subtotal" DECIMAL(18,2) NOT NULL,
  "taxAmount" DECIMAL(18,2) NOT NULL,
  "totalAmount" DECIMAL(18,2) NOT NULL,
  "paymentTerms" TEXT,
  "deliveryDays" INTEGER,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContractItem" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(18,4) NOT NULL,
  "unit" TEXT NOT NULL,
  "unitPrice" DECIMAL(18,4) NOT NULL,
  "totalPrice" DECIMAL(18,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContractItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Contract_sourceOfferId_key" ON "Contract"("sourceOfferId");
CREATE UNIQUE INDEX "Contract_workspaceId_number_key" ON "Contract"("workspaceId", "number");
CREATE INDEX "Contract_workspaceId_status_idx" ON "Contract"("workspaceId", "status");
CREATE INDEX "Contract_opportunityId_idx" ON "Contract"("opportunityId");
CREATE INDEX "Contract_businessPartnerId_idx" ON "Contract"("businessPartnerId");
CREATE UNIQUE INDEX "ContractItem_contractId_lineNumber_key" ON "ContractItem"("contractId", "lineNumber");
CREATE INDEX "ContractItem_contractId_idx" ON "ContractItem"("contractId");

ALTER TABLE "Contract" ADD CONSTRAINT "Contract_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_sourceOfferId_fkey" FOREIGN KEY ("sourceOfferId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_businessPartnerId_fkey" FOREIGN KEY ("businessPartnerId") REFERENCES "BusinessPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ContractItem" ADD CONSTRAINT "ContractItem_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
