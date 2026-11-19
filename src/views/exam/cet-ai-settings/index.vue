<template>
  <div class="app-container">
    <el-card v-loading="loading" class="cet-ai-settings" shadow="never">
      <template #header>
        <h1 class="settings-title">四六级 AI 设置</h1>
      </template>

      <div class="settings-layout">
        <div>
          <el-form
            v-if="settings"
            class="settings-form"
            label-position="top"
            :disabled="saving"
            @submit.prevent="saveSettings()"
          >
            <section aria-labelledby="connection-heading">
              <div class="connection-heading">
                <h2 id="connection-heading">火山方舟</h2>
                <el-tag
                  :type="settings.apiKeyConfigured && settings.encryptionReady ? 'success' : 'info'"
                >
                  {{
                    settings.apiKeyConfigured && settings.encryptionReady
                      ? "已配置 API Key"
                      : "API Key 未就绪"
                  }}
                </el-tag>
              </div>
              <el-form-item label="API Key">
                <el-input
                  ref="apiKeyInput"
                  v-model="apiKey"
                  type="password"
                  autocomplete="new-password"
                  show-password
                  :disabled="!settings.encryptionReady"
                  :placeholder="
                    settings.apiKeyConfigured ? '留空保留已配置的 Key' : '填写火山方舟 API Key'
                  "
                />
              </el-form-item>
              <el-alert
                v-if="!settings.encryptionReady"
                type="warning"
                title="请为管理端和用户端服务配置相同的 CET_AI_ENCRYPTION_KEY。"
                :closable="false"
              />
              <div class="model-fields">
                <el-form-item label="教辅改写模型">
                  <el-select v-model="form.rewriteModel" aria-label="教辅改写模型">
                    <el-option
                      v-for="model in settings.models"
                      :key="model.id"
                      :value="model.id"
                      :label="model.name"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="交卷批改模型">
                  <el-select v-model="form.gradingModel" aria-label="交卷批改模型">
                    <el-option
                      v-for="model in settings.models"
                      :key="model.id"
                      :value="model.id"
                      :label="model.name"
                    />
                  </el-select>
                </el-form-item>
              </div>
            </section>

            <section aria-labelledby="content-heading">
              <h2 id="content-heading">在线内容来源</h2>
              <el-switch
                v-model="form.useGeneratedReference"
                aria-label="在线内容来源"
                active-text="AI 改写版"
                inactive-text="源站版"
              />
              <p class="source-help">
                影响逐题解析、写作参考范文和翻译题参考译文。AI 版缺稿时留空。
              </p>
            </section>

            <div class="settings-actions">
              <el-button native-type="submit" type="primary" :loading="saving">保存设置</el-button>
              <el-button v-if="settings.apiKeyConfigured" @click="clearKey">移除 Key</el-button>
            </div>
          </el-form>
          <el-empty v-else-if="!loading" description="暂时无法读取 AI 设置">
            <el-button @click="loadSettings">重新加载</el-button>
          </el-empty>
        </div>

        <section class="prompt-settings" aria-labelledby="prompt-heading">
          <h2 id="prompt-heading">提示词</h2>
          <div v-for="item in promptItems" :key="item.type" class="prompt-row">
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>
            <el-button
              :aria-label="'编辑' + item.title"
              :disabled="!!promptLoading && promptLoading !== item.type"
              :loading="promptLoading === item.type"
              @click="editPrompt(item)"
            >
              编辑
            </el-button>
          </div>
        </section>
      </div>
    </el-card>

    <el-dialog
      v-model="promptOpen"
      :title="selectedPrompt?.title"
      width="min(900px, 94vw)"
      align-center
      :show-close="!promptSaving"
      :close-on-click-modal="false"
      :close-on-press-escape="!promptSaving"
    >
      <template v-if="prompt && selectedPrompt">
        <p class="prompt-help">
          保存后，用于后续{{ selectedPrompt.type === "grading" ? "交卷批改" : "教辅改写" }}请求。
        </p>
        <el-input
          v-model="promptDraft"
          type="textarea"
          :rows="13"
          :maxlength="prompt.maxLength"
          :aria-label="selectedPrompt.title"
          :disabled="promptSaving"
          show-word-limit
        />
      </template>
      <template #footer>
        <div class="prompt-footer">
          <el-button
            :disabled="promptSaving || promptDraft.trim() === prompt?.defaultPrompt.trim()"
            @click="restoreDefaultPrompt"
          >
            恢复默认
          </el-button>
          <div class="prompt-actions">
            <el-button :disabled="promptSaving" @click="promptOpen = false">取消</el-button>
            <el-button
              type="primary"
              :disabled="!canSavePrompt"
              :loading="promptSaving"
              @click="savePrompt"
            >
              保存提示词
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox, type InputInstance } from "element-plus";
import { useRoute } from "vue-router";
import {
  CET_QUESTION_API,
  getCetAiSettings,
  getCetAiPrompt,
  updateCetAiPrompt,
  type CetAiSettings,
  type CetAiPrompt,
  type CetAiPromptType,
} from "@/api/exam/cet-question-api";
import request from "@/utils/request";

defineOptions({ name: "CetAiSettingsAdmin" });

const route = useRoute();
const settings = ref<CetAiSettings>();
const loading = ref(true);
const saving = ref(false);
const apiKey = ref("");
const apiKeyInput = ref<InputInstance>();
const form = reactive({ rewriteModel: "", gradingModel: "", useGeneratedReference: false });
const promptItems = [
  {
    type: "grading",
    title: "交卷批改提示词",
    description: "会员交卷后，批改作文和翻译时发送给模型。",
  },
  {
    type: "rewrite",
    title: "教辅改写提示词",
    description: "生成逐题解析、参考范文和参考译文改写稿时发送给模型。",
  },
] as const;
type PromptItem = (typeof promptItems)[number];
const selectedPrompt = ref<PromptItem>();
const promptOpen = ref(false);
const prompt = ref<CetAiPrompt>();
const promptDraft = ref("");
const promptLoading = ref<CetAiPromptType>();
const promptSaving = ref(false);
const canSavePrompt = computed(() => {
  const text = promptDraft.value.trim();
  return !!prompt.value && !!text && text !== prompt.value.prompt.trim();
});

async function loadSettings() {
  loading.value = true;
  try {
    const current = await getCetAiSettings();
    settings.value = current;
    form.rewriteModel = current.rewriteModel;
    form.gradingModel = current.gradingModel;
    form.useGeneratedReference = current.useGeneratedReference;
  } finally {
    loading.value = false;
  }
  if (route.query.focus === "key") {
    await nextTick();
    apiKeyInput.value?.focus();
  }
}

async function saveSettings(remove = false) {
  if (saving.value) return;
  saving.value = true;
  try {
    settings.value = await request.put<unknown, CetAiSettings>(CET_QUESTION_API + "/ai-settings", {
      ...form,
      apiKey: remove ? undefined : apiKey.value.trim() || undefined,
      clearKey: remove,
    });
    apiKey.value = "";
    ElMessage.success(remove ? "API Key 已移除" : "设置已保存");
  } finally {
    saving.value = false;
  }
}

async function clearKey() {
  try {
    await ElMessageBox.confirm(
      "移除后，新交卷的 AI 批改和参考稿生成将暂停，已保存的结果仍可查看。",
      "移除豆包 API Key",
      { type: "warning" }
    );
  } catch {
    return;
  }
  await saveSettings(true);
}

async function editPrompt(item: PromptItem) {
  if (promptLoading.value) return;
  promptLoading.value = item.type;
  try {
    prompt.value = await getCetAiPrompt(item.type);
    selectedPrompt.value = item;
    promptDraft.value = prompt.value.prompt;
    promptOpen.value = true;
  } finally {
    promptLoading.value = undefined;
  }
}

function restoreDefaultPrompt() {
  if (prompt.value) promptDraft.value = prompt.value.defaultPrompt;
}

async function savePrompt() {
  if (!selectedPrompt.value || !canSavePrompt.value || promptSaving.value) return;
  promptSaving.value = true;
  try {
    prompt.value = await updateCetAiPrompt(selectedPrompt.value.type, promptDraft.value);
    promptDraft.value = prompt.value.prompt;
    ElMessage.success("提示词已保存");
    promptOpen.value = false;
  } finally {
    promptSaving.value = false;
  }
}

onMounted(() => {
  void loadSettings();
});
</script>

<style scoped>
.cet-ai-settings {
  container-type: inline-size;
}
.settings-layout {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 24px;
  align-items: start;
}
.connection-heading,
.settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.settings-title {
  margin: 0;
  font-size: 20px;
  font-weight: 650;
}
.settings-form {
  display: grid;
  gap: 24px;
}
.settings-form section + section,
.settings-actions {
  padding-top: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.settings-form h2,
.prompt-settings h2 {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 650;
  color: var(--el-text-color-primary);
}
.connection-heading {
  margin-bottom: 16px;
}
.connection-heading h2 {
  margin: 0;
}
.model-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.model-fields :deep(.el-form-item) {
  margin: 0;
}
.model-fields :deep(.el-select) {
  width: 100%;
}
.source-help,
.prompt-row p {
  margin: 8px 0 0;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.settings-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
.prompt-settings {
  padding-inline-start: 24px;
  border-inline-start: 1px solid var(--el-border-color-lighter);
}
.prompt-row,
.prompt-footer {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
.prompt-row {
  padding-block: 12px;
}
.prompt-row + .prompt-row {
  border-top: 1px solid var(--el-border-color-lighter);
}
.prompt-row h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.prompt-row p {
  margin-top: 3px;
}
.prompt-help {
  margin: 0 0 12px;
  color: var(--el-text-color-regular);
}
.prompt-footer,
.prompt-actions {
  flex-wrap: wrap;
}
.prompt-actions {
  display: flex;
  gap: 8px;
}
.prompt-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}
@container (max-width: 760px) {
  .settings-layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .prompt-settings {
    padding-inline-start: 0;
    padding-top: 20px;
    border-inline-start: 0;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
@container (max-width: 520px) {
  .model-fields {
    grid-template-columns: 1fr;
  }
}
</style>
