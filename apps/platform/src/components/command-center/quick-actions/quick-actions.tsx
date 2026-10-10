import Link from "next/link";

import {
  Badge,
  DashboardPanel,
  EmptyState,
} from "@oqood/design-system";

import type {
  CommandCenterActionsData,
  QuickAction,
} from "@/features/command-center";

import styles from "./quick-actions.module.css";

type QuickActionsProps = {
  data: CommandCenterActionsData;
};

function ActionTile({
  action,
}: {
  action: QuickAction;
}) {
  return (
    <li className={styles.actionItem}>
      <Link
        aria-label={`${action.title}: ${action.description}`}
        className={`${styles.action} ${styles[`tone-${action.tone}`]}`}
        href={action.href}
      >
        <span
          aria-hidden="true"
          className={styles.icon}
        >
          {action.icon}
        </span>

        <strong>
          {action.title}
        </strong>

        <small>
          {action.description}
        </small>

        <span
          aria-hidden="true"
          className={styles.arrow}
        >
          ←
        </span>
      </Link>
    </li>
  );
}

export function QuickActions({
  data,
}: QuickActionsProps) {
  return (
    <DashboardPanel
      action={
        <Badge
          size="sm"
          tone="info"
        >
          {data.actions.length}
          {" إجراءات"}
        </Badge>
      }
      aria-label="الإجراءات السريعة"
      className={styles.panel}
      description="ابدأ أكثر العمليات استخدامًا مباشرة."
      padding="none"
      title="إجراءات سريعة"
    >
      {data.actions.length > 0 ? (
        <ul
          className={styles.grid}
          role="list"
        >
          {data.actions.map(
            (action) => (
              <ActionTile
                action={action}
                key={action.id}
              />
            ),
          )}
        </ul>
      ) : (
        <EmptyState
          className={styles.empty}
          icon="+"
          title="لا توجد إجراءات سريعة"
          description="لا توجد عمليات متاحة وفق صلاحياتك الحالية."
          role="status"
        />
      )}
    </DashboardPanel>
  );
}
