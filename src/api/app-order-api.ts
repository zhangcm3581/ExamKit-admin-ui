import request from "@/utils/request";

const APP_ORDER_BASE = "/v1/app-orders";

export interface AppOrderAdminPageQuery extends PageQuery {
  orderNo?: string;
  code?: string;
  status?: "PENDING" | "PAID" | "CLOSED" | "";
  payType?: "NATIVE" | "H5" | "JSAPI" | "";
  startTime?: string;
  endTime?: string;
}

export interface AppOrderAdminVO {
  id: number;
  orderNo: string;
  userId: number;
  userNickname?: string;
  userAvatar?: string;
  userEmail?: string;
  subjectId: string;
  subjectName?: string;
  subjectNameEn?: string;
  providerName?: string;
  quantity: number;
  unitPriceYuan: number;
  totalYuan: number;
  status: "PENDING" | "PAID" | "CLOSED";
  payType: "NATIVE" | "H5" | "JSAPI";
  generatedCount: number;
  paidAt?: string;
  createTime: string;
}

export interface AppOrderCodeVO {
  code: string;
  /** 0=未使用 1=已使用 2=已过期 3=已回收（后端已派生） */
  status: number;
  validDays: number;
  usedAt?: string;
}

const AppOrderAdminAPI = {
  page(query: AppOrderAdminPageQuery) {
    return request<any, PageResult<AppOrderAdminVO[]>>({
      url: `${APP_ORDER_BASE}/page`,
      method: "post",
      data: query,
    });
  },
  listCodes(orderId: number) {
    return request<any, AppOrderCodeVO[]>({
      url: `${APP_ORDER_BASE}/${orderId}/codes`,
      method: "get",
    });
  },
  /** 已支付订单总金额（分），筛选条件同列表但强制 status=PAID */
  paidTotal(query: AppOrderAdminPageQuery) {
    return request<any, number>({
      url: `${APP_ORDER_BASE}/paid-total`,
      method: "post",
      data: query,
    });
  },
};

export default AppOrderAdminAPI;
