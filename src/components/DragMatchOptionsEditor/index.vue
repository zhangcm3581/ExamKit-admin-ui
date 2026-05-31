<template>
  <div class="dm-editor">
    <el-form label-position="top">
      <el-form-item
        v-if="locale !== 'en'"
        label="Tool 池（每行一项；多段用 ;; 分隔后合并为同一池）"
      >
        <el-input
          v-model="state.toolsText"
          type="textarea"
          :rows="5"
          placeholder="术语1&#10;术语2"
        />
      </el-form-item>

      <el-form-item
        :label="
          locale === 'en'
            ? '槽位配置（英文 Purpose，须与中文槽位数一致）'
            : '槽位配置（Purpose + 正确答案）'
        "
      >
        <div class="dm-editor__rows">
          <div v-for="(row, idx) in state.rows" :key="idx" class="dm-editor__row-card">
            <div class="dm-editor__row-head">
              <span>槽位 {{ idx + 1 }}</span>
              <el-button v-if="state.rows.length > 1" type="danger" link @click="removeRow(idx)">
                删除
              </el-button>
            </div>
            <el-input
              v-model="row.purpose"
              type="textarea"
              :rows="2"
              placeholder="Purpose 描述（可留空）"
            />
            <div v-if="locale !== 'en'" class="dm-editor__answer mt-2">
              <span class="dm-editor__answer-label">正确答案（须在 Tool 池中）</span>
              <el-select
                v-model="row.answer"
                placeholder="选择 Tool"
                filterable
                allow-create
                default-first-option
                style="width: 100%"
              >
                <el-option v-for="t in toolChoices" :key="t" :label="t" :value="t" />
              </el-select>
            </div>
          </div>
          <el-button type="primary" plain icon="Plus" @click="addRow">添加槽位</el-button>
        </div>
      </el-form-item>
    </el-form>
    <p v-if="validationError" class="dm-editor__error">{{ validationError }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  createDefaultDragMatchEditorState,
  editorStateToDragMatchAnswer,
  editorStateToDragMatchEnglishOptionsJson,
  editorStateToDragMatchOptionsJson,
  isChoiceOptionsJson,
  optionsToDragMatchEditorState,
  parseDragMatchOptions,
  parseToolsText,
  validateDragMatchEditorState,
  validateDragMatchEnglishEditorState,
  type DragMatchEditorState,
} from "@/utils/dragMatch";
const props = defineProps<{
  modelValue?: string;
  answer?: string;
  /** 双语英文区：不编辑 Tool/答案，提交时与中文对齐 */
  locale?: "zh" | "en";
  zhOptionsJson?: string;
  zhAnswer?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:answer": [value: string];
  valid: [ok: boolean];
}>();

const state = reactive<DragMatchEditorState>(createDefaultDragMatchEditorState());
const validationError = ref("");
let syncing = false;

const locale = computed(() => props.locale ?? "zh");

const toolChoices = computed(() => parseToolsText(state.toolsText));

function syncFromProps() {
  if (
    isChoiceOptionsJson(props.modelValue) &&
    (parseToolsText(state.toolsText).length > 0 || state.rows.some((r) => r.answer.trim()))
  ) {
    return;
  }
  syncing = true;
  Object.assign(state, optionsToDragMatchEditorState(props.modelValue, props.answer));
  syncing = false;
  emitChanges();
}

watch(
  () => [props.modelValue, props.answer],
  () => syncFromProps(),
  { immediate: true }
);

/** 英文区槽位数随中文 options 对齐 */
watch(
  () => props.zhOptionsJson,
  (zhJson) => {
    if (props.locale !== "en" || !zhJson) return;
    const zh = parseDragMatchOptions(zhJson);
    if (!zh) return;
    const len = zh.slots.length;
    while (state.rows.length < len) state.rows.push({ purpose: "", answer: "" });
    while (state.rows.length > len) state.rows.pop();
  },
  { immediate: true }
);

function emitChanges() {
  if (syncing) return;
  const err =
    props.locale === "en" && props.zhOptionsJson
      ? validateDragMatchEnglishEditorState(props.zhOptionsJson, props.zhAnswer || "", state)
      : validateDragMatchEditorState(state);
  validationError.value = err || "";
  emit("valid", !err);
  if (err) return;
  emit("update:modelValue", editorStateToDragMatchOptionsJson(state));
  emit("update:answer", editorStateToDragMatchAnswer(state));
}

watch(
  () => JSON.stringify(state),
  () => emitChanges(),
  { deep: true }
);

function addRow() {
  state.rows.push({ purpose: "", answer: "" });
}

function removeRow(idx: number) {
  state.rows.splice(idx, 1);
}

function validate(zhOptionsJson?: string, zhAnswer?: string): string | null {
  const zhJson = zhOptionsJson ?? props.zhOptionsJson;
  const zhAns = zhAnswer ?? props.zhAnswer ?? "";
  if (props.locale === "en" && zhJson) {
    const err = validateDragMatchEnglishEditorState(zhJson, zhAns, state);
    validationError.value = err || "";
    emit("valid", !err);
    return err;
  }
  const err = validateDragMatchEditorState(state);
  validationError.value = err || "";
  emit("valid", !err);
  return err;
}

function serialize(
  zhOptionsJson?: string,
  zhAnswer?: string
): { optionsJson: string; answer: string } {
  const zhJson = zhOptionsJson ?? props.zhOptionsJson;
  const zhAns = zhAnswer ?? props.zhAnswer ?? "";
  if (props.locale === "en" && zhJson) {
    const json =
      editorStateToDragMatchEnglishOptionsJson(zhJson, state) ||
      editorStateToDragMatchOptionsJson(state);
    return { optionsJson: json, answer: zhAns };
  }
  return {
    optionsJson: editorStateToDragMatchOptionsJson(state),
    answer: editorStateToDragMatchAnswer(state),
  };
}

defineExpose({
  validate,
  serialize,
  isValid: () => validate() === null,
});
</script>

<style scoped>
.dm-editor__rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.dm-editor__row-card {
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.dm-editor__row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
}

.dm-editor__answer-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dm-editor__error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-color-danger);
}

.mt-2 {
  margin-top: 8px;
}
</style>
