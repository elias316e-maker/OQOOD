"use client";

import {
  useEffect,
  useRef,
} from "react";

export function GlobalSearchBox() {
  const inputRef =
    useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleSearchShortcut = (
      event: KeyboardEvent,
    ) => {
      const input = inputRef.current;

      if (!input) {
        return;
      }

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "k"
      ) {
        event.preventDefault();
        input.focus();
        input.select();
        return;
      }

      if (
        event.key === "Escape" &&
        document.activeElement === input
      ) {
        input.blur();
      }
    };

    window.addEventListener(
      "keydown",
      handleSearchShortcut,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleSearchShortcut,
      );
    };
  }, []);

  return (
    <form
      action="/platform/search"
      aria-label="البحث الشامل في مساحة العمل"
      className="odsTopNavigationSearch"
      method="get"
      role="search"
    >
      <span
        aria-hidden="true"
        className="odsTopNavigationSearch__icon"
      >
        ⌕
      </span>

      <input
        aria-keyshortcuts="Control+K Meta+K"
        aria-label="البحث الشامل"
        autoComplete="off"
        enterKeyHint="search"
        maxLength={120}
        minLength={2}
        name="q"
        placeholder="ابحث في العقود، المنافسات، المشاريع والمستندات..."
        ref={inputRef}
        spellCheck={false}
        type="search"
      />

      <kbd aria-hidden="true">
        Ctrl K
      </kbd>
    </form>
  );
}
