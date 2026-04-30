<template>
  <el-dialog
    v-model="visible"
    title="分享好友"
    width="360px"
    align-center
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <div v-loading="loading" class="qr-content">
      <template v-if="!error">
        <div class="title">
          <div class="name-zh">{{ nameZh }}</div>
          <div v-if="nameEn" class="name-en">{{ nameEn }}</div>
        </div>

        <div class="qr-image">
          <img v-if="url" :src="url" alt="小程序码" />
        </div>

        <div class="hint">📱 使用微信扫一扫</div>

        <div class="actions">
          <a v-if="url" :href="url" :download="downloadName" target="_blank">
            <el-button type="primary" plain>下载二维码</el-button>
          </a>
        </div>
      </template>

      <el-result v-else icon="error" title="生成失败" :sub-title="errorMsg">
        <template #extra>
          <el-button type="primary" @click="fetchQr">重试</el-button>
        </template>
      </el-result>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import SubjectAPI from "@/api/exam/subject-api";

interface Props {
  modelValue: boolean;
  subjectId: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const loading = ref(false);
const error = ref(false);
const errorMsg = ref("");
const url = ref("");
const nameZh = ref("");
const nameEn = ref<string | undefined>(undefined);

const downloadName = computed(() =>
  props.subjectId ? `${props.subjectId.slice(0, 8)}_miniapp_qr.png` : "miniapp_qr.png"
);

async function fetchQr() {
  if (!props.subjectId) return;
  loading.value = true;
  error.value = false;
  errorMsg.value = "";
  try {
    const data = await SubjectAPI.getMiniappQr(props.subjectId);
    url.value = data.url;
    nameZh.value = data.nameZh;
    nameEn.value = data.nameEn;
  } catch (e: any) {
    error.value = true;
    errorMsg.value = e?.message || "请稍后重试";
  } finally {
    loading.value = false;
  }
}

function handleOpen() {
  url.value = "";
  nameZh.value = "";
  nameEn.value = undefined;
  errorMsg.value = "";
  fetchQr();
}

watch(
  () => props.subjectId,
  () => {
    if (visible.value) handleOpen();
  }
);
</script>

<style lang="scss" scoped>
.qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 360px;
  padding: 8px 0 4px;
}

.title {
  margin-bottom: 16px;
  text-align: center;

  .name-zh {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .name-en {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.qr-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 256px;
  height: 256px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  img {
    max-width: 100%;
    max-height: 100%;
  }
}

.hint {
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.actions {
  margin-top: 4px;
}
</style>
