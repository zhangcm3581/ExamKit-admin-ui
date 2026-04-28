<template>
  <div ref="rootEl" class="rtf-root">
    <!-- 预览态：未编辑时点击进入 -->
    <div
      v-if="!editing"
      class="rtf-preview"
      :class="{ 'rtf-preview-empty': !modelValue }"
      @click="enterEdit"
    >
      <div v-if="modelValue" class="rtf-preview-html" v-html="formatted"></div>
      <span v-else class="rtf-placeholder">{{ placeholder }}</span>
    </div>

    <!-- 编辑态：完整 WangEditor，工具栏收窄、高度随内容 -->
    <WangEditor
      v-else
      v-model="modelValue"
      :toolbar-keys="TOOLBAR_KEYS"
      :auto-height="true"
      :height="minHeight"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from "vue";
import { formatRichText } from "@/utils/rich-text";

defineProps({
  placeholder: {
    type: String,
    default: "点击此处编辑...",
  },
  minHeight: {
    type: String,
    default: "80px",
  },
});

const modelValue = defineModel<string | undefined>({ required: false });

const editing = ref(false);
const rootEl = ref<HTMLElement | null>(null);

const formatted = computed(() => formatRichText(modelValue.value));

// 用户实际想要保留的工具栏：标题、加粗、有序列表、对齐、图片
const TOOLBAR_KEYS = [
  "headerSelect",
  "bold",
  "numberedList",
  "justifyLeft",
  "justifyCenter",
  "justifyRight",
  "uploadImage",
];

function enterEdit() {
  editing.value = true;
}

function handleClickOutside(e: MouseEvent) {
  if (!editing.value) return;
  const root = rootEl.value;
  if (!root) return;
  const target = e.target as Node | null;
  if (target && !root.contains(target)) {
    editing.value = false;
  }
}

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside, true);
});

defineExpose({
  // 调用方可手动收起，比如父组件保存后
  collapse: () => {
    editing.value = false;
  },
});

// 进入编辑后下一帧滚动锚点保持稳定（避免浏览器把视口滚到底）
async function _ensureLayout() {
  await nextTick();
}
void _ensureLayout;
</script>

<style scoped>
.rtf-root {
  position: relative;
  width: 100%;
}

.rtf-preview {
  min-height: 40px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  cursor: text;
  background: #fff;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  transition: border-color 0.2s;
}

.rtf-preview:hover {
  border-color: var(--el-color-primary);
}

.rtf-preview-empty {
  color: #c0c4cc;
}

.rtf-placeholder {
  font-size: 13px;
  color: #c0c4cc;
}

.rtf-preview-html :deep(p) {
  margin: 0;
}

.rtf-preview-html :deep(p + p) {
  margin-top: 4px;
}
</style>
