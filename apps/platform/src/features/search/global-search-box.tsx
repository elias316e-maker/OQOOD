"use client";

import { useEffect, useRef } from "react";

export function GlobalSearchBox() {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <form action="/platform/search" className="odsTopNavigationSearch" role="search">
      <span aria-hidden="true" className="odsTopNavigationSearch__icon">⌕</span>
      <input
        aria-label="البحث الشامل"
        name="q"
        placeholder="ابحث في العقود، المنافسات، المشاريع والمستندات..."
        ref={inputRef}
        type="search"
      />
      <kbd>Ctrl K</kbd>
    </form>
  );
}
