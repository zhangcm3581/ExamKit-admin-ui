import request from "@/utils/request";

const BASE_URL = "/v1/chapters";

export interface ChapterNode {
  id: number;
  parentId: number | null;
  name: string;
  sortOrder: number;
  children?: ChapterNode[];
}

const ChapterAPI = {
  tree(subjectId: string) {
    return request<any, ChapterNode[]>({
      url: BASE_URL,
      method: "get",
      params: { subjectId },
    });
  },

  create(subjectId: string, parentId?: number) {
    return request<any, number>({
      url: BASE_URL,
      method: "post",
      params: { subjectId, parentId },
    });
  },

  rename(id: number, name: string) {
    return request({
      url: `${BASE_URL}/${id}`,
      method: "put",
      data: { name },
    });
  },

  remove(id: number) {
    return request({
      url: `${BASE_URL}/${id}`,
      method: "delete",
    });
  },
};

export default ChapterAPI;
