import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notificationDelivery: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

import {
  attemptEmailDelivery,
} from "../email-delivery";

describe("Email Notification Delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not resend a delivery that is already sent", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "delivery-sent-1",
      status: "SENT",
    });

    const fetchSpy = vi.spyOn(
      globalThis,
      "fetch",
    );

    await attemptEmailDelivery(
      "delivery-sent-1",
    );

    expect(
      mocks.findUnique,
    ).toHaveBeenCalledWith({
      where: {
        id: "delivery-sent-1",
      },
      select: {
        id: true,
        channel: true,
        recipient: true,
        subject: true,
        body: true,
        href: true,
        status: true,
      },
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
