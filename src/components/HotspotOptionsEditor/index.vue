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

      <p v-if="state.interaction === 'dropdown'" class="hotspot-editor__tip">
        每行独立配置选项池：左侧填写题干，右侧逐行填写本行选项，并点击选择正确答案。
      </p>

      <el-form-item label="行配置">
        <div class="hotspot-editor__rows">
          <div v-for="(row, idx) in state.rows" :key="idx" class="hotspot-editor__row-card">
            <div class="hotspot-editor__row-head">
              <span>第 {{ idx + 1 }} 行</span>
              <el-button v-if="state.rows.length > 1" type="danger" link @click="removeRow(idx)">
                删除
              </el-button>
            </div>

            <div
              class="hotspot-editor__row-body"
              :class="{ 'is-dropdown': state.interaction === 'dropdown' }"
            >
              <!-- 左：行描述（文本多时自动换行） -->
              <div class="hotspot-editor__row-prompt">
                <span class="hotspot-editor__field-label">行描述 / 陈述</span>
                <el-input
                  v-model="row.prompt"
                  type="textarea"
                  :autosize="{ minRows: 2 }"
                  placeholder="行描述 / 陈述"
                />
              </div>

              <!-- 右：本行选项池 + 正确答案（下拉题，单选可见全部选项） -->
              <div v-if="state.interaction === 'dropdown'" class="hotspot-editor__row-pool">
                <span class="hotspot-editor__field-label">本行选项池（每行一个）</span>
                <el-input
                  v-model="row.itemsText"
                  type="textarea"
                  :autosize="{ minRows: 3 }"
                  placeholder="选项1&#10;选项2&#10;选项3"
                />
                <span class="hotspot-editor__field-label hotspot-editor__field-label--mt">
                  正确答案（点击选择）
                </span>
                <el-radio-group
                  v-if="rowAnswerChoices(idx).length"
                  v-model="row.answer"
                  class="hotspot-editor__answer-radios"
                >
                  <el-radio v-for="item in rowAnswerChoices(idx)" :key="item" :label="item" border>
                    {{ item }}
                  </el-radio>
                </el-radio-group>
                <p v-else class="hotspot-editor__tip">请先在上方填写本行选项</p>
              </div>

              <!-- 右：Y/No（判断题） -->
              <div v-else class="hotspot-editor__row-pool">
                <span class="hotspot-editor__field-label">正确答案</span>
                <el-radio-group v-model="row.answer">
                  <el-radio label="Y">Y / 是</el-radio>
                  <el-radio label="N">N / 否</el-radio>
                </el-radio-group>
              </div>
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
  joinLines,
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
  // 统一为各行独立选项池：旧的共享池数据迁移为每行同一份选项
  if (next.interaction === "dropdown") {
    if (next.poolMode === "shared") {
      const shared = splitLines(next.sharedItemsText);
      next.rows = next.rows.map((r) => ({
        ...r,
        itemsText: r.itemsText?.trim() ? r.itemsText : joinLines(shared),
      }));
    }
    next.poolMode = "perRow";
    next.sharedItemsText = "";
    next.reusable = true;
  }
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
  } else {
    // 下拉题统一各行独立选项池
    state.poolMode = "perRow";
    state.sharedItemsText = "";
    state.reusable = true;
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

.hotspot-editor__row-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 下拉题：左行描述、右选项池 */
.hotspot-editor__row-body.is-dropdown {
  flex-direction: row;
  align-items: flex-start;
}

.hotspot-editor__row-prompt,
.hotspot-editor__row-pool {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.hotspot-editor__field-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.hotspot-editor__field-label--mt {
  margin-top: 6px;
}

/* 正确答案：竖排可见全部选项，长文本换行 */
.hotspot-editor__answer-radios {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
}

.hotspot-editor__answer-radios :deep(.el-radio.is-bordered) {
  width: 100%;
  height: auto;
  min-height: 34px;
  padding: 8px 12px;
  margin-right: 0;
}

.hotspot-editor__answer-radios :deep(.el-radio__label) {
  line-height: 1.4;
  overflow-wrap: anywhere;
  white-space: normal;
}

.mt-2 {
  margin-top: 8px;
}

/* 窄屏（双语对照列内）行描述与选项池上下堆叠 */
@media (max-width: 768px) {
  .hotspot-editor__row-body.is-dropdown {
    flex-direction: column;
  }
}

.hotspot-editor__error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-color-danger);
}
</style>
