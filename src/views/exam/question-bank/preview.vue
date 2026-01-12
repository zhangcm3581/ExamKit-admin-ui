<template>
  <div class="app-container">
    <el-card v-loading="loading">
      <!-- 头部信息 -->
      <div class="preview-header">
        <div class="header-info">
          <div class="header-title">
            <h2>题库预览</h2>
            <div class="header-actions">
              <el-button class="action-btn" @click="handleBack">返回</el-button>
              <el-button class="action-btn" type="primary" @click="handlePublish">
                发布到科目
              </el-button>
            </div>
          </div>
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
                <div class="case-text" v-html="formatHtmlContent(row.caseContent)"></div>
              </div>
              <div class="question-content" v-html="formatHtmlContent(row.content)"></div>
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
                <span v-html="formatHtmlContent(option.value)"></span>
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
      width="1000px"
      :close-on-click-modal="false"
    >
      <el-form ref="editFormRef" :model="editForm" label-width="100px">
        <el-form-item label="题号">
          <el-input v-model="editForm.questionNumber" disabled />
        </el-form-item>
        <el-form-item label="题型">
          <el-select v-model="editForm.type" style="width: 100%">
            <el-option label="单选题" value="SINGLE" />
            <el-option label="多选题" value="MULTIPLE" />
            <el-option label="判断题" value="JUDGE" />
          </el-select>
        </el-form-item>
        <el-form-item label="题目内容">
          <WangEditor v-model="editForm.content" :height="250" />
        </el-form-item>

        <!-- 选项编辑 -->
        <el-form-item label="选项">
          <div style="width: 100%">
            <div v-for="(option, index) in editOptions" :key="index" style="margin-bottom: 15px">
              <div style="margin-bottom: 5px; font-weight: 500; color: #606266">
                选项 {{ option.label }}
              </div>
              <WangEditor v-model="option.value" :height="150" />
            </div>
          </div>
        </el-form-item>

        <el-form-item label="答案">
          <el-input v-model="editForm.answer" placeholder="例如：A 或 ABC" />
        </el-form-item>
        <el-form-item label="答案解析">
          <WangEditor v-model="editForm.explanation" :height="200" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button style="font-weight: bold" @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" style="font-weight: bold" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 发布对话框 -->
    <el-dialog
      v-model="publishDialogVisible"
      title="发布到科目"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form ref="publishFormRef" :model="publishForm" label-width="120px">
        <el-form-item label="选择科目">
          <el-select
            v-model="publishForm.subjectId"
            placeholder="请选择科目"
            filterable
            :filter-method="filterSubjects"
            @change="handleSubjectChange"
          >
            <el-option
              v-for="subject in filteredSubjects"
              :key="subject.id"
              :value="subject.id"
              :label="getSubjectSingleName(subject)"
            >
              <template v-if="hasBothLanguages(subject)">
                <div class="subject-option-bilingual">
                  <div class="subject-name-primary">{{ subject.nameZh }}</div>
                  <div class="subject-name-secondary">{{ subject.nameEn }}</div>
                </div>
              </template>
              <template v-else>
                <span>{{ getSubjectSingleName(subject) }}</span>
              </template>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- 选中科目的详细信息 -->
        <el-form-item v-if="selectedSubject" label="" class="selected-subject-info">
          <div class="subject-detail-card">
            <div class="subject-detail-name">{{ selectedSubject.nameZh }}</div>
            <div v-if="selectedSubject.nameEn" class="subject-detail-name-en">
              {{ selectedSubject.nameEn }}
            </div>
          </div>
        </el-form-item>

        <el-form-item label="" class="language-check-info">
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
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button style="font-weight: bold" @click="publishDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="publishLoading"
          style="font-weight: bold"
          @click="handleConfirmPublish"
        >
          确认发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import QuestionBankAPI, {
  type QuestionDraftPreviewVO,
  type QuestionDraftItemVO,
  type LanguageCheckVO,
} from "@/api/exam/question-bank-api";
import SubjectAPI, { type SubjectVO } from "@/api/exam/subject-api";
import WangEditor from "@/components/WangEditor/index.vue";

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
const filteredSubjects = ref<SubjectVO[]>([]);
const filterKeyword = ref("");
const selectedSubject = ref<SubjectVO | null>(null);

const editForm = reactive({
  id: 0,
  questionNumber: 0,
  type: "",
  content: "",
  answer: "",
  explanation: "",
});

// 编辑选项（数组形式）
const editOptions = ref<Array<{ label: string; value: string }>>([]);

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
    filteredSubjects.value = res.data || [];
  } catch (error) {
    console.error("获取科目列表失败", error);
  }
};

// 科目选择变化
const handleSubjectChange = async (subjectId: string) => {
  if (!subjectId) {
    selectedSubject.value = null;
    return;
  }

  // 设置选中的科目
  selectedSubject.value = subjects.value.find((s) => s.id === subjectId) || null;

  try {
    const result = await QuestionBankAPI.checkLanguage(subjectId, metadata.language);
    Object.assign(languageCheck, result);
  } catch (error) {
    console.error("检查语言失败", error);
  }
};

// 自定义过滤方法
const filterSubjects = (keyword: string) => {
  filterKeyword.value = keyword;
  if (!keyword) {
    filteredSubjects.value = subjects.value;
    return;
  }

  const lowerKeyword = keyword.toLowerCase();
  filteredSubjects.value = subjects.value.filter((subject) => {
    const nameZh = (subject.nameZh || "").toLowerCase();
    const nameEn = (subject.nameEn || "").toLowerCase();
    return nameZh.includes(lowerKeyword) || nameEn.includes(lowerKeyword);
  });
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

// 格式化HTML内容（去除<p>标签，保留换行）
const formatHtmlContent = (html: string) => {
  if (!html) return "";
  // 将</p>替换为<br>以保留换行，然后去除<p>和</p>标签
  return html
    .replace(/<\/p>/g, "<br>") // </p> 替换为 <br>
    .replace(/<p>/g, "") // 去除 <p>
    .replace(/<br>$/g, ""); // 去除末尾多余的 <br>
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

  // 解析选项JSON
  try {
    editOptions.value = JSON.parse(row.options);
  } catch (error) {
    editOptions.value = [];
    console.error("解析选项失败", error);
  }

  editDialogVisible.value = true;
};

// 保存编辑
const handleSaveEdit = async () => {
  try {
    // 将选项数组转为JSON字符串
    const optionsJson = JSON.stringify(editOptions.value);

    await QuestionBankAPI.updateDraft(editForm.id, {
      type: editForm.type,
      content: editForm.content,
      options: optionsJson,
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

  try {
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
      router.push("/exam/provider");
    }, 1000);
  } catch (error: any) {
    ElMessage.error("发布失败");
    console.error(error);
  } finally {
    publishLoading.value = false;
  }
};

// 判断科目是否同时支持中英文
const hasBothLanguages = (subject: SubjectVO) => {
  if (!subject) return false;

  const supportLanguages = subject.supportLanguages || "";
  const hasZh = supportLanguages.includes("zh");
  const hasEn = supportLanguages.includes("en");
  const hasNameZh = !!(subject.nameZh && subject.nameZh.trim());
  const hasNameEn = !!(subject.nameEn && subject.nameEn.trim());

  return hasZh && hasEn && hasNameZh && hasNameEn;
};

// 获取科目单一名称（用于选中后输入框显示）
const getSubjectSingleName = (subject: SubjectVO) => {
  const supportLanguages = subject.supportLanguages || "";
  const hasZh = supportLanguages.includes("zh");
  const hasEn = supportLanguages.includes("en");

  // 优先显示中文
  if (hasZh && subject.nameZh) {
    return subject.nameZh;
  }

  // 其次显示英文
  if (hasEn && subject.nameEn) {
    return subject.nameEn;
  }

  // 兜底：返回任何可用的名称
  return subject.nameZh || subject.nameEn || "未命名科目";
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

<style lang="scss">
/* 科目选项双语显示样式 - 全局样式 */
.subject-option-bilingual {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
  width: 100% !important;
  min-height: 50px !important;
  padding: 8px 0 !important;
  line-height: 1.4 !important;

  .subject-name-primary {
    font-size: 14px !important;
    font-weight: 500 !important;
    color: #303133 !important;
    overflow-wrap: break-word !important;
    white-space: normal !important;
  }

  .subject-name-secondary {
    padding-top: 6px !important;
    font-size: 12px !important;
    color: #909399 !important;
    overflow-wrap: break-word !important;
    white-space: normal !important;
    border-top: 1px dashed #d9d9d9 !important;
  }
}

/* 确保 el-option 有足够的高度和明显的区分 */
.el-select-dropdown__item {
  height: auto !important;
  min-height: 34px !important;
  padding: 12px 20px !important;
  margin-bottom: 2px !important;
  line-height: normal !important;
  background-color: #ffffff !important;
  border: 1px solid #e4e7ed !important;
  border-radius: 4px !important;
  transition: all 0.2s;
}

.el-select-dropdown__item:hover {
  background-color: #f5f7fa !important;
  border-color: #c0c4cc !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
}

.el-select-dropdown__item.selected {
  background-color: #ecf5ff !important;
  border-color: #409eff !important;
}

/* 下拉菜单内边距调整 */
.el-select-dropdown__list {
  padding: 6px !important;
}

/* 发布弹窗样式优化 */
.el-dialog {
  min-height: 400px;
}

.el-select-dropdown {
  max-height: 450px !important;
}

/* 选中科目详情卡片 */
.selected-subject-info {
  margin-bottom: 16px !important;
}

.subject-detail-card {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.subject-detail-name {
  margin-bottom: 4px;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  color: #ffffff;
}

.subject-detail-name-en {
  padding-top: 6px;
  font-size: 14px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.9);
  border-top: 1px dashed rgba(255, 255, 255, 0.3);
}

/* 语言检查信息 */
.language-check-info {
  margin-bottom: 0 !important;
}
</style>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}

.preview-header {
  margin-bottom: 20px;

  .header-info {
    .header-title {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      margin-bottom: 15px;

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }
    }
  }

  .header-actions {
    display: flex;
    gap: 10px;
    margin-left: 20px;

    .action-btn {
      font-weight: bold;
    }
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
