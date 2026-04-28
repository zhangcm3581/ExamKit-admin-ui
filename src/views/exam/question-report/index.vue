<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left"></div>
        <div class="toolbar-right">
          <el-select
            v-model="queryParams.subjectId"
            placeholder="科目"
            clearable
            filterable
            style="width: 320px; margin-right: 8px"
            @change="handleQuery"
          >
            <el-option v-for="s in subjectOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-select
            v-model="queryParams.status"
            placeholder="处理状态"
            clearable
            style="width: 120px; margin-right: 8px"
            @change="handleQuery"
          >
            <el-option label="待处理" value="PENDING" />
            <el-option label="处理中" value="PROCESSING" />
            <el-option label="已解决" value="RESOLVED" />
            <el-option label="已驳回" value="REJECTED" />
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
        <el-table-column label="科目" prop="subjectName" min-width="180" show-overflow-tooltip />
        <el-table-column label="题号" width="70" align="center">
          <template #default="scope">#{{ scope.row.questionNumber }}</template>
        </el-table-column>
        <el-table-column label="错误类型" min-width="180">
          <template #default="scope">
            <div class="error-types">
              <el-tag
                v-for="t in parseErrorTypes(scope.row.errorTypes)"
                :key="t"
                size="small"
                effect="plain"
                type="danger"
                style="margin-right: 4px; margin-bottom: 2px"
              >
                {{ errorTypeLabel(t) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="纠错描述"
          prop="description"
          min-width="200"
          show-overflow-tooltip
        />
        <el-table-column label="用户" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.userNickname || "-" }} / {{ scope.row.userEmail || "-" }}（{{
              scope.row.userId
            }}）
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)" size="small" effect="plain">
              {{ statusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="管理员回复"
          prop="handlerRemark"
          min-width="140"
          show-overflow-tooltip
        >
          <template #default="scope">
            <span v-if="scope.row.handlerRemark">{{ scope.row.handlerRemark }}</span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" min-width="170" align="center">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleProcess(scope.row)">
              <b>处理</b>
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

    <!-- 处理对话框 -->
    <el-dialog
      v-model="processDialogVisible"
      title="纠错处理"
      width="700px"
      destroy-on-close
      :before-close="handleDialogBeforeClose"
    >
      <div v-if="currentReport" v-loading="questionLoading">
        <!-- 题目区域工具栏 -->
        <div v-if="questionDetail" class="question-toolbar">
          <span v-if="!editing" class="qt-hint">点击右侧按钮可直接修改本题</span>
          <span v-else class="qt-hint qt-hint-editing">编辑模式</span>
          <el-button v-if="!editing" type="primary" link @click="editing = true">
            <b>编辑题目</b>
          </el-button>
        </div>

        <!-- 题目信息（预览态） -->
        <div v-if="questionDetail && !editing" class="question-panel">
          <!-- 题型标签 + 语言切换 -->
          <div class="qp-header">
            <span class="qp-type-tag">{{ questionTypeLabel(questionDetail.type) }}</span>
            <div v-if="hasBilingual" class="qp-locale-switch">
              <button
                :class="['qp-locale-btn', questionLocale === 'zh' && 'active']"
                @click="questionLocale = 'zh'"
              >
                中文
              </button>
              <button
                :class="['qp-locale-btn', questionLocale === 'en' && 'active']"
                @click="questionLocale = 'en'"
              >
                EN
              </button>
            </div>
          </div>

          <!-- 题号 + 题干 -->
          <div class="qp-stem">
            <span class="qp-number">{{ currentReport.questionNumber }}/</span>
            <span class="qp-content" v-html="questionContent"></span>
          </div>

          <!-- 选项 -->
          <div v-if="parsedOptions.length > 0" class="qp-options">
            <div
              v-for="opt in parsedOptions"
              :key="opt.key"
              class="qp-option"
              :class="{ 'qp-option-correct': opt.correct }"
            >
              <span class="qp-option-label">{{ opt.key }}.</span>
              <span class="qp-option-text" v-html="opt.text"></span>
            </div>
          </div>

          <!-- 答案解析区 -->
          <div class="qp-answer-section">
            <div class="qp-answer-line">
              <span class="qp-answer-title">正确答案</span>
              <span class="qp-answer-value">{{ questionDetail.answer }}</span>
            </div>
            <div v-if="questionExplanation" class="qp-explanation">
              <div class="qp-explanation-title">答案解析：</div>
              <div class="qp-explanation-content" v-html="questionExplanation"></div>
            </div>
          </div>
        </div>

        <!-- 题目信息（编辑态） -->
        <div v-if="questionDetail && editing" class="question-edit-wrapper">
          <QuestionEditPanel
            ref="editPanelRef"
            :question="questionDetail"
            :subject-support-languages="subjectSupportLanguages"
            @saved="onQuestionSaved"
            @cancel="onCancelEdit"
          />
        </div>

        <!-- 纠错信息 -->
        <div class="report-info">
          <div class="report-row">
            <span class="label">错误类型：</span>
            <el-tag
              v-for="t in parseErrorTypes(currentReport.errorTypes)"
              :key="t"
              size="small"
              effect="plain"
              type="danger"
              style="margin-right: 4px"
            >
              {{ errorTypeLabel(t) }}
            </el-tag>
          </div>
          <div class="report-row">
            <span class="label">纠错描述：</span>
            <span>{{ currentReport.description }}</span>
          </div>
          <div class="report-row">
            <span class="label">提交用户：</span>
            <span>
              {{ currentReport.userNickname || currentReport.userEmail }}（ID:
              {{ currentReport.userId }}）
            </span>
          </div>
          <div class="report-row">
            <span class="label">提交时间：</span>
            <span>{{ formatDateTime(currentReport.createTime) }}</span>
          </div>
        </div>

        <!-- 处理操作 -->
        <el-divider />
        <el-form :model="processForm" label-width="90px">
          <el-form-item label="处理状态">
            <el-radio-group v-model="processForm.status">
              <el-radio value="PROCESSING">处理中</el-radio>
              <el-radio value="RESOLVED">已解决</el-radio>
              <el-radio value="REJECTED">已驳回</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="回复内容">
            <el-input
              v-model="processForm.handlerRemark"
              type="textarea"
              :rows="3"
              placeholder="请输入处理回复内容"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="handleDialogCancel"><b>取消</b></el-button>
        <el-button type="primary" :loading="processLoading" @click="submitProcess">
          <b>提交</b>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import QuestionReportAPI, {
  type ReportVO,
  type ReportPageQuery,
} from "@/api/exam/question-report-api";
import QuestionAPI, { type QuestionVO } from "@/api/exam/question-api";
import SubjectAPI from "@/api/exam/subject-api";
import QuestionEditPanel from "@/components/QuestionEditPanel/index.vue";

const loading = ref(false);
const tableData = ref<ReportVO[]>([]);
const total = ref(0);
const subjectOptions = ref<{ id: string; name: string }[]>([]);

const queryParams = reactive<ReportPageQuery>({
  pageNum: 1,
  pageSize: 20,
  status: undefined,
});

// 处理弹窗
const processDialogVisible = ref(false);
const processLoading = ref(false);
const questionLoading = ref(false);
const currentReport = ref<ReportVO | null>(null);
const questionDetail = ref<QuestionVO | null>(null);
const processForm = reactive({
  status: "RESOLVED",
  handlerRemark: "",
});

const questionLocale = ref<"zh" | "en">("zh");
const editing = ref(false);
const subjectSupportLanguages = ref<string>("zh");
const editPanelRef = ref<InstanceType<typeof QuestionEditPanel> | null>(null);

const parsedOptions = computed(() => {
  if (!questionDetail.value) return [];
  const raw =
    questionLocale.value === "zh"
      ? questionDetail.value.optionsZh || questionDetail.value.optionsEn
      : questionDetail.value.optionsEn || questionDetail.value.optionsZh;
  if (!raw || raw === "[]") return [];
  try {
    const arr = JSON.parse(raw);
    // 兼容两种格式: {key, text, correct} 或 {label, value}
    return arr.map((item: any) => ({
      key: item.key || item.label || "",
      text: item.text || item.value || "",
      correct:
        item.correct || (questionDetail.value?.answer || "").includes(item.key || item.label || ""),
    }));
  } catch {
    return [];
  }
});

const questionContent = computed(() => {
  if (!questionDetail.value) return "";
  return questionLocale.value === "zh"
    ? questionDetail.value.contentZh || questionDetail.value.contentEn
    : questionDetail.value.contentEn || questionDetail.value.contentZh;
});

const questionExplanation = computed(() => {
  if (!questionDetail.value) return "";
  return questionLocale.value === "zh"
    ? questionDetail.value.explanationZh || questionDetail.value.explanationEn
    : questionDetail.value.explanationEn || questionDetail.value.explanationZh;
});

const hasBilingual = computed(() => {
  if (!questionDetail.value) return false;
  return !!(questionDetail.value.contentZh && questionDetail.value.contentEn);
});

onMounted(() => {
  fetchData();
  QuestionReportAPI.getSubjects().then((data) => {
    subjectOptions.value = data;
  });
});

const ERROR_TYPE_MAP: Record<string, string> = {
  WRONG_STEM: "题干有误",
  WRONG_ANSWER: "答案有误",
  WRONG_ANALYSIS: "解析有误",
  OTHER: "其他",
};

function errorTypeLabel(type: string): string {
  return ERROR_TYPE_MAP[type] || type;
}

function parseErrorTypes(json?: string): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "待处理",
    PROCESSING: "处理中",
    RESOLVED: "已解决",
    REJECTED: "已驳回",
  };
  return map[status] || status;
}

function questionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    SINGLE: "单选题",
    MULTIPLE: "多选题",
    JUDGE: "判断题",
    SHORT_ANSWER: "简答题",
  };
  return map[type] || type;
}

function statusTagType(status: string): "primary" | "success" | "warning" | "info" | "danger" {
  const map: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = {
    PENDING: "warning",
    PROCESSING: "primary",
    RESOLVED: "success",
    REJECTED: "info",
  };
  return map[status] || "info";
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
    const data = await QuestionReportAPI.getPage(queryParams);
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
  queryParams.subjectId = undefined;
  queryParams.status = undefined;
  queryParams.pageNum = 1;
  queryParams.pageSize = 20;
  fetchData();
}

async function handleProcess(row: ReportVO) {
  currentReport.value = row;
  processForm.status = row.status === "PENDING" ? "RESOLVED" : row.status;
  processForm.handlerRemark = row.handlerRemark || "";
  questionDetail.value = null;
  questionLocale.value = "zh";
  editing.value = false;
  subjectSupportLanguages.value = "zh";
  processDialogVisible.value = true;

  questionLoading.value = true;
  try {
    const [q, s] = await Promise.all([
      QuestionAPI.getFormData(row.questionId),
      SubjectAPI.getFormData(row.subjectId),
    ]);
    questionDetail.value = q;
    subjectSupportLanguages.value = s.supportLanguages || "zh";
  } catch {
    questionDetail.value = null;
  } finally {
    questionLoading.value = false;
  }
}

function onQuestionSaved(updated: QuestionVO) {
  questionDetail.value = updated;
  editing.value = false;
}

async function onCancelEdit() {
  if (editPanelRef.value?.isDirty()) {
    try {
      await ElMessageBox.confirm("有未保存的修改，确定取消编辑？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "继续编辑",
        type: "warning",
      });
    } catch {
      return;
    }
  }
  editing.value = false;
}

async function handleDialogBeforeClose(done: () => void) {
  if (editing.value && editPanelRef.value?.isDirty()) {
    try {
      await ElMessageBox.confirm("题目有未保存的修改，确定关闭？", "提示", {
        confirmButtonText: "确定关闭",
        cancelButtonText: "继续编辑",
        type: "warning",
      });
    } catch {
      return;
    }
  }
  done();
}

function handleDialogCancel() {
  handleDialogBeforeClose(() => {
    processDialogVisible.value = false;
  });
}

async function submitProcess() {
  if (!currentReport.value) return;
  if (!processForm.handlerRemark.trim()) {
    ElMessage.warning("请输入回复内容");
    return;
  }
  processLoading.value = true;
  try {
    await QuestionReportAPI.handle(currentReport.value.id, {
      status: processForm.status,
      handlerRemark: processForm.handlerRemark.trim(),
    });
    ElMessage.success("处理成功");
    processDialogVisible.value = false;
    fetchData();
  } finally {
    processLoading.value = false;
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
  align-items: center;
}

.error-types {
  display: flex;
  flex-wrap: wrap;
}

.user-nickname {
  font-size: 13px;
  color: #303133;
}

.user-email {
  font-size: 12px;
  color: #909399;
}

.text-secondary {
  color: #c0c4cc;
}

/* 题目面板 - 仿前端做题页 */
.question-panel {
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid #e8eaf0;
  border-radius: 10px;
}

.qp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 0;
}

.qp-type-tag {
  display: inline-block;
  padding: 2px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #3b82f6;
  background: #eff6ff;
  border: 1px solid #93c5fd;
  border-radius: 4px;
}

.qp-locale-switch {
  display: flex;
  padding: 2px;
  background: #f3f4f6;
  border-radius: 20px;
}

.qp-locale-btn {
  padding: 2px 12px;
  font-size: 12px;
  color: #9ca3af;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 20px;
  transition: all 0.2s;
}

.qp-locale-btn.active {
  font-weight: 500;
  color: #3b82f6;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.qp-stem {
  padding: 12px 16px 16px;
  font-size: 14px;
  line-height: 1.7;
  color: #1f2937;
}

.qp-stem :deep(p) {
  margin: 0;
}

.qp-number {
  font-weight: 500;
  color: #9ca3af;
}

.qp-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px 16px;
}

.qp-option {
  display: flex;
  align-items: flex-start;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.6;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.qp-option-correct {
  color: #166534;
  background: #f0fdf4;
  border-color: #22c55e;
}

.qp-option-label {
  flex-shrink: 0;
  margin-right: 8px;
  font-weight: 600;
}

.qp-option-text :deep(p) {
  margin: 0;
}

.qp-answer-section {
  padding: 16px;
  margin: 0 16px 16px;
  background: #eff6ff;
  border-radius: 10px;
}

.qp-answer-line {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}

.qp-answer-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.qp-answer-value {
  font-size: 14px;
  font-weight: 600;
  color: #22c55e;
}

.qp-explanation-title {
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.qp-explanation-content {
  font-size: 13px;
  line-height: 1.7;
  color: #4b5563;
}

.qp-explanation-content :deep(p) {
  margin: 4px 0;
}

/* 纠错信息 */
.report-info {
  padding: 14px 16px;
  background: #fef0f0;
  border-radius: 8px;
}

.report-row {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: #606266;
}

.report-row:last-child {
  margin-bottom: 0;
}

.report-row .label {
  font-weight: 500;
  color: #303133;
}

.question-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 8px;
}

.qt-hint {
  font-size: 12px;
  color: #909399;
}

.qt-hint-editing {
  color: #3b82f6;
}

.question-edit-wrapper {
  margin-bottom: 16px;
}
</style>
