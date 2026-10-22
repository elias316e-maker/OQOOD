-- CreateTable
CREATE TABLE "PlatformVerificationThrottle" (
    "key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStartAt" TIMESTAMP(3) NOT NULL,
    "blockedUntil" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformVerificationThrottle_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "PlatformVerificationReplay" (
    "key" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformVerificationReplay_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "PlatformVerificationThrottle_expiresAt_idx" ON "PlatformVerificationThrottle"("expiresAt");

-- CreateIndex
CREATE INDEX "PlatformVerificationReplay_expiresAt_idx" ON "PlatformVerificationReplay"("expiresAt");
