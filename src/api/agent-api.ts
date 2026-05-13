import request from "@/utils/request";

const AGENT_BASE = "/v1/agent";
const AGENT_ORDER_ADMIN_BASE = "/v1/agent-orders";
const AGENT_PRICE_BASE = "/v1/agent-price-configs";

// ===== 代理端 =====
export interface AgentSubjectOption {
  subjectId: string;
  subjectName: string;
  subjectNameEn?: string;
  providerId?: number;
  providerName?: string;
  originalPriceYuan: number;
  agentUnitPriceYuan: number;
}

export interface AgentOrderCreateRequest {
  subjectId: string;
  quantity: number;
  validDays: number;
  remark?: string;
}

export interface AgentOrderCreateResponse {
  orderNo: string;
  codeUrl: string;
  expiresAt: string;
  totalYuan: number;
}

export interface AgentOrderStatus {
  status: "PENDING" | "PAID" | "CLOSED";
  paidAt?: string;
  generatedCount?: number;
}

export interface AgentOrderVO {
  id: number;
  orderNo: string;
  agentId: number;
  agentName?: string;
  subjectId: string;
  subjectName?: string;
  subjectNameEn?: string;
  quantity: number;
  unitPriceYuan: number;
  totalYuan: number;
  validDays: number;
  status: string;
  paidAt?: string;
  generatedCount?: number;
  remark?: string;
  createTime: string;
}

export interface AgentOrderPageQuery extends PageQuery {
  orderNo?: string;
  status?: string;
  subjectId?: string;
  startTime?: string;
  endTime?: string;
}

export interface AgentCodePageQuery extends PageQuery {
  subjectId?: string;
  status?: number;
  keywords?: string;
  orderId?: number;
}

const AgentAPI = {
  listSubjects() {
    return request<any, AgentSubjectOption[]>({ url: `${AGENT_BASE}/subjects`, method: "get" });
  },
  createOrder(data: AgentOrderCreateRequest) {
    return request<any, AgentOrderCreateResponse>({
      url: `${AGENT_BASE}/orders`,
      method: "post",
      data,
    });
  },
  getOrderStatus(orderNo: string) {
    return request<any, AgentOrderStatus>({
      url: `${AGENT_BASE}/orders/${orderNo}/status`,
      method: "get",
    });
  },
  pageOrders(query: AgentOrderPageQuery) {
    return request<any, PageResult<AgentOrderVO[]>>({
      url: `${AGENT_BASE}/orders/page`,
      method: "post",
      data: query,
    });
  },
  pageCodes(query: AgentCodePageQuery) {
    return request<any, PageResult<any[]>>({
      url: `${AGENT_BASE}/codes/page`,
      method: "post",
      data: query,
    });
  },
  exportCodes(subjectId?: string, status?: number) {
    return request<any, any[]>({
      url: `${AGENT_BASE}/codes/export`,
      method: "get",
      params: { subjectId, status },
    });
  },
};
export default AgentAPI;

// ===== 管理员端 =====
export interface AgentPriceSummaryVO {
  agentId: number;
  agentName?: string;
  /** null 表示该代理未配置过比例（前端按系统默认 33.33% 展示） */
  discountBasisPoints?: number;
  overrideCount: number;
  updateTime?: string;
}

export interface AgentPriceFixedOverrideVO {
  subjectId: string;
  subjectName?: string;
  fixedPriceCents: number;
  originalPriceYuan?: number;
}

export interface AgentPriceDetailVO {
  agentId: number;
  agentName?: string;
  discountBasisPoints?: number;
  overrides: AgentPriceFixedOverrideVO[];
}

export interface AgentPriceSummaryPageQuery extends PageQuery {
  agentId?: number;
}

export interface AgentPriceSaveRequest {
  discountBasisPoints: number;
  overrides: Array<{ subjectId: string; fixedPriceYuan: number }>;
}

export const AgentAdminAPI = {
  pageAgentPriceSummaries(query: AgentPriceSummaryPageQuery) {
    return request<any, PageResult<AgentPriceSummaryVO[]>>({
      url: `${AGENT_PRICE_BASE}/agents/page`,
      method: "post",
      data: query,
    });
  },
  getAgentPriceConfig(agentId: number) {
    return request<any, AgentPriceDetailVO>({
      url: `${AGENT_PRICE_BASE}/agents/${agentId}`,
      method: "get",
    });
  },
  saveAgentPriceConfig(agentId: number, data: AgentPriceSaveRequest) {
    return request({
      url: `${AGENT_PRICE_BASE}/agents/${agentId}`,
      method: "put",
      data,
    });
  },
  pageAgentOrders(query: AgentOrderPageQuery & { agentId?: number }) {
    return request<any, PageResult<AgentOrderVO[]>>({
      url: `${AGENT_ORDER_ADMIN_BASE}/page`,
      method: "post",
      data: query,
    });
  },
  /** 列出某个代理订单的全部激活码（不分页） */
  listCodesForOrder(orderId: number) {
    return request<any, any[]>({
      url: `${AGENT_ORDER_ADMIN_BASE}/${orderId}/codes`,
      method: "get",
    });
  },
};
