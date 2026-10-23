"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { PlatformStaffMutationAccessDeniedError } from "@/features/platform-administration/staff-mutation-context";
import {
  PlatformAccessDeniedError,
  requirePlatformPermission,
} from "@/features/platform-administration/require-platform-permission";
import {
  PlatformPermissions,
  type PlatformRole,
} from "@/features/platform-administration/permissions";
import {
  PlatformStaffUpdateDeniedError,
  updatePlatformStaff,
} from "@/features/platform-administration/update-platform-staff";

export type StaffMembershipState = {
  success: boolean;
  message: string;
};

export async function updateStaffMembershipAction(
  _previous: StaffMembershipState,
  data: FormData,
): Promise<StaffMembershipState> {
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

  const staffId = data.get("staffId");
  const role = data.get("role");
  const status = data.get("status");
  const rawVersion = data.get("authorizationVersion");
  const version = typeof rawVersion === "string" ? Number(rawVersion) : NaN;

  if (
    typeof staffId !== "string" ||
    !staffId ||
    staffId.length > 128 ||
    typeof role !== "string" ||
    !["PLATFORM_ADMIN", "SUPPORT", "BILLING", "AUDITOR"].includes(role) ||
    (status !== "ACTIVE" && status !== "SUSPENDED") ||
    !Number.isSafeInteger(version) ||
    version < 1
  ) {
    return { success: false, message: "بيانات التعديل غير صالحة. حدّث الصفحة." };
  }

  try {
    const actor = await requirePlatformPermission(
      PlatformPermissions.staffManage, true,
    );

    await updatePlatformStaff(prisma, {
      actorUserId: actor.userId,
      actorSessionId: actor.sessionId,
      targetStaffId: staffId,
      expectedAuthorizationVersion: version,
      role: role as PlatformRole,
      status,
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
    if (error instanceof PlatformStaffUpdateDeniedError) {
      return {
        success: false,
        message: "تعذر التعديل: قد تكون البيانات تغيّرت أو أن العملية ستعطّل آخر مدير مؤهل. حدّث الصفحة وراجع العضوية.",
      };
    }
    return {
      success: false,
      message: "تعذر حفظ التعديل. حاول لاحقًا.",
    };
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin");
  return {
    success: true,
    message: "تم حفظ العضوية وإبطال إثباتات جلساتها الإدارية السابقة.",
  };
}
