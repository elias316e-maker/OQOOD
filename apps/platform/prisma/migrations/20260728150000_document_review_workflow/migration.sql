ALTER TABLE "Document"
  ADD COLUMN "reviewedById" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewNotes" TEXT;

CREATE INDEX "Document_reviewedById_idx" ON "Document"("reviewedById");

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
