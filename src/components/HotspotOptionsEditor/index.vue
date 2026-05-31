<template>
  <div class="hotspot-editor">
    <!-- 预览 -->
    <div v-if="previewOptions" class="hotspot-editor__preview">
      <div class="hotspot-editor__preview-title">答题区预览</div>
      <div
        v-for="(row, idx) in previewOptions.rows"
        :key="row.id"
        class="hotspot-editor__preview-row"
      >
        <div class="hotspot-editor__preview-prompt">
          <span v-if="row.label" class="font-medium">{{ row.label }}:</span>
          {{ row.prompt }}
        </div>
        <el-select
          v-if="previewOptions.interaction === 'dropdown'"
          :model-value="previewAnswers[idx] || ''"
          placeholder="请选择…"
          class="hotspot-editor__preview-select"
          @update:model-value="(v) => setPreviewAnswer(idx, String(v ?? ''))"
        >
          <el-option v-for="item in getRowItems(idx)" :key="item" :label="item" :value="item" />
        </el-select>
        <el-radio-group
          v-else
          :model-value="previewAnswers[idx] || ''"
          @update:model-value="(v) => setPreviewAnswer(idx, String(v ?? ''))"
        >
          <el-radio label="Y">Yes</el-radio>
          <el-radio label="N">No</el-radio>
        </el-radio-group>
      </div>
    </div>

    <el-divider />

    <el-form label-position="top" class="hotspot-editor__form">
      <el-form-item label="交互模式">
        <el-radio-group v-model="state.interaction" @change="onInteractionChange">
          <el-radio label="dropdown">下拉</el-radio>
          <el-radio label="yesno">判断 Yes/No</el-radio>
        </el-radio-group>
      </el-form-item>

      <template v-if="state.interaction === 'dropdown'">
        <el-form-item label="选项池模式">
          <el-radio-group v-model="state.poolMode">
            <el-radio label="shared">共享选项池（排序/术语题）</el-radio>
            <el-radio label="perRow">各行独立选项池</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="state.poolMode === 'shared'" label="选项池（每行一个选项）">
          <el-input
            v-model="state.sharedItemsText"
            type="textarea"
            :rows="5"
            placeholder="选项1&#10;选项2&#10;选项3"
          />
        </el-form-item>

        <el-form-item v-if="state.poolMode === 'shared'">
          <template #label>
            <span>允许选项重复</span>
            <span class="hotspot-editor__hint">（关闭时各下拉不能选同一项）</span>
          </template>
          <el-switch v-model="state.reusable" />
        </el-form-item>

        <p v-if="state.poolMode === 'perRow'" class="hotspot-editor__tip">
          各行独立池：在下方每一行的「本行选项」中填写，每行一个选项、换行分隔。
        </p>
      </template>

      <el-form-item label="行配置">
        <div class="hotspot-editor__rows">
          <div v-for="(row, idx) in state.rows" :key="idx" class="hotspot-editor__row-card">
            <div class="hotspot-editor__row-head">
              <span>第 {{ idx + 1 }} 行</span>
              <el-button v-if="state.rows.length > 1" type="danger" link @click="removeRow(idx)">
                删除
              </el-button>
            </div>
            <el-input v-model="row.prompt" type="textarea" :rows="2" placeholder="行描述 / 陈述" />
            <el-input
              v-if="state.interaction === 'dropdown' && state.poolMode === 'perRow'"
              v-model="row.itemsText"
              type="textarea"
              :rows="4"
              class="mt-2"
              placeholder="本行选项（每行一个）"
            />
            <div class="hotspot-editor__row-answer mt-2">
              <span class="hotspot-editor__row-answer-label">正确答案</span>
              <el-select
                v-if="state.interaction === 'dropdown'"
                v-model="row.answer"
                placeholder="选择答案"
                filterable
                allow-create
                default-first-option
                style="width: 100%"
              >
                <el-option
                  v-for="item in rowAnswerChoices(idx)"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
              <el-radio-group v-else v-model="row.answer">
                <el-radio label="Y">Y / 是</el-radio>
                <el-radio label="N">N / 否</el-radio>
              </el-radio-group>
            </div>
          </div>
          <el-button type="primary" plain icon="Plus" @click="addRow">添加一行</el-button>
        </div>
      </el-form-item>
    </el-form>
    <p v-if="validationError" class="hotspot-editor__error">{{ validationError }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  createDefaultEditorState,
  editorStateToAnswer,
  editorStateToOptionsJson,
  getHotspotRowItems,
  optionsToEditorState,
  parseHotspotOptions,
  splitLines,
  splitPipe,
  validateHotspotEditorState,
  type HotspotEditorState,
  type HotspotOptions,
} from "@/utils/hotspot";

const props = defineProps<{
  modelValue?: string;
  answer?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:answer": [value: string];
  valid: [ok: boolean];
}>();

const state = reactive<HotspotEditorState>(createDefaultEditorState());
const previewAnswers = reactive<string[]>([]);
const validationError = ref("");
let syncing = false;

function syncFromProps() {
  syncing = true;
  const next = optionsToEditorState(props.modelValue, props.answer);
  Object.assign(state, next);
  const parsed = parseHotspotOptions(props.modelValue);
  const parts = splitPipe(props.answer || "");
  previewAnswers.length = 0;
  const len = parsed?.rows.length || state.rows.length;
  for (let i = 0; i < len; i++) {
    previewAnswers.push(parts[i] || state.rows[i]?.answer || "");
  }
  syncing = false;
}

watch(
  () => [props.modelValue, props.answer],
  () => syncFromProps(),
  { immediate: true }
);

function emitChanges() {
  if (syncing) return;
  const err = validateHotspotEditorState(state);
  validationError.value = err || "";
  emit("valid", !err);
  if (err) return;
  const json = editorStateToOptionsJson(state);
  const ans = editorStateToAnswer(state);
  emit("update:modelValue", json);
  emit("update:answer", ans);
}

watch(
  () => JSON.stringify(state),
  () => {
    emitChanges();
    const len = state.rows.length;
    while (previewAnswers.length < len) previewAnswers.push("");
    while (previewAnswers.length > len) previewAnswers.pop();
  },
  { deep: true }
);

const previewOptions = computed<HotspotOptions | null>(() =>
  parseHotspotOptions(editorStateToOptionsJson(state))
);

function getRowItems(idx: number): string[] {
  const opts = previewOptions.value;
  if (!opts) return [];
  return getHotspotRowItems(opts, idx);
}

function rowAnswerChoices(idx: number): string[] {
  if (state.interaction !== "dropdown") return [];
  if (state.poolMode === "perRow") return splitLines(state.rows[idx]?.itemsText || "");
  return splitLines(state.sharedItemsText);
}

function setPreviewAnswer(idx: number, value: string) {
  previewAnswers[idx] = value;
  if (state.rows[idx]) state.rows[idx].answer = value;
}

function onInteractionChange() {
  if (state.interaction === "yesno") {
    state.poolMode = "shared";
    state.sharedItemsText = "";
    state.rows.forEach((r) => {
      r.itemsText = "";
      if (r.answer !== "Y" && r.answer !== "N") r.answer = "Y";
    });
  }
}

function addRow() {
  state.rows.push({ prompt: "", label: "", itemsText: "", answer: "" });
}

function removeRow(idx: number) {
  state.rows.splice(idx, 1);
  previewAnswers.splice(idx, 1);
}

function validate(): string | null {
  const err = validateHotspotEditorState(state);
  validationError.value = err || "";
  emit("valid", !err);
  return err;
}

function serialize(): { optionsJson: string; answer: string } {
  return {
    optionsJson: editorStateToOptionsJson(state),
    answer: editorStateToAnswer(state),
  };
}

defineExpose({
  validate,
  serialize,
  isValid: () => validateHotspotEditorState(state) === null,
});
</script>

<style scoped>
.hotspot-editor__preview {
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.hotspot-editor__preview-title {
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.hotspot-editor__preview-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.hotspot-editor__preview-row:first-of-type {
  border-top: none;
}

.hotspot-editor__preview-prompt {
  flex: 1;
  min-width: 200px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.hotspot-editor__preview-select {
  width: min(100%, 280px);
}

.hotspot-editor__hint {
  margin-left: 6px;
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

.hotspot-editor__tip {
  margin: -8px 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.hotspot-editor__rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.hotspot-editor__row-card {
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.hotspot-editor__row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
}

.hotspot-editor__row-answer {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hotspot-editor__row-answer-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.mt-2 {
  margin-top: 8px;
}

.hotspot-editor__error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-color-danger);
}
</style>
