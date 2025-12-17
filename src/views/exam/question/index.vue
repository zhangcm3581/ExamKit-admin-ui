<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" class="toolbar-btn" @click="handleAdd">添加试题</el-button>
          <el-dropdown trigger="click">
            <el-button class="toolbar-btn">
              {{ currentTypeLabel }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === '' }"
                  @click="handleTypeFilter('')"
                >
                  全部题型
                </el-dropdown-item>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === 'SINGLE' }"
                  @click="handleTypeFilter('SINGLE')"
                >
                  单选题
                </el-dropdown-item>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === 'MULTIPLE' }"
                  @click="handleTypeFilter('MULTIPLE')"
                >
                  多选题
                </el-dropdown-item>
                <el-dropdown-item
                  :class="{ 'is-active': queryParams.type === 'JUDGE' }"
                  @click="handleTypeFilter('JUDGE')"
                >
                  判断题
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="click">
            <el-button class="toolbar-btn">
              更多操作
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :disabled="ids.length === 0" @click="handleBatchChangeType">
                  批量更换题型
                </el-dropdown-item>
                <el-dropdown-item :disabled="ids.length === 0" @click="handleBatchEdit">
                  批量编辑
                </el-dropdown-item>
                <el-dropdown-item
                  :disabled="ids.length === 0"
                  class="delete-item"
                  @click="handleDelete"
                >
                  批量删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button class="toolbar-btn" @click="handleQuery">试题查重</el-button>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="queryParams.keywords"
            placeholder="请输入内容"
            clearable
            style="width: 300px"
            @keyup.enter="handleQuery"
          >
            <template #suffix>
              <el-icon class="search-icon" @click="handleQuery"><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 试题表格 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        :border="false"
        row-key="id"
        class="question-table"
        :header-cell-style="{ background: '#f5f7fa', color: '#000', fontWeight: 'bold' }"
        :row-style="{ height: '60px' }"
        :cell-style="{ padding: '12px 0' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="question-detail-grid">
              <div class="left-section">
                <!-- 中文题干 -->
                <div v-if="row.contentZh" class="detail-block">
                  <div class="block-label">题干</div>
                  <div class="block-content" v-html="row.contentZh"></div>
                </div>
                <!-- 中文选项 -->
                <div v-if="row.optionsZh" class="detail-block">
                  <div class="options-list">
                    <div
                      v-for="option in parseOptions(row.optionsZh)"
                      :key="'zh-' + option.label"
                      class="option-item"
                    >
                      <span class="option-key">{{ option.label }}</span>
                      <span class="option-text" v-html="option.value"></span>
                    </div>
                  </div>
                </div>
                <!-- 分割线 -->
                <div v-if="row.contentEn || row.optionsEn" class="divider"></div>
                <!-- 英文题干 -->
                <div v-if="row.contentEn" class="detail-block">
                  <div class="block-label">Question</div>
                  <div class="block-content" v-html="row.contentEn"></div>
                </div>
                <!-- 英文选项 -->
                <div v-if="row.optionsEn" class="detail-block">
                  <div class="options-list">
                    <div
                      v-for="option in parseOptions(row.optionsEn)"
                      :key="'en-' + option.label"
                      class="option-item"
                    >
                      <span class="option-key">{{ option.label }}</span>
                      <span class="option-text" v-html="option.value"></span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="right-section">
                <div class="detail-block">
                  <div class="block-label">答案</div>
                  <div class="block-content">{{ row.answer }}</div>
                </div>
                <!-- 中文解析 -->
                <div v-if="row.explanationZh" class="detail-block">
                  <div class="block-label">解析</div>
                  <div class="block-content" v-html="row.explanationZh"></div>
                </div>
                <!-- 分割线 -->
                <div v-if="row.explanationEn" class="divider"></div>
                <!-- 英文解析 -->
                <div v-if="row.explanationEn" class="detail-block">
                  <div class="block-label">Explanation</div>
                  <div class="block-content" v-html="row.explanationEn"></div>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="题型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getQuestionTypeColor(row.type)" size="small">
              {{ getQuestionTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="编号" prop="questionNumber" width="80" align="center" />
        <el-table-column label="题目" min-width="400">
          <template #default="{ row }">
            <div class="question-content-preview" v-html="getContentPreview(row.contentZh)"></div>
          </template>
        </el-table-column>
        <el-table-column label="答案" prop="answer" width="100" align="center" />
        <el-table-column label="编辑时间" width="200" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link class="action-btn" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link class="action-btn" @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="900px"
      class="question-dialog"
      @close="handleCloseDialog"
    >
      <el-form ref="dataFormRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="试题类型" prop="type">
          <el-radio-group v-model="formData.type" @change="handleTypeChange">
            <el-radio label="SINGLE">单选题</el-radio>
            <el-radio label="MULTIPLE">多选题</el-radio>
            <el-radio label="JUDGE">判断题</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="试题题目" prop="contentZh">
          <WangEditor v-model="formData.contentZh" height="200px" />
        </el-form-item>

        <el-form-item v-if="formData.type !== 'JUDGE'" label="试题选项" prop="optionsZh" required>
          <div v-for="(option, index) in optionsList" :key="index" class="option-editor-item">
            <span class="option-label">{{ option.label }}</span>
            <div class="option-editor">
              <WangEditor v-model="option.value" height="120px" />
            </div>
            <el-button
              v-if="optionsList.length > 2"
              type="primary"
              text
              icon="Delete"
              class="delete-btn"
              @click="removeOption(index)"
            >
              删除
            </el-button>
          </div>
          <el-button style="margin-top: 12px" type="primary" plain @click="addOption">
            添加选项
          </el-button>
        </el-form-item>

        <el-form-item label="答案" prop="answer">
          <template v-if="formData.type === 'SINGLE'">
            <el-radio-group v-model="formData.answer">
              <el-radio v-for="option in optionsList" :key="option.label" :label="option.label">
                {{ option.label }}
              </el-radio>
            </el-radio-group>
          </template>
          <template v-else-if="formData.type === 'MULTIPLE'">
            <el-checkbox-group v-model="multipleAnswers">
              <el-checkbox v-for="option in optionsList" :key="option.label" :label="option.label">
                {{ option.label }}
              </el-checkbox>
            </el-checkbox-group>
          </template>
          <template v-else>
            <el-radio-group v-model="formData.answer">
              <el-radio label="A">正确</el-radio>
              <el-radio label="B">错误</el-radio>
            </el-radio-group>
          </template>
        </el-form-item>

        <el-form-item label="解析">
          <WangEditor v-model="formData.explanationZh" height="200px" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取 消</el-button>
          <el-button type="primary" @click="handleSubmit">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoute } from "vue-router";
import QuestionAPI, {
  type QuestionPageQuery,
  type QuestionVO,
  type QuestionForm,
} from "@/api/exam/question-api";
import { formatDateTime } from "@/utils/datetime";
import WangEditor from "@/components/WangEditor/index.vue";

defineOptions({
  name: "QuestionManagement",
  inheritAttrs: false,
});

const route = useRoute();
const dataFormRef = ref();
const loading = ref(false);
const ids = ref<number[]>([]);
const total = ref(0);

const queryParams = reactive<QuestionPageQuery>({
  subjectId: route.query.subjectId as string,
  pageNum: 1,
  pageSize: 100,
});

const tableData = ref<QuestionVO[]>([]);

const dialog = reactive({
  title: "",
  visible: false,
});

const formData = reactive<QuestionForm>({
  type: "SINGLE",
});

// 选项列表
const optionsList = ref<{ label: string; value: string }[]>([
  { label: "A", value: "" },
  { label: "B", value: "" },
  { label: "C", value: "" },
  { label: "D", value: "" },
]);

// 多选题答案数组
const multipleAnswers = ref<string[]>([]);

// 当前选中的题型标签
const currentTypeLabel = computed(() => {
  const typeMap: Record<string, string> = {
    "": "全部题型",
    SINGLE: "单选题",
    MULTIPLE: "多选题",
    JUDGE: "判断题",
  };
  return typeMap[queryParams.type || ""] || "全部题型";
});

// 表单验证规则
const rules = {
  type: [{ required: true, message: "请选择题型", trigger: "change" }],
  contentZh: [{ required: true, message: "请输入题目内容", trigger: "blur" }],
  answer: [{ required: true, message: "请选择答案", trigger: "change" }],
};

// 监听多选答案变化
watch(multipleAnswers, (newVal) => {
  if (formData.type === "MULTIPLE") {
    formData.answer = newVal.sort().join("");
  }
});

// 获取题型文本
function getQuestionTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    SINGLE: "单选题",
    MULTIPLE: "多选题",
    JUDGE: "判断题",
  };
  return typeMap[type] || type;
}

// 获取题型颜色
function getQuestionTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    SINGLE: "",
    MULTIPLE: "success",
    JUDGE: "warning",
  };
  return colorMap[type] || "";
}

// 解析选项JSON
function parseOptions(optionsStr: string): { label: string; value: string }[] {
  try {
    const parsed = JSON.parse(optionsStr);
    // 支持两种格式: {label, value} 和 {key, text}
    return parsed.map((opt: any) => ({
      label: opt.label || opt.key,
      value: opt.value || opt.text,
    }));
  } catch {
    return [];
  }
}

// 获取题目内容预览
function getContentPreview(content: string): string {
  const text = content.replace(/<[^>]+>/g, "");
  return text.length > 50 ? text.substring(0, 50) + "..." : text;
}

// 添加选项
function addOption() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nextKey = letters[optionsList.value.length];
  if (nextKey) {
    optionsList.value.push({ label: nextKey, value: "" });
  }
}

// 删除选项
function removeOption(index: number) {
  optionsList.value.splice(index, 1);
  // 重新赋值标签
  optionsList.value.forEach((option, idx) => {
    option.label = String.fromCharCode(65 + idx);
  });
}

// 监听多选答案变化
watch(multipleAnswers, (newVal) => {
  formData.answer = newVal.sort().join("");
});

// 监听题型变化
function handleTypeChange() {
  // 重置答案
  formData.answer = "";
  multipleAnswers.value = [];

  // 如果是判断题，重置选项
  if (formData.type === "JUDGE") {
    optionsList.value = [
      { label: "A", value: "正确" },
      { label: "B", value: "错误" },
    ];
  } else if (optionsList.value.length === 2) {
    // 从判断题切换回单选/多选，恢复默认选项
    optionsList.value = [
      { label: "A", value: "" },
      { label: "B", value: "" },
      { label: "C", value: "" },
      { label: "D", value: "" },
    ];
  }
}

// 获取数据
async function fetchData() {
  loading.value = true;
  try {
    const res = await QuestionAPI.getPage(queryParams);
    tableData.value = res.data || [];
    total.value = res.total || 0;
  } finally {
    loading.value = false;
  }
}

// 题型筛选
function handleTypeFilter(type: string) {
  queryParams.type = type;
  queryParams.pageNum = 1;
  fetchData();
}

// 批量更换题型
function handleBatchChangeType() {
  if (ids.value.length === 0) {
    ElMessage.warning("请选择要更换题型的试题");
    return;
  }
  ElMessage.info("批量更换题型功能待开发");
}

// 批量编辑
function handleBatchEdit() {
  if (ids.value.length === 0) {
    ElMessage.warning("请选择要编辑的试题");
    return;
  }
  ElMessage.info("批量编辑功能待开发");
}

// 查询
function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

// 选择改变
function handleSelectionChange(selection: QuestionVO[]) {
  ids.value = selection.map((item) => item.id);
}

// 新增
function handleAdd() {
  dialog.visible = true;
  dialog.title = "新增试题";
  resetForm();
}

// 编辑
async function handleEdit(row: QuestionVO) {
  dialog.visible = true;
  dialog.title = "编辑试题";

  const data = await QuestionAPI.getFormData(row.id);
  Object.assign(formData, data);

  // 解析选项
  if (data.optionsZh) {
    optionsList.value = parseOptions(data.optionsZh);
  }

  // 解析多选答案
  if (data.type === "MULTIPLE" && data.answer) {
    multipleAnswers.value = data.answer.split("");
  }
}

// 删除
function handleDelete(id?: number) {
  const delIds = id ? [id] : ids.value;
  if (delIds.length === 0) {
    ElMessage.warning("请选择要删除的试题");
    return;
  }

  ElMessageBox.confirm("确认删除选中的试题吗？", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    QuestionAPI.deleteByIds(delIds.join(",")).then(() => {
      ElMessage.success("删除成功");
      fetchData();
    });
  });
}

// 提交
function handleSubmit() {
  dataFormRef.value.validate((valid: boolean) => {
    if (valid) {
      // 构建选项JSON
      if (formData.type !== "JUDGE") {
        formData.optionsZh = JSON.stringify(optionsList.value);
      } else {
        // 判断题固定选项
        formData.optionsZh = JSON.stringify([
          { label: "A", value: "正确" },
          { label: "B", value: "错误" },
        ]);
      }

      // 设置科目ID
      formData.subjectId = queryParams.subjectId;

      const action = formData.id
        ? QuestionAPI.update(formData.id, formData)
        : QuestionAPI.create(formData);

      action.then(() => {
        ElMessage.success(formData.id ? "修改成功" : "新增成功");
        dialog.visible = false;
        fetchData();
      });
    }
  });
}

// 关闭对话框
function handleCloseDialog() {
  dialog.visible = false;
  resetForm();
}

// 重置表单
function resetForm() {
  formData.id = undefined;
  formData.type = "SINGLE";
  formData.contentZh = "";
  formData.contentEn = "";
  formData.optionsZh = "";
  formData.optionsEn = "";
  formData.answer = "";
  formData.explanationZh = "";
  formData.explanationEn = "";

  optionsList.value = [
    { label: "A", value: "" },
    { label: "B", value: "" },
    { label: "C", value: "" },
    { label: "D", value: "" },
  ];

  multipleAnswers.value = [];

  if (dataFormRef.value) {
    dataFormRef.value.resetFields();
  }
}

onMounted(() => {
  if (!queryParams.subjectId) {
    ElMessage.error("缺少科目ID参数");
    return;
  }
  fetchData();
});
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  margin-bottom: 16px;

  .toolbar-left {
    display: flex;
    gap: 12px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;

    .search-icon {
      cursor: pointer;
    }
  }

  .toolbar-btn {
    font-weight: bold;
  }
}

:deep(.el-dropdown-menu__item.is-active) {
  font-weight: bold;
  color: #409eff;
}

:deep(.el-dropdown-menu__item.delete-item) {
  color: #f56c6c;

  &:not(.is-disabled):hover {
    color: #f56c6c;
    background-color: #fef0f0;
  }
}

.question-table {
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 4px;

  :deep(.el-table__inner-wrapper) {
    &::before {
      display: none;
    }
  }

  :deep(.el-table__row) {
    border-bottom: 1px solid #ebeef5;
  }

  .action-btn {
    font-weight: bold;
  }
}

.question-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px;
  font-size: 14px;
  background-color: #f5f7fa;

  .left-section,
  .right-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .divider {
    width: 100%;
    height: 1px;
    margin: 8px 0;
    background-color: #dcdfe6;
  }

  .detail-block {
    .block-label {
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #606266;
    }

    .block-content {
      line-height: 1.8;
      color: #303133;
      word-break: break-all;
      word-wrap: break-word;
    }
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .option-item {
      display: flex;
      align-items: baseline;

      .option-key {
        flex-shrink: 0;
        min-width: 20px;
        margin-right: 12px;
        font-weight: 500;
        color: #606266;
      }

      .option-text {
        flex: 1;
        line-height: 1.8;
        color: #303133;
        word-break: break-all;
        word-wrap: break-word;
      }
    }
  }
}

.question-content-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  word-break: break-all;
  white-space: normal;
}

.option-editor-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 16px;

  .option-label {
    flex-shrink: 0;
    min-width: 24px;
    padding-top: 8px;
    font-size: 14px;
    font-weight: 400;
    color: #606266;
  }

  .option-editor {
    flex: 1;
  }

  .delete-btn {
    flex-shrink: 0;
    margin-top: 8px;
  }
}

.question-dialog {
  :deep(.el-dialog__header) {
    padding: 16px 20px;
    margin-right: 0;
    border-bottom: 1px solid #e4e7ed;
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 12px 20px;
    border-top: 1px solid #e4e7ed;
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;

    .el-button {
      font-weight: bold;
    }
  }
}
</style>
