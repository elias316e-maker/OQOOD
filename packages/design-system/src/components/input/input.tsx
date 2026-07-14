import type { InputHTMLAttributes, ReactNode } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function Input({
  label,
  hint,
  error,
  leadingIcon,
  trailingIcon,
  id,
  name,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? name;

  return (
    <label className="odsField" htmlFor={inputId}>
      {label ? <span className="odsField__label">{label}</span> : null}

      <span
        className={[
          "odsInputWrapper",
          error ? "odsInputWrapper--error" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {leadingIcon ? (
          <span className="odsInputWrapper__icon">{leadingIcon}</span>
        ) : null}

        <input
          className="odsInput"
          id={inputId}
          name={name}
          {...props}
        />

        {trailingIcon ? (
          <span className="odsInputWrapper__icon">{trailingIcon}</span>
        ) : null}
      </span>

      {error ? (
        <span className="odsField__error">{error}</span>
      ) : hint ? (
        <span className="odsField__hint">{hint}</span>
      ) : null}
    </label>
  );
}
