import request from "@/utils/request";

const ACTIVATION_CODE_BASE_URL = "/v1/activation-codes";

const ActivationCodeAPI = {
  /** 获取激活码分页列表 */
  getPage(queryParams: ActivationCodePageQuery) {
    return request<any, PageResult<ActivationCodeVO[]>>({
      url: `${ACTIVATION_CODE_BASE_URL}/page`,
      method: "post",
      data: queryParams,
    });
  },

  /** 批量生成激活码 */
  batchGenerate(data: BatchGenerateRequest) {
    return request<any, string[]>({
      url: `${ACTIVATION_CODE_BASE_URL}/batch-generate`,
      method: "post",
      data,
    });
  },

  /** 自定义创建激活码 */
  customCreate(data: CustomCreateRequest) {
    return request({
      url: `${ACTIVATION_CODE_BASE_URL}/custom-create`,
      method: "post",
      data,
    });
  },

  /** 导出未使用的激活码 */
  exportUnused(subjectId: string) {
    return request<any, ActivationCodeVO[]>({
      url: `${ACTIVATION_CODE_BASE_URL}/export-unused`,
      method: "get",
      params: { subjectId },
    });
  },
};

export default ActivationCodeAPI;

/** 激活码分页查询参数 */
export interface ActivationCodePageQuery extends PageQuery {
  /** 关键词(激活码) */
  keywords?: string;
  /** 科目ID */
  subjectId?: string;
  /** 状态 0-未使用 1-已使用 2-已过期 */
  status?: number;
}

/** 激活码VO */
export interface ActivationCodeVO {
  /** ID */
  id: number;
  /** 激活码 */
  code: string;
  /** 科目ID */
  subjectId: string;
  /** 科目名称 */
  subjectName?: string;
  /** 类型 */
  type?: string;
  /** 有效天数 */
  validDays: number;
  /** 状态 */
  status: number;
  /** 使用者ID */
  usedBy?: number;
  /** 使用者昵称 */
  usedByName?: string;
  /** 使用时间 */
  usedAt?: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

/** 批量生成请求 */
export interface BatchGenerateRequest {
  /** 科目ID */
  subjectId: string;
  /** 生成数量 */
  count?: number;
  /** 有效天数 */
  validDays?: number;
  /** 备注 */
  remark?: string;
}

/** 自定义创建请求 */
export interface CustomCreateRequest {
  /** 科目ID */
  subjectId: string;
  /** 激活码列表 */
  codes: string[];
  /** 有效天数 */
  validDays?: number;
  /** 备注 */
  remark?: string;
}
