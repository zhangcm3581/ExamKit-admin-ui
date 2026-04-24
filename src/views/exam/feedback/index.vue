<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left"></div>
        <div class="toolbar-right">
          <el-select
            v-model="queryParams.type"
            placeholder="类型"
            clearable
            style="width: 140px; margin-right: 8px"
            @change="handleQuery"
          >
            <el-option label="账号相关" value="ACCOUNT" />
            <el-option label="功能建议" value="SUGGESTION" />
            <el-option label="其它问题" value="OTHER" />
          </el-select>
          <el-select
            v-model="queryParams.status"
            placeholder="状态"
            clearable
            style="width: 120px; margin-right: 8px"
            @change="handleQuery"
          >
            <el-option label="待处理" value="PENDING" />
            <el-option label="已处理" value="RESOLVED" />
          </el-select>
          <el-input
            v-model="queryParams.keyword"
            placeholder="关键词"
            clearable
            style="width: 200px; margin-right: 8px"
            @keyup.enter="handleSearch"
          />
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px; margin-right: 8px"
            @change="handleDateChange"
          />
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
        <el-table-column label="ID" prop="id" width="80" align="center" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="typeTagType(scope.row.type)" size="small" effect="plain">
              {{ typeLabel(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容" prop="title" min-width="260" show-overflow-tooltip />
        <el-table-column label="联系方式" prop="contact" width="130">
          <template #default="scope">
            <span v-if="scope.row.contact">{{ scope.row.contact }}</span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="提交人" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.userNickname || "-" }}（{{ scope.row.userId }}）
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)" size="small" effect="plain">
              {{ statusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" min-width="170" align="center">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleView(scope.row)">
              <b>查看</b>
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

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="反馈详情" size="600px" destroy-on-close>
      <div v-if="current" class="feedback-detail">
        <div class="fd-row">
          <span class="label">类型：</span>
          {{ typeLabel(current.type) }}
        </div>
        <div class="fd-row">
          <span class="label">状态：</span>
          <el-tag :type="statusTagType(current.status)" size="small" effect="plain">
            {{ statusLabel(current.status) }}
          </el-tag>
        </div>
        <div class="fd-row">
          <span class="label">提交人：</span>
          {{ current.userNickname || "-" }}（{{ current.userId }}）
        </div>
        <div class="fd-row">
          <span class="label">联系方式：</span>
          {{ current.contact || "-" }}
        </div>
        <div class="fd-row">
          <span class="label">提交时间：</span>
          {{ formatDateTime(current.createTime) }}
        </div>
        <div class="fd-content">
          <div class="label">反馈内容：</div>
          <div class="content-box">{{ current.content }}</div>
        </div>

        <el-divider />

        <!-- PENDING 显示输入区 -->
        <div v-if="current.status === 'PENDING'">
          <el-form :model="replyForm" label-width="80px">
            <el-form-item label="回复内容">
              <el-input
                v-model="replyForm.reply"
                type="textarea"
                :rows="4"
                maxlength="500"
                show-word-limit
                placeholder="输入回复内容"
              />
            </el-form-item>
          </el-form>
          <div class="fd-actions">
            <el-button
              type="primary"
              :loading="submitting"
              :disabled="!replyForm.reply.trim()"
              @click="onReply"
            >
              <b>回复并标已处理</b>
            </el-button>
            <el-button :loading="submitting" @click="onResolve"><b>仅标已处理</b></el-button>
          </div>
        </div>

        <!-- RESOLVED 显示只读回复 -->
        <div v-else>
          <div class="fd-row">
            <span class="label">处理人：</span>
            {{ current.handlerNickname || "-" }}
          </div>
          <div class="fd-row">
            <span class="label">处理时间：</span>
            {{ formatDateTime(current.repliedAt) }}
          </div>
          <div class="fd-content">
            <div class="label">回复内容：</div>
            <div class="content-box content-box--reply">
              {{ current.reply || "（无回复，仅标记已处理）" }}
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import FeedbackAPI, { type FeedbackAdminVO, type FeedbackPageQuery } from "@/api/exam/feedback-api";

const loading = ref(false);
const tableData = ref<FeedbackAdminVO[]>([]);
const total = ref(0);

const queryParams = reactive<FeedbackPageQuery>({
  pageNum: 1,
  pageSize: 10,
});

const dateRange = ref<[string, string] | null>(null);

const drawerVisible = ref(false);
const current = ref<FeedbackAdminVO | null>(null);
const replyForm = reactive({ reply: "" });
const submitting = ref(false);

onMounted(() => fetchData());

function typeLabel(t: string): string {
  const map: Record<string, string> = {
    ACCOUNT: "账号相关",
    SUGGESTION: "功能建议",
    OTHER: "其它问题",
  };
  return map[t] || t;
}

function typeTagType(t: string): "primary" | "success" | "warning" | "info" | "danger" {
  const map: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = {
    ACCOUNT: "info",
    SUGGESTION: "success",
    OTHER: "warning",
  };
  return map[t] || "info";
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    PENDING: "待处理",
    RESOLVED: "已处理",
  };
  return map[s] || s;
}

function statusTagType(s: string): "primary" | "success" | "warning" | "info" | "danger" {
  const map: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = {
    PENDING: "warning",
    RESOLVED: "success",
  };
  return map[s] || "info";
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

async function fetchData() {
  loading.value = true;
  try {
    const data = await FeedbackAPI.getPage(queryParams);
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

function handleDateChange(val: [string, string] | null) {
  queryParams.startTime = val?.[0];
  queryParams.endTime = val?.[1];
  handleQuery();
}

function handleReset() {
  queryParams.type = undefined;
  queryParams.status = undefined;
  queryParams.keyword = undefined;
  queryParams.startTime = undefined;
  queryParams.endTime = undefined;
  dateRange.value = null;
  queryParams.pageNum = 1;
  queryParams.pageSize = 10;
  fetchData();
}

async function handleView(row: FeedbackAdminVO) {
  current.value = row;
  replyForm.reply = "";
  drawerVisible.value = true;
  // 拉取最新详情（确保 reply / repliedAt 最新）
  try {
    const detail = await FeedbackAPI.getDetail(row.id);
    current.value = detail;
  } catch {
    // 打开时 row 数据已够用，拉取失败不阻塞
  }
}

async function onReply() {
  if (!current.value) return;
  if (!replyForm.reply.trim()) {
    ElMessage.warning("请输入回复内容");
    return;
  }
  submitting.value = true;
  try {
    await FeedbackAPI.reply(current.value.id, { reply: replyForm.reply.trim() });
    ElMessage.success("回复成功");
    drawerVisible.value = false;
    fetchData();
  } finally {
    submitting.value = false;
  }
}

async function onResolve() {
  if (!current.value) return;
  submitting.value = true;
  try {
    await FeedbackAPI.resolve(current.value.id);
    ElMessage.success("已标为已处理");
    drawerVisible.value = false;
    fetchData();
  } finally {
    submitting.value = false;
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
  gap: 4px;
  align-items: center;
}

.text-secondary {
  color: #c0c4cc;
}

.feedback-detail {
  padding: 0 4px;
}

.fd-row {
  margin-bottom: 12px;
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
}

.fd-row .label {
  display: inline-block;
  min-width: 90px;
  color: #606266;
}

.fd-content {
  margin-top: 12px;
}

.fd-content .label {
  margin-bottom: 6px;
  color: #606266;
}

.content-box {
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #303133;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  background: #fafafa;
  border-radius: 6px;
}

.content-box--reply {
  background: #eff6ff;
}

.fd-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
</style>
