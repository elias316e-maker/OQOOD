import type { InputHTMLAttributes, ReactNode } from "react";

export type RadioProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: ReactNode;
  description?: string;
};

export function Radio({
  label,
  description,
  className = "",
  ...props
}: RadioProps) {
  return (
    <label
      className={["odsChoice", "odsRadio", className]
        .filter(Boolean)
        .join(" ")}
    >
      <input type="radio" {...props} />

      <span className="odsChoice__content">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
    </label>
  );
}
