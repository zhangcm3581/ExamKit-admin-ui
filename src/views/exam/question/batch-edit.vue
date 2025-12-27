<template>
  <div class="batch-edit-container">
    <el-card>
      <!-- 顶部操作栏 -->
      <div class="header-toolbar">
        <el-button type="primary" @click="handleSave">保存修改</el-button>
        <el-button type="warning" @click="showBatchChangeTypeDialog">批量更换题型</el-button>
        <el-button @click="handleCancel">取消</el-button>
      </div>

      <!-- 批量编辑表格 -->
      <el-table :data="tableData" border stripe class="batch-edit-table">
        <el-table-column type="index" label="序号" width="60" align="center" />

        <el-table-column label="题型" width="100" align="center">
          <template #default="{ row }">
            <el-select v-model="row.type" size="small" @change="handleTypeChange(row)">
              <el-option label="单选题" value="SINGLE" />
              <el-option label="多选题" value="MULTIPLE" />
              <el-option label="判断题" value="JUDGE" />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="题干" min-width="200">
          <template #default="{ row }">
            <el-input
              v-model="row.contentZh"
              type="textarea"
              :rows="2"
              placeholder="请输入题干（中文）"
            />
          </template>
        </el-table-column>

        <el-table-column label="选项A" min-width="150">
          <template #default="{ row }">
            <el-input
              v-if="row.type !== 'JUDGE'"
              v-model="row.optionA"
              type="textarea"
              :rows="2"
              placeholder="选项A"
              size="small"
            />
            <span v-else class="judge-option">正确</span>
          </template>
        </el-table-column>

        <el-table-column label="选项B" min-width="150">
          <template #default="{ row }">
            <el-input
              v-if="row.type !== 'JUDGE'"
              v-model="row.optionB"
              type="textarea"
              :rows="2"
              placeholder="选项B"
              size="small"
            />
            <span v-else class="judge-option">错误</span>
          </template>
        </el-table-column>

        <el-table-column label="选项C" min-width="150">
          <template #default="{ row }">
            <el-input
              v-if="row.type === 'SINGLE' || row.type === 'MULTIPLE'"
              v-model="row.optionC"
              type="textarea"
              :rows="2"
              placeholder="选项C"
              size="small"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项D" min-width="150">
          <template #default="{ row }">
            <el-input
              v-if="row.type === 'SINGLE' || row.type === 'MULTIPLE'"
              v-model="row.optionD"
              type="textarea"
              :rows="2"
              placeholder="选项D"
              size="small"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项E" min-width="150">
          <template #default="{ row }">
            <el-input
              v-if="row.type === 'SINGLE' || row.type === 'MULTIPLE'"
              v-model="row.optionE"
              type="textarea"
              :rows="2"
              placeholder="选项E（可选）"
              size="small"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项F" min-width="150">
          <template #default="{ row }">
            <el-input
              v-if="row.type === 'SINGLE' || row.type === 'MULTIPLE'"
              v-model="row.optionF"
              type="textarea"
              :rows="2"
              placeholder="选项F（可选）"
              size="small"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项G" min-width="150">
          <template #default="{ row }">
            <el-input
              v-if="row.type === 'SINGLE' || row.type === 'MULTIPLE'"
              v-model="row.optionG"
              type="textarea"
              :rows="2"
              placeholder="选项G（可选）"
              size="small"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="选项H" min-width="150">
          <template #default="{ row }">
            <el-input
              v-if="row.type === 'SINGLE' || row.type === 'MULTIPLE'"
              v-model="row.optionH"
              type="textarea"
              :rows="2"
              placeholder="选项H（可选）"
              size="small"
            />
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="正确答案" width="120" align="center">
          <template #default="{ row }">
            <el-input v-model="row.answer" placeholder="如：A 或 ABC" size="small" maxlength="8" />
          </template>
        </el-table-column>

        <el-table-column label="解析" min-width="200">
          <template #default="{ row }">
            <el-input
              v-model="row.explanationZh"
              type="textarea"
              :rows="2"
              placeholder="请输入解析（可选）"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 批量更换题型对话框 -->
    <el-dialog v-model="batchChangeTypeVisible" title="选择题型" width="400px">
      <el-select v-model="selectedType" placeholder="请选择题型" style="width: 100%" size="large">
        <el-option label="单选题" value="SINGLE" />
        <el-option label="多选题" value="MULTIPLE" />
        <el-option label="判断题" value="JUDGE" />
      </el-select>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="batchChangeTypeVisible = false">取消</el-button>
          <el-button type="primary" @click="handleBatchChangeType">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import QuestionAPI from "@/api/exam/question-api";

defineOptions({
  name: "QuestionBatchEdit",
  inheritAttrs: false,
});

const route = useRoute();
const router = useRouter();

interface EditRow {
  id: number;
  type: string;
  contentZh: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  optionF: string;
  optionG: string;
  optionH: string;
  answer: string;
  explanationZh: string;
  subjectId: string;
}

const tableData = ref<EditRow[]>([]);
const subjectId = ref<string>("");
const batchChangeTypeVisible = ref(false);
const selectedType = ref<string>("");

onMounted(() => {
  const ids = route.query.ids as string;
  subjectId.value = route.query.subjectId as string;

  if (!ids || !subjectId.value) {
    ElMessage.error("参数错误");
    router.back();
    return;
  }

  loadQuestions(ids.split(",").map(Number));
});

// 加载题目数据
async function loadQuestions(ids: number[]) {
  try {
    const promises = ids.map((id) => QuestionAPI.getFormData(id));
    const results = await Promise.all(promises);

    tableData.value = results.map((data) => {
      const options = parseOptions(data.optionsZh);
      return {
        id: data.id,
        type: data.type,
        contentZh: stripHtml(data.contentZh),
        optionA: options[0]?.value || "",
        optionB: options[1]?.value || "",
        optionC: options[2]?.value || "",
        optionD: options[3]?.value || "",
        optionE: options[4]?.value || "",
        optionF: options[5]?.value || "",
        optionG: options[6]?.value || "",
        optionH: options[7]?.value || "",
        answer: data.answer,
        explanationZh: stripHtml(data.explanationZh),
        subjectId: data.subjectId,
      };
    });
  } catch (error) {
    ElMessage.error("加载题目失败");
    console.error(error);
  }
}

// 解析选项
function parseOptions(optionsStr: string): { label: string; value: string }[] {
  try {
    return JSON.parse(optionsStr || "[]");
  } catch {
    return [];
  }
}

// 去除HTML标签
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "");
}

// 题型改变
function handleTypeChange(row: EditRow) {
  if (row.type === "JUDGE") {
    row.optionA = "正确";
    row.optionB = "错误";
    row.optionC = "";
    row.optionD = "";
    row.optionE = "";
    row.optionF = "";
    row.optionG = "";
    row.optionH = "";
    row.answer = "A";
  } else {
    // 单选或多选题，清空答案让用户重新输入
    row.answer = "";
  }
}

// 显示批量更换题型对话框
function showBatchChangeTypeDialog() {
  selectedType.value = "";
  batchChangeTypeVisible.value = true;
}

// 批量更换题型
async function handleBatchChangeType() {
  if (!selectedType.value) {
    ElMessage.warning("请选择题型");
    return;
  }

  try {
    // 直接调用API更换题型
    const ids = tableData.value.map((row) => row.id);
    await QuestionAPI.batchChangeType(ids, selectedType.value);

    batchChangeTypeVisible.value = false;
    ElMessage.success(`已将所有题目更换为${getTypeLabel(selectedType.value)}`);

    // 返回上一页
    router.back();
  } catch (error) {
    ElMessage.error("批量更换题型失败");
    console.error(error);
  }
}

// 获取题型标签
function getTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    SINGLE: "单选题",
    MULTIPLE: "多选题",
    JUDGE: "判断题",
  };
  return typeMap[type] || type;
}

// 保存修改
async function handleSave() {
  try {
    // 验证数据
    for (let i = 0; i < tableData.value.length; i++) {
      const row = tableData.value[i];
      if (!row.contentZh.trim()) {
        ElMessage.error(`第 ${i + 1} 题的题干不能为空`);
        return;
      }
      if (row.type !== "JUDGE") {
        if (!row.optionA.trim() || !row.optionB.trim()) {
          ElMessage.error(`第 ${i + 1} 题至少需要两个选项`);
          return;
        }
      }
      if (!row.answer || !row.answer.trim()) {
        ElMessage.error(`第 ${i + 1} 题请输入答案`);
        return;
      }
      // 验证答案格式（单个大写字母或多个大写字母）
      const answerPattern = /^[A-H]+$/;
      if (!answerPattern.test(row.answer.toUpperCase())) {
        ElMessage.error(`第 ${i + 1} 题答案格式错误，请输入A-H的字母组合（如：A 或 ABC）`);
        return;
      }
    }

    // 构建更新请求
    const questions = tableData.value.map((row) => {
      const options = [];
      if (row.optionA) options.push({ label: "A", value: row.optionA });
      if (row.optionB) options.push({ label: "B", value: row.optionB });
      if (row.optionC) options.push({ label: "C", value: row.optionC });
      if (row.optionD) options.push({ label: "D", value: row.optionD });
      if (row.optionE) options.push({ label: "E", value: row.optionE });
      if (row.optionF) options.push({ label: "F", value: row.optionF });
      if (row.optionG) options.push({ label: "G", value: row.optionG });
      if (row.optionH) options.push({ label: "H", value: row.optionH });

      const updateData: any = {
        id: row.id,
        type: row.type,
        contentZh: `<p>${row.contentZh}</p>`,
        optionsZh: JSON.stringify(options),
        answer: row.answer.toUpperCase(),
        subjectId: row.subjectId,
      };

      // 只有当字段有值时才设置，避免空字符串导致 JSON 字段错误
      if (row.explanationZh && row.explanationZh.trim()) {
        updateData.explanationZh = `<p>${row.explanationZh}</p>`;
      }

      return updateData;
    });

    await QuestionAPI.batchUpdate(questions);
    ElMessage.success("批量更新成功");
    router.back();
  } catch (error) {
    ElMessage.error("批量更新失败");
    console.error(error);
  }
}

// 取消
function handleCancel() {
  ElMessageBox.confirm("确认取消编辑吗？未保存的修改将丢失", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    router.back();
  });
}
</script>

<style scoped lang="scss">
.batch-edit-container {
  padding: 20px;
}

.header-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  :deep(.el-button) {
    font-weight: bold;
  }
}

.batch-edit-table {
  :deep(.el-table__header) {
    th {
      font-weight: bold;
      color: #000;
      background-color: #f5f7fa;
    }
  }

  :deep(.el-input__inner) {
    font-size: 13px;
  }

  :deep(.el-textarea__inner) {
    font-size: 13px;
  }

  .judge-option {
    font-size: 13px;
    color: #909399;
  }
}

// 批量更换题型对话框样式
:deep(.el-dialog) {
  .el-dialog__header {
    padding: 16px 20px 12px;
    margin-right: 0;
    border-bottom: 1px solid #e8eaec;

    .el-dialog__title {
      font-size: 16px;
      font-weight: 600;
      line-height: 24px;
      color: #303133;
    }

    .el-dialog__headerbtn {
      top: 16px;
      right: 20px;
      width: 24px;
      height: 24px;
      font-size: 16px;
      line-height: 24px;
    }
  }

  .el-dialog__body {
    padding: 24px 20px;
  }

  .el-dialog__footer {
    padding: 15px 20px 20px;
    border-top: 1px solid #e8eaec;
  }

  .el-select {
    .el-input__wrapper {
      font-size: 16px;
    }
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
