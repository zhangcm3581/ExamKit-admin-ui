import request from "@/utils/request";

const BASE_URL = "/v1/user-subject-auths";

const UserSubjectAuthAPI = {
  /** 查询指定用户的全部题库权限 */
  listByUserId(userId: number) {
    return request<any, UserSubjectAuthAdminVO[]>({
      url: BASE_URL,
      method: "get",
      params: { userId },
    });
  },

  /** 修改到期时间 */
  updateExpiredAt(id: number, expiredAt: string) {
    return request({
      url: `${BASE_URL}/${id}/expired-at`,
      method: "put",
      data: { expiredAt },
    });
  },

  /** 强制过期（设为昨天） */
  forceExpire(id: number) {
    return request({
      url: `${BASE_URL}/${id}/force-expire`,
      method: "post",
    });
  },
};

export default UserSubjectAuthAPI;

/** 用户科目权限（管理端 VO） */
export interface UserSubjectAuthAdminVO {
  id: number;
  userId: number;
  subjectId: string;
  subjectNameZh?: string;
  subjectNameEn?: string;
  providerName?: string;
  activationCodeId?: number;
  code?: string;
  source: string;
  activatedAt: string;
  expiredAt?: string;
  isExpired: boolean;
}
