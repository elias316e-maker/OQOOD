import "server-only";

import { prisma } from "@/lib/prisma";

type QueueEmailInput = {
  workspaceId: string;
  userId?: string;
  category: string;
  recipient: string;
  subject: string;
  body: string;
  href?: string;
};

export async function queueNotificationEmail(input: QueueEmailInput) {
  const delivery = await prisma.notificationDelivery.create({
    data: {
      ...input,
      channel: "EMAIL",
    },
  });
  await attemptEmailDelivery(delivery.id);
  return delivery;
}

export async function attemptEmailDelivery(deliveryId: string) {
  const delivery = await prisma.notificationDelivery.findUnique({
    where: { id: deliveryId },
  });
  if (!delivery || delivery.status === "SENT") return;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from) {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "PENDING",
        lastError: "Email provider is not configured.",
      },
    });
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": delivery.id,
      },
      body: JSON.stringify({
        from,
        to: [delivery.recipient],
        subject: delivery.subject,
        text: delivery.href
          ? `${delivery.body}\n\n${delivery.href}`
          : delivery.body,
      }),
    });
    const payload = (await response.json()) as { id?: string; message?: string };
    if (!response.ok) throw new Error(payload.message || `Email API ${response.status}`);
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "SENT",
        attempts: { increment: 1 },
        providerId: payload.id,
        lastError: null,
        sentAt: new Date(),
      },
    });
  } catch (error) {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message.slice(0, 500) : "Unknown delivery error",
      },
    });
  }
}
