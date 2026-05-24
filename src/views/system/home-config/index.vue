<!-- 站点配置 -->
<template>
  <div class="app-container">
    <el-card shadow="hover" class="mb-4">
      <template #header>
        <span>首页设置 — 主标题</span>
      </template>

      <el-form
        ref="titleFormRef"
        v-loading="loading"
        :model="formData"
        :rules="titleRules"
        label-width="160px"
        style="max-width: 720px"
      >
        <el-form-item label="标题(中文)" prop="titleZh">
          <el-input v-model="formData.titleZh" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="标题(英文)" prop="titleEn">
          <el-input v-model="formData.titleEn" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover">
      <template #header>
        <span>站点配置 — 客服与题数展示</span>
      </template>

      <el-form
        ref="siteFormRef"
        v-loading="loading"
        :model="formData"
        :rules="siteRules"
        label-width="160px"
        style="max-width: 720px"
      >
        <el-form-item label="客服二维码 URL" prop="customerServiceWechatQrUrl">
          <el-input
            v-model="formData.customerServiceWechatQrUrl"
            placeholder="https://..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="客服微信号" prop="customerServiceWechatId">
          <el-input
            v-model="formData.customerServiceWechatId"
            placeholder="展示用微信号文案"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="未激活隐藏题数" prop="hideTotalBeforeActivate">
          <el-switch v-model="formData.hideTotalBeforeActivate" />
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

const titleFormRef = ref<FormInstance>();
const siteFormRef = ref<FormInstance>();
const loading = ref(false);
const submitting = ref(false);

const formData = reactive<HomeConfigForm>({
  titleZh: "",
  titleEn: "",
  customerServiceWechatQrUrl: "",
  customerServiceWechatId: "",
  hideTotalBeforeActivate: true,
});

const titleRules: FormRules = {
  titleZh: [{ required: true, message: "请输入中文标题", trigger: "blur" }],
  titleEn: [{ required: true, message: "请输入英文标题", trigger: "blur" }],
};

const siteRules: FormRules = {
  hideTotalBeforeActivate: [{ required: true, message: "请设置开关", trigger: "change" }],
};

async function loadData() {
  loading.value = true;
  try {
    const data = await HomeConfigAPI.get();
    formData.titleZh = data.titleZh;
    formData.titleEn = data.titleEn;
    formData.customerServiceWechatQrUrl = data.customerServiceWechatQrUrl || "";
    formData.customerServiceWechatId = data.customerServiceWechatId || "";
    formData.hideTotalBeforeActivate = data.hideTotalBeforeActivate ?? true;
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  await Promise.all([titleFormRef.value?.validate(), siteFormRef.value?.validate()]);
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

<style scoped>
.mb-4 {
  margin-bottom: 16px;
}
</style>
