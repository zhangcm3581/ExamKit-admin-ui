import request from "@/utils/request";

const BASE_URL = "/v1/key-points";

export interface KeyPointVO {
  id: number;
  subjectId: string;
  title: string;
  fileUrl: string;
  fileName?: string;
  sortOrder: number;
}

const KeyPointAPI = {
  list(subjectId: string) {
    return request<any, KeyPointVO[]>({
      url: BASE_URL,
      method: "get",
      params: { subjectId },
    });
  },
  create(subjectId: string, title: string, file: File) {
    const data = new FormData();
    data.append("subjectId", subjectId);
    data.append("title", title);
    data.append("file", file);
    return request<any, number>({
      url: BASE_URL,
      method: "post",
      data,
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  rename(id: number, title: string) {
    return request({ url: `${BASE_URL}/${id}`, method: "put", data: { title } });
  },
  remove(id: number) {
    return request({ url: `${BASE_URL}/${id}`, method: "delete" });
  },
};

export default KeyPointAPI;
