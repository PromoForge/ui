import type { DashboardData, RevenueDataPoint } from "$lib/types";

function generateRevenueData(
  days: number,
  baseRevenue: number,
  variance: number,
): RevenueDataPoint[] {
  const points: RevenueDataPoint[] = [];
  const now = new Date("2026-02-21");
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const daily =
      baseRevenue +
      Math.sin(i * 0.3) * variance +
      (i % 7 < 2 ? -variance * 0.3 : 0);
    points.push({
      date: date.toISOString().split("T")[0],
      revenue: Math.round(Math.max(0, daily)),
    });
  }
  return points;
}

const ksaDashboard: DashboardData = {
  kpi: {
    running: 342,
    expiringSoon: 18,
    lowOnBudget: 7,
  },
  revenueChart: generateRevenueData(90, 800_000, 200_000),
  pastWeekSummary: {
    influenceRate: 34.2,
    totalRevenue: 5_840_000,
    influencedRevenue: 1_997_280,
    revenueChange: 1.8,
    influencedChange: 3.24,
  },
  revenueSummary: [
    {
      label: "Total Revenue",
      yesterday: 812_000,
      past7Days: 5_840_000,
      pastMonth: 24_500_000,
      currentMonth: 16_200_000,
      past3Months: 72_400_000,
    },
    {
      label: "Influenced Revenue",
      yesterday: 278_000,
      past7Days: 1_997_280,
      pastMonth: 8_330_000,
      currentMonth: 5_508_000,
      past3Months: 24_616_000,
    },
    {
      label: "Influence Rate",
      yesterday: 34.24,
      past7Days: 34.2,
      pastMonth: 34.0,
      currentMonth: 34.0,
      past3Months: 34.0,
    },
  ],
};

const uaeDashboard: DashboardData = {
  kpi: {
    running: 156,
    expiringSoon: 9,
    lowOnBudget: 3,
  },
  revenueChart: generateRevenueData(90, 450_000, 120_000),
  pastWeekSummary: {
    influenceRate: 28.7,
    totalRevenue: 3_210_000,
    influencedRevenue: 921_270,
    revenueChange: 0.95,
    influencedChange: 2.1,
  },
  revenueSummary: [
    {
      label: "Total Revenue",
      yesterday: 465_000,
      past7Days: 3_210_000,
      pastMonth: 13_800_000,
      currentMonth: 9_100_000,
      past3Months: 40_200_000,
    },
    {
      label: "Influenced Revenue",
      yesterday: 133_455,
      past7Days: 921_270,
      pastMonth: 3_960_600,
      currentMonth: 2_611_700,
      past3Months: 11_537_400,
    },
    {
      label: "Influence Rate",
      yesterday: 28.7,
      past7Days: 28.7,
      pastMonth: 28.7,
      currentMonth: 28.7,
      past3Months: 28.7,
    },
  ],
};

const sandboxDashboard: DashboardData = {
  kpi: {
    running: 12,
    expiringSoon: 2,
    lowOnBudget: 1,
  },
  revenueChart: generateRevenueData(90, 50_000, 15_000),
  pastWeekSummary: {
    influenceRate: 42.1,
    totalRevenue: 345_000,
    influencedRevenue: 145_245,
    revenueChange: 5.2,
    influencedChange: 4.8,
  },
  revenueSummary: [
    {
      label: "Total Revenue",
      yesterday: 48_000,
      past7Days: 345_000,
      pastMonth: 1_480_000,
      currentMonth: 980_000,
      past3Months: 4_350_000,
    },
    {
      label: "Influenced Revenue",
      yesterday: 20_208,
      past7Days: 145_245,
      pastMonth: 623_080,
      currentMonth: 412_580,
      past3Months: 1_831_350,
    },
    {
      label: "Influence Rate",
      yesterday: 42.1,
      past7Days: 42.1,
      pastMonth: 42.1,
      currentMonth: 42.1,
      past3Months: 42.1,
    },
  ],
};

export const mockDashboardData: Record<string, DashboardData> = {
  "app-1": ksaDashboard,
  "app-2": uaeDashboard,
  "app-3": sandboxDashboard,
  "app-4": sandboxDashboard,
};
