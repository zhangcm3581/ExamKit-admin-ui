import request from "@/utils/request";

const QUESTION_BASE_URL = "/v1/questions";

/** 试题分页查询参数 */
export interface QuestionPageQuery {
  /** 科目ID */
  subjectId: string;
  /** 关键词 */
  keywords?: string;
  /** 题型 */
  type?: string;
  /** 页码 */
  pageNum: number;
  /** 每页大小 */
  pageSize: number;
}

/** 试题VO */
export interface QuestionVO {
  /** 题目ID */
  id: number;
  /** 科目ID */
  subjectId: string;
  /** 题号 */
  questionNumber: number;
  /** 是否案例题 */
  isCase: boolean;
  /** 案例ID */
  caseId?: number;
  /** 题型 */
  type: string;
  /** 题目内容(中文) */
  contentZh: string;
  /** 题目内容(英文) */
  contentEn?: string;
  /** 选项(中文) JSON格式 */
  optionsZh: string;
  /** 选项(英文) JSON格式 */
  optionsEn?: string;
  /** 答案 */
  answer: string;
  /** 答案解析(中文) */
  explanationZh?: string;
  /** 答案解析(英文) */
  explanationEn?: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
}

/** 试题创建请求 */
export interface QuestionForm {
  /** 题目ID */
  id?: number;
  /** 科目ID */
  subjectId?: string;
  /** 题型 */
  type?: string;
  /** 题目内容(中文) */
  contentZh?: string;
  /** 题目内容(英文) */
  contentEn?: string;
  /** 选项(中文) JSON格式 */
  optionsZh?: string;
  /** 选项(英文) JSON格式 */
  optionsEn?: string;
  /** 答案 */
  answer?: string;
  /** 答案解析(中文) */
  explanationZh?: string;
  /** 答案解析(英文) */
  explanationEn?: string;
}

const QuestionAPI = {
  /**
   * 获取试题分页列表
   */
  getPage(params: QuestionPageQuery) {
    return request<any, PageResult<QuestionVO>>({
      url: `${QUESTION_BASE_URL}/page`,
      method: "get",
      params,
    });
  },

  /**
   * 获取试题表单数据
   */
  getFormData(id: number) {
    return request<any, QuestionVO>({
      url: `${QUESTION_BASE_URL}/${id}/form`,
      method: "get",
    });
  },

  /**
   * 新增试题
   */
  create(data: QuestionForm) {
    return request({
      url: QUESTION_BASE_URL,
      method: "post",
      data,
    });
  },

  /**
   * 修改试题
   */
  update(id: number, data: QuestionForm) {
    return request({
      url: `${QUESTION_BASE_URL}/${id}`,
      method: "put",
      data,
    });
  },

  /**
   * 删除试题（单个）
   */
  deleteById(id: number, subjectId: string) {
    return request({
      url: `${QUESTION_BASE_URL}/${id}`,
      method: "delete",
      params: { subjectId },
    });
  },

  /**
   * 批量删除试题
   */
  batchDelete(ids: number[], subjectId: string) {
    return request({
      url: `${QUESTION_BASE_URL}/batch-delete`,
      method: "post",
      data: { ids, subjectId },
    });
  },

  /**
   * 批量更新试题
   */
  batchUpdate(questions: QuestionForm[]) {
    return request({
      url: `${QUESTION_BASE_URL}/batch-update`,
      method: "post",
      data: questions,
    });
  },

  /**
   * 批量更换题型
   */
  batchChangeType(ids: number[], type: string) {
    return request({
      url: `${QUESTION_BASE_URL}/batch-change-type`,
      method: "post",
      data: { ids, type },
    });
  },
};

export default QuestionAPI;

/** 分页结果 */
interface PageResult<T> {
  data: T[];
  total: number;
  size: number;
  current: number;
}
