CREATE TABLE "NotificationReceipt" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "dismissedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NotificationReceipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationReceipt_workspaceId_userId_fingerprint_key"
  ON "NotificationReceipt"("workspaceId", "userId", "fingerprint");
CREATE INDEX "NotificationReceipt_workspaceId_userId_readAt_idx"
  ON "NotificationReceipt"("workspaceId", "userId", "readAt");
CREATE INDEX "NotificationReceipt_workspaceId_userId_dismissedAt_idx"
  ON "NotificationReceipt"("workspaceId", "userId", "dismissedAt");

ALTER TABLE "NotificationReceipt"
  ADD CONSTRAINT "NotificationReceipt_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NotificationReceipt"
  ADD CONSTRAINT "NotificationReceipt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
