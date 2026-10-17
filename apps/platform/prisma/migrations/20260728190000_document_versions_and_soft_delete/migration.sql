ALTER TABLE "Document"
  ADD COLUMN "previousVersionId" TEXT,
  ADD COLUMN "deletedById" TEXT,
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletionReason" TEXT;

CREATE UNIQUE INDEX "Document_previousVersionId_key" ON "Document"("previousVersionId");
CREATE INDEX "Document_deletedById_idx" ON "Document"("deletedById");
CREATE INDEX "Document_workspaceId_deletedAt_idx" ON "Document"("workspaceId", "deletedAt");

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_previousVersionId_fkey"
  FOREIGN KEY ("previousVersionId") REFERENCES "Document"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_deletedById_fkey"
  FOREIGN KEY ("deletedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
