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
  <div style="z-index: 999; border: 1px solid var(--el-border-color)">
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

const props = defineProps({
  height: {
    type: String,
    default: "500px",
  },
  toolbarKeys: {
    type: Array as () => string[],
    default: undefined,
  },
  autoHeight: {
    type: Boolean,
    default: false,
  },
});

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

// 工具栏配置：toolbarKeys 提供白名单时收窄菜单
const toolbarConfig = computed<Partial<IToolbarConfig>>(() =>
  props.toolbarKeys ? { toolbarKeys: props.toolbarKeys } : {}
);

// 编辑器配置
const editorConfig = ref<Partial<IEditorConfig>>({
  placeholder: "请输入内容...",
  MENU_CONF: {
    uploadImage: {
      customUpload(file: File, insertFn: InsertFnType) {
        // 创建 FormData
        const formData = new FormData();
        formData.append("file", file);

        // 上传图片到 COS
        FileManageAPI.upload(formData)
          .then((res) => {
            // 插入图片（url, alt, href）
            insertFn(res.url, res.fileName, res.url);
          })
          .catch((error) => {
            console.error("图片上传失败:", error);
            ElMessage.error("图片上传失败");
          });
      },
    } as any,
  },
});

// 记录 editor 实例，重要！
const handleCreated = (editor: any) => {
  editorRef.value = editor;
};

// 组件销毁时，也及时销毁编辑器，重要！
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});
</script>
