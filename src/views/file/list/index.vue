<template>
  <div class="app-container">
    <!-- 工具栏 -->
    <div class="search-bar">
      <div class="search-bar-left">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索文件..."
          clearable
          style="width: 280px"
          @keyup.enter="handleQuery"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="search-bar-right">
        <el-button
          v-if="selectedFiles.length > 0"
          type="danger"
          icon="Delete"
          @click="handleBatchDelete"
        >
          删除 ({{ selectedFiles.length }})
        </el-button>
        <el-button icon="FolderAdd" @click="handleCreateFolder">新建文件夹</el-button>
        <el-button type="primary" icon="Upload" @click="handleUploadDialog">上传文件</el-button>
        <el-divider direction="vertical" />
        <el-radio-group v-model="viewMode">
          <el-radio-button value="grid">
            <el-icon><Grid /></el-icon>
          </el-radio-button>
          <el-radio-button value="list">
            <el-icon><List /></el-icon>
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="file-content">
      <!-- 左侧目录树 -->
      <el-card class="sidebar-card" shadow="never">
        <template #header>
          <div class="sidebar-header">
            <span>文件夹</span>
            <el-button icon="Refresh" link @click="loadFolders" />
          </div>
        </template>
        <el-scrollbar height="calc(100vh - 280px)">
          <div class="folder-list">
            <div
              :class="['folder-item', { active: !currentFolder }]"
              @click="handleFolderClick('')"
            >
              <el-icon><Folder /></el-icon>
              <span class="folder-name">全部文件</span>
              <el-tag size="small" type="info">{{ stats.totalFiles }}</el-tag>
            </div>
            <div
              v-for="folder in folders"
              :key="folder.path"
              :class="['folder-item', { active: currentFolder === folder.path }]"
              @click="handleFolderClick(folder.path)"
              @contextmenu.prevent="handleFolderContextMenu($event, folder)"
            >
              <el-icon><FolderOpened /></el-icon>
              <span class="folder-name">{{ folder.name }}</span>
              <el-tag size="small" type="info">{{ folder.fileCount }}</el-tag>
            </div>
          </div>
        </el-scrollbar>
      </el-card>

      <!-- 右侧文件列表 -->
      <el-card class="main-card" shadow="never">
        <template #header>
          <div class="main-header">
            <div class="header-left">
              <span class="current-path">
                <el-icon><Folder /></el-icon>
                {{ currentFolder || "全部文件" }}
              </span>
              <span class="file-count">{{ total }} 个文件</span>
            </div>
          </div>
        </template>

        <div class="content-wrapper">
          <!-- 网格视图 -->
          <div v-if="viewMode === 'grid'" v-loading="loading" class="grid-view">
            <template v-if="fileList.length > 0">
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
                    <el-icon :size="48"><Document /></el-icon>
                  </div>
                  <el-checkbox
                    :model-value="selectedFiles.includes(file.id)"
                    class="file-checkbox"
                    @click.stop
                    @change="(checked) => handleCheckboxChange(file.id, checked as boolean)"
                  />
                </div>
                <div class="file-info">
                  <div class="file-name" :title="file.fileName">{{ file.fileName }}</div>
                  <div class="file-meta">
                    <span>{{ formatFileSize(file.fileSize) }}</span>
                    <span class="meta-divider">·</span>
                    <span>{{ formatDate(file.createTime) }}</span>
                  </div>
                </div>
                <div class="file-actions">
                  <el-button type="primary" link size="small" @click.stop="handlePreview(file)">
                    预览
                  </el-button>
                  <el-button type="success" link size="small" @click.stop="handleDownload(file)">
                    下载
                  </el-button>
                  <el-button
                    v-hasPerm="['file:delete']"
                    type="danger"
                    link
                    size="small"
                    @click.stop="handleDelete(file)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </template>
            <el-empty v-else description="暂无文件" />
          </div>

          <!-- 列表视图 -->
          <div v-else v-loading="loading" class="list-view">
            <el-table :data="fileList" @selection-change="handleSelectionChange">
              <el-table-column type="selection" width="50" align="center" />
              <el-table-column label="预览" width="80" align="center">
                <template #default="{ row }">
                  <el-image
                    v-if="isImage(row.fileType)"
                    :src="row.url"
                    fit="cover"
                    style="width: 48px; height: 48px; border-radius: 6px"
                    lazy
                  >
                    <template #error>
                      <div class="table-image-error">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <el-icon v-else :size="28" color="#909399"><Document /></el-icon>
                </template>
              </el-table-column>
              <el-table-column
                label="文件名"
                prop="fileName"
                min-width="200"
                show-overflow-tooltip
              />
              <el-table-column label="大小" width="100" align="center">
                <template #default="{ row }">
                  {{ formatFileSize(row.fileSize) }}
                </template>
              </el-table-column>
              <el-table-column label="上传时间" width="160" align="center">
                <template #default="{ row }">
                  {{ formatDate(row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" fixed="right" width="180" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="handlePreview(row)">
                    预览
                  </el-button>
                  <el-button type="success" link size="small" @click="handleDownload(row)">
                    下载
                  </el-button>
                  <el-button
                    v-hasPerm="['file:delete']"
                    type="danger"
                    link
                    size="small"
                    @click="handleDelete(row)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 分页 -->
        <pagination
          v-if="total > 0"
          v-model:total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="handleQuery"
        />
      </el-card>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialog.visible"
      title="上传文件"
      width="650px"
      :close-on-click-modal="false"
      class="upload-dialog"
    >
      <div class="upload-dialog-content">
        <!-- 目标文件夹选择 -->
        <div class="folder-selector">
          <span class="selector-label">上传到：</span>
          <el-select
            v-model="uploadDialog.targetFolder"
            placeholder="选择目标文件夹"
            clearable
            style="flex: 1"
          >
            <el-option label="根目录（默认按日期存储）" value="" />
            <el-option
              v-for="folder in folders"
              :key="folder.path"
              :label="folder.name"
              :value="folder.path"
            >
              <div style="display: flex; gap: 8px; align-items: center">
                <el-icon><FolderOpened /></el-icon>
                <span>{{ folder.name }}</span>
              </div>
            </el-option>
          </el-select>
        </div>

        <!-- 上传区域 -->
        <div class="upload-container">
          <el-upload
            ref="uploadRef"
            drag
            multiple
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileChange"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
          >
            <div class="upload-area">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <div class="upload-text">
                将文件拖拽到此处，或
                <em>点击选择文件</em>
              </div>
              <div class="upload-tip">支持图片、文档、压缩包等格式，单个文件不超过 10MB</div>
            </div>
          </el-upload>
        </div>

        <!-- 已选文件列表 -->
        <div v-if="uploadDialog.fileList.length > 0" class="selected-files">
          <div class="files-header">
            <span>已选择 {{ uploadDialog.fileList.length }} 个文件</span>
            <el-button type="danger" link size="small" @click="clearUploadFiles">
              清空列表
            </el-button>
          </div>
          <el-scrollbar max-height="200px">
            <div class="file-list">
              <div v-for="(file, index) in uploadDialog.fileList" :key="index" class="file-item">
                <div class="file-item-preview">
                  <el-image
                    v-if="file.raw?.type?.startsWith('image/')"
                    :src="getFilePreviewUrl(file)"
                    fit="cover"
                  />
                  <el-icon v-else :size="24"><Document /></el-icon>
                </div>
                <div class="file-item-info">
                  <div class="file-item-name" :title="file.name">{{ file.name }}</div>
                  <div class="file-item-size">{{ formatFileSize(file.size) }}</div>
                </div>
                <el-icon class="file-item-remove" @click="removeUploadFile(index)">
                  <Close />
                </el-icon>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="uploadDialog.visible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="uploading"
            :disabled="uploadDialog.fileList.length === 0"
            @click="handleUploadSubmit"
          >
            <el-icon v-if="!uploading"><Upload /></el-icon>
            {{ uploading ? "上传中..." : `上传 ${uploadDialog.fileList.length} 个文件` }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog v-model="previewDialog.visible" title="文件预览" width="800px">
      <div v-if="isImage(previewDialog.fileType)" class="preview-container">
        <el-image :src="previewDialog.url" fit="contain" style="width: 100%; max-height: 600px" />
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
import FileManageAPI, {
  type FilePageQuery,
  type FileVO,
  type FolderVO,
  type FileStorageStatsVO,
} from "@/api/file-api";
import { Close, Upload } from "@element-plus/icons-vue";

defineOptions({
  name: "FileManage",
  inheritAttrs: false,
});

const uploadRef = ref();
const loading = ref(false);
const uploading = ref(false);
const total = ref(0);
const viewMode = ref<"grid" | "list">("grid");
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
const stats = ref<FileStorageStatsVO>({
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

/** 复选框变化 */
function handleCheckboxChange(fileId: number, checked: boolean) {
  if (checked) {
    if (!selectedFiles.value.includes(fileId)) {
      selectedFiles.value.push(fileId);
    }
  } else {
    const index = selectedFiles.value.indexOf(fileId);
    if (index > -1) {
      selectedFiles.value.splice(index, 1);
    }
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
function handleFileChange(file: any) {
  // 检查文件大小
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning(`文件 ${file.name} 超过 10MB 限制`);
    return;
  }
  uploadDialog.fileList.push(file);
}

/** 获取文件预览URL */
function getFilePreviewUrl(file: any): string {
  if (file.raw) {
    return URL.createObjectURL(file.raw);
  }
  return "";
}

/** 移除单个文件 */
function removeUploadFile(index: number) {
  uploadDialog.fileList.splice(index, 1);
}

/** 清空文件列表 */
function clearUploadFiles() {
  uploadDialog.fileList = [];
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
      loadFolders();
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
        loadFolders();
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
    padding: 30px 40px;
    text-align: center;

    .upload-icon {
      margin-bottom: 12px;
      font-size: 48px;
      color: #409eff;
    }

    .upload-text {
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.6;
      color: #606266;

      em {
        font-style: normal;
        color: #409eff;
        cursor: pointer;
      }
    }

    .upload-tip {
      font-size: 12px;
      color: #909399;
    }
  }
}

.upload-dialog-content {
  .folder-selector {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;

    .selector-label {
      flex-shrink: 0;
      font-size: 14px;
      font-weight: 500;
      color: #606266;
    }
  }

  .selected-files {
    padding: 12px;
    margin-top: 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .files-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 8px;
      margin-bottom: 12px;
      font-size: 13px;
      font-weight: 500;
      color: #606266;
      border-bottom: 1px solid #e4e7ed;
    }

    .file-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .file-item {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 8px 12px;
      background: white;
      border-radius: 6px;
      transition: all 0.2s;

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        .file-item-remove {
          opacity: 1;
        }
      }

      .file-item-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        overflow: hidden;
        background: #f5f7fa;
        border-radius: 4px;

        .el-image {
          width: 100%;
          height: 100%;
        }

        .el-icon {
          color: #909399;
        }
      }

      .file-item-info {
        flex: 1;
        min-width: 0;

        .file-item-name {
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 13px;
          color: #303133;
          white-space: nowrap;
        }

        .file-item-size {
          margin-top: 2px;
          font-size: 12px;
          color: #909399;
        }
      }

      .file-item-remove {
        padding: 4px;
        font-size: 14px;
        color: #909399;
        cursor: pointer;
        opacity: 0;
        transition: all 0.2s;

        &:hover {
          color: #f56c6c;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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
  background: linear-gradient(180deg, #f5f5f7 0%, #ffffff 100%);
}

// 新布局样式 - Apple 风格
.app-container {
  min-height: calc(100vh - 130px);
  padding: 20px;
  background: linear-gradient(180deg, #f5f5f7 0%, #fafafa 100%);

  .search-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .search-bar-left {
      display: flex;
      align-items: center;
    }

    .search-bar-right {
      display: flex;
      gap: 12px;
      align-items: center;

      .el-divider--vertical {
        height: 20px;
        margin: 0 4px;
      }
    }
  }

  .file-content {
    display: flex;
    gap: 20px;
    height: calc(100vh - 190px);
  }

  .sidebar-card {
    flex-shrink: 0;
    width: 220px;
    background: rgba(255, 255, 255, 0.8);
    border: none;
    border-radius: 12px;
    backdrop-filter: blur(20px);

    :deep(.el-card__header) {
      padding: 14px 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    :deep(.el-card__body) {
      padding: 8px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      font-weight: 600;
      color: #1d1d1f;
      letter-spacing: -0.01em;
    }

    .folder-list {
      padding: 0;
    }

    .folder-item {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      margin-bottom: 2px;
      font-size: 13px;
      color: #1d1d1f;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.15s ease;

      .el-icon {
        font-size: 16px;
        color: #86868b;
      }

      .folder-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .el-tag {
        height: 18px;
        padding: 0 6px;
        font-size: 11px;
        line-height: 18px;
        color: #86868b;
        background: rgba(0, 0, 0, 0.05);
        border: none;
        border-radius: 9px;
      }

      &:hover {
        background: rgba(0, 0, 0, 0.04);
      }

      &.active {
        color: white;
        background: #007aff;

        .el-icon {
          color: white;
        }

        .el-tag {
          color: white;
          background: rgba(255, 255, 255, 0.25);
        }
      }
    }
  }

  .main-card {
    flex: 1;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 12px;
    backdrop-filter: blur(20px);

    :deep(.el-card__header) {
      padding: 14px 20px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    :deep(.el-card__body) {
      padding: 16px;
    }

    .content-wrapper {
      height: calc(100vh - 340px);
      overflow-y: auto;
    }

    .main-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .header-left {
        display: flex;
        gap: 10px;
        align-items: center;

        .current-path {
          display: flex;
          gap: 6px;
          align-items: center;
          font-size: 13px;
          font-weight: 600;
          color: #1d1d1f;
          letter-spacing: -0.01em;

          .el-icon {
            color: #86868b;
          }
        }

        .file-count {
          font-size: 12px;
          color: #86868b;
        }
      }
    }

    .grid-view {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
      align-content: start;
      padding: 4px;
    }

    .list-view {
      :deep(.el-table) {
        border-radius: 8px;
      }
    }

    .table-image-error {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      color: #86868b;
      background: #f5f5f7;
      border-radius: 8px;
    }
  }

  .file-card {
    overflow: hidden;
    cursor: pointer;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);

      .file-actions {
        opacity: 1;
      }
    }

    &.selected {
      box-shadow:
        0 0 0 2px #007aff,
        0 4px 12px rgba(0, 122, 255, 0.2);
    }

    .file-preview {
      position: relative;
      width: 100%;
      padding-top: 100%;
      overflow: hidden;
      background: #f5f5f7;

      .preview-image,
      :deep(.el-image) {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      :deep(.el-image__inner) {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .file-icon {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: #86868b;
      }

      .image-error {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        color: #86868b;
        background: #f5f5f7;
      }

      .file-checkbox {
        position: absolute;
        top: 8px;
        left: 8px;
        z-index: 10;

        :deep(.el-checkbox__inner) {
          width: 18px;
          height: 18px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        :deep(.el-checkbox__inner::after) {
          top: 3px;
          left: 6px;
        }
      }
    }

    .file-info {
      padding: 10px 12px 8px;

      .file-name {
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 12px;
        font-weight: 500;
        color: #1d1d1f;
        letter-spacing: -0.01em;
        white-space: nowrap;
      }

      .file-meta {
        display: flex;
        align-items: center;
        font-size: 11px;
        color: #86868b;

        .meta-divider {
          margin: 0 4px;
        }
      }
    }

    .file-actions {
      display: flex;
      gap: 2px;
      justify-content: center;
      padding: 0 8px 10px;
      opacity: 0;
      transition: opacity 0.15s ease;

      .el-button {
        padding: 4px 8px;
        font-size: 12px;
      }
    }
  }
}
</style>
