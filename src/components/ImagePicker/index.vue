<!-- 图片选择器组件 - 从文件管理中选择图片 -->
<template>
  <div class="image-picker">
    <!-- 已选择的图片预览 -->
    <div v-if="modelValue" class="image-preview" :style="previewStyle">
      <el-image
        :src="modelValue"
        :preview-src-list="[modelValue]"
        fit="contain"
        class="preview-image"
      />
      <div class="image-actions">
        <el-button type="primary" link size="small" @click="handleOpenPicker">
          <el-icon><Edit /></el-icon>
          更换
        </el-button>
        <el-button type="danger" link size="small" @click="handleClear">
          <el-icon><Delete /></el-icon>
          移除
        </el-button>
      </div>
    </div>
    <!-- 未选择时显示选择按钮 -->
    <div v-else class="picker-trigger" :style="previewStyle" @click="handleOpenPicker">
      <el-icon class="picker-icon"><Plus /></el-icon>
      <span class="picker-text">选择图片</span>
    </div>

    <!-- 图片选择弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      title="选择图片"
      width="900px"
      :close-on-click-modal="false"
      append-to-body
    >
      <!-- 搜索和筛选 -->
      <div class="picker-toolbar">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索文件名"
          style="width: 200px"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="queryParams.folder"
          placeholder="选择文件夹"
          clearable
          style="width: 150px"
          @change="handleSearch"
        >
          <el-option label="全部文件夹" value="" />
          <el-option
            v-for="folder in folders"
            :key="folder.path"
            :label="folder.name"
            :value="folder.path"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <!-- 图片列表 -->
      <div v-loading="loading" class="image-grid">
        <div
          v-for="file in fileList"
          :key="file.id"
          class="image-item"
          :class="{ selected: selectedUrl === file.url }"
          @click="handleSelect(file)"
        >
          <el-image :src="file.url" fit="cover" class="image-thumbnail">
            <template #error>
              <div class="image-error">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="image-name" :title="file.fileName">{{ file.fileName }}</div>
          <div v-if="selectedUrl === file.url" class="selected-mark">
            <el-icon><Select /></el-icon>
          </div>
        </div>
        <el-empty v-if="fileList.length === 0 && !loading" description="暂无图片" />
      </div>

      <!-- 分页 -->
      <div class="picker-pagination">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[12, 24, 36, 48]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedUrl" @click="handleConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from "vue";
import FileManageAPI, { type FileVO, type FolderVO } from "@/api/file-api";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    width?: number | string;
    height?: number | string;
  }>(),
  {
    width: 120,
    height: 80,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | undefined): void;
}>();

// 计算预览区域样式
const previewStyle = computed(() => {
  const w = typeof props.width === "number" ? `${props.width}px` : props.width;
  const h = typeof props.height === "number" ? `${props.height}px` : props.height;
  return {
    width: w,
    height: h,
  };
});

const dialogVisible = ref(false);
const loading = ref(false);
const fileList = ref<FileVO[]>([]);
const folders = ref<FolderVO[]>([]);
const total = ref(0);
const selectedUrl = ref("");

const queryParams = reactive({
  pageNum: 1,
  pageSize: 12,
  keyword: "",
  folder: "",
});

// 打开选择器
function handleOpenPicker() {
  dialogVisible.value = true;
  selectedUrl.value = props.modelValue || "";
  loadFolders();
  handleQuery();
}

// 加载文件夹列表
async function loadFolders() {
  try {
    const data = await FileManageAPI.getFolders();
    folders.value = data || [];
  } catch (error) {
    console.error("加载文件夹失败", error);
  }
}

// 查询图片列表
async function handleQuery() {
  loading.value = true;
  try {
    const data = await FileManageAPI.getImages(queryParams);
    fileList.value = data?.data || [];
    total.value = data?.total || 0;
  } catch (error) {
    console.error("加载图片失败", error);
    fileList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// 搜索
function handleSearch() {
  queryParams.pageNum = 1;
  handleQuery();
}

// 选择图片
function handleSelect(file: FileVO) {
  selectedUrl.value = file.url;
}

// 确认选择
function handleConfirm() {
  emit("update:modelValue", selectedUrl.value);
  dialogVisible.value = false;
}

// 清除选择
function handleClear() {
  emit("update:modelValue", undefined);
}

// 监听弹窗关闭重置状态
watch(dialogVisible, (val) => {
  if (!val) {
    queryParams.keyword = "";
    queryParams.folder = "";
    queryParams.pageNum = 1;
  }
});
</script>

<style lang="scss" scoped>
.image-picker {
  display: inline-block;
}

.image-preview {
  position: relative;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;

  .preview-image {
    width: 100%;
    height: 100%;
  }

  .image-actions {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    gap: 4px;
    justify-content: center;
    padding: 4px;
    background: rgba(0, 0, 0, 0.6);
    opacity: 0;
    transition: opacity 0.3s;

    .el-button {
      padding: 2px 6px;
      font-size: 12px;
      color: #fff;
    }
  }

  &:hover .image-actions {
    opacity: 1;
  }
}

.picker-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--el-fill-color-lighter);
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  transition: all 0.3s;

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }

  .picker-icon {
    font-size: 24px;
    color: var(--el-text-color-placeholder);
  }

  .picker-text {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}

.picker-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  min-height: 300px;
  max-height: 400px;
  padding: 4px;
  overflow-y: auto;
}

.image-item {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  &.selected {
    border-color: var(--el-color-primary);
  }

  .image-thumbnail {
    width: 100%;
    height: 120px;
    background: var(--el-fill-color-lighter);
  }

  .image-name {
    padding: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    color: var(--el-text-color-regular);
    text-align: center;
    white-space: nowrap;
  }

  .selected-mark {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    font-size: 14px;
    color: white;
    background: var(--el-color-primary);
    border-radius: 50%;
  }

  .image-error {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 120px;
    font-size: 32px;
    color: var(--el-text-color-placeholder);
    background: var(--el-fill-color-lighter);
  }
}

.picker-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
