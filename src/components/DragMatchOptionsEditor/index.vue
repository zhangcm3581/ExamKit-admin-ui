<template>
  <div class="dm-editor">
    <el-form label-position="top">
      <el-form-item label="Tool 池（每行一项；多段用 ;; 分隔后合并为同一池）">
        <el-input
          v-model="state.toolsText"
          type="textarea"
          :rows="5"
          placeholder="术语1&#10;术语2"
        />
      </el-form-item>

      <el-form-item label="槽位配置（Purpose + 正确答案）">
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
            <div class="dm-editor__answer mt-2">
              <span class="dm-editor__answer-label">正确答案（点击选择，须在 Tool 池中）</span>
              <el-radio-group
                v-if="toolChoices.length"
                v-model="row.answer"
                class="dm-editor__answer-radios"
              >
                <el-radio v-for="t in toolChoices" :key="t" :label="t" border>{{ t }}</el-radio>
              </el-radio-group>
              <p v-else class="dm-editor__tip">请先在上方填写 Tool 池</p>
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
  editorStateToDragMatchOptionsJson,
  isChoiceOptionsJson,
  optionsToDragMatchEditorState,
  parseToolsText,
  validateDragMatchEditorState,
  type DragMatchEditorState,
} from "@/utils/dragMatch";

const props = defineProps<{
  modelValue?: string;
  answer?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:answer": [value: string];
  valid: [ok: boolean];
}>();

const state = reactive<DragMatchEditorState>(createDefaultDragMatchEditorState());
const validationError = ref("");
let syncing = false;

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

function emitChanges() {
  if (syncing) return;
  const err = validateDragMatchEditorState(state);
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

function validate(): string | null {
  const err = validateDragMatchEditorState(state);
  validationError.value = err || "";
  emit("valid", !err);
  return err;
}

function serialize(): { optionsJson: string; answer: string } {
  return {
    optionsJson: editorStateToDragMatchOptionsJson(state),
    answer: editorStateToDragMatchAnswer(state),
  };
}

defineExpose({
  validate,
  serialize,
  isValid: () => validateDragMatchEditorState(state) === null,
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

/* 正确答案：竖排可见全部 Tool，长文本换行 */
.dm-editor__answer-radios {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  margin-top: 6px;
}

.dm-editor__answer-radios :deep(.el-radio.is-bordered) {
  width: 100%;
  height: auto;
  min-height: 34px;
  padding: 8px 12px;
  margin-right: 0;
}

.dm-editor__answer-radios :deep(.el-radio__label) {
  line-height: 1.4;
  overflow-wrap: anywhere;
  white-space: normal;
}

.dm-editor__tip {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
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
