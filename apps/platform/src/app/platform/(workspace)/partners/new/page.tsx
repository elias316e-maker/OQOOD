import Link from "next/link";

import { PartnerCreateForm } from "@/features/partner";

export default function NewPartnerPage() {
  return (
    <main className="platformContent">
      <header className="listPageHeader">
        <div>
          <span className="pageEyebrow">دليل المنشأة</span>
          <h1>إضافة شريك أعمال</h1>
          <p>
            سجّل المورد أو المقاول ثم استخدمه مباشرة
            في دعوات المنافسات.
          </p>
        </div>
        <Link
          className="secondaryButton compactButton"
          href="/platform/partners"
        >
          العودة للموردين
        </Link>
      </header>
      <PartnerCreateForm />
    </main>
  );
}

