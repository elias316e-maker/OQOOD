"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  PlatformAccessDeniedError,
  requirePlatformPermission,
} from "@/features/platform-administration/require-platform-permission";
import {
  PlatformPermissions,
  type PlatformRole,
} from "@/features/platform-administration/permissions";
import {
  createPlatformStaff,
  PlatformStaffCreationDeniedError,
} from "@/features/platform-administration/create-platform-staff";
import {
  PlatformStaffMutationAccessDeniedError,
} from "@/features/platform-administration/staff-mutation-context";

export type CreateStaffState = {
  success: boolean;
  message: string;
};

export async function createStaffAction(
  _previous: CreateStaffState,
  data: FormData,
): Promise<CreateStaffState> {
  if (process.env.PLATFORM_ADMIN_PORTAL_ENABLED !== "true") {
    return { success: false, message: "بوابة الإدارة غير متاحة حاليًا." };
  }

  const requestHeaders = await headers();
  const appUrl = process.env.BETTER_AUTH_URL;
  if (
    !appUrl ||
    requestHeaders.get("origin") !== new URL(appUrl).origin
  ) {
    return { success: false, message: "تعذر التحقق من مصدر الطلب." };
  }

  const rawId = data.get("targetUserId");
  const userId = typeof rawId === "string" ? rawId.trim() : "";
  const role = data.get("role");
  const confirmed = data.get("confirmed") === "on";

  if (
    !userId ||
    userId.length > 128 ||
    typeof role !== "string" ||
    !["PLATFORM_ADMIN", "SUPPORT", "BILLING", "AUDITOR"].includes(role) ||
    !confirmed
  ) {
    return {
      success: false,
      message: "حدد الحساب والدور، وأكد مراجعة الحساب المستهدف.",
    };
  }

  try {
    const actor = await requirePlatformPermission(
      PlatformPermissions.staffManage, true,
    );

    await createPlatformStaff(prisma, {
      actorUserId: actor.userId,
      actorSessionId: actor.sessionId,
      targetUserId: userId,
      role: role as PlatformRole,
      requestId: randomUUID(),
    });
  } catch (error) {
    if (
      error instanceof PlatformAccessDeniedError ||
      error instanceof PlatformStaffMutationAccessDeniedError
    ) {
      return {
        success: false,
        message: "يلزم تحقق إداري حديث وصلاحية إدارة الموظفين. أعد التحقق ثم حاول مجددًا.",
      };
    }
    if (error instanceof PlatformStaffCreationDeniedError) {
      return {
        success: false,
        message: "تعذرت الإضافة. يجب أن يكون الحساب موجودًا ونشطًا وبريده موثقًا ومصادقته الثنائية مكتملة، وألا تكون له عضوية إدارية سابقة.",
      };
    }
    return { success: false, message: "تعذرت إضافة الموظف. حاول لاحقًا." };
  }

  revalidatePath("/admin/staff");
  return {
    success: true,
    message: "أُضيفت العضوية بحالة معلّقة. راجع بيانات الموظف في القائمة قبل تفعيلها.",
  };
}
