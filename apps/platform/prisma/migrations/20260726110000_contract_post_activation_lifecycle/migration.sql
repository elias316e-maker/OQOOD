ALTER TABLE "Contract"
  ADD COLUMN "suspendedAt" TIMESTAMP(3),
  ADD COLUMN "suspensionReason" TEXT,
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "terminatedAt" TIMESTAMP(3),
  ADD COLUMN "terminationReason" TEXT;
