import {
  z,
} from "zod";

const identifierSchema = z
  .string()
  .trim()
  .min(1, "المعرف مطلوب.");

export const queueAwardNotificationsSchema =
  z.object({
    workspaceId: identifierSchema,
    actorUserId: identifierSchema,
    opportunityId: identifierSchema,
  });
