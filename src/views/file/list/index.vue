<template>
  <div class="file-manage-container">
    <div class="file-manage-header">
      <div class="header-title">
        <h2>文件管理</h2>
        <span class="file-count">当前目录: {{ currentFolder || "全部文件" }} ({{ total }} 张)</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" plain icon="FolderAdd" @click="handleCreateFolder">
          新建文件夹
        </el-button>
        <el-button type="primary" icon="Upload" @click="handleUploadDialog">上传文件</el-button>
        <el-button
          v-if="selectedFiles.length > 0"
          type="danger"
          icon="Delete"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
      </div>
    </div>

    <div class="file-manage-content">
      <!-- 左侧目录树 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>目录分类</h3>
          <el-button icon="Refresh" circle size="small" @click="loadFolders" />
        </div>
        <el-scrollbar>
          <div class="category-list">
            <div
              :class="['category-item', { active: !currentFolder }]"
              @click="handleFolderClick('')"
            >
              <el-icon><Folder /></el-icon>
              <span>全部文件</span>
              <span class="count">({{ stats.totalFiles }})</span>
            </div>
            <div
              v-for="folder in folders"
              :key="folder.path"
              :class="['category-item', { active: currentFolder === folder.path }]"
              @click="handleFolderClick(folder.path)"
              @contextmenu.prevent="handleFolderContextMenu($event, folder)"
            >
              <el-icon><FolderOpened /></el-icon>
              <span>{{ folder.name }}</span>
              <span class="count">({{ folder.fileCount }})</span>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧主内容区 -->
      <div class="main-content">
        <!-- 工具栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button-group>
              <el-button
                :type="viewMode === 'grid' ? 'primary' : ''"
                icon="Grid"
                @click="viewMode = 'grid'"
              >
                图片
              </el-button>
              <el-button
                :type="viewMode === 'list' ? 'primary' : ''"
                icon="List"
                @click="viewMode = 'list'"
              >
                列表
              </el-button>
            </el-button-group>
          </div>

          <div class="toolbar-right">
            <el-select v-model="viewSize" style="width: 120px" size="small">
              <el-option label="多张模式" value="multi" />
              <el-option label="单张模式" value="single" />
            </el-select>
            <el-input
              v-model="queryParams.keyword"
              placeholder="搜索文件名"
              clearable
              style="width: 200px"
              size="small"
              @keyup.enter="handleQuery"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button icon="Setting" circle size="small" />
          </div>
        </div>

        <!-- 网格视图 -->
        <div v-if="viewMode === 'grid'" class="grid-view">
          <!-- loading状态 -->
          <div v-if="loading" class="grid-loading">
            <el-icon class="is-loading" :size="40"><Loading /></el-icon>
            <span>加载中...</span>
          </div>

          <!-- 文件卡片列表 -->
          <template v-else-if="fileList.length > 0">
            <div
              v-for="file in fileList"
              :key="file.id"
              :class="['file-card', { selected: selectedFiles.includes(file.id) }]"
              @click="toggleFileSelection(file.id)"
            >
              <div class="file-preview">
                <el-image
                  v-if="isImage(file.fileType)"
                  :src="file.url"
                  fit="cover"
                  class="preview-image"
                  lazy
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <div v-else class="file-icon">
                  <el-icon :size="60"><Document /></el-icon>
                </div>
                <el-checkbox
                  v-model="selectedFiles"
                  :value="file.id"
                  class="file-checkbox"
                  @click.stop
                />
              </div>
              <div class="file-info">
                <div class="file-name" :title="file.fileName">{{ file.fileName }}</div>
                <div class="file-meta">
                  <span>{{ formatFileSize(file.fileSize) }}</span>
                  <span>{{ formatDate(file.createTime) }}</span>
                </div>
              </div>
              <div class="file-actions">
                <el-button
                  type="primary"
                  link
                  size="small"
                  icon="View"
                  @click.stop="handlePreview(file)"
                >
                  预览
                </el-button>
                <el-button
                  type="success"
                  link
                  size="small"
                  icon="Download"
                  @click.stop="handleDownload(file)"
                >
                  下载
                </el-button>
                <el-button
                  v-hasPerm="['file:delete']"
                  type="danger"
                  link
                  size="small"
                  icon="Delete"
                  @click.stop="handleDelete(file)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </template>

          <!-- 空状态 -->
          <div v-else class="empty-state">
            <el-empty description="暂无文件" />
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else v-loading="loading" class="list-view">
          <el-table :data="fileList" border @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="预览" width="80" align="center">
              <template #default="{ row }">
                <el-image
                  v-if="isImage(row.fileType)"
                  :src="row.url"
                  fit="cover"
                  style="width: 50px; height: 50px; border-radius: 4px"
                  lazy
                >
                  <template #error>
                    <div
                      style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 50px;
                        height: 50px;
                      "
                    >
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                <el-icon v-else :size="30"><Document /></el-icon>
              </template>
            </el-table-column>
            <el-table-column label="文件名" prop="fileName" min-width="200" show-overflow-tooltip />
            <el-table-column label="大小" width="120" align="center">
              <template #default="{ row }">
                {{ formatFileSize(row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column label="修改时间" width="180" align="center">
              <template #default="{ row }">
                {{ row.createTime }}
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="200" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" icon="View" @click="handlePreview(row)">
                  预览
                </el-button>
                <el-button
                  type="success"
                  link
                  size="small"
                  icon="Download"
                  @click="handleDownload(row)"
                >
                  下载
                </el-button>
                <el-button
                  v-hasPerm="['file:delete']"
                  type="danger"
                  link
                  size="small"
                  icon="Delete"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页 -->
        <div v-if="total > 0" class="pagination-container">
          <pagination
            v-model:total="total"
            v-model:page="queryParams.pageNum"
            v-model:limit="queryParams.pageSize"
            @pagination="handleQuery"
          />
        </div>
      </div>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialog.visible"
      title="上传文件"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="uploadDialog" label-width="80px">
        <el-form-item label="目标文件夹">
          <el-select
            v-model="uploadDialog.targetFolder"
            placeholder="选择文件夹"
            clearable
            style="width: 100%"
          >
            <el-option label="根目录" value="" />
            <el-option
              v-for="folder in folders"
              :key="folder.path"
              :label="folder.name"
              :value="folder.path"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="upload-container">
        <el-upload
          ref="uploadRef"
          drag
          multiple
          :auto-upload="false"
          :file-list="uploadDialog.fileList"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
        >
          <div class="upload-area">
            <el-icon class="upload-icon"><UploadFilled /></el-icon>
            <div class="upload-text">
              将图片拖拽到此处，
              <br />
              或
              <em>点击选择文件</em>
            </div>
            <div class="upload-tip">
              支持 JPG、PNG、GIF、WebP、BMP、SVG 格式，单个文件不超过 10MB
            </div>
          </div>
        </el-upload>
      </div>

      <template #footer>
        <el-button @click="uploadDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUploadSubmit">
          开始上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewDialog.visible" title="文件预览" width="800px">
      <div v-if="isImage(previewDialog.fileType)" class="preview-container">
        <el-image :src="previewDialog.url" fit="contain" style=" width: 100%;max-height: 600px" />
      </div>
      <div v-else class="preview-no-support">
        <el-icon :size="100"><Document /></el-icon>
        <p class="mt-4">该文件类型不支持预览</p>
        <el-link :href="previewDialog.url" target="_blank" type="primary">点击下载查看</el-link>
      </div>
    </el-dialog>

    <!-- 新建文件夹对话框 -->
    <el-dialog v-model="folderDialog.visible" title="新建文件夹" width="400px">
      <el-form :model="folderDialog" label-width="80px">
        <el-form-item label="文件夹名">
          <el-input v-model="folderDialog.name" placeholder="请输入文件夹名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="folderDialog.loading" @click="handleFolderSubmit">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import FileManageAPI, { type FilePageQuery, type FileVO, type FolderVO } from "@/api/file-api";
import { Loading } from "@element-plus/icons-vue";

defineOptions({
  name: "FileManage",
  inheritAttrs: false,
});

const uploadRef = ref();
const loading = ref(false);
const uploading = ref(false);
const total = ref(0);
const viewMode = ref<"grid" | "list">("grid");
const viewSize = ref("multi");
const currentFolder = ref("");
const selectedFiles = ref<number[]>([]);

const queryParams = reactive<FilePageQuery & { folder?: string }>({
  pageNum: 1,
  pageSize: 20,
  keyword: "",
  status: 1,
  folder: "",
});

const fileList = ref<FileVO[]>([]);
const folders = ref<FolderVO[]>([]);
const stats = ref({
  totalFiles: 0,
  totalSize: 0,
  totalSizeReadable: "0 B",
  orphanFiles: 0,
  orphanSize: 0,
  orphanSizeReadable: "0 B",
  byFileType: [],
});

const uploadDialog = reactive({
  visible: false,
  fileList: [] as any[],
  targetFolder: "",
});

const previewDialog = reactive({
  visible: false,
  url: "",
  fileType: "",
});

const folderDialog = reactive({
  visible: false,
  name: "",
  loading: false,
});

/** 判断是否为图片 */
function isImage(fileType: string): boolean {
  return fileType?.startsWith("image/") || false;
}

/** 格式化文件大小 */
function formatFileSize(size: number): string {
  if (!size || size === 0) return "0 B";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + " KB";
  if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + " MB";
  return (size / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

/** 格式化日期 */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** 查询文件列表 */
function handleQuery() {
  loading.value = true;
  const params = { ...queryParams, folder: currentFolder.value };

  FileManageAPI.getPageByFolder(params)
    .then((data: any) => {
      // 响应格式: { data: [...], total, page, size }
      fileList.value = data?.data || [];
      total.value = data?.total || 0;
    })
    .catch((error) => {
      console.error("Failed to load files:", error);
      fileList.value = [];
      total.value = 0;
    })
    .finally(() => {
      loading.value = false;
    });
}

/** 加载统计数据 */
function loadStats() {
  FileManageAPI.getStats()
    .then((data) => {
      if (data) {
        stats.value = data;
      }
    })
    .catch((error) => {
      console.error("Failed to load stats:", error);
    });
}

/** 加载文件夹列表 */
function loadFolders() {
  FileManageAPI.getFolders()
    .then((data) => {
      folders.value = data || [];
    })
    .catch((error) => {
      console.error("Failed to load folders:", error);
      folders.value = [];
    });
}

/** 点击文件夹 */
function handleFolderClick(folderPath: string) {
  currentFolder.value = folderPath;
  queryParams.pageNum = 1;
  handleQuery();
}

/** 文件夹右键菜单 */
function handleFolderContextMenu(event: MouseEvent, folder: FolderVO) {
  // 可以扩展右键菜单功能
  ElMessageBox.confirm(`确认删除文件夹【${folder.name}】吗？`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    FileManageAPI.deleteFolder(folder.path).then(() => {
      ElMessage.success("删除成功");
      loadFolders();
      if (currentFolder.value === folder.path) {
        currentFolder.value = "";
        handleQuery();
      }
    });
  });
}

/** 打开创建文件夹对话框 */
function handleCreateFolder() {
  folderDialog.visible = true;
  folderDialog.name = "";
}

/** 提交创建文件夹 */
function handleFolderSubmit() {
  if (!folderDialog.name.trim()) {
    ElMessage.warning("请输入文件夹名称");
    return;
  }

  folderDialog.loading = true;
  FileManageAPI.createFolder(folderDialog.name.trim())
    .then(() => {
      ElMessage.success("创建成功");
      folderDialog.visible = false;
      loadFolders();
    })
    .finally(() => {
      folderDialog.loading = false;
    });
}

/** 切换文件选择 */
function toggleFileSelection(fileId: number) {
  const index = selectedFiles.value.indexOf(fileId);
  if (index > -1) {
    selectedFiles.value.splice(index, 1);
  } else {
    selectedFiles.value.push(fileId);
  }
}

/** 表格选择变化 */
function handleSelectionChange(selection: FileVO[]) {
  selectedFiles.value = selection.map((item) => item.id);
}

/** 打开上传对话框 */
function handleUploadDialog() {
  uploadDialog.visible = true;
  uploadDialog.fileList = [];
  uploadDialog.targetFolder = currentFolder.value;
}

/** 文件选择 */
function handleFileChange(file: any, fileList: any[]) {
  uploadDialog.fileList = fileList;
}

/** 移除文件 */
function handleFileRemove(file: any, fileList: any[]) {
  uploadDialog.fileList = fileList;
}

/** 提交上传 */
function handleUploadSubmit() {
  if (uploadDialog.fileList.length === 0) {
    ElMessage.warning("请选择文件");
    return;
  }

  uploading.value = true;

  // 依次上传所有文件
  const uploadPromises = uploadDialog.fileList.map((fileItem) => {
    const formData = new FormData();
    formData.append("file", fileItem.raw);
    if (uploadDialog.targetFolder) {
      formData.append("folder", uploadDialog.targetFolder);
    }
    return FileManageAPI.upload(formData);
  });

  Promise.all(uploadPromises)
    .then(() => {
      ElMessage.success(`成功上传 ${uploadDialog.fileList.length} 个文件`);
      uploadDialog.visible = false;
      handleQuery();
      loadStats();
      loadFolders();
    })
    .catch(() => {
      ElMessage.error("部分文件上传失败");
    })
    .finally(() => {
      uploading.value = false;
    });
}

/** 预览文件 */
function handlePreview(row: FileVO) {
  previewDialog.url = row.url;
  previewDialog.fileType = row.fileType;
  previewDialog.visible = true;
}

/** 下载文件 */
function handleDownload(row: FileVO) {
  window.open(row.url, "_blank");
}

/** 删除文件 */
function handleDelete(row: FileVO) {
  ElMessageBox.confirm(`确认删除文件【${row.fileName}】吗?`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    FileManageAPI.deleteById(row.id).then(() => {
      ElMessage.success("删除成功");
      handleQuery();
      loadStats();
    });
  });
}

/** 批量删除 */
function handleBatchDelete() {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning("请选择要删除的文件");
    return;
  }

  ElMessageBox.confirm(
    `确认删除选中的 ${selectedFiles.value.length} 个文件吗？此操作不可恢复！`,
    "警告",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  ).then(() => {
    const deletePromises = selectedFiles.value.map((id) => FileManageAPI.deleteById(id));

    Promise.all(deletePromises)
      .then(() => {
        ElMessage.success("批量删除成功");
        selectedFiles.value = [];
        handleQuery();
        loadStats();
      })
      .catch(() => {
        ElMessage.error("部分文件删除失败");
      });
  });
}

onMounted(() => {
  handleQuery();
  loadStats();
  loadFolders();
});
</script>

<style scoped lang="scss">
.upload-container {
  .upload-area {
    padding: 40px;
    text-align: center;

    .upload-icon {
      margin-bottom: 16px;
      font-size: 67px;
      color: #409eff;
    }

    .upload-text {
      margin-bottom: 12px;
      font-size: 16px;
      line-height: 1.8;
      color: #606266;

      em {
        font-style: normal;
        color: #409eff;
      }
    }

    .upload-tip {
      font-size: 12px;
      color: #909399;
    }
  }
}

.preview-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-no-support {
  padding: 40px;
  text-align: center;

  .el-icon {
    color: #c0c4cc;
  }

  p {
    margin: 16px 0;
    color: #909399;
  }
}

.file-manage-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  background: #f5f7fa;

  .file-manage-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 30px;
    color: white;
    background: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .header-title {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 500;
      }

      .file-count {
        font-size: 14px;
        opacity: 0.9;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;

      :deep(.el-button--primary.is-plain) {
        color: var(--el-color-primary);
        background: rgba(255, 255, 255, 0.9);
        border-color: rgba(255, 255, 255, 0.3);

        &:hover {
          background: white;
        }
      }

      :deep(.el-button--primary:not(.is-plain)) {
        color: var(--el-color-primary);
        background: white;
        border-color: white;

        &:hover {
          background: rgba(255, 255, 255, 0.9);
        }
      }

      :deep(.el-button--danger) {
        color: white;
        background: var(--el-color-danger);
        border-color: var(--el-color-danger);
      }
    }
  }

  .file-manage-content {
    display: flex;
    flex: 1;
    overflow: hidden;

    .sidebar {
      display: flex;
      flex-direction: column;
      width: 240px;
      background: white;
      border-right: 1px solid #e4e7ed;

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid #e4e7ed;

        h3 {
          margin: 0;
          font-size: 16px;
          color: #303133;
        }
      }

      .category-list {
        padding: 8px;

        .category-item {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          margin-bottom: 4px;
          color: #606266;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.3s;

          .el-icon {
            margin-right: 8px;
            font-size: 18px;
          }

          span:nth-child(2) {
            flex: 1;
          }

          .count {
            padding: 2px 8px;
            font-size: 12px;
            color: #909399;
            background: #f5f7fa;
            border-radius: 10px;
          }

          &:hover {
            color: #409eff;
            background: #f5f7fa;
          }

          &.active {
            color: white;
            background: var(--el-color-primary);

            .count {
              color: white;
              background: rgba(255, 255, 255, 0.2);
            }
          }
        }
      }
    }

    .main-content {
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: hidden;

      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        background: white;
        border-bottom: 1px solid #e4e7ed;

        .toolbar-left {
          :deep(.el-button-group) {
            .el-button {
              padding: 8px 15px;
            }
          }
        }

        .toolbar-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }
      }

      .grid-view {
        position: relative;
        display: grid;
        flex: 1;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
        align-content: start;
        padding: 20px;
        overflow-y: auto;

        .grid-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          color: var(--el-color-primary);
          transform: translate(-50%, -50%);

          .is-loading {
            animation: rotating 2s linear infinite;
          }
        }

        .empty-state {
          display: flex;
          grid-column: 1 / -1;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        @keyframes rotating {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .file-card {
          overflow: hidden;
          cursor: pointer;
          background: white;
          border: 2px solid transparent;
          border-radius: 8px;
          transition: all 0.3s;

          .file-preview {
            position: relative;
            width: 100%;
            padding-top: 100%;
            overflow: hidden;
            background: #f5f7fa;

            .preview-image,
            .file-icon {
              position: absolute;
              top: 0;
              left: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
            }

            .file-icon {
              color: #909399;
            }

            .image-error {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
              color: #c0c4cc;
            }

            .file-checkbox {
              position: absolute;
              top: 8px;
              left: 8px;
              z-index: 10;

              :deep(.el-checkbox__inner) {
                border-color: white;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
            }
          }

          .file-info {
            padding: 12px;

            .file-name {
              margin-bottom: 8px;
              overflow: hidden;
              text-overflow: ellipsis;
              font-size: 14px;
              color: #303133;
              white-space: nowrap;
            }

            .file-meta {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #909399;
            }
          }

          .file-actions {
            display: flex;
            gap: 8px;
            padding: 0 12px 12px;
            opacity: 0;
            transition: opacity 0.3s;

            .el-button {
              flex: 1;
              padding: 4px 0;
            }
          }

          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(-4px);

            .file-actions {
              opacity: 1;
            }
          }

          &.selected {
            background: #ecf5ff;
            border-color: #409eff;
          }
        }
      }

      .list-view {
        flex: 1;
        padding: 20px;
        overflow: auto;
        background: white;
      }

      .pagination-container {
        padding: 16px 20px;
        background: white;
        border-top: 1px solid #e4e7ed;
      }
    }
  }
}
</style>
