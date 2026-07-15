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
  return (
    <section className={styles.layout}>
      <article className={styles.pipelinePanel}>
        <header className={styles.panelHeader}>
          <div>
            <h2>مسار المنافسات</h2>
            <p>الحالة التشغيلية الحالية للمنافسات.</p>
          </div>

          <button type="button">عرض التفاصيل</button>
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
            <strong>47</strong>
            عملية نشطة
          </span>

          <span>
            متوسط مدة الدورة:
            <strong> 21 يومًا</strong>
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

        <button className={styles.viewTasks} type="button">
          عرض جميع المهام
        </button>
      </article>
    </section>
  );
}
