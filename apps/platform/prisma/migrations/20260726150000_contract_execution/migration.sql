CREATE TYPE "ContractMilestoneStatus" AS ENUM ('PLANNED','IN_PROGRESS','SUBMITTED','ACCEPTED','REJECTED');
CREATE TYPE "MilestonePaymentStatus" AS ENUM ('NOT_CLAIMED','CLAIMED','PAID');

CREATE TABLE "ContractMilestone" (
  "id" TEXT NOT NULL,
  "contractId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP(3),
  "amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "status" "ContractMilestoneStatus" NOT NULL DEFAULT 'PLANNED',
  "paymentStatus" "MilestonePaymentStatus" NOT NULL DEFAULT 'NOT_CLAIMED',
  "createdById" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "acceptedAt" TIMESTAMP(3),
  "claimedAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ContractMilestone_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ContractMilestone_progress_range" CHECK ("progress" >= 0 AND "progress" <= 100),
  CONSTRAINT "ContractMilestone_amount_nonnegative" CHECK ("amount" >= 0)
);
CREATE UNIQUE INDEX "ContractMilestone_contractId_number_key" ON "ContractMilestone"("contractId","number");
CREATE INDEX "ContractMilestone_contractId_status_idx" ON "ContractMilestone"("contractId","status");
CREATE INDEX "ContractMilestone_contractId_paymentStatus_idx" ON "ContractMilestone"("contractId","paymentStatus");
ALTER TABLE "ContractMilestone" ADD CONSTRAINT "ContractMilestone_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContractMilestone" ADD CONSTRAINT "ContractMilestone_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
