"use server";

import { revalidatePath } from "next/cache";

import { requireAuthenticatedUser } from "@/features/workspace/guards";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

function value(formData: FormData, key: string) {
  const result = formData.get(key);
  return typeof result === "string" ? result.trim().slice(0, 500) : "";
}

async function context() {
  const [workspace, user] = await Promise.all([requireCurrentWorkspace(), requireAuthenticatedUser()]);
  return { workspaceId: workspace.workspace.id, userId: user.id };
}

export async function markNotificationReadAction(formData: FormData) {
  const fingerprint = value(formData, "fingerprint");
  if (!fingerprint) return;
  const owner = await context();
  await prisma.notificationReceipt.upsert({
    where: { workspaceId_userId_fingerprint: { ...owner, fingerprint } },
    update: { readAt: new Date() },
    create: { ...owner, fingerprint, readAt: new Date() },
  });
  revalidatePath("/platform/notifications");
  revalidatePath("/platform", "layout");
}

export async function dismissNotificationAction(formData: FormData) {
  const fingerprint = value(formData, "fingerprint");
  if (!fingerprint) return;
  const owner = await context();
  await prisma.notificationReceipt.upsert({
    where: { workspaceId_userId_fingerprint: { ...owner, fingerprint } },
    update: { dismissedAt: new Date(), readAt: new Date() },
    create: { ...owner, fingerprint, dismissedAt: new Date(), readAt: new Date() },
  });
  revalidatePath("/platform/notifications");
  revalidatePath("/platform", "layout");
}

export async function markAllNotificationsReadAction(formData: FormData) {
  const owner = await context();
  const fingerprints = formData.getAll("fingerprint")
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.slice(0, 500));
  await prisma.$transaction(fingerprints.map((fingerprint) => prisma.notificationReceipt.upsert({
    where: { workspaceId_userId_fingerprint: { ...owner, fingerprint } },
    update: { readAt: new Date() },
    create: { ...owner, fingerprint, readAt: new Date() },
  })));
  revalidatePath("/platform/notifications");
  revalidatePath("/platform", "layout");
}

export async function updateNotificationPreferencesAction(formData: FormData) {
  const owner = await context();
  const categories = ["TEAM_INVITATIONS", "OPPORTUNITIES", "CONTRACTS", "APPROVALS"];
  const digest = value(formData, "digest");
  const safeDigest = ["IMMEDIATE", "DAILY", "WEEKLY"].includes(digest)
    ? digest
    : "IMMEDIATE";
  await prisma.$transaction(categories.map((category) =>
    prisma.notificationPreference.upsert({
      where: {
        workspaceId_userId_category: { ...owner, category },
      },
      update: {
        inAppEnabled: formData.get(`inApp:${category}`) === "on",
        emailEnabled: formData.get(`email:${category}`) === "on",
        digest: safeDigest,
      },
      create: {
        ...owner,
        category,
        inAppEnabled: formData.get(`inApp:${category}`) === "on",
        emailEnabled: formData.get(`email:${category}`) === "on",
        digest: safeDigest,
      },
    }),
  ));
  revalidatePath("/platform/notifications");
}
