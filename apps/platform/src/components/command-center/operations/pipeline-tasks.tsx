import Link from "next/link";
import type {
  CommandTask,
  PipelineStage,
} from "@/features/command-center";
import styles from "./pipeline-tasks.module.css";

type PipelineTasksProps = {
  pipeline: PipelineStage[];
  tasks: CommandTask[];
};

function TaskItem({ task }: { task: CommandTask }) {
  return (
    <article
      className={[
        styles.task,
        styles[`priority-${task.priority}`],
        task.completed ? styles.completed : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        aria-label={task.completed ? "مهمة مكتملة" : "إكمال المهمة"}
        className={styles.taskCheck}
        type="button"
      >
        {task.completed ? "✓" : ""}
      </button>

      <div className={styles.taskContent}>
        <strong>{task.title}</strong>
        <span>{task.context}</span>
      </div>

      <small>{task.dueLabel}</small>
    </article>
  );
}

export function PipelineTasks({
  pipeline,
  tasks,
}: PipelineTasksProps) {
  const activeOperations = pipeline.reduce(
    (sum, stage) => sum + stage.value,
    0,
  );

  return (
    <section className={styles.layout}>
      <article className={styles.pipelinePanel}>
        <header className={styles.panelHeader}>
          <div>
            <h2>مسار المنافسات</h2>
            <p>الحالة التشغيلية الحالية للمنافسات.</p>
          </div>

          <Link href="/platform/opportunities">عرض التفاصيل</Link>
        </header>

        <div className={styles.pipeline}>
          {pipeline.map((stage, index) => (
            <article
              className={`${styles.stage} ${
                styles[`tone-${stage.tone}`]
              }`}
              key={stage.id}
            >
              <div className={styles.stageTop}>
                <span>{index + 1}</span>
                <small>{stage.description}</small>
              </div>

              <strong>{stage.value}</strong>
              <h3>{stage.title}</h3>

              {index < pipeline.length - 1 ? (
                <span className={styles.connector} aria-hidden="true">
                  ←
                </span>
              ) : null}
            </article>
          ))}
        </div>

        <footer className={styles.pipelineFooter}>
          <span>
            <strong>{activeOperations}</strong>
            عملية نشطة
          </span>

          <span>
            بيانات محدثة مباشرة من مساحة العمل
          </span>
        </footer>
      </article>

      <article className={styles.tasksPanel}>
        <header className={styles.panelHeader}>
          <div>
            <h2>مهامي اليوم</h2>
            <p>الإجراءات التي تحتاج إلى متابعتك.</p>
          </div>

          <span className={styles.taskCount}>
            {tasks.filter((task) => !task.completed).length}
          </span>
        </header>

        <div className={styles.tasks}>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>

        <Link className={styles.viewTasks} href="/platform/notifications">
          عرض جميع المهام
        </Link>
      </article>
    </section>
  );
}
