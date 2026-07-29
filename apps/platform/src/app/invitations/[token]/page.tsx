import Link from "next/link";

import { acceptWorkspaceInvitationAction } from "@/features/settings/invitation-actions";
import { hashInvitationToken } from "@/features/settings/invitation-token";
import { prisma } from "@/lib/prisma";

export default async function WorkspaceInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    include: {
      workspace: { select: { nameAr: true } },
      role: { select: { name: true } },
    },
  });
  const valid =
    invitation?.status === "PENDING" && invitation.expiresAt > new Date();

  return (
    <main className="authLayout">
      <section className="authContentPanel">
        <div className="authContentWrapper">
          <header className="authPageHeader">
            <span className="authPageLabel">دعوة فريق</span>
            <h2>{valid ? `الانضمام إلى ${invitation.workspace.nameAr}` : "الدعوة غير صالحة"}</h2>
            <p>
              {valid
                ? `ستحصل على دور «${invitation.role.name}». سجل الدخول بالبريد ${invitation.email} ثم اقبل الدعوة.`
                : "قد تكون الدعوة منتهية أو ملغاة أو مستخدمة مسبقًا."}
            </p>
          </header>
          {valid ? (
            <>
              <form action={acceptWorkspaceInvitationAction}>
                <input name="token" type="hidden" value={token} />
                <button type="submit">قبول الدعوة</button>
              </form>
              <Link href={`/login?callbackURL=${encodeURIComponent(`/invitations/${token}`)}`}>
                تسجيل الدخول بالحساب المدعو
              </Link>
              <Link href={`/register?invitation=${encodeURIComponent(token)}`}>
                إنشاء حساب بالبريد المدعو
              </Link>
            </>
          ) : (
            <Link href="/login">العودة إلى تسجيل الدخول</Link>
          )}
        </div>
      </section>
    </main>
  );
}
