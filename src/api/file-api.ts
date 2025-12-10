import request from "@/utils/request";

const FILE_BASE_URL = "/v1/files";

const FileManageAPI = {
  /** 获取文件分页列表 */
  getPage(queryParams: FilePageQuery) {
    return request<any, PageResult<FileVO>>({
      url: `${FILE_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  /** 上传文件 */
  upload(formData: FormData, onProgress?: (percent: number) => void) {
    return request<any, FileUploadVO>({
      url: `${FILE_BASE_URL}/upload`,
      method: "post",
      data: formData,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.(percent);
        }
      },
    });
  },

  /** 获取文件详情 */
  getDetail(id: number) {
    return request<any, FileVO>({
      url: `${FILE_BASE_URL}/${id}`,
      method: "get",
    });
  },

  /** 删除文件 */
  deleteById(id: number) {
    return request({
      url: `${FILE_BASE_URL}/${id}`,
      method: "delete",
    });
  },

  /** 获取存储统计 */
  getStats() {
    return request<any, FileStorageStatsVO>({
      url: `${FILE_BASE_URL}/stats`,
      method: "get",
    });
  },

  /** 清理孤儿文件 */
  cleanOrphan(days: number = 30) {
    return request<any, CleanResultVO>({
      url: `${FILE_BASE_URL}/clean-orphan`,
      method: "post",
      params: { days },
    });
  },

  /** 获取文件夹列表 */
  getFolders() {
    return request<any, FolderVO[]>({
      url: `${FILE_BASE_URL}/folders`,
      method: "get",
    });
  },

  /** 创建文件夹 */
  createFolder(name: string) {
    return request<any, FolderVO>({
      url: `${FILE_BASE_URL}/folders`,
      method: "post",
      data: { name },
    });
  },

  /** 删除文件夹 */
  deleteFolder(folderPath: string) {
    return request({
      url: `${FILE_BASE_URL}/folders`,
      method: "delete",
      params: { path: folderPath },
    });
  },

  /** 按文件夹获取文件分页列表 */
  getPageByFolder(queryParams: FilePageQuery & { folder?: string }) {
    return request<any, PageResult<FileVO>>({
      url: `${FILE_BASE_URL}/page`,
      method: "get",
      params: queryParams,
    });
  },

  /** 获取图片列表(用于图片选择器) */
  getImages(queryParams: FilePageQuery & { folder?: string }) {
    return request<any, PageResult<FileVO>>({
      url: `${FILE_BASE_URL}/page`,
      method: "get",
      params: {
        ...queryParams,
        fileType: "image",
        status: 1, // 只显示未删除的图片
      },
    });
  },
};

export default FileManageAPI;

/** 文件查询参数 */
export interface FilePageQuery extends PageQuery {
  /** 关键字 */
  keyword?: string;
  /** 状态: 0-已删除 1-正常 */
  status?: number;
}

/** 文件VO */
export interface FileVO {
  /** 文件ID */
  id: number;
  /** 文件Key */
  fileKey: string;
  /** 文件名 */
  fileName: string;
  /** 文件大小（字节） */
  fileSize: number;
  /** 文件类型 */
  fileType: string;
  /** 文件扩展名 */
  fileExt: string;
  /** 文件URL */
  url: string;
  /** 状态 */
  status: number;
  /** 创建时间 */
  createTime: string;
}

/** 文件上传响应 */
export interface FileUploadVO {
  /** 文件ID */
  id: number;
  /** 文件Key */
  fileKey: string;
  /** 文件名 */
  fileName: string;
  /** 文件大小 */
  fileSize: number;
  /** 文件类型 */
  fileType: string;
  /** 文件扩展名 */
  fileExt: string;
  /** 文件URL */
  url: string;
}

/** 存储统计 */
export interface FileStorageStatsVO {
  /** 总文件数 */
  totalFiles: number;
  /** 总大小（字节） */
  totalSize: number;
  /** 总大小（可读） */
  totalSizeReadable: string;
  /** 孤儿文件数 */
  orphanFiles: number;
  /** 孤儿文件大小 */
  orphanSize: number;
  /** 孤儿文件大小（可读） */
  orphanSizeReadable: string;
  /** 按文件类型统计 */
  byFileType: FileTypeStat[];
}

/** 文件类型统计 */
export interface FileTypeStat {
  /** 文件类型 */
  fileType: string;
  /** 文件数量 */
  count: number;
  /** 总大小 */
  size: number;
  /** 总大小（可读） */
  sizeReadable: string;
}

/** 清理结果 */
export interface CleanResultVO {
  /** 总数 */
  total: number;
  /** 成功数 */
  success: number;
  /** 失败数 */
  failed: number;
  /** 错误信息 */
  errors: string[];
}

/** 文件夹VO */
export interface FolderVO {
  /** 文件夹名称 */
  name: string;
  /** 文件夹路径 */
  path: string;
  /** 文件数量 */
  fileCount: number;
}
