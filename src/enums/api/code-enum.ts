/**
 * API响应码枚举
 */
export const enum ApiCodeEnum {
  /**
   * 成功
   */
  SUCCESS = "SUCCESS",
  /**
   * 错误
   */
  ERROR = "BIZ_ERROR",

  /**
   * 访问令牌无效或过期
   */
  ACCESS_TOKEN_INVALID = "TOKEN_EXPIRED",

  /**
   * 刷新令牌无效或过期
   */
  REFRESH_TOKEN_INVALID = "REFRESH_TOKEN_EXPIRED",
}
