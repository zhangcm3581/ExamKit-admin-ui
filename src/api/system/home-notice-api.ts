import request from "@/utils/request";

const NOTICE_BASE_URL = "/v1/home-notices";

const HomeNoticeAPI = {
  /** 获取首页公告分页数据 */
  getPage(query: HomeNoticePageQuery) {
    return request<any, PageResult<HomeNoticeVO[]>>({
      url: `${NOTICE_BASE_URL}/page`,
      method: "get",
      params: query,
    });
  },
  /** 获取首页公告表单数据 */
  getFormData(id: number) {
    return request<any, HomeNoticeVO>({
      url: `${NOTICE_BASE_URL}/${id}/form`,
      method: "get",
    });
  },
  /** 新增首页公告 */
  create(data: HomeNoticeForm) {
    return request({ url: NOTICE_BASE_URL, method: "post", data });
  },
  /** 修改首页公告 */
  update(id: number, data: HomeNoticeForm) {
    return request({ url: `${NOTICE_BASE_URL}/${id}`, method: "put", data });
  },
  /** 切换启用状态 */
  toggle(id: number) {
    return request({ url: `${NOTICE_BASE_URL}/${id}/toggle`, method: "put" });
  },
  /** 批量删除首页公告，多个以英文逗号(,)分割 */
  deleteByIds(ids: string) {
    return request({ url: `${NOTICE_BASE_URL}/${ids}`, method: "delete" });
  },
};

export default HomeNoticeAPI;

export interface HomeNoticePageQuery extends PageQuery {
  keywords?: string;
}

export interface HomeNoticeVO {
  id: number;
  contentZh: string;
  contentEn?: string;
  enabled: number;
  sortOrder: number;
  createTime?: string;
  updateTime?: string;
}

export interface HomeNoticeForm {
  contentZh: string;
  contentEn?: string;
  enabled: number;
  sortOrder: number;
}
