export type SendNotificationEmailInput = {
  recipient: string;
  subject: string;
  body: string;
  href: string | null;
  idempotencyKey: string;
};

export type SendNotificationEmailResult = {
  providerId?: string;
};

export interface NotificationEmailProvider {
  isConfigured(): boolean;

  send(
    input: SendNotificationEmailInput,
  ): Promise<SendNotificationEmailResult>;
}
