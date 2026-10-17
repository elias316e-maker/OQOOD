export type DashboardAlertTone =
  | "danger"
  | "warning"
  | "success"
  | "info";

export type DashboardAlert = {
  id: string;
  label: string;
  value: number;
  description: string;
  tone: DashboardAlertTone;
  icon: string;
};

export type DashboardProgress = {
  percentage: number;
  completed: number;
  total: number;
  label: string;
};

export type DashboardHeroData = {
  userName: string;
  greeting: string;
  dateLabel: string;
  headline: string;
  description: string;
  alerts: DashboardAlert[];
  progress: DashboardProgress;
};

export type DashboardData = {
  hero: DashboardHeroData;
};
