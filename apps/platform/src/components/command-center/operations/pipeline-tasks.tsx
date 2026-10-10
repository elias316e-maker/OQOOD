import Link from "next/link";

import {
  Badge,
  DashboardPanel,
  EmptyState,
} from "@oqood/design-system";

import type {
  CommandTask,
  PipelineStage,
} from "@/features/command-center";

import styles from "./pipeline-tasks.module.css";

type PipelineTasksProps = {
  pipeline: PipelineStage[];
  tasks: CommandTask[];
};

const stageBadgeTones: Record<
  PipelineStage["tone"],
  | "info"
  | "primary"
  | "success"
  | "warning"
> = {
  blue: "info",
  cyan: "info",
  purple: "primary",
  orange: "warning",
  green: "success",
};

const priorityLabels: Record<
  CommandTask["priority"],
  string
> = {
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
};

const priorityBadgeTones: Record<
  CommandTask["priority"],
  | "danger"
  | "warning"
  | "info"
> = {
  high: "danger",
  medium: "warning",
  low: "info",
};

function TaskItem({
  task,
}: {
  task: CommandTask;
}) {
  return (
    <article
      aria-label={`${task.title} — ${
        task.completed
          ? "مكتملة"
          : `أولوية ${priorityLabels[task.priority]}`
      }`}
      className={[
        styles.task,
        styles[
          `priority-${task.priority}`
        ],
        task.completed
          ? styles.completed
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="listitem"
    >
      <span
        aria-hidden="true"
        className={styles.taskCheck}
        data-completed={
          task.completed
        }
      >
        {task.completed ? "✓" : "•"}
      </span>

      <div
        className={styles.taskContent}
      >
        <div
          className={styles.taskHeading}
        >
          <strong>
            {task.title}
          </strong>

          <Badge
            className={styles.taskStatus}
            size="sm"
            tone={
              task.completed
                ? "success"
                : priorityBadgeTones[
                    task.priority
                  ]
            }
          >
            {task.completed
              ? "مكتملة"
              : priorityLabels[
                  task.priority
                ]}
          </Badge>
        </div>

        <span>
          {task.context}
        </span>
      </div>

      <small
        className={styles.taskDue}
      >
        {task.dueLabel}
      </small>
    </article>
  );
}

export function PipelineTasks({
  pipeline,
  tasks,
}: PipelineTasksProps) {
  const activeOperations =
    pipeline.reduce(
      (sum, stage) =>
        sum + stage.value,
      0,
    );

  const outstandingTasks =
    tasks.filter(
      (task) => !task.completed,
    ).length;

  const completedTasks =
    tasks.length -
    outstandingTasks;

  return (
    <section
      aria-label="العمليات والمهام"
      className={styles.layout}
    >
      <DashboardPanel
        action={
          <Link
            className={styles.panelLink}
            href="/platform/opportunities"
          >
            عرض التفاصيل
          </Link>
        }
        aria-label="مسار المنافسات"
        className={
          styles.pipelinePanel
        }
        description="الحالة التشغيلية الحالية للمنافسات."
        footer={
          <div
            className={
              styles.pipelineFooter
            }
          >
            <span
              className={
                styles.footerMetric
              }
            >
              <strong>
                {activeOperations}
              </strong>

              عملية نشطة
            </span>

            <span>
              بيانات محدثة مباشرة من
              مساحة العمل
            </span>
          </div>
        }
        padding="none"
        title="مسار المنافسات"
      >
        {pipeline.length > 0 ? (
          <div
            className={styles.pipeline}
            role="list"
          >
            {pipeline.map(
              (stage, index) => (
                <article
                  aria-label={`${stage.title}: ${stage.value} — ${stage.description}`}
                  className={`${styles.stage} ${styles[`tone-${stage.tone}`]}`}
                  key={stage.id}
                  role="listitem"
                >
                  <div
                    className={
                      styles.stageTop
                    }
                  >
                    <Badge
                      className={
                        styles.stageIndex
                      }
                      size="sm"
                      tone={
                        stageBadgeTones[
                          stage.tone
                        ]
                      }
                    >
                      {index + 1}
                    </Badge>

                    <small>
                      {stage.description}
                    </small>
                  </div>

                  <strong>
                    {stage.value}
                  </strong>

                  <h3>
                    {stage.title}
                  </h3>

                  {index <
                  pipeline.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className={
                        styles.connector
                      }
                    >
                      ←
                    </span>
                  ) : null}
                </article>
              ),
            )}
          </div>
        ) : (
          <EmptyState
            className={styles.empty}
            icon="◇"
            title="لا توجد منافسات نشطة"
            description="ستظهر مراحل المنافسات هنا بعد إنشاء أول منافسة في مساحة العمل."
            role="status"
          />
        )}
      </DashboardPanel>

      <DashboardPanel
        action={
          <Badge
            className={styles.taskCount}
            size="sm"
            tone={
              outstandingTasks > 0
                ? "warning"
                : "success"
            }
          >
            {outstandingTasks}
            {" معلّقة"}
          </Badge>
        }
        aria-label="مهامي اليوم"
        className={styles.tasksPanel}
        description="الإجراءات التي تحتاج إلى متابعتك."
        footer={
          <div
            className={
              styles.tasksFooter
            }
          >
            <span>
              {completedTasks}
              {" مكتملة من "}
              {tasks.length}
            </span>

            <Link
              className={
                styles.viewTasks
              }
              href="/platform/notifications"
            >
              عرض جميع المهام
            </Link>
          </div>
        }
        padding="none"
        title="مهامي اليوم"
      >
        {tasks.length > 0 ? (
          <div
            className={styles.tasks}
            role="list"
          >
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            className={styles.empty}
            tone="success"
            icon="✓"
            title="لا توجد مهام معلّقة"
            description="لا توجد إجراءات تحتاج إلى متابعتك في الوقت الحالي."
            role="status"
          />
        )}
      </DashboardPanel>
    </section>
  );
}
