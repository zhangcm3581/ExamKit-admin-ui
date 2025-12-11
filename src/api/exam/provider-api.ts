import request from "@/utils/request";

const PROVIDER_BASE_URL = "/v1/providers";

const ProviderAPI = {
  /** 获取题库组合分页列表 (Provider + 未分类Subject) */
  getBankItemPage(queryParams: ProviderPageQuery) {
    return request<any, PageResult<BankItemVO[]>>({
      url: `${PROVIDER_BASE_URL}/bank-items/page`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取供应商分页列表 */
  getPage(queryParams: ProviderPageQuery) {
    return request<any, PageResult<ProviderVO[]>>({
      url: `${PROVIDER_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取供应商选项(下拉框) */
  getOptions() {
    return request<any, ProviderOptionVO[]>({
      url: `${PROVIDER_BASE_URL}/options`,
      method: "get",
    });
  },

  /** 获取供应商表单数据 */
  getFormData(id: number) {
    return request<any, ProviderVO>({
      url: `${PROVIDER_BASE_URL}/${id}/form`,
      method: "get",
    });
  },

  /** 新增供应商 */
  create(data: ProviderForm) {
    return request({
      url: `${PROVIDER_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /** 修改供应商 */
  update(id: number, data: ProviderForm) {
    return request({
      url: `${PROVIDER_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /** 删除供应商 */
  deleteByIds(ids: string) {
    return request({
      url: `${PROVIDER_BASE_URL}/${ids}`,
      method: "delete",
    });
  },
};

export default ProviderAPI;

/** 供应商查询参数 */
export interface ProviderPageQuery extends PageQuery {
  /** 关键字 */
  keywords?: string;
  /** 状态 */
  status?: number;
}

/** 供应商VO */
export interface ProviderVO {
  /** 供应商ID */
  id: number;
  /** 文件夹名称(管理后台显示) */
  folderName: string;
  /** 前端显示名称(用户界面显示) */
  displayName: string;
  /** Logo URL */
  logo?: string;
  /** 排序值 */
  sortOrder: number;
  /** 状态 */
  status: number;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

/** 供应商表单 */
export interface ProviderForm {
  /** 供应商ID */
  id?: number;
  /** 文件夹名称(管理后台显示) */
  folderName?: string;
  /** 前端显示名称(用户界面显示) */
  displayName?: string;
  /** Logo URL */
  logo?: string;
  /** 排序值 */
  sortOrder?: number;
  /** 状态 */
  status?: number;
}

/** 供应商选项 */
export interface ProviderOptionVO {
  /** 供应商ID */
  value: number;
  /** 显示名称 */
  label: string;
}

/** 题库项VO (Provider或Subject的统一展示) */
export interface BankItemVO {
  /** ID */
  id: string;
  /** 是否是文件夹 */
  isFolder: boolean;
  /** 文件夹名称 (仅Provider) */
  folderName?: string;
  /** 显示名称 (仅Provider) */
  displayName?: string;
  /** 科目名称(中文) (仅Subject) */
  nameZh?: string;
  /** 科目名称(英文) (仅Subject) */
  nameEn?: string;
  /** 支持的语言 (仅Subject) */
  supportLanguages?: string;
  /** Logo/图标 */
  logo?: string;
  /** 题目总数 (仅Subject) */
  totalQuestions?: number;
  /** 排序值 */
  sortOrder?: number;
  /** 状态 */
  status: number;
  /** 供应商ID (仅Subject) */
  providerId?: number;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}
