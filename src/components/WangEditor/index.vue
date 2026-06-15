<!--
 * 基于 wangEditor-next 的富文本编辑器组件二次封装
 * 版权所有 © 2021-present 有来开源组织
 *
 * 开源协议：https://opensource.org/licenses/MIT
 * 项目地址：https://gitee.com/youlaiorg/vue3-element-admin
 *
 * 在使用时，请保留此注释，感谢您对开源的支持！
-->

<template>
  <div class="wang-editor-wrap">
    <!-- 工具栏 -->
    <Toolbar
      :editor="editorRef"
      mode="simple"
      :default-config="toolbarConfig"
      style="border-bottom: 1px solid var(--el-border-color)"
    />
    <!-- 编辑器 -->
    <Editor
      v-model="modelValue"
      :style="editorStyle"
      :default-config="editorConfig"
      mode="simple"
      @on-created="handleCreated"
    />
  </div>
</template>

<script setup lang="ts">
import "@wangeditor-next/editor/dist/css/style.css";
import { Toolbar, Editor } from "@wangeditor-next/editor-for-vue";
import { IToolbarConfig, IEditorConfig } from "@wangeditor-next/editor";

// 文件上传 API
import FileManageAPI from "@/api/file-api";

// 上传图片回调函数类型
type InsertFnType = (_url: string, _alt: string, _href: string) => void;

/** insertImage 菜单配置（@wangeditor-next/editor 未导出对应类型） */
interface InsertImageMenuConf {
  checkImage?: (src: string, alt: string, href: string) => boolean | string;
  parseImageSrc?: (src: string) => string;
}

/** 网络图片地址校验（insertImage 菜单） */
function checkImageUrl(src: string, alt: string, href: string): boolean | string {
  const url = src?.trim();
  if (!url) return "请输入图片地址";
  if (!/^https?:\/\//i.test(url) && !url.startsWith("data:image/")) {
    return "图片地址需以 http:// 或 https:// 开头";
  }
  void alt;
  void href;
  return true;
}

const insertImageMenuConf: InsertImageMenuConf = {
  checkImage: checkImageUrl,
  parseImageSrc: (src: string) => src.trim(),
};

const props = defineProps({
  height: {
    type: String,
    default: "500px",
  },
  toolbarKeys: {
    type: Array as () => IToolbarConfig["toolbarKeys"],
    default: undefined,
  },
  autoHeight: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: "请输入内容...",
  },
});

const emit = defineEmits<{
  ready: [editor: any];
}>();

// 高度策略：autoHeight=true 时让内容自然撑高，仅设最小高度避免空内容塌缩
const editorStyle = computed(() =>
  props.autoHeight
    ? { height: "auto", minHeight: props.height, overflowY: "hidden" as const }
    : { height: props.height, overflowY: "hidden" as const }
);
// 双向绑定
const modelValue = defineModel("modelValue", {
  type: String,
  required: false,
});

// 编辑器实例，必须用 shallowRef，重要！
const editorRef = shallowRef();

/** 高于 Element Plus Dialog（约 2000+），避免编辑试题弹窗内图片/链接模态被遮挡 */
const EDITOR_MODAL_Z_INDEX = 10000;

// 工具栏配置：弹层挂到 body，避免 el-dialog / overflow 裁剪
const toolbarConfig = computed<Partial<IToolbarConfig>>(() => ({
  modalAppendToBody: true,
  ...(props.toolbarKeys ? { toolbarKeys: props.toolbarKeys } : {}),
}));

function centerModalOnBody(modalOrPanel: { type?: string; $elem?: unknown }) {
  if (modalOrPanel?.type !== "modal") return;
  const raw = modalOrPanel.$elem as { elems?: HTMLElement[] } | HTMLElement | null;
  const el =
    raw && "elems" in raw && raw.elems?.[0]
      ? raw.elems[0]
      : raw instanceof HTMLElement
        ? raw
        : null;
  if (!el?.classList?.contains("w-e-modal")) return;

  requestAnimationFrame(() => {
    const width = el.offsetWidth || 300;
    const height = el.offsetHeight || 160;
    Object.assign(el.style, {
      position: "fixed",
      left: "50%",
      top: "50%",
      right: "auto",
      marginLeft: `${-width / 2}px`,
      marginTop: `${-height / 2}px`,
      zIndex: String(EDITOR_MODAL_Z_INDEX),
    });
  });
}

// 编辑器配置：placeholder 跟随 prop
const editorConfig = computed<Partial<IEditorConfig>>(() => ({
  placeholder: props.placeholder,
  // 关闭默认的「创建即聚焦到开头」，由调用方（RichTextField）按点击位置自行定位光标
  autoFocus: false,
  MENU_CONF: {
    uploadImage: {
      customUpload(file: File, insertFn: InsertFnType) {
        const formData = new FormData();
        formData.append("file", file);

        FileManageAPI.upload(formData)
          .then((res) => {
            insertFn(res.url, res.fileName, res.url);
          })
          .catch((error) => {
            console.error("图片上传失败:", error);
            ElMessage.error("图片上传失败");
          });
      },
    } as any,
    insertImage: insertImageMenuConf,
  },
}));

// 记录 editor 实例，重要！
const handleCreated = (editor: any) => {
  editorRef.value = editor;
  editor.on?.("modalOrPanelShow", centerModalOnBody);
  emit("ready", editor);
};

// 组件销毁时，也及时销毁编辑器，重要！
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});
</script>

<style scoped>
.wang-editor-wrap {
  position: relative;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
}
</style>

<style>
/* appendToBody 的模态框：居中且置于最前（与 centerModalOnBody 双保险） */
body > .w-e-modal {
  position: fixed !important;
  inset: auto !important;
  top: 50% !important;
  right: auto !important;
  left: 50% !important;
  z-index: 10000 !important;
  max-width: calc(100vw - 32px);
  transform: translate(-50%, -50%) !important;
}

/* 覆盖 wangEditor-next 内核默认 p {margin:15px 0}/h1-h5 {margin:20px 0}，
   减小段落与标题的上下间距，让编辑视觉与前端 .rich-text-content 渲染更接近 */
.w-e-text-container [data-slate-editor] p {
  margin: 0 0 6px 0;
}

.w-e-text-container [data-slate-editor] h1,
.w-e-text-container [data-slate-editor] h2,
.w-e-text-container [data-slate-editor] h3,
.w-e-text-container [data-slate-editor] h4,
.w-e-text-container [data-slate-editor] h5 {
  margin: 12px 0 6px 0;
}

/* 宽图/带 width 属性的图片不撑破编辑区与弹窗 */
.wang-editor-wrap .w-e-text-container,
.wang-editor-wrap .w-e-scroll {
  max-width: 100%;
  overflow-x: auto;
}

.wang-editor-wrap .w-e-text-container [data-slate-editor] img {
  box-sizing: border-box;
  display: block;
  width: auto !important;
  max-width: 100% !important;
  height: auto !important;
}

.wang-editor-wrap .w-e-text-container [data-slate-editor] table {
  display: block;
  max-width: 100%;
  overflow-x: auto;
}
</style>
