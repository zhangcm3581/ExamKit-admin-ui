<template>
  <div class="qep-root">
    <!-- 双语 tab -->
    <el-tabs v-if="hasBothLanguages" v-model="activeTab" type="border-card" class="qep-tabs">
      <el-tab-pane label="中文" name="zh">
        <el-form label-position="top">
          <el-form-item label="题目内容">
            <WangEditor v-model="form.contentZh" height="180px" />
          </el-form-item>
          <el-form-item v-if="hasOptions" label="选项文本">
            <div v-for="(opt, idx) in optionsZh" :key="`zh-${opt.label}`" class="qep-option-item">
              <span class="qep-option-label">{{ opt.label }}</span>
              <div class="qep-option-editor">
                <WangEditor v-model="optionsZh[idx].value" height="100px" />
              </div>
            </div>
          </el-form-item>
          <el-form-item label="解析">
            <WangEditor v-model="form.explanationZh" height="180px" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="English" name="en">
        <el-form label-position="top">
          <el-form-item label="Question">
            <WangEditor v-model="form.contentEn" height="180px" />
          </el-form-item>
          <el-form-item v-if="hasOptions" label="Options">
            <div v-for="(opt, idx) in optionsEn" :key="`en-${opt.label}`" class="qep-option-item">
              <span class="qep-option-label">{{ opt.label }}</span>
              <div class="qep-option-editor">
                <WangEditor v-model="optionsEn[idx].value" height="100px" />
              </div>
            </div>
          </el-form-item>
          <el-form-item label="Explanation">
            <WangEditor v-model="form.explanationEn" height="180px" />
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <!-- 单语：仅中文 -->
    <el-form v-else-if="onlyZh" label-position="top">
      <el-form-item label="题目内容">
        <WangEditor v-model="form.contentZh" height="180px" />
      </el-form-item>
      <el-form-item v-if="hasOptions" label="选项文本">
        <div v-for="(opt, idx) in optionsZh" :key="`zh-${opt.label}`" class="qep-option-item">
          <span class="qep-option-label">{{ opt.label }}</span>
          <div class="qep-option-editor">
            <WangEditor v-model="optionsZh[idx].value" height="100px" />
          </div>
        </div>
      </el-form-item>
      <el-form-item label="解析">
        <WangEditor v-model="form.explanationZh" height="180px" />
      </el-form-item>
    </el-form>

    <!-- 单语：仅英文 -->
    <el-form v-else-if="onlyEn" label-position="top">
      <el-form-item label="Question">
        <WangEditor v-model="form.contentEn" height="180px" />
      </el-form-item>
      <el-form-item v-if="hasOptions" label="Options">
        <div v-for="(opt, idx) in optionsEn" :key="`en-${opt.label}`" class="qep-option-item">
          <span class="qep-option-label">{{ opt.label }}</span>
          <div class="qep-option-editor">
            <WangEditor v-model="optionsEn[idx].value" height="100px" />
          </div>
        </div>
      </el-form-item>
      <el-form-item label="Explanation">
        <WangEditor v-model="form.explanationEn" height="180px" />
      </el-form-item>
    </el-form>

    <div class="qep-actions">
      <el-button @click="onCancel"><b>取消</b></el-button>
      <el-button type="primary" :loading="saving" @click="onSave">
        <b>保存题目</b>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import type { QuestionVO, QuestionForm } from "@/api/exam/question-api";

interface Props {
  question: QuestionVO;
  subjectSupportLanguages: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  saved: [updated: QuestionVO];
  cancel: [];
}>();

const saving = ref(false);
const activeTab = ref<"zh" | "en">("zh");

const supportedLangs = computed(() =>
  (props.subjectSupportLanguages || "zh").split(",").filter(Boolean)
);
const hasBothLanguages = computed(
  () => supportedLangs.value.includes("zh") && supportedLangs.value.includes("en")
);
const onlyZh = computed(
  () => supportedLangs.value.includes("zh") && !supportedLangs.value.includes("en")
);
const onlyEn = computed(
  () => supportedLangs.value.includes("en") && !supportedLangs.value.includes("zh")
);

const hasOptions = computed(
  () =>
    props.question.type !== "JUDGE" &&
    props.question.type !== "SHORT_ANSWER" &&
    props.question.type !== "FILL_BLANK"
);

function parseOptions(json?: string): { label: string; value: string }[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return arr.map((opt: any) => ({
      label: opt.label || opt.key || "",
      value: opt.value || opt.text || "",
    }));
  } catch {
    return [];
  }
}

const form = reactive<QuestionForm>({
  id: props.question.id,
  subjectId: props.question.subjectId,
  type: props.question.type,
  contentZh: props.question.contentZh || "",
  contentEn: props.question.contentEn || "",
  optionsZh: props.question.optionsZh || "",
  optionsEn: props.question.optionsEn || "",
  answer: props.question.answer || "",
  explanationZh: props.question.explanationZh || "",
  explanationEn: props.question.explanationEn || "",
});

const optionsZh = ref(parseOptions(props.question.optionsZh));
const optionsEn = ref(
  props.question.optionsEn
    ? parseOptions(props.question.optionsEn)
    : optionsZh.value.map((o) => ({ label: o.label, value: "" }))
);

function onCancel() {
  emit("cancel");
}

function onSave() {
  // 真正的保存逻辑在 Task 3 实现
  ElMessage.info("保存逻辑未实现");
  void saving.value;
  void emit;
}
</script>

<style scoped>
.qep-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qep-tabs {
  border-radius: 8px;
}

.qep-option-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.qep-option-label {
  flex-shrink: 0;
  width: 28px;
  padding-top: 4px;
  font-weight: 600;
  color: #303133;
}

.qep-option-editor {
  flex: 1;
}

.qep-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
}
</style>
