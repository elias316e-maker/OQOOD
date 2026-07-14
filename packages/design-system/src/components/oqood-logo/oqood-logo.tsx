import type { ReactNode } from "react";

export type OqoodLogoProps = {
  compact?: boolean;
  inverted?: boolean;
  className?: string;
  markOnly?: boolean;
  suffix?: ReactNode;
};

export function OqoodLogo({
  compact = false,
  inverted = false,
  className = "",
  markOnly = false,
  suffix,
}: OqoodLogoProps) {
  return (
    <span
      className={[
        "odsLogo",
        inverted ? "odsLogo--inverted" : "",
        compact ? "odsLogo--compact" : "",
        markOnly ? "odsLogo--markOnly" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg
        aria-hidden="true"
        className="odsLogo__mark"
        viewBox="0 0 64 64"
      >
        <defs>
          <linearGradient id="odsLogoGradientA" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#7467ff" />
            <stop offset="55%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          <linearGradient id="odsLogoGradientB" x1="1" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#635bff" />
            <stop offset="100%" stopColor="#14b8d4" />
          </linearGradient>
        </defs>

        <path
          d="M32 4 55 17v30L32 60 9 47V17L32 4Z"
          fill="url(#odsLogoGradientA)"
        />

        <path
          d="m32 14 14 8v8l-14-8-14 8v-8l14-8Z"
          fill="#ffffff"
          fillOpacity=".96"
        />

        <path
          d="M18 30 32 22v16l-14 8V30Z"
          fill="#ffffff"
          fillOpacity=".8"
        />

        <path
          d="m32 22 14 8v16l-14-8V22Z"
          fill="url(#odsLogoGradientB)"
        />

        <path
          d="m25 34 7-4 7 4-7 4-7-4Z"
          fill="#ffffff"
          fillOpacity=".97"
        />
      </svg>

      {!markOnly ? (
        <span className="odsLogo__text">
          <strong>OQOOD</strong>
          <small>عقــود</small>
        </span>
      ) : null}

      {suffix ? <span className="odsLogo__suffix">{suffix}</span> : null}
    </span>
  );
}
