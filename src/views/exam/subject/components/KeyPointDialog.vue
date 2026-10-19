<template>
  <el-dialog v-model="visible" :title="`考点速记 · ${subjectName}`" width="640px" destroy-on-close>
    <p class="hint">每个科目只能上传一个 PDF，且不超过 50MB。要更换文件，请先删除现有的。</p>
    <div v-if="!loading && rows.length === 0" class="add-row">
      <el-input v-model="title" placeholder="标题，可留空则使用文件名" />
      <el-upload
        :show-file-list="false"
        accept=".pdf,application/pdf"
        :before-upload="beforeUpload"
        :http-request="upload"
      >
        <el-button type="primary" :loading="uploading">上传 PDF</el-button>
      </el-upload>
    </div>
    <el-table v-loading="loading" :data="rows" stripe>
      <el-table-column label="标题" prop="title" min-width="180" />
      <el-table-column label="文件" prop="fileName" min-width="160" show-overflow-tooltip />
      <el-table-column label="操作" width="140" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="rename(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage, ElMessageBox, type UploadRequestOptions } from "element-plus";
import KeyPointAPI, { type KeyPointVO } from "@/api/exam/key-point-api";

const visible = ref(false);
const loading = ref(false);
const uploading = ref(false);
const subjectId = ref("");
const subjectName = ref("");
const title = ref("");
const rows = ref<KeyPointVO[]>([]);

function open(id: string, name: string) {
  subjectId.value = id;
  subjectName.value = name || "";
  title.value = "";
  visible.value = true;
  void load();
}

async function load() {
  loading.value = true;
  try {
    rows.value = (await KeyPointAPI.list(subjectId.value)) || [];
  } finally {
    loading.value = false;
  }
}

const MAX_PDF_BYTES = 50 * 1024 * 1024;

function beforeUpload(file: File) {
  if (rows.value.length > 0) {
    ElMessage.warning("该科目已有考点速记，请先删除后再上传");
    return false;
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    ElMessage.warning("请上传 PDF 文件");
    return false;
  }
  if (file.size > MAX_PDF_BYTES) {
    ElMessage.warning("PDF 不能超过 50MB");
    return false;
  }
  return true;
}

async function upload(options: UploadRequestOptions) {
  uploading.value = true;
  try {
    await KeyPointAPI.create(subjectId.value, title.value.trim(), options.file as File);
    title.value = "";
    ElMessage.success("已上传");
    await load();
  } finally {
    uploading.value = false;
  }
}

async function rename(row: KeyPointVO) {
  try {
    const { value } = await ElMessageBox.prompt("标题", "编辑考点速记", {
      inputValue: row.title,
      inputPattern: /\S/,
      inputErrorMessage: "标题不能为空",
    });
    await KeyPointAPI.rename(row.id, value.trim());
    await load();
  } catch {
    /* 取消 */
  }
}

async function remove(row: KeyPointVO) {
  try {
    await ElMessageBox.confirm(`删除「${row.title}」？`, "删除考点速记", { type: "warning" });
  } catch {
    return;
  }
  await KeyPointAPI.remove(row.id);
  await load();
}

defineExpose({ open });
</script>

<style scoped>
.hint {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.add-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
</style>
