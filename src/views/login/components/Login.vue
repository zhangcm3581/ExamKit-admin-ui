<template>
  <div class="login-form">
    <header class="form-header">
      <div class="form-eyebrow">User Login</div>
      <div class="form-title-row">
        <h2 class="form-title">欢迎登录</h2>
        <span class="form-title-tag">掌学兔 后台管理系统</span>
      </div>
      <p class="form-sub">默认账号 · admin / 123456</p>
    </header>

    <el-form
      ref="loginFormRef"
      :model="loginFormData"
      :rules="loginRules"
      size="large"
      :validate-on-rule-change="false"
      class="ek-form"
    >
      <!-- Username -->
      <el-form-item prop="username">
        <label class="ek-label">用户名</label>
        <el-input v-model.trim="loginFormData.username" :placeholder="t('login.username')">
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <!-- Password -->
      <el-tooltip :visible="isCapsLock" :content="t('login.capsLock')" placement="right">
        <el-form-item prop="password">
          <label class="ek-label">密码</label>
          <el-input
            v-model.trim="loginFormData.password"
            :placeholder="t('login.password')"
            type="password"
            show-password
            @keyup="checkCapsLock"
            @keyup.enter="handleLoginSubmit"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-tooltip>

      <!-- Captcha -->
      <el-form-item prop="captchaCode">
        <label class="ek-label">验证码</label>
        <div class="captcha-row">
          <el-input
            v-model.trim="loginFormData.captchaCode"
            :placeholder="t('login.captchaCode')"
            clearable
            class="captcha-input"
            @keyup.enter="handleLoginSubmit"
          >
            <template #prefix>
              <div class="i-svg:captcha" />
            </template>
          </el-input>
          <button type="button" class="captcha-img" @click="getCaptcha">
            <el-icon v-if="codeLoading" class="is-loading" :size="18">
              <Loading />
            </el-icon>
            <img v-else-if="captchaBase64" :src="captchaBase64" alt="captcha" />
            <span v-else class="captcha-empty">点击获取</span>
          </button>
        </div>
      </el-form-item>

      <div class="form-row">
        <el-checkbox v-model="loginFormData.rememberMe">{{ t("login.rememberMe") }}</el-checkbox>
        <a class="form-link" @click="toOtherForm('resetPwd')">
          {{ t("login.forgetPassword") }}
        </a>
      </div>

      <el-form-item class="submit-item">
        <button type="button" class="ek-btn primary" :disabled="loading" @click="handleLoginSubmit">
          <span v-if="!loading" class="btn-label">登 录</span>
          <span v-else class="btn-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>登录中</span>
          </span>
        </button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance } from "element-plus";
import AuthAPI, { type LoginFormData } from "@/api/auth-api";
import router from "@/router";
import { useUserStore } from "@/store";
import { AuthStorage } from "@/utils/auth";

const { t } = useI18n();
const userStore = useUserStore();
const route = useRoute();

onMounted(() => getCaptcha());

const loginFormRef = ref<FormInstance>();
const loading = ref(false);
const isCapsLock = ref(false);
const captchaBase64 = ref();
const rememberMe = AuthStorage.getRememberMe();

const loginFormData = ref<LoginFormData>({
  username: "admin",
  password: "123456",
  captchaKey: "",
  captchaCode: "",
  rememberMe,
});

const loginRules = computed(() => {
  return {
    username: [
      {
        required: true,
        trigger: "blur",
        message: t("login.message.username.required"),
      },
    ],
    password: [
      {
        required: true,
        trigger: "blur",
        message: t("login.message.password.required"),
      },
      {
        min: 6,
        message: t("login.message.password.min"),
        trigger: "blur",
      },
    ],
    captchaCode: [
      {
        required: true,
        trigger: "blur",
        message: t("login.message.captchaCode.required"),
      },
    ],
  };
});

const codeLoading = ref(false);
function getCaptcha() {
  codeLoading.value = true;
  AuthAPI.getCaptcha()
    .then((data) => {
      loginFormData.value.captchaKey = data.captchaKey;
      captchaBase64.value = data.captchaBase64;
    })
    .finally(() => (codeLoading.value = false));
}

async function handleLoginSubmit() {
  try {
    const valid = await loginFormRef.value?.validate();
    if (!valid) return;

    loading.value = true;

    await userStore.login(loginFormData.value);

    ElMessage.success("登录成功");

    await nextTick();

    const redirectPath = (route.query.redirect as string) || "/";
    await router.push(decodeURIComponent(redirectPath));
  } catch (error: any) {
    getCaptcha();

    const errorMessage = error?.message || error || "登录失败，请重试";
    ElMessage.error(errorMessage);

    console.error("登录失败:", error);
  } finally {
    loading.value = false;
  }
}

function checkCapsLock(event: KeyboardEvent) {
  if (event instanceof KeyboardEvent) {
    isCapsLock.value = event.getModifierState("CapsLock");
  }
}

const emit = defineEmits(["update:modelValue"]);
function toOtherForm(type: "register" | "resetPwd") {
  emit("update:modelValue", type);
}
</script>

<style lang="scss" scoped>
@use "./form-shared";
</style>
