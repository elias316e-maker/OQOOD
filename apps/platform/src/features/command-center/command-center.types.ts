export type CommandCenterTone =
  | "blue"
  | "purple"
  | "green"
  | "orange"
  | "red"
  | "cyan";

export type CommandCenterAlert = {
  id: string;
  title: string;
  value: number;
  description: string;
  tone: CommandCenterTone;
  icon: string;
};

export type CommandCenterKpi = {
  id: string;
  title: string;
  value: string;
  unit?: string;
  change: string;
  trend: "up" | "down";
  tone: CommandCenterTone;
  icon: string;
  chart: number[];
};

export type CommandCenterProgress = {
  percentage: number;
  completed: number;
  total: number;
};

export type CommandCenterData = {
  user: {
    firstName: string;
    role: string;
  };
  date: string;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    progress: CommandCenterProgress;
    alerts: CommandCenterAlert[];
  };
  kpis: CommandCenterKpi[];
  intelligence: CommandCenterIntelligenceData;
  quickActions: CommandCenterActionsData;
  operations: CommandCenterOperationsData;
  performance: CommandCenterPerformanceData;
  activity: CommandCenterActivityData;
  summary: CommandCenterSummaryData;
  notifications: CommandCenterNotificationsData;
};

export type AiInsightTone =
  | "blue"
  | "purple"
  | "green"
  | "orange"
  | "red";

export type AiInsight = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  tone: AiInsightTone;
  icon: string;
};

export type QuickAction = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: CommandCenterTone;
  icon: string;
};

export type CommandCenterIntelligenceData = {
  winProbability: number;
  change: string;
  insights: AiInsight[];
};

export type CommandCenterActionsData = {
  actions: QuickAction[];
};

export type PipelineStageTone =
  | "blue"
  | "cyan"
  | "purple"
  | "orange"
  | "green";

export type PipelineStage = {
  id: string;
  title: string;
  value: number;
  description: string;
  tone: PipelineStageTone;
};

export type CommandTaskPriority =
  | "high"
  | "medium"
  | "low";

export type CommandTask = {
  id: string;
  title: string;
  context: string;
  dueLabel: string;
  priority: CommandTaskPriority;
  completed: boolean;
};

export type CommandOpportunityStatus =
  | "draft"
  | "published"
  | "evaluation"
  | "closing";

export type CommandOpportunity = {
  id: string;
  reference: string;
  title: string;
  organization: string;
  closingLabel: string;
  progress: number;
  status: CommandOpportunityStatus;
  value: string;
};

export type CommandEventTone =
  | "blue"
  | "green"
  | "orange"
  | "purple"
  | "red";

export type CommandEvent = {
  id: string;
  day: string;
  month: string;
  title: string;
  description: string;
  time: string;
  tone: CommandEventTone;
};

export type CommandCenterOperationsData = {
  pipeline: PipelineStage[];
  tasks: CommandTask[];
  opportunities: CommandOpportunity[];
  events: CommandEvent[];
};

export type PerformancePoint = {
  label: string;
  contracts: number;
  procurement: number;
};

export type PerformanceMetric = {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  tone: CommandCenterTone;
};

export type ActivityTone =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "red";

export type CommandActivity = {
  id: string;
  title: string;
  description: string;
  time: string;
  actor: string;
  icon: string;
  tone: ActivityTone;
};

export type CommandCenterPerformanceData = {
  periodLabel: string;
  points: PerformancePoint[];
  metrics: PerformanceMetric[];
};

export type CommandCenterActivityData = {
  items: CommandActivity[];
};

export type ExecutiveSummaryItem = {
  id: string;
  label: string;
  value: string;
  tone: CommandCenterTone;
};

export type SmartNotificationTone =
  | "blue"
  | "green"
  | "orange"
  | "purple"
  | "red";

export type SmartNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: SmartNotificationTone;
  icon: string;
  unread: boolean;
};

export type CommandCenterSummaryData = {
  headline: string;
  description: string;
  healthScore: number;
  items: ExecutiveSummaryItem[];
};

export type CommandCenterNotificationsData = {
  unreadCount: number;
  items: SmartNotification[];
};
