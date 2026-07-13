import Link from "next/link";

export function PlatformTopbar() {
  return (
    <header className="platformTopbar">
      <div className="globalSearch">
        <span>⌕</span>
        <input
          type="search"
          placeholder="ابحث في الفرص، العقود، الموردين والمستندات..."
        />
        <kbd>Ctrl K</kbd>
      </div>

      <div className="platformTopActions">
        <button className="iconButton" type="button" aria-label="الإشعارات">
          ♢
          <span className="notificationDot" />
        </button>

        <button className="iconButton" type="button" aria-label="المساعدة">
          ؟
        </button>

        <Link className="primaryButton smallButton" href="/platform/opportunities/new">
          + إنشاء
        </Link>
      </div>
    </header>
  );
}
