const fallback = "/platform";
const localOrigin = "https://oqood.invalid";

export function safeAuthReturnPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const decoded = decodeURIComponent(value);
    if (
      /[\s\\\u0000-\u001f\u007f]/.test(value) ||
      /[\\\u0000-\u001f\u007f]/.test(decoded) ||
      decoded.startsWith("//")
    ) {
      return fallback;
    }

    const url = new URL(value, localOrigin);
    if (url.origin !== localOrigin) return fallback;

    // Authentication pages must not become return destinations.
    if (
      ["/login", "/two-factor", "/register"].some(
        (path) => url.pathname === path || url.pathname.startsWith(`${path}/`),
      )
    ) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function authReturnPathFromSearch(search: string): string {
  return safeAuthReturnPath(
    new URLSearchParams(search).get("callbackURL"),
  );
}

export function twoFactorPathFromSearch(search: string): string {
  const destination = authReturnPathFromSearch(search);
  return `/two-factor?callbackURL=${encodeURIComponent(destination)}`;
}
