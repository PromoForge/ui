export type CampaignFilterStatus =
  | "scheduled"
  | "running"
  | "expired"
  | "disabled"
  | "lowOnBudget"
  | "expiringSoon";

export interface CampaignFilterCount {
  status: CampaignFilterStatus;
  label: string;
  count: number;
  color: string;
}

export interface MetricValue {
  label: string;
  value: number;
  change: number;
  period: string;
}

export interface InfluencedMetricValue {
  value: number;
  rate: number;
  rateLabel: string;
  change: number;
  period: string;
}

export interface AppDetailMetric {
  id: string;
  title: string;
  icon: string;
  accentColor: string;
  total: MetricValue;
  influenced?: InfluencedMetricValue;
  formatAs: "currency" | "number" | "percent";
}

export interface AppDetailData {
  campaignFilters: CampaignFilterCount[];
  metrics: AppDetailMetric[];
}
