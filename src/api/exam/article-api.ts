import request from "@/utils/request";

const BASE_URL = "/v1/articles";

export interface ArticleVO {
  id: number;
  title: string;
  coverUrl?: string;
  content: string;
  tags?: string[];
  pinned: number;
  createTime?: string;
  updateTime?: string;
}

export interface ArticleQuery {
  pageNum: number;
  pageSize: number;
  keywords?: string;
}

export interface ArticleForm {
  title: string;
  coverUrl?: string;
  content: string;
  tags?: string[];
  pinned: number;
}

const ArticleAPI = {
  getPage(query: ArticleQuery) {
    return request<any, PageResult<ArticleVO[]>>({
      url: `${BASE_URL}/page`,
      method: "post",
      data: query,
    });
  },
  create(data: ArticleForm) {
    return request<any, number>({ url: BASE_URL, method: "post", data });
  },
  update(id: number, data: ArticleForm) {
    return request({ url: `${BASE_URL}/${id}`, method: "put", data });
  },
  remove(id: number) {
    return request({ url: `${BASE_URL}/${id}`, method: "delete" });
  },
  sort(ids: number[]) {
    return request({ url: `${BASE_URL}/sort`, method: "put", data: { ids } });
  },
};

export default ArticleAPI;
