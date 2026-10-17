export type QueueAwardNotificationsRequest = {
  workspaceId: string;
  actorUserId: string;
  opportunityId: string;
};

export type QueuedAwardNotification = {
  deliveryId: string;
  businessPartnerId: string;
  recipient: string;
  outcome: "WINNER" | "LOST";
  created: boolean;
};

export type QueueAwardNotificationsResponse = {
  opportunityId: string;
  queuedCount: number;
  skippedCount: number;
  deliveries: QueuedAwardNotification[];
};
