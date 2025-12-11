<template>
  <el-dialog
    v-model="visible"
    :width="width"
    :top="top"
    :modal="modal"
    :lock-scroll="lockScroll"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :align-center="alignCenter"
    :destroy-on-close="destroyOnClose"
    class="common-dialog"
    @close="handleClose"
    @open="handleOpen"
    @opened="handleOpened"
    @closed="handleClosed"
  >
    <!-- 自定义标题 -->
    <template #header>
      <div class="custom-header">
        <div class="header-title">{{ title }}</div>
      </div>
    </template>

    <!-- 内容区域 -->
    <slot></slot>

    <!-- 底部操作区 -->
    <template v-if="showFooter" #footer>
      <slot name="footer">
        <div class="dialog-footer">
          <el-button @click="handleCancel">{{ cancelText }}</el-button>
          <el-button type="primary" :loading="confirmLoading" @click="handleConfirm">
            {{ confirmText }}
          </el-button>
        </div>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  /** 是否显示弹窗 */
  modelValue?: boolean;
  /** 弹窗标题 */
  title?: string;
  /** 弹窗宽度 */
  width?: string | number;
  /** 距离顶部位置 */
  top?: string;
  /** 是否显示遮罩层 */
  modal?: boolean;
  /** 是否锁定body滚动 */
  lockScroll?: boolean;
  /** 点击遮罩是否关闭 */
  closeOnClickModal?: boolean;
  /** 按ESC是否关闭 */
  closeOnPressEscape?: boolean;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 是否居中显示 */
  alignCenter?: boolean;
  /** 关闭时销毁DOM */
  destroyOnClose?: boolean;
  /** 是否显示底部 */
  showFooter?: boolean;
  /** 取消按钮文字 */
  cancelText?: string;
  /** 确认按钮文字 */
  confirmText?: string;
  /** 确认按钮loading状态 */
  confirmLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: "",
  width: "500px",
  top: "15vh",
  modal: true,
  lockScroll: true,
  closeOnClickModal: false,
  closeOnPressEscape: true,
  showClose: true,
  alignCenter: false,
  destroyOnClose: false,
  showFooter: true,
  cancelText: "取消",
  confirmText: "确定",
  confirmLoading: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
  cancel: [];
  open: [];
  opened: [];
  close: [];
  closed: [];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const handleConfirm = () => {
  emit("confirm");
};

const handleCancel = () => {
  visible.value = false;
  emit("cancel");
};

const handleOpen = () => {
  emit("open");
};

const handleOpened = () => {
  emit("opened");
};

const handleClose = () => {
  emit("close");
};

const handleClosed = () => {
  emit("closed");
};
</script>

<style lang="scss">
// 直接针对 el-dialog 元素，不需要 common-dialog 类
.el-dialog {
  padding: 0 !important;
}
.el-dialog.common-dialog {
  .el-dialog__header {
    height: auto !important;
    padding: 15px 20px !important;
    margin: 0 !important;
    border-bottom: 1px solid #e4e7ed !important;
  }
  .custom-header {
    position: relative;
    padding: 0 !important;
    margin: 0 !important;

    .header-title {
      height: auto !important;
      padding: 0 !important;
      margin: 0 !important;
      font-size: 16px !important;
      font-weight: bold !important;
      line-height: 1 !important;
      color: #303133 !important;
    }
  }

  .el-dialog__headerbtn {
    top: 15px !important;
    right: 15px !important;
    width: auto !important;
    height: auto !important;
  }

  .el-dialog__body {
    padding: 15px 20px !important;
    margin: 0 !important;

    .el-form {
      margin: 0 !important;

      .el-form-item {
        margin-bottom: 16px !important;
      }

      .el-form-item__label {
        padding-left: 0 !important;
        margin-left: 0 !important;
        font-weight: bold !important;
        color: #606266 !important;
        text-align: left !important;
      }

      .el-form-item__content {
        margin-left: 0 !important;
      }
    }
  }

  .el-dialog__footer {
    padding: 20px !important;
    margin: 0 !important;
    border-top: none !important;
  }

  .dialog-footer {
    display: flex !important;
    gap: 10px !important;
    justify-content: flex-end !important;
    padding: 0 !important;
    margin: 0 !important;

    .el-button {
      margin: 0 !important;
      font-weight: bold !important;
    }
  }
}
</style>
