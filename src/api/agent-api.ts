import request from "@/utils/request";

const AGENT_BASE = "/v1/agent";
const AGENT_ORDER_ADMIN_BASE = "/v1/agent-orders";
const AGENT_PRICE_BASE = "/v1/agent-price-configs";

// ===== 代理端 =====
export interface AgentSubjectOption {
  subjectId: string;
  subjectName: string;
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
export interface AgentPriceConfigVO {
  id: number;
  agentId: number;
  agentName?: string;
  subjectId: string;
  subjectName?: string;
  pricingType: "PERCENT" | "FIXED";
  discountBasisPoints?: number;
  fixedPriceCents?: number;
  agentUnitPriceYuan?: number;
  originalPriceYuan?: number;
  createTime: string;
  updateTime: string;
}

export interface AgentPriceConfigSaveRequest {
  agentId: number;
  subjectId: string;
  pricingType: "PERCENT" | "FIXED";
  discountBasisPoints?: number;
  fixedPriceYuan?: number;
}

export const AgentAdminAPI = {
  pagePriceConfigs(query: PageQuery & { agentId?: number; subjectId?: string }) {
    return request<any, PageResult<AgentPriceConfigVO[]>>({
      url: `${AGENT_PRICE_BASE}/page`,
      method: "post",
      data: query,
    });
  },
  savePriceConfig(data: AgentPriceConfigSaveRequest) {
    return request({ url: AGENT_PRICE_BASE, method: "post", data });
  },
  deletePriceConfig(id: number) {
    return request({ url: `${AGENT_PRICE_BASE}/${id}`, method: "delete" });
  },
  pageAgentOrders(query: AgentOrderPageQuery & { agentId?: number }) {
    return request<any, PageResult<AgentOrderVO[]>>({
      url: `${AGENT_ORDER_ADMIN_BASE}/page`,
      method: "post",
      data: query,
    });
  },
};
