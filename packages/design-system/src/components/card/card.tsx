import type { HTMLAttributes, ReactNode } from "react";

export type CardElevation = "none" | "sm" | "md" | "lg";
export type CardPadding = "none" | "sm" | "md" | "lg";

export type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  elevation?: CardElevation;
  padding?: CardPadding;
};

export function Card({
  children,
  elevation = "sm",
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  return (
    <section
      className={[
        "odsCard",
        `odsCard--elevation-${elevation}`,
        `odsCard--padding-${padding}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </section>
  );
}

export type CardHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function CardHeader({
  title,
  description,
  action,
  className = "",
}: CardHeaderProps) {
  return (
    <header className={["odsCardHeader", className].filter(Boolean).join(" ")}>
      <div className="odsCardHeader__content">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>

      {action ? <div className="odsCardHeader__action">{action}</div> : null}
    </header>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["odsCardBody", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <footer className={["odsCardFooter", className].filter(Boolean).join(" ")}>
      {children}
    </footer>
  );
}
