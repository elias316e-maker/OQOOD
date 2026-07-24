import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

export class InactiveUserError extends Error {
  constructor() {
    super("حساب المستخدم غير نشط.");
    this.name = "InactiveUserError";
  }
}

export async function requireAuthenticatedUser() {
  const sessionUser = await requireCurrentUser();

  const user = await prisma.user.findUnique({
    where: {
      id: sessionUser.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      phone: true,
      isActive: true,
    },
  });

  if (!user) {
    /*
     * قد تكون جلسة Better Auth موجودة بينما تم حذف
     * مستخدم النطاق من قاعدة البيانات.
     */
    throw new Error(
      "تعذر العثور على حساب المستخدم المرتبط بالجلسة.",
    );
  }

  if (!user.isActive) {
    throw new InactiveUserError();
  }

  return user;
}
