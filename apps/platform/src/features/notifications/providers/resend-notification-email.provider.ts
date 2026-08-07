import type {
  NotificationEmailProvider,
  SendNotificationEmailInput,
  SendNotificationEmailResult,
} from "./notification-email.provider";

export class ResendNotificationEmailProvider
  implements NotificationEmailProvider
{
  isConfigured(): boolean {
    return Boolean(
      process.env.RESEND_API_KEY &&
      process.env.NOTIFICATION_FROM_EMAIL,
    );
  }

  async send(
    input: SendNotificationEmailInput,
  ): Promise<SendNotificationEmailResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.NOTIFICATION_FROM_EMAIL;

    if (!apiKey || !from) {
      throw new Error(
        "Email provider is not configured.",
      );
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key":
            input.idempotencyKey,
        },
        body: JSON.stringify({
          from,
          to: [input.recipient],
          subject: input.subject,
          text: input.href
            ? `${input.body}\n\n${input.href}`
            : input.body,
        }),
      },
    );

    const payload =
      (await response.json()) as {
        id?: string;
        message?: string;
      };

    if (!response.ok) {
      throw new Error(
        payload.message ||
        `Email API ${response.status}`,
      );
    }

    return {
      providerId: payload.id,
    };
  }
}
