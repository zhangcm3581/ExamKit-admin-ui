<!-- 首页设置 -->
<template>
  <div class="app-container">
    <el-card shadow="hover">
      <template #header>
        <span>首页设置 — 主标题</span>
      </template>

      <el-form
        ref="formRef"
        v-loading="loading"
        :model="formData"
        :rules="rules"
        label-width="120px"
        style="max-width: 720px"
      >
        <el-form-item label="标题(中文)" prop="titleZh">
          <el-input v-model="formData.titleZh" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="标题(英文)" prop="titleEn">
          <el-input v-model="formData.titleEn" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item>
          <el-button
            v-hasPerm="['sys:home-config:edit']"
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            保存
          </el-button>
          <el-button @click="loadData">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import HomeConfigAPI, { type HomeConfigForm } from "@/api/system/home-config-api";

defineOptions({ name: "HomeConfig" });

const formRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);

const formData = reactive<HomeConfigForm>({ titleZh: "", titleEn: "" });

const rules: FormRules = {
  titleZh: [{ required: true, message: "请输入中文标题", trigger: "blur" }],
  titleEn: [{ required: true, message: "请输入英文标题", trigger: "blur" }],
};

async function loadData() {
  loading.value = true;
  try {
    const data = await HomeConfigAPI.get();
    formData.titleZh = data.titleZh;
    formData.titleEn = data.titleEn;
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    await HomeConfigAPI.update({ ...formData });
    ElMessage.success("保存成功");
  } finally {
    submitting.value = false;
  }
}

onMounted(loadData);
</script>
