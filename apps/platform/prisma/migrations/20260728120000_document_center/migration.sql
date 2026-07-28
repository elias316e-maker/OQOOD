CREATE TYPE "DocumentEntityType" AS ENUM (
  'WORKSPACE',
  'PROCUREMENT_REQUEST',
  'OPPORTUNITY',
  'OFFER',
  'CONTRACT',
  'BUSINESS_PARTNER',
  'PROJECT'
);

CREATE TYPE "DocumentReviewStatus" AS ENUM (
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'ARCHIVED'
);

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "entityType" "DocumentEntityType" NOT NULL,
  "entityId" TEXT,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "sizeBytes" BIGINT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "reviewStatus" "DocumentReviewStatus" NOT NULL DEFAULT 'DRAFT',
  "isConfidential" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3),
  "notes" TEXT,
  "uploadedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Document_storageKey_key" ON "Document"("storageKey");
CREATE INDEX "Document_workspaceId_entityType_entityId_idx" ON "Document"("workspaceId", "entityType", "entityId");
CREATE INDEX "Document_workspaceId_reviewStatus_idx" ON "Document"("workspaceId", "reviewStatus");
CREATE INDEX "Document_workspaceId_category_idx" ON "Document"("workspaceId", "category");
CREATE INDEX "Document_expiresAt_idx" ON "Document"("expiresAt");

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
