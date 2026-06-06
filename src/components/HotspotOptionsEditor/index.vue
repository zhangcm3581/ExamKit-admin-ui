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
      <!-- 交互模式：未受控时内部选择；受控（由「试题类型」选择）时隐藏 -->
      <el-form-item v-if="props.interaction === undefined" label="交互模式">
        <el-radio-group v-model="state.interaction" @change="onInteractionChange">
          <el-radio label="dropdown">下拉</el-radio>
          <el-radio label="yesno">判断 Yes/No</el-radio>
        </el-radio-group>
      </el-form-item>

      <p v-if="state.interaction === 'dropdown'" class="hotspot-editor__tip">
        每行独立配置选项池：左侧填写题干，右侧逐行填写本行选项，并点击选择正确答案。
      </p>

      <!-- 判断 Yes/No：批量粘贴陈述，按换行自动生成行 -->
      <el-form-item v-if="state.interaction === 'yesno'" label="陈述（批量粘贴，每行一个）">
        <div class="hotspot-editor__yesno">
          <el-input
            v-model="yesnoText"
            type="textarea"
            :autosize="{ minRows: 4 }"
            placeholder="把多个判断陈述一次性粘贴进来，每行一个，如：&#10;陈述一&#10;陈述二&#10;陈述三"
          />
          <p class="hotspot-editor__tip">下方会按行自动生成，逐行选择 Y / N 即可，无需手动添加。</p>

          <div v-if="yesnoLines.length" class="hotspot-editor__yesno-rows">
            <div v-for="(line, idx) in yesnoLines" :key="idx" class="hotspot-editor__yesno-row">
              <span class="hotspot-editor__yesno-index">第 {{ idx + 1 }} 行</span>
              <span class="hotspot-editor__yesno-text">{{ line }}</span>
              <el-radio-group
                v-model="yesnoAnswers[idx]"
                class="hotspot-editor__yesno-radios"
                @change="syncYesnoToState"
              >
                <el-radio label="Y">Y / 是</el-radio>
                <el-radio label="N">N / 否</el-radio>
              </el-radio-group>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- 下拉：每行独立选项池 -->
      <el-form-item v-else label="行配置">
        <div class="hotspot-editor__rows">
          <div v-for="(row, idx) in state.rows" :key="idx" class="hotspot-editor__row-card">
            <div class="hotspot-editor__row-head">
              <span>第 {{ idx + 1 }} 行</span>
              <el-button v-if="state.rows.length > 1" type="danger" link @click="removeRow(idx)">
                删除
              </el-button>
            </div>

            <div class="hotspot-editor__row-body is-dropdown">
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

              <!-- 右：本行选项池 + 正确答案（单选可见全部选项） -->
              <div class="hotspot-editor__row-pool">
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
  type HotspotInteraction,
  type HotspotOptions,
} from "@/utils/hotspot";

const props = defineProps<{
  modelValue?: string;
  answer?: string;
  /** 受控交互模式：由父级（「试题类型」）指定时，隐藏内部「交互模式」选择并跟随该值 */
  interaction?: HotspotInteraction;
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

/** 判断 Yes/No 批量编辑：整段陈述文本 + 逐行答案，按换行自动成行 */
const yesnoText = ref("");
const yesnoAnswers = reactive<string[]>([]);
const yesnoLines = computed(() => splitLines(yesnoText.value));

function normalizeYesNo(raw: string): "Y" | "N" {
  const t = (raw || "").trim().toUpperCase();
  return t === "N" || t === "NO" || raw === "否" ? "N" : "Y";
}

/** 用当前陈述文本 + 逐行答案重建 state.rows（判断题专用） */
function syncYesnoToState() {
  if (state.interaction !== "yesno" || syncing) return;
  const lines = yesnoLines.value;
  while (yesnoAnswers.length < lines.length) yesnoAnswers.push("Y");
  if (yesnoAnswers.length > lines.length) yesnoAnswers.length = lines.length;
  state.rows = lines.map((prompt, i) => ({
    prompt,
    label: "",
    itemsText: "",
    answer: yesnoAnswers[i] || "Y",
  }));
}

/** 从 state.rows 初始化批量编辑的文本与逐行答案 */
function loadYesnoFromState() {
  const fromState = joinLines(state.rows.map((r) => r.prompt));
  // 仅当内容实际不同才覆盖，避免回显（父组件回传 modelValue）时打断正在输入的文本
  if (joinLines(yesnoLines.value) !== fromState) {
    yesnoText.value = fromState;
  }
  yesnoAnswers.length = 0;
  state.rows.forEach((r) => yesnoAnswers.push(normalizeYesNo(r.answer)));
}

watch(yesnoText, () => syncYesnoToState());

// 受控交互模式：父级切换「试题类型（下拉/判断）」时同步并归一化
watch(
  () => props.interaction,
  (val) => {
    if (val === undefined || val === state.interaction) return;
    state.interaction = val;
    onInteractionChange();
  }
);

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
  // 受控交互模式优先于已存 options 的 interaction
  if (props.interaction !== undefined && props.interaction !== state.interaction) {
    state.interaction = props.interaction;
    onInteractionChange();
  } else if (state.interaction === "yesno") {
    loadYesnoFromState();
  }
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
    loadYesnoFromState();
    syncYesnoToState();
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

/* 判断 Yes/No：批量陈述 + 自动生成行 */
.hotspot-editor__yesno {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.hotspot-editor__yesno-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hotspot-editor__yesno-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.hotspot-editor__yesno-index {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.hotspot-editor__yesno-text {
  flex: 1;
  min-width: 160px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  overflow-wrap: anywhere;
}

.hotspot-editor__yesno-radios {
  flex-shrink: 0;
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
