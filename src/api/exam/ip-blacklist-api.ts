import request from "@/utils/request";

const BASE_URL = "/v1/ip-blacklist";

const IpBlacklistAPI = {
  getPage(query: IpBlacklistPageQuery) {
    return request<any, PageResult<IpBlacklistVO[]>>({
      url: `${BASE_URL}/page`,
      method: "post",
      data: query,
    });
  },

  create(data: IpBlacklistCreateRequest) {
    return request<any, number>({
      url: BASE_URL,
      method: "post",
      data,
    });
  },

  updateEnabled(id: number, enabled: boolean) {
    return request({
      url: `${BASE_URL}/${id}/enabled`,
      method: "put",
      params: { enabled },
    });
  },

  remove(id: number) {
    return request({
      url: `${BASE_URL}/${id}`,
      method: "delete",
    });
  },
};

export default IpBlacklistAPI;

export interface IpBlacklistPageQuery extends PageQuery {
  keywords?: string;
  enabled?: boolean;
}

export interface IpBlacklistCreateRequest {
  ipValue: string;
  remark?: string;
}

export interface IpBlacklistVO {
  id: number;
  ipValue: string;
  remark?: string;
  enabled: boolean;
  createTime: string;
  updateTime?: string;
}
