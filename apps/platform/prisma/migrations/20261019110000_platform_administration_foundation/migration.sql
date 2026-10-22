-- CreateEnum
CREATE TYPE "PlatformStaffStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PlatformStaffRole" AS ENUM ('PLATFORM_ADMIN', 'SUPPORT', 'BILLING', 'AUDITOR');

-- CreateTable
CREATE TABLE "PlatformStaff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PlatformStaffStatus" NOT NULL DEFAULT 'SUSPENDED',
    "role" "PlatformStaffRole" NOT NULL,
    "authorizationVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSessionAssurance" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "factorId" TEXT NOT NULL,
    "factorVersion" TEXT NOT NULL,
    "authorizationVersion" INTEGER NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSessionAssurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorStaffId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "targetWorkspaceId" TEXT,
    "requestId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAdministrationControl" (
    "id" TEXT NOT NULL,
    "bootstrappedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAdministrationControl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformStaff_userId_key" ON "PlatformStaff"("userId");

-- CreateIndex
CREATE INDEX "PlatformStaff_role_status_idx" ON "PlatformStaff"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformSessionAssurance_sessionId_key" ON "PlatformSessionAssurance"("sessionId");

-- CreateIndex
CREATE INDEX "PlatformSessionAssurance_staffId_idx" ON "PlatformSessionAssurance"("staffId");

-- CreateIndex
CREATE INDEX "PlatformSessionAssurance_factorId_idx" ON "PlatformSessionAssurance"("factorId");

-- CreateIndex
CREATE INDEX "PlatformSessionAssurance_expiresAt_idx" ON "PlatformSessionAssurance"("expiresAt");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_createdAt_idx" ON "PlatformAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_actorUserId_createdAt_idx" ON "PlatformAuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_actorStaffId_idx" ON "PlatformAuditLog"("actorStaffId");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_targetType_targetId_idx" ON "PlatformAuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_targetWorkspaceId_createdAt_idx" ON "PlatformAuditLog"("targetWorkspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_requestId_idx" ON "PlatformAuditLog"("requestId");

-- AddForeignKey
ALTER TABLE "PlatformStaff" ADD CONSTRAINT "PlatformStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSessionAssurance" ADD CONSTRAINT "PlatformSessionAssurance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSessionAssurance" ADD CONSTRAINT "PlatformSessionAssurance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "PlatformStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformSessionAssurance" ADD CONSTRAINT "PlatformSessionAssurance_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "TwoFactor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAuditLog" ADD CONSTRAINT "PlatformAuditLog_actorStaffId_fkey" FOREIGN KEY ("actorStaffId") REFERENCES "PlatformStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
