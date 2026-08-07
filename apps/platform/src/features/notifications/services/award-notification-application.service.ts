import type {
  QueueAwardNotificationsRequest,
  QueueAwardNotificationsResponse,
} from "../dtos";

export interface AwardNotificationApplicationService {
  queueForOpportunity(
    request: QueueAwardNotificationsRequest,
  ): Promise<QueueAwardNotificationsResponse>;
}
