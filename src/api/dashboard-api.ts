import request from "@/utils/request";

const DASHBOARD_BASE_URL = "/admin/exam/dashboard";

const DashboardAPI = {
  /** 获取看板概览（KPI、趋势、待办） */
  getOverview(range: 7 | 30 | 90, signal?: AbortSignal) {
    return request<any, DashboardOverviewVO>({
      url: `${DASHBOARD_BASE_URL}/overview`,
      method: "get",
      params: { range },
      signal,
    });
  },
};

export default DashboardAPI;

/** 趋势点 */
export interface DashboardTrendPoint {
  /** yyyy-MM-dd */
  date: string;
  count: number;
}

/** 看板概览 VO */
export interface DashboardOverviewVO {
  range: number;
  newUsers: number;
  codeUsed: number;
  totalUsers: number;
  newUsersTrend: DashboardTrendPoint[];
  codeUsedTrend: DashboardTrendPoint[];
  pendingReports: number;
  pendingFeedbacks: number;
}
