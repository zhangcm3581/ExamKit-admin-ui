<template>
  <div class="practice-container">
    <el-card v-loading="loading" class="practice-card">
      <!-- 顶部导航栏 -->
      <div class="top-bar">
        <div v-if="subjectInfo" class="subject-title">
          <div class="subject-title-zh">{{ subjectInfo.nameZh }}</div>
          <div v-if="subjectInfo.nameEn" class="subject-title-en">{{ subjectInfo.nameEn }}</div>
        </div>
      </div>

      <el-divider style="margin: 12px 0" />

      <!-- 主体内容区 -->
      <div class="content-wrapper">
        <!-- 左侧题目区域：有双语内容时显示 Tab 切换 -->
        <div v-if="hasEnglishContent" class="question-area">
          <!-- 中英文切换 Tab -->
          <el-tabs v-model="activeLanguageTab" type="border-card" class="content-tabs">
            <!-- 中文 Tab -->
            <el-tab-pane label="中文" name="zh">
              <!-- 题型标签 -->
              <div v-if="currentQuestion.type" class="question-type-tag">
                <el-tag
                  :type="getQuestionTypeColor(currentQuestion.type) || undefined"
                  size="small"
                >
                  {{ getQuestionTypeText(currentQuestion.type) }}
                </el-tag>
              </div>

              <!-- 题目内容 -->
              <div v-if="currentQuestion.contentZh" class="question-content">
                <div v-html="currentQuestion.contentZh"></div>
              </div>

              <!-- 选项列表 -->
              <div v-if="currentQuestion.optionsZh" class="options-section">
                <div class="options-list">
                  <div
                    v-for="option in parseOptions(currentQuestion.optionsZh)"
                    :key="'zh-' + option.label"
                    class="option-item"
                    :class="{ 'is-answer': isCorrectOption(option.label) }"
                  >
                    <span class="option-label">{{ option.label }}</span>
                    <span class="option-text" v-html="option.value"></span>
                    <el-icon
                      v-if="isCorrectOption(option.label)"
                      class="answer-icon"
                      color="#67c23a"
                    >
                      <CircleCheck />
                    </el-icon>
                  </div>
                </div>
              </div>

              <!-- 答案 -->
              <div class="answer-section">
                <span class="section-label">答案：</span>
                <span class="answer-content">{{ currentQuestion.answer }}</span>
              </div>

              <!-- 解析 -->
              <div v-if="currentQuestion.explanationZh" class="explanation-section">
                <div class="section-label">解析：</div>
                <div
                  class="explanation-content"
                  v-html="formatExplanation(currentQuestion.explanationZh)"
                ></div>
              </div>
            </el-tab-pane>

            <!-- 英文 Tab -->
            <el-tab-pane label="英文" name="en">
              <!-- 题型标签 -->
              <div v-if="currentQuestion.type" class="question-type-tag">
                <el-tag
                  :type="getQuestionTypeColor(currentQuestion.type) || undefined"
                  size="small"
                >
                  {{ getQuestionTypeText(currentQuestion.type) }}
                </el-tag>
              </div>

              <!-- 题目内容 -->
              <div v-if="currentQuestion.contentEn" class="question-content">
                <div v-html="currentQuestion.contentEn"></div>
              </div>

              <!-- 选项列表 -->
              <div v-if="currentQuestion.optionsEn" class="options-section">
                <div class="options-list">
                  <div
                    v-for="option in parseOptions(currentQuestion.optionsEn)"
                    :key="'en-' + option.label"
                    class="option-item"
                    :class="{ 'is-answer': isCorrectOption(option.label) }"
                  >
                    <span class="option-label">{{ option.label }}</span>
                    <span class="option-text" v-html="option.value"></span>
                    <el-icon
                      v-if="isCorrectOption(option.label)"
                      class="answer-icon"
                      color="#67c23a"
                    >
                      <CircleCheck />
                    </el-icon>
                  </div>
                </div>
              </div>

              <!-- 答案 -->
              <div class="answer-section">
                <span class="section-label">Answer:</span>
                <span class="answer-content">{{ currentQuestion.answer }}</span>
              </div>

              <!-- 解析 -->
              <div v-if="currentQuestion.explanationEn" class="explanation-section">
                <div class="section-label">Explanation:</div>
                <div
                  class="explanation-content"
                  v-html="formatExplanation(currentQuestion.explanationEn)"
                ></div>
              </div>
            </el-tab-pane>
          </el-tabs>

          <!-- 导航按钮 -->
          <div class="navigation-buttons">
            <el-button
              class="nav-button prev-button"
              :disabled="currentIndex === 0"
              @click="handlePrevious"
            >
              <el-icon><ArrowLeft /></el-icon>
              <span>上一题</span>
            </el-button>
            <el-button
              class="nav-button next-button"
              type="primary"
              :disabled="currentIndex === questions.length - 1"
              @click="handleNext"
            >
              <span>下一题</span>
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 左侧题目区域：只有单语内容时不显示 Tab -->
        <div v-else class="question-area">
          <div class="single-language-content">
            <!-- 题型标签 -->
            <div v-if="currentQuestion.type" class="question-type-tag">
              <el-tag :type="getQuestionTypeColor(currentQuestion.type) || undefined" size="small">
                {{ getQuestionTypeText(currentQuestion.type) }}
              </el-tag>
            </div>

            <!-- 题目内容 -->
            <div
              v-if="currentQuestion.contentZh || currentQuestion.contentEn"
              class="question-content"
            >
              <div v-html="currentQuestion.contentZh || currentQuestion.contentEn"></div>
            </div>

            <!-- 选项列表 -->
            <div
              v-if="currentQuestion.optionsZh || currentQuestion.optionsEn"
              class="options-section"
            >
              <div class="options-list">
                <div
                  v-for="option in parseOptions(
                    currentQuestion.optionsZh || currentQuestion.optionsEn
                  )"
                  :key="option.label"
                  class="option-item"
                  :class="{ 'is-answer': isCorrectOption(option.label) }"
                >
                  <span class="option-label">{{ option.label }}</span>
                  <span class="option-text" v-html="option.value"></span>
                  <el-icon v-if="isCorrectOption(option.label)" class="answer-icon" color="#67c23a">
                    <CircleCheck />
                  </el-icon>
                </div>
              </div>
            </div>

            <!-- 答案 -->
            <div class="answer-section">
              <span class="section-label">
                {{ currentQuestion.contentZh ? "答案：" : "Answer: " }}
              </span>
              <span class="answer-content">{{ currentQuestion.answer }}</span>
            </div>

            <!-- 解析 -->
            <div
              v-if="currentQuestion.explanationZh || currentQuestion.explanationEn"
              class="explanation-section"
            >
              <div class="section-label">
                {{ currentQuestion.contentZh ? "解析：" : "Explanation: " }}
              </div>
              <div
                class="explanation-content"
                v-html="
                  formatExplanation(currentQuestion.explanationZh || currentQuestion.explanationEn)
                "
              ></div>
            </div>
          </div>

          <!-- 导航按钮 -->
          <div class="navigation-buttons">
            <el-button
              class="nav-button prev-button"
              :disabled="currentIndex === 0"
              @click="handlePrevious"
            >
              <el-icon><ArrowLeft /></el-icon>
              <span>上一题</span>
            </el-button>
            <el-button
              class="nav-button next-button"
              type="primary"
              :disabled="currentIndex === questions.length - 1"
              @click="handleNext"
            >
              <span>下一题</span>
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 右侧答题卡 -->
        <div class="answer-sheet">
          <div class="sheet-title">答题卡</div>

          <!-- 题目序号网格 -->
          <div class="number-grid">
            <div
              v-for="(q, index) in questions"
              :key="q.id"
              class="number-item"
              :class="{ active: currentIndex === index }"
              @click="handleSelectQuestion(index)"
            >
              {{ index + 1 }}
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, ArrowRight, CircleCheck } from "@element-plus/icons-vue";
import QuestionAPI, { type QuestionVO, type QuestionPageQuery } from "@/api/exam/question-api";
import SubjectAPI, { type SubjectVO } from "@/api/exam/subject-api";

defineOptions({
  name: "PracticeView",
  inheritAttrs: false,
});

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const questions = ref<QuestionVO[]>([]);
const currentIndex = ref(0);
const activeLanguageTab = ref("zh");
const subjectInfo = ref<SubjectVO | null>(null);

// 当前题目
const currentQuestion = computed(() => {
  return questions.value[currentIndex.value] || {};
});

// 是否支持英文（仅根据科目的 supportLanguages 字段判断）
const hasEnglishContent = computed(() => {
  if (!subjectInfo.value || !subjectInfo.value.supportLanguages) {
    return false;
  }
  const languages = subjectInfo.value.supportLanguages.toLowerCase();
  return languages.includes("zh") && languages.includes("en");
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
function getQuestionTypeColor(type: string): "success" | "info" | "warning" | "danger" | "" {
  const colorMap: Record<string, "success" | "info" | "warning" | "danger" | ""> = {
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
    return parsed.map((opt: any) => ({
      label: opt.label || opt.key,
      value: opt.value || opt.text,
    }));
  } catch {
    return [];
  }
}

// 判断是否是正确选项
function isCorrectOption(optionLabel: string): boolean {
  const answer = currentQuestion.value.answer || "";
  return answer.includes(optionLabel);
}

// 格式化解析内容
function formatExplanation(content: string): string {
  if (!content) return "";

  // 处理 Markdown 风格的代码块
  const markdownCodeBlockRegex = /```\w*\n([\s\S]*?)```/g;
  let hasMarkdownCode = false;

  content = content.replace(markdownCodeBlockRegex, (match, code) => {
    hasMarkdownCode = true;
    return "<pre><code>" + escapeHtml(code.trim()) + "</code></pre>";
  });

  if (hasMarkdownCode) {
    return content
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed && !line.includes("<pre>") && !line.includes("</pre>")) {
          return "<p>" + line + "</p>";
        }
        return line;
      })
      .join("");
  }

  // 简单的换行处理
  return content
    .split("\n")
    .map((line) => (line.trim() ? "<p>" + line + "</p>" : ""))
    .join("");
}

// HTML 转义函数
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 上一题
function handlePrevious() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
}

// 下一题
function handleNext() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++;
  }
}

// 选择题目
function handleSelectQuestion(index: number) {
  currentIndex.value = index;
}

// 获取科目详情
async function fetchSubjectInfo() {
  try {
    const subjectId = route.query.subjectId as string;
    const res = await SubjectAPI.getFormData(subjectId);

    // 响应拦截器已经处理过了，直接使用 res 而不是 res.data
    subjectInfo.value = res as any;
  } catch (error) {
    console.error("获取科目信息失败:", error);
  }
}

// 获取题目数据
async function fetchData() {
  loading.value = true;
  try {
    const queryParams: QuestionPageQuery = {
      subjectId: route.query.subjectId as string,
      pageNum: 1,
      pageSize: 1000, // 获取所有题目
    };
    const res = await QuestionAPI.getPage(queryParams);
    questions.value = res.data || [];

    if (questions.value.length === 0) {
      ElMessage.warning("该科目暂无题目");
    }
  } catch {
    ElMessage.error("加载题目失败");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  if (!route.query.subjectId) {
    ElMessage.error("缺少科目ID");
    router.back();
    return;
  }
  // 先获取科目信息，再获取题目
  await fetchSubjectInfo();
  await fetchData();
});
</script>

<style lang="scss" scoped>
.practice-container {
  height: calc(100vh - 90px);
  padding: 12px;
  overflow-y: auto;

  .practice-card {
    :deep(.el-card__body) {
      padding: 16px;
    }
  }
}

.top-bar {
  margin-bottom: 16px;

  .subject-title {
    padding: 12px 16px;
    background-color: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 8px;

    .subject-title-zh {
      margin-bottom: 2px;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.5;
      color: #303133;
    }

    .subject-title-en {
      font-size: 13px;
      font-weight: 400;
      line-height: 1.4;
      color: #606266;
    }
  }
}

.content-wrapper {
  display: flex;
  gap: 16px;

  .question-area {
    flex: 1;
  }

  .answer-sheet {
    flex-shrink: 0;
    width: 240px;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 6px;

    .sheet-title {
      margin-bottom: 12px;
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      text-align: center;
    }

    .number-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
      max-height: 670px;
      padding-right: 5px;
      overflow-y: auto;

      /* 美化滚动条 */
      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background-color: #f1f1f1;
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: #c1c1c1;
        border-radius: 3px;
        transition: background-color 0.2s;

        &:hover {
          background-color: #a8a8a8;
        }
      }

      .number-item {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 28px;
        font-size: 11px;
        font-weight: 500;
        color: #606266;
        cursor: pointer;
        background-color: #fff;
        border: 1px solid #dcdfe6;
        border-radius: 3px;
        transition: all 0.2s;

        &:hover {
          color: #409eff;
          background-color: #ecf5ff;
          border-color: #409eff;
        }

        &.active {
          color: #fff;
          background-color: #409eff;
          border-color: #409eff;
        }
      }
    }
  }
}

.content-tabs {
  :deep(.el-tabs__header) {
    padding-left: 0;
    margin-bottom: 10px;
  }

  :deep(.el-tabs__item) {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;

    &.is-active {
      font-weight: 600;
    }
  }

  :deep(.el-tabs__content) {
    padding: 0;
  }

  :deep(.el-tab-pane) {
    padding: 10px 0;
  }
}

.single-language-content {
  padding: 10px 0;
}

.question-type-tag {
  padding-left: 10px;
  margin-bottom: 10px;
}

.question-content {
  padding-left: 10px;
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: #303133;
}

.options-section {
  padding-left: 10px;
  margin-bottom: 12px;

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 5px;

    .option-item {
      position: relative;
      display: flex;
      align-items: center;
      min-height: 26px;
      padding: 4px 8px;
      font-size: 12px;
      border: 1px solid #e4e7ed;
      border-radius: 3px;
      transition: all 0.2s;

      &.is-answer {
        background-color: #f0f9ff;
        border-color: #67c23a;
      }

      .option-label {
        flex-shrink: 0;
        width: 18px;
        height: 18px;
        margin-right: 6px;
        font-size: 11px;
        font-weight: 600;
        line-height: 18px;
        color: #fff;
        text-align: center;
        background-color: #909399;
        border-radius: 50%;
      }

      &.is-answer .option-label {
        background-color: #67c23a;
      }

      .option-text {
        flex: 1;
        line-height: 1.3;
        color: #303133;

        :deep(p) {
          margin: 0;
          line-height: 1.3;
        }

        :deep(br) {
          display: none;
        }
      }

      .answer-icon {
        flex-shrink: 0;
        margin-left: 6px;
        font-size: 14px;
      }
    }
  }
}

.answer-section {
  padding: 8px 10px;
  margin-bottom: 12px;
  margin-left: 10px;
  font-size: 12px;
  background-color: #f0f9ff;
  border-left: 2px solid #67c23a;
  border-radius: 3px;

  .section-label {
    font-weight: 600;
    color: #606266;
  }

  .answer-content {
    font-size: 13px;
    font-weight: 600;
    color: #67c23a;
  }
}

.explanation-section {
  padding: 10px;
  margin-left: 10px;
  font-size: 12px;
  background-color: #fafafa;
  border-radius: 3px;

  .section-label {
    margin-bottom: 6px;
    font-weight: 600;
    color: #606266;
  }

  .explanation-content {
    line-height: 1.5;
    color: #606266;

    :deep(p) {
      margin: 4px 0;
    }

    :deep(pre) {
      padding: 8px;
      margin: 4px 0;
      overflow-x: auto;
      font-family: "Courier New", Consolas, monospace;
      font-size: 11px;
      background-color: #fff;
      border: 1px solid #dcdfe6;
      border-radius: 3px;
    }
  }
}

.navigation-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #e4e7ed;

  .nav-button {
    min-width: 100px;
    font-size: 14px;
    font-weight: 600;

    &.prev-button {
      .el-icon {
        margin-right: 6px;
      }
    }

    &.next-button {
      .el-icon {
        margin-left: 6px;
      }
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    span {
      display: inline-block;
    }
  }
}
</style>
