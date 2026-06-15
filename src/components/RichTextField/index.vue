<template>
  <div ref="rootEl" class="rtf-root">
    <!-- 预览态：未编辑时点击进入 -->
    <div
      v-if="!editing"
      class="rtf-preview"
      :class="{ 'rtf-preview-empty': !modelValue }"
      role="textbox"
      tabindex="0"
      @click="enterEdit"
      @keydown.enter.prevent="enterEdit()"
      @keydown.space.prevent="enterEdit()"
    >
      <div v-if="modelValue" class="rtf-preview-html" v-html="formatted"></div>
      <span v-else class="rtf-placeholder">{{ placeholder }}</span>
    </div>

    <!-- 编辑态：完整 WangEditor，工具栏收窄、高度随内容 -->
    <WangEditor
      v-else
      v-model="localValue"
      :toolbar-keys="TOOLBAR_KEYS"
      :auto-height="true"
      :height="minHeight"
      :placeholder="placeholder"
      @ready="handleEditorReady"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import type { IToolbarConfig } from "@wangeditor-next/editor";
import { formatRichText } from "@/utils/rich-text";
import { toEditorHtml } from "@/utils/editor-html";
import { getPreviewCaretOffset, focusEditorAtOffset } from "@/utils/editor-caret";

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

// 工具栏白名单（wangEditor-next v5 menu key），用 "|" 做视觉分组
const TOOLBAR_KEYS: IToolbarConfig["toolbarKeys"] = [
  "headerSelect",
  "|",
  "bold",
  "|",
  "bulletedList",
  "numberedList",
  "|",
  "justifyLeft",
  "justifyCenter",
  "justifyRight",
  "|",
  "insertLink",
  {
    key: "group-image",
    title: "图片",
    menuKeys: ["uploadImage", "insertImage"],
  },
  "codeBlock",
  "|",
  "undo",
  "redo",
  "clearStyle",
];

/**
 * 本地中间值：父→本地直接同步；本地→父在 WangEditor `ready` 之前不向上传播，
 * 避免 wangEditor-next 创建瞬间的内容规整 emit 误把外部 dirty 标记翻为 true。
 */
const localValue = ref<string | undefined>(modelValue.value);
let editorReady = false;

watch(modelValue, (v) => {
  if (v !== localValue.value) localValue.value = v;
});

watch(localValue, (v) => {
  if (!editorReady) return;
  if (v !== modelValue.value) modelValue.value = v;
});

// 点击进入编辑时，记录点击落在预览文本的第几个字符，待编辑器就绪后定位光标
let pendingCaretOffset: number | null = null;

function enterEdit(e?: MouseEvent) {
  pendingCaretOffset = null;
  if (e) {
    const contentEl = rootEl.value?.querySelector<HTMLElement>(".rtf-preview-html");
    if (contentEl) pendingCaretOffset = getPreviewCaretOffset(contentEl, e.clientX, e.clientY);
  }
  // 进入编辑前把外部值规整成 wangEditor 可解析的规范 HTML，确保起手内容（尤其含图片时）
  // 不被严格解析器丢弃。见 utils/editor-html.ts。
  localValue.value = toEditorHtml(modelValue.value);
  editorReady = false;
  editing.value = true;
}

function handleEditorReady(editor: any) {
  editorReady = true;
  const offset = pendingCaretOffset;
  pendingCaretOffset = null;
  // 等编辑器 DOM 渲染完再定位光标到点击位置（失败回退到末尾）
  nextTick(() => focusEditorAtOffset(editor, offset));
}

/**
 * wangEditor-next 的下拉面板 / 模态框 / 弹层会挂到 document.body，
 * 不在组件 DOM 子树里。点击它们时不能误判为 click-outside 收起编辑器，
 * 否则「标题」下拉、「上传图片」模态打开后立即被关掉。
 */
const PORTAL_CLASSES = [
  "w-e-modal",
  "w-e-drop-panel",
  "w-e-select-list",
  "w-e-bar-item-menus-container",
];

function isInsideEditorPortal(target: Node | null): boolean {
  let el = target as HTMLElement | null;
  while (el && el !== document.body) {
    const cls = el.classList;
    if (cls && PORTAL_CLASSES.some((c) => cls.contains(c))) return true;
    el = el.parentElement;
  }
  return false;
}

function handleClickOutside(e: MouseEvent) {
  if (!editing.value) return;
  const root = rootEl.value;
  if (!root) return;
  const target = e.target as Node | null;
  if (!target) return;
  if (root.contains(target)) return;
  if (isInsideEditorPortal(target)) return;
  editing.value = false;
}

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside, true);
});

defineExpose({
  collapse: () => {
    editing.value = false;
  },
});
</script>

<style scoped>
.rtf-root {
  position: relative;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.rtf-preview {
  max-width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  cursor: text;
  background: #fff;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  transition: border-color 0.2s;
}

.rtf-preview:hover,
.rtf-preview:focus {
  outline: none;
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

.rtf-preview-html :deep(img) {
  box-sizing: border-box;
  display: block;
  max-width: 100%;
  height: auto;
}

.rtf-preview-html :deep(table) {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}
</style>
