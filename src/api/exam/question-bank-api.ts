import request from "@/utils/request";

const QUESTION_BANK_BASE_URL = "/v1/question-bank";

const QuestionBankAPI = {
  /**
   * 上传Excel文件
   */
  upload(file: File, language: string, isCase: boolean = false) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    formData.append("isCase", String(isCase));

    return request({
      url: `${QUESTION_BANK_BASE_URL}/upload`,
      method: "post",
      data: formData,
      headers: {
        "Content-Type": undefined, // 让浏览器自动设置multipart/form-data带boundary
      },
    });
  },

  /**
   * 获取草稿预览
   */
  getPreview(batchId: string) {
    return request<any, QuestionDraftPreviewVO>({
      url: `${QUESTION_BANK_BASE_URL}/preview/${batchId}`,
      method: "get",
    });
  },

  /**
   * 更新草稿题目
   */
  updateDraft(id: number, data: QuestionDraftUpdateRequest) {
    return request({
      url: `${QUESTION_BANK_BASE_URL}/draft/${id}`,
      method: "put",
      data,
    });
  },

  /**
   * 检查语言冲突
   */
  checkLanguage(subjectId: string, language: string) {
    return request<any, LanguageCheckVO>({
      url: `${QUESTION_BANK_BASE_URL}/check-language`,
      method: "get",
      params: { subjectId, language },
    });
  },

  /**
   * 发布到科目
   */
  publish(data: QuestionBankPublishRequest) {
    return request<any, QuestionBankPublishResultVO>({
      url: `${QUESTION_BANK_BASE_URL}/publish`,
      method: "post",
      data,
    });
  },

  /**
   * 获取草稿列表
   */
  getDraftList(pageNum: number = 1, pageSize: number = 10, fileName?: string, language?: string) {
    return request<any, DraftListResponse>({
      url: `${QUESTION_BANK_BASE_URL}/drafts`,
      method: "get",
      params: { pageNum, pageSize, fileName, language },
    });
  },

  /**
   * 删除草稿
   */
  deleteDraft(batchId: string) {
    return request({
      url: `${QUESTION_BANK_BASE_URL}/drafts/${batchId}`,
      method: "delete",
    });
  },
};

export default QuestionBankAPI;

/** 草稿预览VO */
export interface QuestionDraftPreviewVO {
  metadata: MetadataInfo;
  questions: QuestionDraftItemVO[];
}

export interface MetadataInfo {
  batchId: string;
  language: string;
  fileName: string;
  totalCount: number;
}

export interface QuestionDraftItemVO {
  id: number;
  questionNumber: number;
  isCase: boolean;
  caseId?: number;
  caseContent?: string;
  type: string;
  content: string;
  options: string;
  answer: string;
  explanation?: string;
}

/** 草稿更新请求 */
export interface QuestionDraftUpdateRequest {
  questionNumber?: number;
  type?: string;
  content?: string;
  options?: string;
  answer?: string;
  explanation?: string;
}

/** 语言检查VO */
export interface LanguageCheckVO {
  hasLanguage: boolean;
  questionCount: number;
}

/** 发布请求 */
export interface QuestionBankPublishRequest {
  batchId: string;
  subjectId: string;
}

/** 发布结果VO */
export interface QuestionBankPublishResultVO {
  publishedQuestions: number;
  mode: string;
}

/** 草稿元数据 */
export interface DraftMetadata {
  batchId: string;
  fileName: string;
  language: string;
  totalCount: number;
  createTime: string;
}

/** 草稿列表响应 */
export interface DraftListResponse {
  records: DraftMetadata[];
  total: number;
  size: number;
  current: number;
}
