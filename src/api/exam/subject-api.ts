import request from "@/utils/request";

const SUBJECT_BASE_URL = "/v1/subjects";

const SubjectAPI = {
  /** 获取科目分页列表 */
  getPage(queryParams: SubjectPageQuery) {
    return request<any, PageResult<SubjectVO[]>>({
      url: `${SUBJECT_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取科目表单数据 */
  getFormData(id: string) {
    return request<any, SubjectVO>({
      url: `${SUBJECT_BASE_URL}/${id}/form`,
      method: "get",
    });
  },

  /** 新增科目 */
  create(data: SubjectForm) {
    return request({
      url: `${SUBJECT_BASE_URL}`,
      method: "post",
      data,
    });
  },

  /** 修改科目 */
  update(id: string, data: Partial<SubjectForm>) {
    return request({
      url: `${SUBJECT_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /** 移动科目到指定文件夹 */
  move(id: string, providerId: number | null) {
    return request({
      url: `${SUBJECT_BASE_URL}/${id}/move`,
      method: "put",
      params: { providerId },
    });
  },

  /** 删除科目 */
  deleteByIds(ids: string) {
    return request({
      url: `${SUBJECT_BASE_URL}/${ids}`,
      method: "delete",
    });
  },
};

export default SubjectAPI;

/** 科目查询参数 */
export interface SubjectPageQuery extends PageQuery {
  /** 关键字 */
  keywords?: string;
  /** 供应商ID */
  providerId?: number;
  /** 状态 */
  status?: number;
}

/** 科目VO */
export interface SubjectVO {
  /** 科目ID(UUID) */
  id: string;
  /** 供应商ID */
  providerId: number;
  /** 供应商名称 */
  providerName?: string;
  /** 科目名称(中文) */
  nameZh: string;
  /** 科目名称(英文) */
  nameEn?: string;
  /** 科目描述(中文) */
  descriptionZh?: string;
  /** 科目描述(英文) */
  descriptionEn?: string;
  /** 支持的语言 */
  supportLanguages?: string;
  /** 题目总数 */
  totalQuestions: number;
  /** 考试信息 */
  examInfo?: string;
  /** PDF资料URL */
  pdfUrl?: string;
  /** 视频资料URLs */
  videoUrls?: string;
  /** 排序值 */
  sortOrder: number;
  /** 状态 */
  status: number;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

/** 科目表单 */
export interface SubjectForm {
  /** 科目ID */
  id?: string;
  /** 供应商ID */
  providerId?: number;
  /** 科目名称(中文) */
  nameZh?: string;
  /** 科目名称(英文) */
  nameEn?: string;
  /** 科目描述(中文) */
  descriptionZh?: string;
  /** 科目描述(英文) */
  descriptionEn?: string;
  /** 支持的语言 */
  supportLanguages?: string;
  /** 考试信息 */
  examInfo?: string;
  /** PDF资料URL */
  pdfUrl?: string;
  /** 视频资料URLs */
  videoUrls?: string;
  /** 排序值 */
  sortOrder?: number;
  /** 状态 */
  status?: number;
}
