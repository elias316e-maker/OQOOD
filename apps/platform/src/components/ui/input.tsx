import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="uiField" htmlFor={inputId}>
      {label && <span className="uiFieldLabel">{label}</span>}

      <input
        className={[
          "uiInput",
          error ? "uiInputError" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        id={inputId}
        {...props}
      />

      {error ? (
        <span className="uiFieldError">{error}</span>
      ) : (
        hint && <span className="uiFieldHint">{hint}</span>
      )}
    </label>
  );
}
