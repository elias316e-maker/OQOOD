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
};
