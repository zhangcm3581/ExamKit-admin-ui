import request from "@/utils/request";

const APP_USER_BASE_URL = "/v1/app-users";

const AppUserAPI = {
  /** 获取注册用户分页列表 */
  getPage(queryParams: AppUserPageQuery) {
    return request<any, PageResult<AppUserVO[]>>({
      url: `${APP_USER_BASE_URL}/page`,
      method: "post",
      data: queryParams,
    });
  },

  /** 管理员手动验证用户邮箱 */
  verifyEmail(userId: number) {
    return request({
      url: `${APP_USER_BASE_URL}/${userId}/verify-email`,
      method: "put",
    });
  },
};

export default AppUserAPI;

/** 注册用户查询参数 */
export interface AppUserPageQuery extends PageQuery {
  /** 关键字(昵称/邮箱) */
  keywords?: string;
  /** 邮箱是否验证 */
  emailVerified?: boolean;
}

/** 注册用户VO */
export interface AppUserVO {
  /** 用户ID */
  id: number;
  /** 昵称 */
  nickname: string;
  /** 头像URL */
  avatar?: string;
  /** 邮箱 */
  email?: string;
  /** 邮箱是否验证 */
  emailVerified: boolean;
  /** 状态 0-禁用 1-正常 */
  status: number;
  /** 最后登录时间 */
  lastLoginAt?: string;
  /** 最后登录设备 */
  lastLoginDevice?: string;
  /** 语言偏好 */
  locale?: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime?: string;
}
