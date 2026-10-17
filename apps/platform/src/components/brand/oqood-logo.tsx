import Link from "next/link";

type OqoodLogoProps = {
  compact?: boolean;
  href?: string;
  inverted?: boolean;
};

export function OqoodLogo({
  compact = false,
  href = "/",
  inverted = false,
}: OqoodLogoProps) {
  const content = (
    <span className={`oqoodLogo ${inverted ? "oqoodLogoInverted" : ""}`}>
      <svg
        aria-hidden="true"
        className="oqoodLogoMark"
        viewBox="0 0 64 64"
      >
        <defs>
          <linearGradient id="oqoodGradientA" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#7467ff" />
            <stop offset="100%" stopColor="#3157e8" />
          </linearGradient>

          <linearGradient id="oqoodGradientB" x1="1" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#20b9d5" />
          </linearGradient>
        </defs>

        <path
          d="M32 4 55 17v30L32 60 9 47V17L32 4Z"
          fill="url(#oqoodGradientA)"
        />

        <path
          d="m32 14 14 8v8l-14-8-14 8v-8l14-8Z"
          fill="#ffffff"
          fillOpacity=".94"
        />

        <path
          d="M18 30 32 22v16l-14 8V30Z"
          fill="#ffffff"
          fillOpacity=".78"
        />

        <path
          d="m32 22 14 8v16l-14-8V22Z"
          fill="url(#oqoodGradientB)"
        />

        <path
          d="m25 34 7-4 7 4-7 4-7-4Z"
          fill="#ffffff"
          fillOpacity=".96"
        />
      </svg>

      {!compact && (
        <span className="oqoodLogoText">
          <strong>OQOOD</strong>
          <small>عقــــود</small>
        </span>
      )}
    </span>
  );

  return href ? (
    <Link aria-label="OQOOD" href={href}>
      {content}
    </Link>
  ) : (
    content
  );
}
