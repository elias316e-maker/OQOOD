"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useState,
} from "react";

export type TabsProps = {
  defaultValue: string;
  children: ReactNode;
  className?: string;
};

export type TabsListProps = {
  children: ReactNode;
  className?: string;
};

export type TabsTriggerProps = {
  value: string;
  children: ReactNode;
  active?: boolean;
  onSelect?: (value: string) => void;
};

export type TabsContentProps = {
  value: string;
  activeValue?: string;
  children: ReactNode;
  className?: string;
};

export function Tabs({
  defaultValue,
  children,
  className = "",
}: TabsProps) {
  const [activeValue, setActiveValue] = useState(defaultValue);

  return (
    <div
      className={["odsTabs", className].filter(Boolean).join(" ")}
      data-value={activeValue}
    >
      {Children.map(children, (child) => {
        if (!isValidElement(child)) {
          return child;
        }

        if (child.type === TabsList) {
          return cloneElement(
            child as ReactElement<TabsListProps>,
            {},
            Children.map(
              (child as ReactElement<TabsListProps>).props.children,
              (trigger) => {
                if (!isValidElement(trigger)) {
                  return trigger;
                }

                return cloneElement(
                  trigger as ReactElement<TabsTriggerProps>,
                  {
                    active:
                      (trigger as ReactElement<TabsTriggerProps>).props.value ===
                      activeValue,
                    onSelect: setActiveValue,
                  },
                );
              },
            ),
          );
        }

        if (child.type === TabsContent) {
          return cloneElement(
            child as ReactElement<TabsContentProps>,
            {
              activeValue,
            },
          );
        }

        return child;
      })}
    </div>
  );
}

export function TabsList({
  children,
  className = "",
}: TabsListProps) {
  return (
    <div
      className={["odsTabsList", className].filter(Boolean).join(" ")}
      role="tablist"
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  active = false,
  onSelect,
}: TabsTriggerProps) {
  return (
    <button
      aria-selected={active}
      className={[
        "odsTabsTrigger",
        active ? "odsTabsTrigger--active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => onSelect?.(value)}
      role="tab"
      type="button"
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  activeValue,
  children,
  className = "",
}: TabsContentProps) {
  if (value !== activeValue) {
    return null;
  }

  return (
    <section
      className={["odsTabsContent", className].filter(Boolean).join(" ")}
      role="tabpanel"
    >
      {children}
    </section>
  );
}
