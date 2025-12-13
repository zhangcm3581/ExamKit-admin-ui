<template>
  <div class="app-container">
    <el-card v-loading="loading">
      <!-- 头部信息 -->
      <div class="preview-header">
        <div class="header-info">
          <h2>题库预览</h2>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="文件名">{{ metadata.fileName }}</el-descriptions-item>
            <el-descriptions-item label="语言">
              <el-tag :type="metadata.language === 'zh' ? 'success' : 'primary'">
                {{ metadata.language === "zh" ? "中文" : "英文" }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="题目总数">{{ metadata.totalCount }}</el-descriptions-item>
            <el-descriptions-item label="批次ID">
              <el-text size="small" type="info">{{ metadata.batchId }}</el-text>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="header-actions">
          <el-button @click="handleBack">返回</el-button>
          <el-button type="primary" @click="handlePublish">发布到科目</el-button>
        </div>
      </div>

      <!-- 题目列表 -->
      <div class="question-list">
        <el-table :data="questions" border stripe>
          <el-table-column prop="questionNumber" label="题号" width="80" align="center" />
          <el-table-column label="题型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getQuestionTypeColor(row.type)">
                {{ getQuestionTypeText(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="题目内容" min-width="300">
            <template #default="{ row }">
              <div v-if="row.isCase && row.caseContent" class="case-content">
                <el-text type="warning" size="small">【案例背景】</el-text>
                <div class="case-text">{{ row.caseContent }}</div>
              </div>
              <div class="question-content">{{ row.content }}</div>
            </template>
          </el-table-column>
          <el-table-column label="选项" min-width="200">
            <template #default="{ row }">
              <div
                v-for="option in parseOptions(row.options)"
                :key="option.label"
                class="option-item"
              >
                <el-tag
                  size="small"
                  :type="isCorrectOption(row.answer, option.label) ? 'success' : 'info'"
                >
                  {{ option.label }}
                </el-tag>
                {{ option.value }}
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="answer" label="答案" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="success">{{ row.answer }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑题目"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form ref="editFormRef" :model="editForm" label-width="100px">
        <el-form-item label="题号">
          <el-input v-model="editForm.questionNumber" disabled />
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="editForm.type" disabled>
            <el-option label="单选题" value="SINGLE" />
            <el-option label="多选题" value="MULTIPLE" />
            <el-option label="判断题" value="JUDGE" />
          </el-select>
        </el-form-item>
        <el-form-item label="题目内容">
          <el-input v-model="editForm.content" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="答案">
          <el-input v-model="editForm.answer" />
        </el-form-item>
        <el-form-item label="答案解析">
          <el-input v-model="editForm.explanation" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 发布对话框 -->
    <el-dialog
      v-model="publishDialogVisible"
      title="发布到科目"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="publishFormRef" :model="publishForm" label-width="120px">
        <el-form-item label="选择科目">
          <el-select
            v-model="publishForm.subjectId"
            placeholder="请选择科目"
            filterable
            @change="handleSubjectChange"
          >
            <el-option
              v-for="subject in subjects"
              :key="subject.id"
              :label="subject.nameZh"
              :value="subject.id"
            />
          </el-select>
        </el-form-item>

        <el-alert v-if="languageCheck.hasLanguage" type="warning" :closable="false" show-icon>
          <template #title>
            该科目已存在{{ metadata.language === "zh" ? "中文" : "英文" }}题目（共{{
              languageCheck.questionCount
            }}题）， 发布后将
            <strong>全量替换</strong>
            该语言的题目内容
          </template>
        </el-alert>

        <el-alert v-else-if="publishForm.subjectId" type="info" :closable="false" show-icon>
          <template #title>
            该科目暂无{{ metadata.language === "zh" ? "中文" : "英文" }}题目，发布后将
            <strong>全量插入</strong>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="publishLoading" @click="handleConfirmPublish">
          确认发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import QuestionBankAPI, {
  type QuestionDraftPreviewVO,
  type QuestionDraftItemVO,
  type LanguageCheckVO,
} from "@/api/exam/question-bank-api";
import SubjectAPI, { type SubjectVO } from "@/api/exam/subject-api";

defineOptions({
  name: "QuestionBankPreview",
  inheritAttrs: false,
});

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const editDialogVisible = ref(false);
const publishDialogVisible = ref(false);
const publishLoading = ref(false);

const metadata = reactive({
  batchId: "",
  language: "",
  fileName: "",
  totalCount: 0,
});

const questions = ref<QuestionDraftItemVO[]>([]);
const subjects = ref<SubjectVO[]>([]);

const editForm = reactive({
  id: 0,
  questionNumber: 0,
  type: "",
  content: "",
  answer: "",
  explanation: "",
});

const publishForm = reactive({
  subjectId: "",
});

const languageCheck = reactive<LanguageCheckVO>({
  hasLanguage: false,
  questionCount: 0,
});

// 获取预览数据
const fetchPreview = async () => {
  const batchId = route.query.batchId as string;
  if (!batchId) {
    ElMessage.error("缺少批次ID");
    router.back();
    return;
  }

  loading.value = true;
  try {
    const data: QuestionDraftPreviewVO = await QuestionBankAPI.getPreview(batchId);
    Object.assign(metadata, data.metadata);
    questions.value = data.questions;

    // 如果路由参数中有subjectId，自动选中
    if (route.query.subjectId) {
      publishForm.subjectId = route.query.subjectId as string;
      await handleSubjectChange(publishForm.subjectId);
    }
  } catch (error) {
    ElMessage.error("获取预览数据失败");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 获取科目列表
const fetchSubjects = async () => {
  try {
    const res = await SubjectAPI.getPage({ pageNum: 1, pageSize: 1000 });
    subjects.value = res.data || [];
  } catch (error) {
    console.error("获取科目列表失败", error);
  }
};

// 科目选择变化
const handleSubjectChange = async (subjectId: string) => {
  if (!subjectId) {
    return;
  }

  try {
    const result = await QuestionBankAPI.checkLanguage(subjectId, metadata.language);
    Object.assign(languageCheck, result);
  } catch (error) {
    console.error("检查语言失败", error);
  }
};

// 解析选项JSON
const parseOptions = (optionsJson: string) => {
  try {
    return JSON.parse(optionsJson);
  } catch {
    return [];
  }
};

// 判断是否为正确选项
const isCorrectOption = (answer: string, label: string) => {
  return answer.includes(label);
};

// 获取题型文本
const getQuestionTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    SINGLE: "单选",
    MULTIPLE: "多选",
    JUDGE: "判断",
  };
  return typeMap[type] || type;
};

// 获取题型颜色
const getQuestionTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    SINGLE: "primary",
    MULTIPLE: "success",
    JUDGE: "warning",
  };
  return colorMap[type] || "";
};

// 编辑题目
const handleEdit = (row: QuestionDraftItemVO) => {
  Object.assign(editForm, {
    id: row.id,
    questionNumber: row.questionNumber,
    type: row.type,
    content: row.content,
    answer: row.answer,
    explanation: row.explanation || "",
  });
  editDialogVisible.value = true;
};

// 保存编辑
const handleSaveEdit = async () => {
  try {
    await QuestionBankAPI.updateDraft(editForm.id, {
      content: editForm.content,
      answer: editForm.answer,
      explanation: editForm.explanation,
    });
    ElMessage.success("保存成功");
    editDialogVisible.value = false;
    fetchPreview();
  } catch (error) {
    ElMessage.error("保存失败");
    console.error(error);
  }
};

// 打开发布对话框
const handlePublish = () => {
  publishDialogVisible.value = true;
};

// 确认发布
const handleConfirmPublish = async () => {
  if (!publishForm.subjectId) {
    ElMessage.warning("请选择科目");
    return;
  }

  const confirmText = languageCheck.hasLanguage
    ? `确认要全量替换该科目的${metadata.language === "zh" ? "中文" : "英文"}题目吗？原有题目将被覆盖。`
    : `确认要发布到该科目吗？`;

  try {
    await ElMessageBox.confirm(confirmText, "确认发布", {
      type: "warning",
    });

    publishLoading.value = true;
    const result = await QuestionBankAPI.publish({
      batchId: metadata.batchId,
      subjectId: publishForm.subjectId,
    });

    ElMessage.success(
      `发布成功！已发布 ${result.publishedQuestions} 道题目（${result.mode === "replace" ? "替换模式" : "插入模式"}）`
    );
    publishDialogVisible.value = false;

    setTimeout(() => {
      router.push("/exam/subject");
    }, 1000);
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("发布失败");
      console.error(error);
    }
  } finally {
    publishLoading.value = false;
  }
};

// 返回
const handleBack = () => {
  router.back();
};

onMounted(() => {
  fetchPreview();
  fetchSubjects();
});
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;

  .header-info {
    flex: 1;

    h2 {
      margin: 0 0 15px 0;
      font-size: 20px;
      font-weight: 600;
    }
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }
}

.question-list {
  margin-top: 20px;

  .case-content {
    padding: 10px;
    margin-bottom: 10px;
    background: #fff7e6;
    border-left: 3px solid #faad14;
    border-radius: 4px;

    .case-text {
      margin-top: 5px;
      font-size: 13px;
      color: #666;
    }
  }

  .question-content {
    line-height: 1.6;
  }

  .option-item {
    margin-bottom: 5px;
    line-height: 1.8;

    .el-tag {
      margin-right: 8px;
    }
  }
}
</style>
