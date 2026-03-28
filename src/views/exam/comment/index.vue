<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" icon="Plus" @click="handleCreate"><b>新增评论</b></el-button>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="queryParams.keywords"
            placeholder="评论内容/用户邮箱/昵称"
            clearable
            style="width: 220px; margin-right: 8px"
            @keyup.enter="handleSearch"
          />
          <el-select
            v-model="queryParams.type"
            placeholder="评论类型"
            clearable
            style="width: 120px; margin-right: 8px"
            @change="handleQuery"
          >
            <el-option label="真实用户" :value="0" />
            <el-option label="虚拟评论" :value="1" />
          </el-select>
          <el-button type="primary" icon="Search" @click="handleSearch" />
          <el-button icon="Refresh" @click="handleReset" />
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        header-cell-class-name="table-header"
        stripe
      >
        <el-table-column label="序号" width="60" align="center">
          <template #default="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="科目" prop="subjectName" min-width="200" />
        <el-table-column label="评论内容" prop="content" min-width="200" show-overflow-tooltip />
        <el-table-column label="用户" min-width="160">
          <template #default="scope">
            <div class="user-info">
              <el-avatar :size="24" :src="scope.row.userAvatar" icon="UserFilled" />
              <div class="user-detail">
                <span class="user-nickname">{{ scope.row.userNickname || "-" }}</span>
                <span class="user-email">{{ scope.row.userEmail || "-" }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.type === 0 ? 'primary' : 'warning'"
              size="small"
              effect="plain"
            >
              {{ scope.row.type === 0 ? "真实用户" : "虚拟评论" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="90" align="center">
          <template #default="scope">
            <div
              v-if="parseImages(scope.row.images).length > 0"
              class="image-thumb"
              @click="handlePreviewImages(scope.row)"
            >
              <el-image
                :src="parseImages(scope.row.images)[0]"
                fit="cover"
                style="width: 50px; height: 50px; cursor: pointer; border-radius: 4px"
              />
              <span v-if="parseImages(scope.row.images).length > 1" class="image-badge">
                {{ parseImages(scope.row.images).length }}
              </span>
            </div>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="管理员回复" prop="adminReply" min-width="160" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.adminReply">{{ scope.row.adminReply }}</span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="评论时间" width="170" align="center">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleReply(scope.row)">
              <b>{{ scope.row.adminReply ? "编辑回复" : "回复" }}</b>
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(scope.row)">
              <b>删除</b>
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <!-- 新增评论对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新增评论"
      width="580px"
      destroy-on-close
      @close="resetCreateForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="90px"
        class="create-form"
      >
        <!-- 供应商 -->
        <el-form-item label="供应商">
          <el-select
            v-model="selectedProviderId"
            placeholder="请选择供应商"
            clearable
            filterable
            style="width: 100%"
            @change="handleProviderChange"
          >
            <el-option
              v-for="p in providerOptions"
              :key="p.value"
              :label="p.label"
              :value="p.value"
            />
          </el-select>
        </el-form-item>

        <!-- 科目 -->
        <el-form-item label="科目" prop="subjectId">
          <el-select
            v-model="createForm.subjectId"
            placeholder="请选择科目"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="s in filteredSubjects"
              :key="s.id"
              :label="s.nameZh || s.nameEn"
              :value="s.id"
            />
          </el-select>
        </el-form-item>

        <!-- 评论内容 -->
        <el-form-item label="评论内容" prop="content">
          <el-input
            v-model="createForm.content"
            type="textarea"
            :rows="3"
            placeholder="请输入评论内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 用户邮箱 -->
        <el-form-item label="用户邮箱" prop="userEmail">
          <el-input v-model="createForm.userEmail" placeholder="请输入用户邮箱" />
        </el-form-item>

        <!-- 用户昵称 -->
        <el-form-item label="用户昵称" prop="userNickname">
          <el-input v-model="createForm.userNickname" disabled style="width: 200px">
            <template #append>
              <el-button style="padding: 0 12px" @click="regenerateNickname">
                <el-icon><RefreshRight /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <!-- 上传图片 -->
        <el-form-item label="上传图片">
          <el-upload
            v-model:file-list="uploadFileList"
            :action="uploadAction"
            :headers="uploadHeaders"
            list-type="picture-card"
            :limit="3"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            :on-remove="handleUploadRemove"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            class="compact-upload"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="form-tip">只能上传jpg/png格式图片，且不超过5MB，最多3张</div>
        </el-form-item>

        <!-- 管理员回复 -->
        <el-form-item label="管理员回复">
          <el-input
            v-model="createForm.adminReply"
            type="textarea"
            :rows="2"
            placeholder="请输入管理员回复内容（可选）"
            maxlength="300"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false"><b>取 消</b></el-button>
        <el-button type="primary" :loading="createLoading" @click="submitCreate">
          <b>确 定</b>
        </el-button>
      </template>
    </el-dialog>

    <!-- 回复对话框 -->
    <el-dialog v-model="replyDialogVisible" title="回复评论" width="500px">
      <div v-if="currentComment" class="reply-comment-info">
        <div class="comment-meta">
          <span class="comment-user">
            {{ currentComment.userNickname || currentComment.userEmail }}
          </span>
          <span class="comment-time">{{ formatDateTime(currentComment.createTime) }}</span>
        </div>
        <div class="comment-content">{{ currentComment.content }}</div>
      </div>
      <el-input
        v-model="replyForm.reply"
        type="textarea"
        :rows="4"
        placeholder="请输入回复内容"
        maxlength="500"
        show-word-limit
        style="margin-top: 16px"
      />
      <template #footer>
        <el-button @click="replyDialogVisible = false"><b>取消</b></el-button>
        <el-button type="primary" :loading="replyLoading" @click="submitReply">
          <b>确定</b>
        </el-button>
      </template>
    </el-dialog>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewImages"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type UploadFile,
  type UploadProps,
} from "element-plus";
import { Plus, RefreshRight } from "@element-plus/icons-vue";
import CommentAPI, {
  type CommentVO,
  type CommentPageQuery,
  type CreateVirtualCommentRequest,
} from "@/api/exam/comment-api";
import SubjectAPI, { type SubjectVO } from "@/api/exam/subject-api";
import ProviderAPI, { type ProviderOptionVO } from "@/api/exam/provider-api";
import { AuthStorage } from "@/utils/auth";

const loading = ref(false);
const tableData = ref<CommentVO[]>([]);
const total = ref(0);

const queryParams = reactive<CommentPageQuery>({
  pageNum: 1,
  pageSize: 20,
  keywords: undefined,
  type: undefined,
});

// 选项数据
const providerOptions = ref<ProviderOptionVO[]>([]);
const allSubjects = ref<SubjectVO[]>([]);
const selectedProviderId = ref<number | undefined>();

const filteredSubjects = computed(() => {
  if (!selectedProviderId.value) return allSubjects.value;
  return allSubjects.value.filter((s) => s.providerId === selectedProviderId.value);
});

// 新增评论
const createDialogVisible = ref(false);
const createLoading = ref(false);
const createFormRef = ref<FormInstance>();
const uploadFileList = ref<UploadFile[]>([]);
const uploadedImageUrls = ref<string[]>([]);

const uploadAction = computed(() => `${import.meta.env.VITE_APP_BASE_API}/v1/files/upload`);
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${AuthStorage.getAccessToken()}`,
}));

const createForm = reactive({
  subjectId: "",
  content: "",
  userEmail: "",
  userNickname: generateNickname(),
  adminReply: "",
});

const createRules = {
  subjectId: [{ required: true, message: "请选择科目", trigger: "change" }],
  content: [{ required: true, message: "评论内容不能为空", trigger: "blur" }],
  userEmail: [{ required: true, message: "用户邮箱不能为空", trigger: "blur" }],
};

// 回复
const replyDialogVisible = ref(false);
const replyLoading = ref(false);
const currentComment = ref<CommentVO | null>(null);
const replyForm = reactive({ reply: "" });

// 图片预览
const previewVisible = ref(false);
const previewImages = ref<string[]>([]);
const previewIndex = ref(0);

onMounted(() => {
  fetchData();
  loadOptions();
});

function generateNickname(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return "User" + suffix;
}

function regenerateNickname() {
  createForm.userNickname = generateNickname();
}

function handleProviderChange() {
  createForm.subjectId = "";
}

async function loadOptions() {
  const [providers, subjects] = await Promise.all([
    ProviderAPI.getOptions(),
    SubjectAPI.getPage({ pageNum: 1, pageSize: 1000, status: 1 }),
  ]);
  providerOptions.value = providers;
  allSubjects.value = subjects.data;
}

async function fetchData() {
  loading.value = true;
  try {
    const data = await CommentAPI.getPage(queryParams);
    tableData.value = data.data;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.pageNum = 1;
  fetchData();
}

function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

function handleReset() {
  queryParams.keywords = undefined;
  queryParams.type = undefined;
  queryParams.pageNum = 1;
  queryParams.pageSize = 20;
  fetchData();
}

function parseImages(images?: string): string[] {
  if (!images || images === "[]") return [];
  try {
    return JSON.parse(images);
  } catch {
    return [];
  }
}

function handlePreviewImages(row: CommentVO) {
  const imgs = parseImages(row.images);
  if (imgs.length > 0) {
    previewImages.value = imgs;
    previewIndex.value = 0;
    previewVisible.value = true;
  }
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function handleCreate() {
  createForm.userNickname = generateNickname();
  selectedProviderId.value = undefined;
  createDialogVisible.value = true;
}

const beforeUpload: UploadProps["beforeUpload"] = (rawFile) => {
  const allowTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowTypes.includes(rawFile.type)) {
    ElMessage.error("只能上传 jpg/png/webp 格式图片");
    return false;
  }
  if (rawFile.size > 5 * 1024 * 1024) {
    ElMessage.error("图片大小不能超过 5MB");
    return false;
  }
  return true;
};

const handleUploadSuccess: UploadProps["onSuccess"] = (response) => {
  if (response?.data?.url) {
    uploadedImageUrls.value.push(response.data.url);
  }
};

const handleUploadRemove = (file: UploadFile) => {
  const url = (file.response as any)?.data?.url;
  if (url) {
    uploadedImageUrls.value = uploadedImageUrls.value.filter((u) => u !== url);
  }
};

function resetCreateForm() {
  createFormRef.value?.resetFields();
  createForm.subjectId = "";
  createForm.content = "";
  createForm.userEmail = "";
  createForm.userNickname = generateNickname();
  createForm.adminReply = "";
  uploadFileList.value = [];
  uploadedImageUrls.value = [];
  selectedProviderId.value = undefined;
}

async function submitCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false);
  if (!valid) return;

  createLoading.value = true;
  try {
    const data: CreateVirtualCommentRequest = {
      subjectId: createForm.subjectId,
      content: createForm.content,
      userEmail: createForm.userEmail,
      userNickname: createForm.userNickname,
      images:
        uploadedImageUrls.value.length > 0 ? JSON.stringify(uploadedImageUrls.value) : undefined,
      adminReply: createForm.adminReply || undefined,
    };
    await CommentAPI.create(data);
    ElMessage.success("新增成功");
    createDialogVisible.value = false;
    fetchData();
  } finally {
    createLoading.value = false;
  }
}

function handleReply(row: CommentVO) {
  currentComment.value = row;
  replyForm.reply = row.adminReply || "";
  replyDialogVisible.value = true;
}

async function submitReply() {
  if (!currentComment.value) return;
  if (!replyForm.reply.trim()) {
    ElMessage.warning("请输入回复内容");
    return;
  }
  replyLoading.value = true;
  try {
    await CommentAPI.reply(currentComment.value.id, replyForm.reply.trim());
    ElMessage.success("回复成功");
    replyDialogVisible.value = false;
    fetchData();
  } finally {
    replyLoading.value = false;
  }
}

async function handleDelete(row: CommentVO) {
  try {
    await ElMessageBox.confirm("确定要删除这条评论吗？此操作不可恢复。", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await CommentAPI.delete(row.id);
    ElMessage.success("删除成功");
    fetchData();
  } catch {
    // cancelled
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.toolbar-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.user-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.user-detail {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.user-nickname {
  font-size: 13px;
  color: #303133;
}

.user-email {
  font-size: 12px;
  color: #909399;
}

.image-thumb {
  position: relative;
  display: inline-block;
}

.image-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  color: #fff;
  background: #409eff;
  border-radius: 50%;
}

.text-secondary {
  color: #c0c4cc;
}

/* 新增弹窗 */
.create-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.compact-upload :deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
}

.compact-upload :deep(.el-upload-list__item) {
  width: 100px;
  height: 100px;
}

.form-tip {
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}

/* 回复弹窗 */
.reply-comment-info {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.comment-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.comment-user {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-content {
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
  white-space: pre-wrap;
}
</style>
