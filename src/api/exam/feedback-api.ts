import request from "@/utils/request";

const FEEDBACK_BASE_URL = "/admin/exam/feedback";

const FeedbackAPI = {
  /** 分页查询 */
  getPage(queryParams: FeedbackPageQuery) {
    return request<any, PageResult<FeedbackAdminVO[]>>({
      url: `${FEEDBACK_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  /** 查详情 */
  getDetail(id: number) {
    return request<any, FeedbackAdminVO>({
      url: `${FEEDBACK_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /** 回复并标已处理 */
  reply(id: number, data: { reply: string }) {
    return request({
      url: `${FEEDBACK_BASE_URL}/${id}/reply`,
      method: "put",
      data,
    });
  },

  /** 仅标已处理 */
  resolve(id: number) {
    return request({
      url: `${FEEDBACK_BASE_URL}/${id}/resolve`,
      method: "put",
    });
  },
};

export default FeedbackAPI;

/** 反馈分页查询参数 */
export interface FeedbackPageQuery extends PageQuery {
  type?: string;
  status?: string;
  keyword?: string;
  startTime?: string;
  endTime?: string;
}

/** 反馈 VO（管理后台） */
export interface FeedbackAdminVO {
  id: number;
  type: string;
  title: string;
  content: string;
  contact?: string;
  status: string;
  userId: number;
  userNickname?: string;
  reply?: string;
  repliedAt?: string;
  handlerId?: number;
  handlerNickname?: string;
  createTime: string;
}
