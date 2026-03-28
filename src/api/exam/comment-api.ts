import request from "@/utils/request";

const COMMENT_BASE_URL = "/admin/exam/comment";

const CommentAPI = {
  /** 获取评论分页列表 */
  getPage(queryParams: CommentPageQuery) {
    return request<any, PageResult<CommentVO[]>>({
      url: `${COMMENT_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  /** 新增虚拟评论 */
  create(data: CreateVirtualCommentRequest) {
    return request({
      url: `${COMMENT_BASE_URL}/create`,
      method: "post",
      data,
    });
  },

  /** 回复评论 */
  reply(id: number, reply: string) {
    return request({
      url: `${COMMENT_BASE_URL}/${id}/reply`,
      method: "put",
      data: { reply },
    });
  },

  /** 显示/隐藏评论 */
  toggle(id: number) {
    return request({
      url: `${COMMENT_BASE_URL}/${id}/toggle`,
      method: "put",
    });
  },

  /** 删除评论 */
  delete(id: number) {
    return request({
      url: `${COMMENT_BASE_URL}/${id}`,
      method: "delete",
    });
  },
};

export default CommentAPI;

/** 新增虚拟评论请求 */
export interface CreateVirtualCommentRequest {
  subjectId: string;
  content: string;
  userEmail: string;
  userNickname: string;
  images?: string;
  adminReply?: string;
}

/** 评论分页查询参数 */
export interface CommentPageQuery extends PageQuery {
  /** 关键词（评论内容/用户邮箱/昵称） */
  keywords?: string;
  /** 科目ID */
  subjectId?: string;
  /** 评论类型 0-真实用户 1-虚拟评论 */
  type?: number;
  /** 状态 0-隐藏 1-显示 */
  status?: number;
}

/** 评论VO */
export interface CommentVO {
  id: number;
  subjectId: string;
  subjectName: string;
  userId: number;
  userEmail: string;
  userNickname: string;
  userAvatar?: string;
  content: string;
  /** 图片URLs JSON字符串 */
  images?: string;
  /** 评论类型 0-真实用户 1-虚拟评论 */
  type: number;
  /** 状态 0-隐藏 1-显示 */
  status: number;
  adminReply?: string;
  repliedAt?: string;
  createTime: string;
}
