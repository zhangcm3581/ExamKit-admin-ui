<template>
  <div class="app-container cet-question-admin">
    <el-card class="question-catalog" shadow="never">
      <template #header><h1 class="catalog-title">四六级题库</h1></template>
      <el-alert
        v-if="setupMessage"
        :title="setupMessage"
        type="info"
        :closable="false"
        show-icon
        class="rewrite-setup"
      >
        <el-button v-if="!settings" link type="primary" @click="loadSettings">重试</el-button>
        <router-link
          v-else-if="settings.encryptionReady && !settings.apiKeyConfigured && canOpenAiSettings"
          class="setup-link"
          :to="{ name: 'CetAiSettingsAdmin', query: { focus: 'key' } }"
        >
          去配置 API Key
        </router-link>
      </el-alert>
      <el-tabs v-model="section" class="catalog-tabs" @tab-change="search">
        <el-tab-pane label="历年真题" name="real" />
        <el-tab-pane label="模拟卷" name="mock" />
        <el-tab-pane label="未编入整卷" name="standalone" />
      </el-tabs>
      <el-form class="catalog-filters" inline @submit.prevent="search">
        <el-form-item class="filter-choice" label="级别">
          <el-select v-model="level" class="filter-select" @change="search">
            <el-option label="英语四级" value="CET4" />
            <el-option label="英语六级" value="CET6" />
          </el-select>
        </el-form-item>
        <el-form-item class="filter-choice" label="题型">
          <el-select v-model="category" class="filter-select" @change="search">
            <el-option label="全部题型" value="" />
            <el-option
              v-for="(label, value) in categories"
              :key="value"
              :value="value"
              :label="label"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="filter-keyword" label="关键词">
          <el-input
            v-model="keyword"
            maxlength="100"
            clearable
            :placeholder="section === 'standalone' ? '题组编号、标题或题干' : '试卷名、编号或题干'"
            @clear="search"
          />
        </el-form-item>
        <el-form-item><el-button native-type="submit" type="primary">查询</el-button></el-form-item>
      </el-form>
      <CetGroupTable
        v-if="section === 'standalone'"
        v-loading="loading"
        :rows="groups"
        show-source
        @open="openGroup"
      />
      <el-table
        v-else
        :key="level + '-' + section"
        ref="paperTable"
        v-loading="loading"
        class="paper-table"
        :data="papers"
        row-key="id"
        :expand-row-keys="expandedIds"
        empty-text="暂无符合条件的试卷"
        @expand-change="onPaperExpand"
      >
        <el-table-column type="expand" width="44">
          <template #default="{ row }: { row: PaperRow }">
            <div v-loading="paperLoading.has(row.id)" class="paper-groups">
              <CetGroupTable
                v-if="paperGroups[row.id]"
                :rows="paperGroups[row.id]"
                @open="openGroup($event, row.title)"
              />
              <el-button
                v-else-if="paperFailed.has(row.id)"
                link
                type="primary"
                @click="loadPaperGroups(row.id)"
              >
                重新加载题目
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="试卷" min-width="256">
          <template #default="{ row }: { row: PaperRow }">
            <div class="paper-identity">
              <span class="paper-title" :title="row.title">{{ row.title }}</span>
              <span class="paper-id" :title="row.id">{{ row.id }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="groupCount"
          label="题组数"
          width="96"
          align="center"
          class-name="paper-count"
        />
        <el-table-column label="AI 改写" width="152" align="center">
          <template #default="{ row }: { row: PaperRow }">
            <el-tag
              v-if="row.rewrittenGroups"
              type="success"
              effect="light"
              size="small"
              :title="row.rewrittenGroups + ' 个题组有稿'"
            >
              有改写稿 · {{ row.rewrittenGroups }}
            </el-tag>
            <span v-else class="rewrite-status-empty">未改写</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210">
          <template #default="{ row }: { row: PaperRow }">
            <div class="paper-actions">
              <el-button link @click="paperTable?.toggleRowExpansion(row)">
                {{ expandedIds.includes(row.id) ? "收起题目" : "查看题目" }}
              </el-button>
              <el-button
                link
                type="primary"
                :loading="activePaper === row.id"
                :disabled="!!activePaper || generating || savingReference || !canGenerate"
                @click="openRewriteDialog(row)"
              >
                整卷 AI 改写
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="catalog-footer">
        <span v-if="!loading">
          共 {{ total }} {{ section === "standalone" ? "个题组" : "套试卷" }}
        </span>
        <el-pagination
          v-model:current-page="page"
          :page-size="25"
          :pager-count="5"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="loadListing()"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailOpen" :title="detailId" width="min(960px, 94vw)" destroy-on-close>
      <div v-loading="detailLoading" class="question-detail">
        <template v-if="detail">
          <p v-if="detailPaper || detail.group.sourceExam?.title">
            {{ detailPaper || detail.group.sourceExam?.title }}
          </p>
          <h3>{{ questionTitle }}</h3>
          <p v-for="(material, index) in materials" :key="index" class="question-text">
            {{ material }}
          </p>
          <ol v-if="detail.group.data.questions?.length" class="question-list">
            <li v-for="(question, index) in detail.group.data.questions" :key="index">
              <b>
                {{ question.questionNumber ?? question.blankNumber ?? index + 1 }}.
                {{ question.questionText || question.statementText }}
              </b>
              <ul v-if="question.options?.length">
                <li v-for="option in question.options" :key="option.label">
                  {{ option.label }}) {{ option.text }}
                </li>
              </ul>
              <p v-if="question.correctAnswer || question.correctWord">
                答案 ·
                {{ [question.correctAnswer, question.correctWord].filter(Boolean).join(" ") }}
              </p>
              <p v-if="question.analysis" class="question-text">{{ question.analysis }}</p>
            </li>
          </ol>
          <section v-if="detail.sections.length" class="rewrites">
            <el-select v-model="selectedKey" aria-label="选择改写项目" class="rewrite-select">
              <el-option
                v-for="item in detail.sections"
                :key="item.key"
                :value="item.key"
                :label="item.label + (item.generated ? ' · 已保存' : '')"
              />
            </el-select>
            <div v-if="selectedSection" class="reference-editor">
              <section>
                <h3>源站{{ selectedSection.label }}</h3>
                <p class="question-text">{{ selectedSection.source || "源站暂无该项内容" }}</p>
              </section>
              <section>
                <h3>AI {{ selectedSection.label }}</h3>
                <el-input
                  :key="selectedKey"
                  v-model="draft"
                  aria-label="改写稿正文"
                  type="textarea"
                  :rows="8"
                  maxlength="12000"
                />
                <div class="reference-actions">
                  <el-button
                    :loading="generating"
                    :disabled="!!activePaper || savingReference || !canGenerate"
                    @click="generateReference"
                  >
                    {{ draft ? "重新改写" : "用豆包改写" }}
                  </el-button>
                  <el-button
                    type="primary"
                    :loading="savingReference"
                    :disabled="
                      !!activePaper || generating || draft.trim() === selectedSection.generated
                    "
                    @click="saveReference"
                  >
                    保存改写稿
                  </el-button>
                </div>
              </section>
            </div>
          </section>
          <details class="raw-question">
            <summary>查看完整题目数据</summary>
            <pre>{{ JSON.stringify(detail.group, null, 2) }}</pre>
          </details>
        </template>
      </div>
    </el-dialog>
    <el-dialog
      v-model="batchOpen"
      class="cet-rewrite-dialog"
      title="整卷 AI 改写"
      width="min(760px, calc(100% - 32px))"
      align-center
      :show-close="!activePaper"
      :close-on-press-escape="!activePaper"
      :close-on-click-modal="false"
    >
      <div v-if="batch" class="rewrite-dialog-body">
        <div class="rewrite-paper-heading">
          <h3>{{ batch.paper.title }}</h3>
          <el-tag type="info" effect="plain">{{ batch.paper.groupCount }} 个题组</el-tag>
        </div>
        <div v-if="batch.state === 'ready'" class="rewrite-dialog-panel">
          <h4>改写范围</h4>
          <p>豆包会补齐逐题解析、参考范文和参考译文的改写稿。新稿自动保存，已有稿件保留。</p>
        </div>
        <div v-else class="rewrite-dialog-panel rewrite-progress">
          <div class="rewrite-progress-heading">
            <h4 role="status">{{ batchStatus }}</h4>
            <strong>{{ batchPercent }}%</strong>
          </div>
          <el-progress
            aria-label="整卷改写进度"
            :percentage="batchPercent"
            :status="batchBarStatus"
            :show-text="false"
            :stroke-width="8"
          />
          <dl class="rewrite-progress-counts">
            <div>
              <dt>已处理题组</dt>
              <dd>{{ batch.processed }} / {{ batch.total }}</dd>
            </div>
            <div>
              <dt>已保存稿件</dt>
              <dd>{{ batch.saved }}</dd>
            </div>
            <div>
              <dt>失败题组</dt>
              <dd :class="{ 'rewrite-errors': batch.failed }">{{ batch.failed }}</dd>
            </div>
          </dl>
          <p v-if="batch.state === 'partial'" class="rewrite-errors">
            可再次运行整卷改写，补齐缺少的稿件。
          </p>
        </div>
      </div>
      <template #footer>
        <template v-if="batch?.state === 'ready'">
          <el-button @click="batchOpen = false">取消</el-button>
          <el-button type="primary" :disabled="!canGenerate" @click="startRewrite">
            开始改写
          </el-button>
        </template>
        <el-button v-else-if="activePaper" :disabled="stopBatch" @click="stopBatch = true">
          停止后续生成
        </el-button>
        <el-button v-else type="primary" @click="batchOpen = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, type TableInstance } from "element-plus";
import { useRouter } from "vue-router";
import {
  CET_QUESTION_API,
  getCetAiSettings,
  getCetRewritePrompt,
  type CetAiSettings,
  type CetRewritePrompt,
} from "@/api/exam/cet-question-api";
import request from "@/utils/request";
import CetGroupTable, { categories, type Category, type GroupRow } from "./CetGroupTable.vue";

defineOptions({ name: "CetQuestionAdmin" });
const api = CET_QUESTION_API;
type Level = "CET4" | "CET6";
type Section = "real" | "mock" | "standalone";
interface PaperRow {
  id: string;
  title: string;
  groupCount: number;
  rewrittenGroups: number;
}
interface RewriteBatch {
  paper: PaperRow;
  total: number;
  processed: number;
  saved: number;
  failed: number;
  current: string;
  state: "ready" | "running" | "done" | "stopped" | "partial" | "error";
}
interface Page<T> {
  items: T[];
  total: number;
}
interface Question {
  questionNumber?: number;
  blankNumber?: number;
  questionText?: string;
  statementText?: string;
  options?: { label: string; text: string }[];
  correctAnswer?: string;
  correctWord?: string;
  analysis?: string;
}
interface RewriteSection {
  key: string;
  label: string;
  source: string;
  generated: string;
}
interface GroupDetail {
  sections: RewriteSection[];
  group: {
    type: Category;
    sourceExam?: { title?: string };
    data: {
      title?: string;
      content?: { topic?: string; directions?: string };
      directions?: string;
      sourceText?: string;
      material?: {
        passage?: string;
        paragraphs?: (string | { text?: string; content?: string })[];
      };
      questions?: Question[];
    };
  };
}

const settings = ref<CetAiSettings>();
const settingsLoading = ref(false);
const router = useRouter();
const canOpenAiSettings = router.hasRoute("CetAiSettingsAdmin");

const section = ref<Section>("real");
const level = ref<Level>("CET4");
const category = ref<Category | "">("");
const keyword = ref("");
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const groups = ref<GroupRow[]>([]);
const papers = ref<PaperRow[]>([]);
const paperTable = ref<TableInstance>();
const expandedIds = ref<string[]>([]);
const paperGroups = reactive<Record<string, GroupRow[]>>({});
const paperLoading = reactive(new Set<string>());
const paperFailed = reactive(new Set<string>());
let listRequest = 0;

const detail = ref<GroupDetail>();
const detailId = ref("");
const detailPaper = ref("");
const detailOpen = ref(false);
const detailLoading = ref(false);
const selectedKey = ref("");
const drafts = ref<Record<string, string>>({});
const selectedSection = computed(() =>
  detail.value?.sections.find((item) => item.key === selectedKey.value)
);
const draft = computed({
  get: () => drafts.value[selectedKey.value] ?? selectedSection.value?.generated ?? "",
  set: (value) => {
    drafts.value[selectedKey.value] = value;
  },
});
const prompt = ref<CetRewritePrompt>();
const setupMessage = computed(() => {
  if (settingsLoading.value) return "";
  if (!settings.value) return "暂时无法读取豆包配置，AI 改写不可用。";
  if (!settings.value.encryptionReady) return "服务端加密密钥未配置，暂时无法保存方舟 API Key。";
  if (!settings.value.apiKeyConfigured)
    return "在「四六级 AI 设置」中保存火山方舟 API Key 后可使用 AI 改写。";
  return "";
});
const canGenerate = computed(
  () => !settingsLoading.value && settings.value?.apiKeyConfigured && settings.value.encryptionReady
);
const stopBatch = ref(false);
const batchOpen = ref(false);
const batch = ref<RewriteBatch>();
const activePaper = computed(() => (batch.value?.state === "running" ? batch.value.paper.id : ""));
const batchPercent = computed(() =>
  batch.value?.total ? Math.round((batch.value.processed * 100) / batch.value.total) : 0
);
const batchBarStatus = computed(() => {
  if (batch.value?.state === "done") return "success";
  if (batch.value?.state === "partial" || batch.value?.state === "error") return "exception";
  return undefined;
});
const batchStatus = computed(() => {
  if (!batch.value) return "";
  if (batch.value.state === "done") return batch.value.saved ? "改写完成" : "改写稿已齐，无需补齐";
  if (batch.value.state === "stopped") return "已停止，已保存的改写稿可继续使用";
  if (batch.value.state === "partial") return "部分题组待重试";
  if (batch.value.state === "error") return "无法加载试卷或改写配置，请重试";
  if (stopBatch.value) return "正在停止，当前批次完成后会保存并结束…";
  return batch.value.current || "正在准备改写…";
});
const generating = ref(false);
const savingReference = ref(false);

const questionTitle = computed(() => {
  const group = detail.value?.group;
  return group ? group.data.content?.topic || group.data.title || categories[group.type] : "";
});
const materials = computed(() => {
  const data = detail.value?.group.data;
  if (!data) return [];
  const paragraphs = data.material?.paragraphs
    ?.map((p) => (typeof p === "string" ? p : p.text || p.content))
    .filter(Boolean);
  const result = [
    data.directions,
    data.content?.directions,
    data.sourceText,
    ...(data.material?.passage ? [data.material.passage] : (paragraphs ?? [])),
  ];
  return [...new Set(result.filter((value): value is string => Boolean(value)))];
});

async function loadSettings() {
  if (settingsLoading.value) return;
  settingsLoading.value = true;
  try {
    settings.value = await getCetAiSettings();
  } catch {
    settings.value = undefined;
  } finally {
    settingsLoading.value = false;
  }
}

async function loadListing(resetExpanded = true) {
  const token = ++listRequest;
  const params = {
    level: level.value,
    category: category.value,
    keyword: keyword.value.trim(),
    page: page.value,
  };
  loading.value = true;
  if (resetExpanded) expandedIds.value = [];
  try {
    if (section.value === "standalone") {
      const result = await request.get<unknown, Page<GroupRow>>(api, {
        params: { ...params, standalone: true },
      });
      if (token !== listRequest) return;
      groups.value = result.items;
      total.value = result.total;
    } else {
      const result = await request.get<unknown, Page<PaperRow>>(api + "/papers", {
        params: { ...params, kind: section.value },
      });
      if (token !== listRequest) return;
      papers.value = result.items;
      total.value = result.total;
    }
  } finally {
    if (token === listRequest) loading.value = false;
  }
}

function search() {
  page.value = 1;
  void loadListing();
}

function onPaperExpand(row: PaperRow, expanded: PaperRow[]) {
  expandedIds.value = expanded.map((paper) => paper.id);
  if (expandedIds.value.includes(row.id)) void loadPaperGroups(row.id);
}

async function loadPaperGroups(id: string) {
  if (paperGroups[id] || paperLoading.has(id)) return;
  paperLoading.add(id);
  paperFailed.delete(id);
  try {
    paperGroups[id] = await request.get<unknown, GroupRow[]>(
      api + "/papers/" + encodeURIComponent(id) + "/groups"
    );
  } catch {
    paperFailed.add(id);
  } finally {
    paperLoading.delete(id);
  }
}

async function openGroup(id: string, paper = "") {
  detailId.value = id;
  detailPaper.value = paper;
  detail.value = undefined;
  drafts.value = {};
  selectedKey.value = "";
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    const result = await request.get<unknown, GroupDetail>(api + "/" + encodeURIComponent(id));
    if (detailId.value === id) {
      detail.value = result;
      selectedKey.value = result.sections[0]?.key || "";
    }
  } finally {
    if (detailId.value === id) detailLoading.value = false;
  }
}

const detailPath = (id: string) => api + "/" + encodeURIComponent(id);

async function loadPrompt() {
  prompt.value ??= await getCetRewritePrompt();
  return prompt.value;
}

function generateDrafts(id: string, keys: string[]) {
  return request.post<unknown, Record<string, string>>(detailPath(id) + "/generate-rewrite", {
    keys,
  });
}

function persistDrafts(id: string, sections: Record<string, string | null>, missingOnly = false) {
  return request.put<unknown, Record<string, string | null>>(detailPath(id) + "/rewrites", {
    sections,
    missingOnly,
  });
}

async function generateReference() {
  if (!selectedSection.value || generating.value || activePaper.value) return;
  generating.value = true;
  const id = detailId.value;
  const key = selectedKey.value;
  try {
    const result = await generateDrafts(id, [key]);
    if (detailId.value === id && detailOpen.value) drafts.value[key] = result[key];
  } finally {
    generating.value = false;
  }
}

function markGenerated(id: string, generated: boolean) {
  for (const rows of [groups.value, ...Object.values(paperGroups)]) {
    for (const row of rows) if (row.id === id) row.generated = generated;
  }
}

async function saveReference() {
  const item = selectedSection.value;
  const group = detail.value;
  if (!item || !group || savingReference.value || activePaper.value) return;
  savingReference.value = true;
  const id = detailId.value;
  const content = draft.value.trim();
  try {
    await persistDrafts(id, { [item.key]: content || null });
    item.generated = content;
    markGenerated(
      id,
      group.sections.some((section) => section.generated)
    );
    ElMessage.success("改写稿已保存");
    if (section.value !== "standalone") void loadListing(false).catch(() => undefined);
  } finally {
    savingReference.value = false;
  }
}

function openRewriteDialog(paper: PaperRow) {
  if (activePaper.value || generating.value || savingReference.value || !canGenerate.value) return;
  stopBatch.value = false;
  batch.value = {
    paper,
    total: paper.groupCount,
    processed: 0,
    saved: 0,
    failed: 0,
    current: "",
    state: "ready",
  };
  batchOpen.value = true;
}

async function startRewrite() {
  const progress = batch.value;
  if (
    progress?.state !== "ready" ||
    generating.value ||
    savingReference.value ||
    !canGenerate.value
  )
    return;
  progress.state = "running";
  try {
    const [{ batchSize }, rows] = await Promise.all([
      loadPrompt(),
      request.get<unknown, GroupRow[]>(
        api + "/papers/" + encodeURIComponent(progress.paper.id) + "/groups"
      ),
    ]);
    progress.total = rows.length;
    for (const [index, row] of rows.entries()) {
      if (stopBatch.value) break;
      progress.current = `正在检查第 ${index + 1}/${rows.length} 个题组 · ${row.title || categories[row.category]}`;
      try {
        const group = await request.get<unknown, GroupDetail>(detailPath(row.id));
        const keys = group.sections.filter((item) => !item.generated).map((item) => item.key);
        for (let offset = 0; offset < keys.length && !stopBatch.value; offset += batchSize) {
          const end = Math.min(offset + batchSize, keys.length);
          progress.current = `正在改写第 ${index + 1}/${rows.length} 个题组 · 第 ${offset + 1}–${end} / ${keys.length} 项`;
          const generated = await generateDrafts(row.id, keys.slice(offset, end));
          const saved = await persistDrafts(row.id, generated, true);
          progress.saved += Object.keys(saved).length;
          markGenerated(row.id, true);
          if (detailId.value === row.id && detail.value) {
            for (const item of detail.value.sections) {
              const text = saved[item.key];
              if (text) item.generated = text;
            }
          }
        }
      } catch {
        progress.failed++;
      }
      if (!stopBatch.value) progress.processed++;
    }
    progress.state = stopBatch.value ? "stopped" : progress.failed ? "partial" : "done";
  } catch {
    progress.state = "error";
  } finally {
    if (progress.processed || progress.saved) void loadListing(false).catch(() => undefined);
  }
}

onBeforeUnmount(() => {
  stopBatch.value = true;
});
onMounted(() => {
  void loadSettings();
  void loadListing();
});
onActivated(() => {
  void loadSettings();
});
</script>

<style scoped>
.catalog-title {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
}
.catalog-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}
.catalog-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  align-items: center;
  margin-bottom: 20px;
}
.catalog-filters :deep(.el-form-item) {
  margin: 0;
}
.catalog-filters .filter-keyword {
  flex: 1 1 260px;
  min-width: 0;
  max-width: 400px;
}
.catalog-filters .filter-keyword :deep(.el-form-item__content) {
  min-width: 0;
}
.filter-select {
  width: 124px;
}
.paper-table {
  --el-table-header-bg-color: var(--el-fill-color-light);
}
.paper-table :deep(.el-table__cell) {
  padding-block: 10px;
}
.paper-table :deep(.paper-count .cell) {
  font-variant-numeric: tabular-nums;
}
.paper-identity {
  display: grid;
  gap: 2px;
  line-height: 1.4;
}
.paper-identity span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.paper-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.paper-id {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.paper-actions {
  display: flex;
  gap: 14px;
  align-items: center;
}
.paper-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
.catalog-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  margin-top: 16px;
  color: var(--el-text-color-secondary);
}
.catalog-footer .el-pagination {
  margin-inline-start: auto;
}
.paper-groups {
  min-height: 56px;
  padding: 10px 16px 14px;
  background: var(--el-fill-color-lighter);
}
.question-detail {
  min-height: 65px;
}
.question-detail h3 {
  font-size: 16px;
  font-weight: 650;
}
.question-text {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.question-list {
  display: grid;
  gap: 16px;
  padding: 0;
  list-style: none;
}
.question-list > li {
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}
.question-list ul {
  display: grid;
  gap: 5px;
  padding: 8px 0;
  list-style: none;
}
.rewrite-setup {
  margin-bottom: 12px;
}
.setup-link {
  color: var(--el-color-primary);
}
.setup-link:hover {
  text-decoration: underline;
}
.rewrite-status-empty {
  color: var(--el-text-color-secondary);
}
:deep(.cet-rewrite-dialog) {
  --el-dialog-padding-primary: 24px;
  --el-dialog-border-radius: 14px;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
}
:deep(.cet-rewrite-dialog .el-dialog__title) {
  font-size: 20px;
  font-weight: 650;
}
.rewrite-dialog-body {
  display: grid;
  gap: 16px;
}
.rewrite-paper-heading,
.rewrite-progress-heading {
  display: flex;
  gap: 12px;
  align-items: baseline;
  justify-content: space-between;
}
.rewrite-paper-heading h3 {
  margin: 0;
  font-size: 17px;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}
.rewrite-paper-heading .el-tag {
  flex-shrink: 0;
}
.rewrite-dialog-panel {
  padding: 20px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
}
.rewrite-dialog-panel h4 {
  margin: 0;
  font-size: 15px;
  color: var(--el-text-color-primary);
}
.rewrite-dialog-panel p {
  margin: 8px 0 0;
  line-height: 1.6;
}
.rewrite-progress {
  display: grid;
  gap: 14px;
}
.rewrite-progress-heading strong {
  font-size: 22px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}
.rewrite-progress-counts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}
.rewrite-progress-counts > div {
  display: grid;
  gap: 5px;
  padding: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
.rewrite-progress-counts dt {
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.rewrite-progress-counts dd {
  margin: 0;
  font-size: 18px;
  font-weight: 650;
  color: var(--el-text-color-primary);
}
.rewrite-progress-counts dd.rewrite-errors,
.rewrite-errors {
  color: var(--el-color-warning-dark-2);
}
.rewrites {
  margin: 20px 0;
}
.rewrite-select {
  width: 100%;
  max-width: 350px;
}
.reference-editor {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin: 20px 0;
}
.reference-editor section {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
}
.reference-editor h3 {
  margin: 0 0 12px;
}
.reference-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.raw-question summary {
  cursor: pointer;
}
.raw-question pre {
  max-height: 360px;
  padding: 10px;
  overflow: auto;
  background: var(--el-fill-color-light);
}
@media (max-width: 720px) {
  .reference-editor {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 480px) {
  .question-catalog {
    --el-card-padding: 14px;
  }
  .catalog-filters .filter-choice {
    flex: 1 1 140px;
  }
  .filter-select {
    width: 100%;
  }
  :deep(.cet-rewrite-dialog) {
    --el-dialog-padding-primary: 16px;
  }
  .rewrite-paper-heading {
    flex-wrap: wrap;
  }
  .rewrite-dialog-panel {
    padding: 12px;
  }
  .rewrite-progress-counts {
    gap: 6px;
  }
  .rewrite-progress-counts > div {
    padding: 8px;
  }
  .rewrite-progress-counts dt {
    font-size: 12px;
  }
}
</style>
