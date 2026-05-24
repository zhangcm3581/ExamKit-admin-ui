import request from "@/utils/request";

const HOME_CONFIG_BASE_URL = "/v1/home-config";

const HomeConfigAPI = {
  get() {
    return request<any, HomeConfigVO>({
      url: HOME_CONFIG_BASE_URL,
      method: "get",
    });
  },
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
  customerServiceWechatQrUrl: string;
  customerServiceWechatId: string;
  hideTotalBeforeActivate: boolean;
}

export interface HomeConfigForm {
  titleZh: string;
  titleEn: string;
  customerServiceWechatQrUrl: string;
  customerServiceWechatId: string;
  hideTotalBeforeActivate: boolean;
}
