import request from "@/utils/request";

const REPORT_BASE_URL = "/admin/exam/question-report";

const QuestionReportAPI = {
  /** 获取纠错分页列表 */
  getPage(queryParams: ReportPageQuery) {
    return request<any, PageResult<ReportVO[]>>({
      url: `${REPORT_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取有纠错记录的科目列表 */
  getSubjects() {
    return request<any, { id: string; name: string }[]>({
      url: `${REPORT_BASE_URL}/subjects`,
      method: "get",
    });
  },

  /** 处理纠错 */
  handle(id: number, data: { status: string; handlerRemark: string }) {
    return request({
      url: `${REPORT_BASE_URL}/${id}/handle`,
      method: "put",
      data,
    });
  },
};

export default QuestionReportAPI;

/** 纠错分页查询参数 */
export interface ReportPageQuery extends PageQuery {
  subjectId?: string;
  status?: string;
}

/** 纠错VO */
export interface ReportVO {
  id: number;
  userId: number;
  userEmail: string;
  userNickname: string;
  subjectId: string;
  subjectName: string;
  questionId: number;
  questionNumber: number;
  errorTypes: string;
  description: string;
  status: string;
  handlerRemark?: string;
  handledAt?: string;
  createTime: string;
}
