import type { SelectHTMLAttributes } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Select({
  label,
  hint,
  error,
  id,
  name,
  className = "",
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? name;

  return (
    <label className="odsField" htmlFor={selectId}>
      {label ? <span className="odsField__label">{label}</span> : null}

      <select
        className={[
          "odsSelect",
          error ? "odsSelect--error" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        id={selectId}
        name={name}
        {...props}
      >
        {children}
      </select>

      {error ? (
        <span className="odsField__error">{error}</span>
      ) : hint ? (
        <span className="odsField__hint">{hint}</span>
      ) : null}
    </label>
  );
}
