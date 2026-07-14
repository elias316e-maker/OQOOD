import type { HTMLAttributes } from "react";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  name: string;
  imageUrl?: string;
  size?: AvatarSize;
  status?: "online" | "offline" | "busy";
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
}

export function Avatar({
  name,
  imageUrl,
  size = "md",
  status,
  className = "",
  ...props
}: AvatarProps) {
  return (
    <span
      aria-label={name}
      className={[
        "odsAvatar",
        `odsAvatar--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title={name}
      {...props}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={name} src={imageUrl} />
      ) : (
        <span>{getInitials(name)}</span>
      )}

      {status ? (
        <span
          aria-label={status}
          className={`odsAvatar__status odsAvatar__status--${status}`}
        />
      ) : null}
    </span>
  );
}
