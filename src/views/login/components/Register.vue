<template>
  <div class="login-form">
    <header class="form-header">
      <div class="form-eyebrow">Sign Up</div>
      <div class="form-title-row">
        <h2 class="form-title">创建账号</h2>
        <span class="form-title-tag">加入掌学兔 · 开启认证练习</span>
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

      <el-tooltip :visible="isCapsLock" :content="t('login.capsLock')" placement="right">
        <el-form-item prop="password">
          <label class="ek-label">密码</label>
          <el-input
            v-model.trim="model.password"
            :placeholder="t('login.password')"
            type="password"
            show-password
            @keyup="checkCapsLock"
            @keyup.enter="submit"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-tooltip>

      <el-tooltip :visible="isCapsLock" :content="t('login.capsLock')" placement="right">
        <el-form-item prop="confirmPassword">
          <label class="ek-label">确认密码</label>
          <el-input
            v-model.trim="model.confirmPassword"
            :placeholder="t('login.message.password.confirm')"
            type="password"
            show-password
            @keyup="checkCapsLock"
            @keyup.enter="submit"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-tooltip>

      <el-form-item prop="captchaCode">
        <label class="ek-label">验证码</label>
        <div class="captcha-row">
          <el-input
            v-model.trim="model.captchaCode"
            :placeholder="t('login.captchaCode')"
            class="captcha-input"
            @keyup.enter="submit"
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

      <div class="form-row agreement">
        <el-checkbox v-model="isRead">
          <span class="agreement-text">
            {{ t("login.agree") }}
            <a class="form-link strong">{{ t("login.userAgreement") }}</a>
          </span>
        </el-checkbox>
      </div>

      <el-form-item class="submit-item">
        <button type="button" class="ek-btn primary" :disabled="loading" @click="submit">
          <span class="btn-label">注 册</span>
        </button>
      </el-form-item>
    </el-form>

    <div class="form-aside">
      <span>{{ t("login.haveAccount") }}</span>
      <a class="form-link strong" @click="toLogin">{{ t("login.login") }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance } from "element-plus";
import { Lock } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import AuthAPI, { type LoginFormData } from "@/api/auth-api";

const { t } = useI18n();

const emit = defineEmits(["update:modelValue"]);
const toLogin = () => emit("update:modelValue", "login");

onMounted(() => getCaptcha());

const formRef = ref<FormInstance>();
const loading = ref(false);
const isCapsLock = ref(false);
const captchaBase64 = ref();
const isRead = ref(false);

interface Model extends LoginFormData {
  confirmPassword: string;
}

const model = ref<Model>({
  username: "admin",
  password: "123456",
  confirmPassword: "",
  captchaKey: "",
  captchaCode: "",
  rememberMe: false,
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
    confirmPassword: [
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
      {
        validator: (_: any, value: string) => {
          return value === model.value.password;
        },
        trigger: "blur",
        message: t("login.message.password.inconformity"),
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
      model.value.captchaKey = data.captchaKey;
      captchaBase64.value = data.captchaBase64;
    })
    .finally(() => (codeLoading.value = false));
}

function checkCapsLock(event: KeyboardEvent) {
  if (event instanceof KeyboardEvent) {
    isCapsLock.value = event.getModifierState("CapsLock");
  }
}

const submit = async () => {
  await formRef.value?.validate();
  ElMessage.warning("开发中 ...");
};
</script>

<style lang="scss" scoped>
@use "./form-shared";

.agreement {
  margin: -4px 2px 24px;
}

.agreement-text {
  font-size: 13px;
  color: rgb(15 23 41 / 65%);
}

:global(html.dark) .agreement-text {
  color: rgb(244 239 231 / 65%);
}

.form-aside {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
  font-size: 13px;
  color: rgb(15 23 41 / 60%);
}

:global(html.dark) .form-aside {
  color: rgb(244 239 231 / 60%);
}
</style>
