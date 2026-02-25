export type TimeRange =
  | "custom"
  | "yesterday"
  | "7d"
  | "30d"
  | "3m"
  | "6m"
  | "ytd"
  | "max";

export interface KpiData {
  running: number;
  expiringSoon: number;
  lowOnBudget: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface RevenueSummaryRow {
  label: string;
  yesterday: number;
  past7Days: number;
  pastMonth: number;
  currentMonth: number;
  past3Months: number;
}

export interface PastWeekSummary {
  influenceRate: number;
  totalRevenue: number;
  influencedRevenue: number;
  revenueChange: number;
  influencedChange: number;
}

export interface DashboardData {
  kpi: KpiData;
  revenueChart: RevenueDataPoint[];
  pastWeekSummary: PastWeekSummary;
  revenueSummary: RevenueSummaryRow[];
}
