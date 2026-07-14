import type { InputHTMLAttributes, ReactNode } from "react";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: ReactNode;
  description?: string;
};

export function Checkbox({
  label,
  description,
  className = "",
  ...props
}: CheckboxProps) {
  return (
    <label
      className={["odsChoice", "odsCheckbox", className]
        .filter(Boolean)
        .join(" ")}
    >
      <input type="checkbox" {...props} />

      <span className="odsChoice__content">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
    </label>
  );
}
