<template>
  <div
    class="practice-page min-h-[calc(100vh-90px)] py-3 px-4 overflow-auto"
    :class="eyeProtection ? 'bg-eye-protection' : 'bg-[#f9fafb]'"
  >
    <!-- 加载中 -->
    <div
      v-if="loading"
      class="flex items-center justify-center h-[60vh] gap-3 text-gray-500 text-sm"
    >
      <span class="loading-spinner"></span>
      <span>加载中...</span>
    </div>

    <!-- 主体两栏 -->
    <div v-else class="max-w-7xl mx-auto flex gap-4">
      <!-- 左：question-panel -->
      <div class="flex-1 min-w-0 bg-white rounded-lg overflow-hidden">
        <!-- 顶栏：科目信息 + 中/EN 胶囊 -->
        <div class="flex items-center justify-between gap-2 border-b border-gray-200 px-5 h-11">
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded bg-gradient-to-br from-blue-400 to-blue-500 text-white"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-sm font-medium text-gray-700 truncate">
                {{ subjectInfo?.nameZh || subjectInfo?.nameEn || "题目练习" }}
              </span>
              <span class="text-xs text-gray-400">|</span>
              <span class="text-xs text-gray-400">背题模式</span>
            </div>
          </div>
          <div
            v-if="hasEnglishContent && currentBilingual"
            class="flex items-center bg-gray-100 rounded-full p-0.5 flex-shrink-0"
          >
            <button
              class="px-2.5 py-0.5 text-xs rounded-full transition-colors cursor-pointer"
              :class="
                questionLocale === 'zh'
                  ? 'bg-white text-blue-600 shadow-sm font-medium'
                  : 'text-gray-400 hover:text-gray-600'
              "
              @click="questionLocale = 'zh'"
            >
              中
            </button>
            <button
              class="px-2.5 py-0.5 text-xs rounded-full transition-colors cursor-pointer"
              :class="
                questionLocale === 'en'
                  ? 'bg-white text-blue-600 shadow-sm font-medium'
                  : 'text-gray-400 hover:text-gray-600'
              "
              @click="questionLocale = 'en'"
            >
              EN
            </button>
          </div>
        </div>

        <!-- 题目区 -->
        <div v-if="questions.length > 0" class="px-5 py-5">
          <!-- 案例背景 -->
          <div
            v-if="displayCaseContent"
            class="mb-4 p-3 bg-blue-50/70 border border-blue-100 rounded-lg"
          >
            <div class="flex items-center gap-1.5 mb-2">
              <span class="text-xs font-medium text-blue-600 px-1.5 py-0.5 bg-blue-100 rounded">
                案例题
              </span>
              <span class="text-xs text-blue-400">案例背景</span>
            </div>
            <div class="text-sm text-gray-700 leading-relaxed" v-html="displayCaseContent"></div>
          </div>

          <!-- 题号 + 题型 + 题干 -->
          <div class="mb-5 select-none">
            <div class="text-gray-800 leading-relaxed break-words" :class="fontSizeClass">
              <span
                class="inline-block rounded-sm text-white align-text-bottom"
                style="
                  padding: 0 4px;
                  margin-right: 4px;
                  font-size: 12px;
                  line-height: 18px;
                  background-color: #198cff;
                "
              >
                {{ getQuestionTypeText(currentQuestion.type) }}
              </span>
              <span class="font-semibold">{{ currentIndex + 1 }}/{{ questions.length }}、</span>
              <span v-html="displayContent"></span>
            </div>
          </div>

          <!-- 选项列表 -->
          <div v-if="displayOptions.length > 0" class="space-y-2 mb-4" :class="fontSizeClass">
            <div
              v-for="opt in displayOptions"
              :key="opt.label"
              class="w-full text-left px-3 py-2 rounded border transition-all"
              :class="
                isCorrectOption(opt.label)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              "
            >
              <div class="flex items-start gap-2 select-none">
                <span class="flex-shrink-0 font-medium text-gray-700">{{ opt.label }}.</span>
                <span class="flex-1 text-gray-700" v-html="opt.value"></span>
              </div>
            </div>
          </div>

          <!-- 上一题 / 下一题 -->
          <div class="flex items-center gap-2 py-3">
            <button
              class="h-7 px-4 text-xs rounded border transition-colors cursor-pointer"
              :class="
                currentIndex > 0
                  ? 'text-[#1a8cff] border-[#1a8cff] bg-white hover:bg-blue-50'
                  : 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed'
              "
              :disabled="currentIndex <= 0"
              @click="handlePrevious"
            >
              上一题
            </button>
            <button
              class="h-7 px-4 text-xs rounded border transition-colors cursor-pointer"
              :class="
                currentIndex < questions.length - 1
                  ? 'text-white bg-blue-500 border-blue-500 hover:bg-blue-600'
                  : 'text-gray-300 border-gray-200 bg-gray-50 cursor-not-allowed'
              "
              :disabled="currentIndex >= questions.length - 1"
              @click="handleNext"
            >
              下一题
            </button>
          </div>

          <!-- 解析卡 -->
          <div class="mt-4 border border-blue-100 rounded-lg bg-blue-50 p-4">
            <div class="flex items-center mb-3 text-sm">
              <span>
                正确答案:
                <span class="font-medium text-green-600 ml-1">
                  {{ currentQuestion.answer || "" }}
                </span>
              </span>
            </div>
            <div>
              <div class="font-medium text-gray-700 mb-2 text-sm">答案解析:</div>
              <div
                v-if="displayExplanation"
                class="text-sm text-gray-600 leading-relaxed break-words explanation-content"
                v-html="formatExplanation(displayExplanation)"
              ></div>
              <div v-else class="text-sm text-gray-400">暂无解析</div>
            </div>
          </div>
        </div>

        <!-- 空态 -->
        <div v-else class="flex items-center justify-center h-64 text-gray-400 text-sm">
          暂无题目
        </div>
      </div>

      <!-- 右：answer-card + settings -->
      <div class="hidden sm:block w-60 lg:w-64 flex-shrink-0 space-y-4">
        <!-- 答题卡 -->
        <div class="bg-white rounded-lg overflow-hidden">
          <div class="flex items-center px-3 h-11 border-b border-gray-200">
            <h3 class="text-xs font-bold text-gray-900">答题卡</h3>
          </div>
          <div
            ref="cardGrid"
            class="grid grid-cols-5 gap-1.5 max-h-[276px] overflow-y-auto px-3 pt-2 pb-2 answer-card-scroll"
          >
            <button
              v-for="(q, index) in questions"
              :key="q.id"
              class="w-full h-8 flex items-center justify-center text-xs rounded font-semibold cursor-pointer transition-colors"
              :class="
                currentIndex === index
                  ? 'bg-[#228be6] text-white !ring-2 !ring-offset-1 !ring-[#228be6]'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              "
              @click="handleSelectQuestion(index)"
            >
              {{ index + 1 }}
            </button>
          </div>
        </div>

        <!-- 设置面板 -->
        <div class="bg-white rounded-lg overflow-hidden">
          <h3
            class="text-xs font-bold text-gray-900 px-3 h-11 flex items-center border-b border-gray-200"
          >
            设置
          </h3>
          <div class="space-y-2 px-3 py-2">
            <!-- 护眼模式 -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-600">护眼模式</span>
              <button
                class="relative w-9 h-5 rounded-full transition-colors cursor-pointer"
                :class="eyeProtection ? 'bg-blue-500' : 'bg-gray-300'"
                @click="eyeProtection = !eyeProtection"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                  :class="{ 'translate-x-4': eyeProtection }"
                ></span>
              </button>
            </div>

            <!-- 字体大小 -->
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-600">字体大小</span>
              <div class="flex items-center gap-1">
                <button
                  v-for="size in fontSizes"
                  :key="size.value"
                  class="text-xs px-3 py-1 rounded transition-colors cursor-pointer"
                  :class="
                    fontSize === size.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  "
                  @click="fontSize = size.value"
                >
                  {{ size.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import QuestionAPI, { type QuestionVO, type QuestionPageQuery } from "@/api/exam/question-api";
import SubjectAPI, { type SubjectVO } from "@/api/exam/subject-api";

defineOptions({
  name: "PracticeView",
  inheritAttrs: false,
});

const route = useRoute();
const router = useRouter();

type FontSize = "small" | "medium" | "large";

const loading = ref(false);
const questions = ref<QuestionVO[]>([]);
const currentIndex = ref(0);
const questionLocale = ref<"zh" | "en">("zh");
const subjectInfo = ref<SubjectVO | null>(null);
const cardGrid = ref<HTMLElement | null>(null);

// 阅读偏好
const eyeProtection = ref(false);
const fontSize = ref<FontSize>("medium");

const fontSizes: { label: string; value: FontSize }[] = [
  { label: "较小", value: "small" },
  { label: "标准", value: "medium" },
  { label: "较大", value: "large" },
];

const fontSizeClass = computed(() => {
  const map: Record<FontSize, string> = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };
  return map[fontSize.value] || "text-sm";
});

// 当前题目（空对象兜底）
const currentQuestion = computed(
  () => (questions.value[currentIndex.value] || {}) as Partial<QuestionVO>
);

// 科目是否支持双语
const hasEnglishContent = computed(() => {
  if (!subjectInfo.value || !subjectInfo.value.supportLanguages) return false;
  const languages = subjectInfo.value.supportLanguages.toLowerCase();
  return languages.includes("zh") && languages.includes("en");
});

// 当前题是否双语都有内容
const currentBilingual = computed(() => {
  const q = currentQuestion.value;
  return !!(q && q.contentZh && q.contentEn);
});

// 题型映射
function getQuestionTypeText(type?: string): string {
  if (!type) return "";
  const typeMap: Record<string, string> = {
    SINGLE: "单选题",
    MULTIPLE: "多选题",
    JUDGE: "判断题",
  };
  return typeMap[type] || type;
}

// 选项 JSON 解析（兼容 label/value 与 key/text 两套字段）
function parseOptions(optionsStr: string | undefined): { label: string; value: string }[] {
  if (!optionsStr) return [];
  try {
    const parsed = JSON.parse(optionsStr);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((opt: any) => ({
      label: opt.label || opt.key || "",
      value: opt.value || opt.text || "",
    }));
  } catch {
    return [];
  }
}

// 题干（按 questionLocale + 单语回退）
const displayContent = computed(() => {
  const q = currentQuestion.value;
  if (!q) return "";
  const { contentZh, contentEn } = q;
  if (contentZh && !contentEn) return contentZh;
  if (contentEn && !contentZh) return contentEn;
  if (questionLocale.value === "zh") return contentZh || contentEn || "";
  return contentEn || contentZh || "";
});

// 选项
const displayOptions = computed(() => {
  const q = currentQuestion.value;
  if (!q) return [];
  const { optionsZh, optionsEn } = q;
  const hasZh = !!optionsZh && optionsZh !== "[]";
  const hasEn = !!optionsEn && optionsEn !== "[]";
  let str: string | undefined;
  if (questionLocale.value === "zh") {
    str = hasZh ? optionsZh : hasEn ? optionsEn : undefined;
  } else {
    str = hasEn ? optionsEn : hasZh ? optionsZh : undefined;
  }
  return parseOptions(str);
});

// 解析
const displayExplanation = computed(() => {
  const q = currentQuestion.value;
  if (!q) return "";
  const { explanationZh, explanationEn } = q;
  if (explanationZh && !explanationEn) return explanationZh;
  if (explanationEn && !explanationZh) return explanationEn;
  if (questionLocale.value === "zh") return explanationZh || explanationEn || "";
  return explanationEn || explanationZh || "";
});

// 案例背景
const displayCaseContent = computed(() => {
  const q = currentQuestion.value;
  if (!q || !q.isCase) return "";
  const { caseContentZh, caseContentEn } = q;
  if (caseContentZh && !caseContentEn) return caseContentZh;
  if (caseContentEn && !caseContentZh) return caseContentEn;
  if (questionLocale.value === "zh") return caseContentZh || caseContentEn || "";
  return caseContentEn || caseContentZh || "";
});

// 是否为正确选项
function isCorrectOption(label: string): boolean {
  const ans = currentQuestion.value.answer || "";
  return ans.includes(label);
}

// 解析格式化（沿用原实现）
function formatExplanation(content: string | undefined): string {
  if (!content) return "";
  const markdownCodeBlockRegex = /```\w*\n([\s\S]*?)```/g;
  let hasMarkdownCode = false;
  content = content.replace(markdownCodeBlockRegex, (_match, code) => {
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
  return content
    .split("\n")
    .map((line) => (line.trim() ? "<p>" + line + "</p>" : ""))
    .join("");
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 翻页 / 跳转
function handlePrevious() {
  if (currentIndex.value > 0) currentIndex.value--;
}
function handleNext() {
  if (currentIndex.value < questions.value.length - 1) currentIndex.value++;
}
function handleSelectQuestion(index: number) {
  currentIndex.value = index;
}

// 当前题号超出可视区时滚入答题卡中央
function scrollCurrentIntoView() {
  nextTick(() => {
    const grid = cardGrid.value;
    if (!grid) return;
    const btn = grid.children[currentIndex.value] as HTMLElement | undefined;
    if (!btn) return;
    const gridRect = grid.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    if (btnRect.top < gridRect.top || btnRect.bottom > gridRect.bottom) {
      btn.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });
}

watch(currentIndex, scrollCurrentIntoView);
watch(
  () => questions.value.length,
  (len) => {
    if (len > 0) scrollCurrentIntoView();
  }
);

// 数据加载
async function fetchSubjectInfo() {
  try {
    const subjectId = route.query.subjectId as string;
    const res = await SubjectAPI.getFormData(subjectId);
    subjectInfo.value = res;
  } catch (error) {
    console.error("获取科目信息失败:", error);
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const queryParams: QuestionPageQuery = {
      subjectId: route.query.subjectId as string,
      pageNum: 1,
      pageSize: 1000,
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
  await fetchSubjectInfo();
  await fetchData();
});
</script>

<style scoped>
.bg-eye-protection {
  background-color: rgb(220, 230, 221);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: practice-spin 0.8s linear infinite;
}
@keyframes practice-spin {
  to {
    transform: rotate(360deg);
  }
}

.answer-card-scroll {
  scrollbar-color: #d1d5db transparent;
  scrollbar-width: thin;
}
.answer-card-scroll::-webkit-scrollbar {
  width: 4px;
}
.answer-card-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.answer-card-scroll::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 4px;
}
.answer-card-scroll::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

.explanation-content :deep(p) {
  margin: 4px 0;
}
.explanation-content :deep(pre) {
  padding: 8px;
  margin: 4px 0;
  overflow-x: auto;
  font-family: "Courier New", Consolas, monospace;
  font-size: 12px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 3px;
}
</style>
