-- DEV-0300.1.3
-- Procurement Domain Foundation

CREATE TYPE "ProcurementRequestStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'ARCHIVED'
);

CREATE TYPE "ProcurementPriority" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

CREATE TYPE "ProcurementItemType" AS ENUM (
  'MATERIAL',
  'SERVICE',
  'WORK'
);

CREATE TABLE "ProcurementRequest" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "projectId" TEXT,
  "number" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProcurementRequestStatus" NOT NULL DEFAULT 'DRAFT',
  "priority" "ProcurementPriority" NOT NULL DEFAULT 'NORMAL',
  "category" TEXT,

  "requestedById" TEXT NOT NULL,
  "assignedToId" TEXT,

  "departmentReference" TEXT,
  "costCenterReference" TEXT,
  "requiredByDate" TIMESTAMP(3),
  "deliveryLocation" TEXT,

  "currency" TEXT NOT NULL DEFAULT 'SAR',
  "estimatedTotal" DECIMAL(18,2),

  "submittedAt" TIMESTAMP(3),
  "submittedById" TEXT,

  "reviewStartedAt" TIMESTAMP(3),
  "reviewStartedById" TEXT,

  "changesRequestedAt" TIMESTAMP(3),
  "changesRequestedById" TEXT,
  "changesRequestReason" TEXT,

  "approvedAt" TIMESTAMP(3),
  "approvedById" TEXT,

  "rejectedAt" TIMESTAMP(3),
  "rejectedById" TEXT,
  "rejectionReason" TEXT,

  "cancelledAt" TIMESTAMP(3),
  "cancelledById" TEXT,
  "cancellationReason" TEXT,

  "archivedAt" TIMESTAMP(3),
  "archivedById" TEXT,

  "createdById" TEXT NOT NULL,
  "updatedById" TEXT,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProcurementRequest_pkey"
    PRIMARY KEY ("id"),

  CONSTRAINT "ProcurementRequest_estimatedTotal_nonnegative"
    CHECK (
      "estimatedTotal" IS NULL
      OR "estimatedTotal" >= 0
    )
);

CREATE TABLE "ProcurementRequestItem" (
  "id" TEXT NOT NULL,
  "procurementRequestId" TEXT NOT NULL,
  "lineNumber" INTEGER NOT NULL,
  "type" "ProcurementItemType" NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(18,4) NOT NULL,
  "unit" TEXT NOT NULL,
  "specification" TEXT,
  "estimatedUnitPrice" DECIMAL(18,4),
  "estimatedTotal" DECIMAL(18,2),
  "requiredByDate" TIMESTAMP(3),
  "deliveryLocation" TEXT,
  "notes" TEXT,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProcurementRequestItem_pkey"
    PRIMARY KEY ("id"),

  CONSTRAINT "ProcurementRequestItem_lineNumber_positive"
    CHECK ("lineNumber" > 0),

  CONSTRAINT "ProcurementRequestItem_quantity_positive"
    CHECK ("quantity" > 0),

  CONSTRAINT "ProcurementRequestItem_estimatedUnitPrice_nonnegative"
    CHECK (
      "estimatedUnitPrice" IS NULL
      OR "estimatedUnitPrice" >= 0
    ),

  CONSTRAINT "ProcurementRequestItem_estimatedTotal_nonnegative"
    CHECK (
      "estimatedTotal" IS NULL
      OR "estimatedTotal" >= 0
    )
);

CREATE UNIQUE INDEX
  "ProcurementRequest_workspaceId_number_key"
ON "ProcurementRequest"("workspaceId", "number");

CREATE INDEX
  "ProcurementRequest_workspaceId_status_idx"
ON "ProcurementRequest"("workspaceId", "status");

CREATE INDEX
  "ProcurementRequest_workspaceId_priority_idx"
ON "ProcurementRequest"("workspaceId", "priority");

CREATE INDEX
  "ProcurementRequest_workspaceId_createdAt_idx"
ON "ProcurementRequest"("workspaceId", "createdAt");

CREATE INDEX
  "ProcurementRequest_workspaceId_requestedById_idx"
ON "ProcurementRequest"("workspaceId", "requestedById");

CREATE INDEX
  "ProcurementRequest_workspaceId_assignedToId_idx"
ON "ProcurementRequest"("workspaceId", "assignedToId");

CREATE INDEX
  "ProcurementRequest_projectId_idx"
ON "ProcurementRequest"("projectId");

CREATE INDEX
  "ProcurementRequest_requiredByDate_idx"
ON "ProcurementRequest"("requiredByDate");

CREATE UNIQUE INDEX
  "ProcurementRequestItem_procurementRequestId_lineNumber_key"
ON "ProcurementRequestItem"(
  "procurementRequestId",
  "lineNumber"
);

CREATE INDEX
  "ProcurementRequestItem_procurementRequestId_idx"
ON "ProcurementRequestItem"("procurementRequestId");

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_workspaceId_fkey"
FOREIGN KEY ("workspaceId")
REFERENCES "Workspace"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_projectId_fkey"
FOREIGN KEY ("projectId")
REFERENCES "Project"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_requestedById_fkey"
FOREIGN KEY ("requestedById")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_assignedToId_fkey"
FOREIGN KEY ("assignedToId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_submittedById_fkey"
FOREIGN KEY ("submittedById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_reviewStartedById_fkey"
FOREIGN KEY ("reviewStartedById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_changesRequestedById_fkey"
FOREIGN KEY ("changesRequestedById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_approvedById_fkey"
FOREIGN KEY ("approvedById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_rejectedById_fkey"
FOREIGN KEY ("rejectedById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_cancelledById_fkey"
FOREIGN KEY ("cancelledById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_archivedById_fkey"
FOREIGN KEY ("archivedById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_createdById_fkey"
FOREIGN KEY ("createdById")
REFERENCES "User"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequest"
ADD CONSTRAINT "ProcurementRequest_updatedById_fkey"
FOREIGN KEY ("updatedById")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "ProcurementRequestItem"
ADD CONSTRAINT "ProcurementRequestItem_procurementRequestId_fkey"
FOREIGN KEY ("procurementRequestId")
REFERENCES "ProcurementRequest"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
