<template>
  <div class="qep-root">
    <div class="qep-placeholder">编辑面板（开发中）</div>
    <div class="qep-actions">
      <el-button @click="onCancel"><b>取消</b></el-button>
      <el-button type="primary" :loading="saving" @click="onSave">
        <b>保存题目</b>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import type { QuestionVO } from "@/api/exam/question-api";

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

function onCancel() {
  emit("cancel");
}

function onSave() {
  // 占位：真正的保存在 Task 4 替换为 QuestionAPI.update + getFormData
  ElMessage.info("脚手架阶段");
  void props;
  void emit;
}
</script>

<style scoped>
.qep-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qep-placeholder {
  padding: 16px;
  font-size: 13px;
  color: #909399;
  text-align: center;
  background: #f5f7fa;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
}

.qep-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
