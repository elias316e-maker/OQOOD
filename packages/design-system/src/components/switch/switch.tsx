import type { InputHTMLAttributes, ReactNode } from "react";

export type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: ReactNode;
  description?: string;
};

export function Switch({
  label,
  description,
  className = "",
  ...props
}: SwitchProps) {
  return (
    <label className={["odsSwitch", className].filter(Boolean).join(" ")}>
      <span className="odsSwitch__control">
        <input type="checkbox" role="switch" {...props} />
        <span className="odsSwitch__track">
          <span className="odsSwitch__thumb" />
        </span>
      </span>

      <span className="odsChoice__content">
        <strong>{label}</strong>
        {description ? <small>{description}</small> : null}
      </span>
    </label>
  );
}
