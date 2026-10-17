import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  DefaultNotificationDeliveryApplicationService,
} from "../services/default-notification-delivery-application.service";

describe(
  "DefaultNotificationDeliveryApplicationService",
  () => {
    const repository = {
      findById: vi.fn(),
      markPending: vi.fn(),
      markSent: vi.fn(),
      markFailed: vi.fn(),
    };

    const provider = {
      isConfigured: vi.fn(),
      send: vi.fn(),
    };

    let service:
      DefaultNotificationDeliveryApplicationService;

    beforeEach(() => {
      vi.clearAllMocks();

      service =
        new DefaultNotificationDeliveryApplicationService(
          repository as never,
          provider as never,
        );
    });

    it(
      "returns when delivery does not exist",
      async () => {
        repository.findById.mockResolvedValue(
          null,
        );

        await service.deliver({
          deliveryId: "missing",
        });

        expect(
          provider.send,
        ).not.toHaveBeenCalled();

        expect(
          repository.markSent,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "does not resend a delivery that is already sent",
      async () => {
        repository.findById.mockResolvedValue({
          id: "delivery-sent-1",
          channel: "EMAIL",
          recipient: "vendor@example.com",
          subject: "Award result",
          body: "Notification body",
          href: null,
          status: "SENT",
        });

        await service.deliver({
          deliveryId: "delivery-sent-1",
        });

        expect(
          provider.isConfigured,
        ).not.toHaveBeenCalled();

        expect(
          provider.send,
        ).not.toHaveBeenCalled();

        expect(
          repository.markPending,
        ).not.toHaveBeenCalled();

        expect(
          repository.markSent,
        ).not.toHaveBeenCalled();

        expect(
          repository.markFailed,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "keeps delivery pending when email provider is not configured",
      async () => {
        repository.findById.mockResolvedValue({
          id: "delivery-pending-1",
          channel: "EMAIL",
          recipient: "vendor@example.com",
          subject: "Award result",
          body: "Notification body",
          href: "/platform/opportunities/opportunity-1",
          status: "PENDING",
        });

        provider.isConfigured.mockReturnValue(
          false,
        );

        await service.deliver({
          deliveryId: "delivery-pending-1",
        });

        expect(
          repository.markPending,
        ).toHaveBeenCalledWith({
          deliveryId: "delivery-pending-1",
          error: "Email provider is not configured.",
        });

        expect(
          provider.send,
        ).not.toHaveBeenCalled();

        expect(
          repository.markSent,
        ).not.toHaveBeenCalled();

        expect(
          repository.markFailed,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "marks delivery as sent after successful email delivery",
      async () => {
        repository.findById.mockResolvedValue({
          id: "delivery-success-1",
          channel: "EMAIL",
          recipient: "vendor@example.com",
          subject: "Award result",
          body: "Notification body",
          href: "/platform/opportunities/opportunity-1",
          status: "PENDING",
        });

        provider.isConfigured.mockReturnValue(
          true,
        );

        provider.send.mockResolvedValue({
          providerId: "resend-123",
        });

        await service.deliver({
          deliveryId: "delivery-success-1",
        });

        expect(
          provider.send,
        ).toHaveBeenCalledWith({
          recipient: "vendor@example.com",
          subject: "Award result",
          body: "Notification body",
          href: "/platform/opportunities/opportunity-1",
          idempotencyKey: "delivery-success-1",
        });

        expect(
          repository.markSent,
        ).toHaveBeenCalledWith({
          deliveryId: "delivery-success-1",
          providerId: "resend-123",
          sentAt: expect.any(Date),
        });

        expect(
          repository.markFailed,
        ).not.toHaveBeenCalled();

        expect(
          repository.markPending,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "marks delivery as failed when provider throws",
      async () => {
        repository.findById.mockResolvedValue({
          id: "delivery-failed-1",
          channel: "EMAIL",
          recipient: "vendor@example.com",
          subject: "Award result",
          body: "Notification body",
          href: null,
          status: "PENDING",
        });

        provider.isConfigured.mockReturnValue(
          true,
        );

        provider.send.mockRejectedValue(
          new Error("SMTP timeout"),
        );

        await service.deliver({
          deliveryId: "delivery-failed-1",
        });

        expect(
          repository.markFailed,
        ).toHaveBeenCalledWith({
          deliveryId: "delivery-failed-1",
          error: "SMTP timeout",
        });

        expect(
          repository.markSent,
        ).not.toHaveBeenCalled();

        expect(
          repository.markPending,
        ).not.toHaveBeenCalled();
      },
    );


    it(
      "marks unsupported delivery channel as failed",
      async () => {
        repository.findById.mockResolvedValue({
          id: "delivery-sms-1",
          channel: "SMS",
          recipient: "0500000000",
          subject: "Award result",
          body: "Notification body",
          href: null,
          status: "PENDING",
        });

        await service.deliver({
          deliveryId: "delivery-sms-1",
        });

        expect(
          repository.markFailed,
        ).toHaveBeenCalledWith({
          deliveryId: "delivery-sms-1",
          error: "Unsupported notification delivery channel.",
        });

        expect(
          provider.isConfigured,
        ).not.toHaveBeenCalled();

        expect(
          provider.send,
        ).not.toHaveBeenCalled();

        expect(
          repository.markSent,
        ).not.toHaveBeenCalled();

        expect(
          repository.markPending,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
