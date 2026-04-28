import request from "@/utils/request";

const HOME_CONFIG_BASE_URL = "/v1/home-config";

const HomeConfigAPI = {
  /** 查询首页标题配置 */
  get() {
    return request<any, HomeConfigVO>({
      url: HOME_CONFIG_BASE_URL,
      method: "get",
    });
  },
  /** 更新首页标题配置 */
  update(data: HomeConfigForm) {
    return request({
      url: HOME_CONFIG_BASE_URL,
      method: "put",
      data,
    });
  },
};

export default HomeConfigAPI;

export interface HomeConfigVO {
  titleZh: string;
  titleEn: string;
}

export interface HomeConfigForm {
  titleZh: string;
  titleEn: string;
}
