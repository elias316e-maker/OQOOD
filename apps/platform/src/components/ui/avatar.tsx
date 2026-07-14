type AvatarProps = {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
};

export function Avatar({
  name,
  imageUrl,
  size = "md",
}: AvatarProps) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");

  return (
    <span
      aria-label={name}
      className={`uiAvatar uiAvatar-${size}`}
      title={name}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={name} src={imageUrl} />
      ) : (
        initials
      )}
    </span>
  );
}
