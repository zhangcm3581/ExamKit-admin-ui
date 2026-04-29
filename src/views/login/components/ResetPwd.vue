<template>
  <div class="login-form">
    <header class="form-header">
      <div class="form-eyebrow">Forgot Password</div>
      <div class="form-title-row">
        <h2 class="form-title">重置密码</h2>
        <span class="form-title-tag">输入用户名以发起重置</span>
      </div>
    </header>

    <el-form ref="formRef" :model="model" :rules="rules" size="large" class="ek-form">
      <el-form-item prop="username">
        <label class="ek-label">用户名</label>
        <el-input v-model.trim="model.username" :placeholder="t('login.username')">
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item class="submit-item">
        <button type="button" class="ek-btn primary" @click="submit">
          <span class="btn-label">重置密码</span>
        </button>
      </el-form-item>
    </el-form>

    <div class="form-aside">
      <span>{{ t("login.thinkOfPasswd") }}</span>
      <a class="form-link strong" @click="toLogin">{{ t("login.login") }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { FormInstance } from "element-plus";

const { t } = useI18n();

const emit = defineEmits(["update:modelValue"]);
const toLogin = () => emit("update:modelValue", "login");

const model = ref({
  username: "",
});

const rules = computed(() => {
  return {
    username: [
      {
        required: true,
        trigger: "blur",
        message: t("login.message.username.required"),
      },
    ],
  };
});

const formRef = ref<FormInstance>();

const submit = async () => {
  await formRef.value?.validate();
  ElMessage.warning("开发中 ...");
};
</script>

<style lang="scss" scoped>
@use "./form-shared";

.form-aside {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 28px;
  font-size: 13px;
  color: rgb(15 23 41 / 60%);
}

:global(html.dark) .form-aside {
  color: rgb(244 239 231 / 60%);
}
</style>
