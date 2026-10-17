import type { TextareaHTMLAttributes } from "react";

export type TextareaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    hint?: string;
    error?: string;
  };

export function Textarea({
  label,
  hint,
  error,
  id,
  name,
  className = "",
  ...props
}: TextareaProps) {
  const textareaId = id ?? name;

  return (
    <label className="odsField" htmlFor={textareaId}>
      {label ? <span className="odsField__label">{label}</span> : null}

      <textarea
        className={[
          "odsTextarea",
          error ? "odsTextarea--error" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        id={textareaId}
        name={name}
        {...props}
      />

      {error ? (
        <span className="odsField__error">{error}</span>
      ) : hint ? (
        <span className="odsField__hint">{hint}</span>
      ) : null}
    </label>
  );
}
