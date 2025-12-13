<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 页面头部 -->
      <div class="page-header">
        <span class="page-title">题库导入</span>
      </div>

      <!-- 表单区域 - 居中显示 -->
      <div class="upload-content">
        <el-form
          ref="formRef"
          :model="formData"
          label-width="110px"
          class="upload-form"
          @submit.prevent
        >
          <!-- 语言选择 -->
          <el-form-item label="选择语言" required>
            <el-radio-group v-model="selectedLanguage">
              <el-radio-button label="zh">中文</el-radio-button>
              <el-radio-button label="en">English</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 题目类型 -->
          <el-form-item label="题目类型" required>
            <el-radio-group v-model="isCase">
              <el-radio-button :label="false">普通题</el-radio-button>
              <el-radio-button :label="true">案例题</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 模板下载 -->
          <el-form-item label="下载模板">
            <el-button type="primary" plain icon="Download" @click="handleDownloadNormalTemplate">
              普通题模板
            </el-button>
            <el-button type="primary" plain icon="Download" @click="handleDownloadCaseTemplate">
              案例题模板
            </el-button>
          </el-form-item>

          <!-- 文件上传 -->
          <el-form-item label="上传文件" required>
            <div class="upload-area-wrapper">
              <input
                ref="fileInputRef"
                type="file"
                accept=".xlsx,.xls"
                style="display: none"
                @change="handleFileSelect"
              />
              <div
                class="upload-dragger"
                @click="triggerFileSelect"
                @drop.prevent="handleDrop"
                @dragover.prevent
              >
                <el-icon class="el-icon--upload" :size="60"><UploadFilled /></el-icon>
                <div class="el-upload__text">
                  将Excel文件拖拽到此处，或
                  <em>点击选择文件</em>
                </div>
                <div class="el-upload__tip">仅支持 .xlsx 或 .xls 格式，文件大小不超过 10MB</div>
              </div>
            </div>
          </el-form-item>

          <!-- 底部警告 -->
          <el-alert type="warning" :closable="false" class="warning-alert">
            <template #title>
              <div class="alert-content">
                <strong>⚠️ 注意：</strong>
                题号由系统自动生成（Excel行号-1），请确保数据行连续，不要有空行
              </div>
            </template>
          </el-alert>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import QuestionBankAPI from "@/api/exam/question-bank-api";

defineOptions({
  name: "QuestionBankUpload",
  inheritAttrs: false,
});

const router = useRouter();
const route = useRoute();
const fileInputRef = ref<HTMLInputElement>();
const formRef = ref();

// 表单数据
const formData = ref({});
const selectedLanguage = ref<string>("zh");
const isCase = ref<boolean>(false);
const subjectId = ref<string>("");

// 下载普通题模板
const handleDownloadNormalTemplate = () => {
  const link = document.createElement("a");
  link.href = "/templates/question_normal_template.xlsx";
  link.download = "题库模板-普通题.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  ElMessage.success("模板下载成功");
};

// 下载案例题模板
const handleDownloadCaseTemplate = () => {
  const link = document.createElement("a");
  link.href = "/templates/question_case_template.xlsx";
  link.download = "题库模板-案例题.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  ElMessage.success("模板下载成功");
};

// 触发文件选择
const triggerFileSelect = () => {
  fileInputRef.value?.click();
};

// 处理拖拽
const handleDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFileUpload(files[0]);
  }
};

// 处理文件选择
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (files && files.length > 0) {
    handleFileUpload(files[0]);
  }
  // 清空 input，允许重复上传同一文件
  target.value = "";
};

// 自定义上传方法
const handleFileUpload = async (file: File) => {
  console.log("handleFileUpload called", file.name);

  // 验证文件类型
  const isExcel =
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel";

  if (!isExcel) {
    ElMessage.error("只能上传 Excel 文件！");
    return;
  }

  // 验证文件大小
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage.error("文件大小不能超过 10MB！");
    return;
  }

  // 使用API上传
  try {
    console.log("Starting upload API call...");
    const response: any = await QuestionBankAPI.upload(file, selectedLanguage.value, isCase.value);
    console.log("Upload API response:", response);

    // 响应拦截器已经返回了data对象: {batchId: "..."}
    if (response && response.batchId) {
      ElMessage.success("文件上传成功，正在解析...");
      const batchId = response.batchId;

      // 跳转到预览页面，带上subjectId参数
      setTimeout(() => {
        const query: any = { batchId };
        if (subjectId.value) {
          query.subjectId = subjectId.value;
        }
        // 传递activeMenu参数，保持菜单选中状态
        if (route.query.activeMenu) {
          query.activeMenu = route.query.activeMenu;
        }
        router.push({
          name: "QuestionBankPreview",
          query,
        });
      }, 500);
    } else {
      ElMessage.error("上传失败：响应数据格式错误");
    }
  } catch (error: any) {
    console.error("上传失败", error);
    ElMessage.error(error.message || "上传失败，请稍后重试");
  }
};

// 初始化
onMounted(() => {
  // 从路由参数获取科目ID
  if (route.query.subjectId) {
    subjectId.value = route.query.subjectId as string;
  }
});
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}

// 页面头部样式（保持一致）
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

// 主要内容区 - 居中布局
.upload-content {
  max-width: 800px;
  margin: 0 auto;
}

// 表单样式
.upload-form {
  .el-form-item {
    margin-bottom: 22px;
  }

  // 表单标签样式
  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: normal;
    color: #606266;
  }

  // 上传区域样式
  .upload-area-wrapper {
    width: 100%;

    .upload-dragger {
      width: 100%;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      background-color: #fff;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      transition: border-color 0.3s;

      &:hover {
        border-color: #409eff;
      }

      .el-icon--upload {
        margin-bottom: 16px;
        font-size: 67px;
        color: #c0c4cc;
      }

      .el-upload__text {
        margin-bottom: 8px;
        font-size: 14px;
        color: #606266;

        em {
          font-style: normal;
          color: #409eff;
        }
      }

      .el-upload__tip {
        margin-top: 8px;
        font-size: 12px;
        line-height: 1.5;
        color: #909399;
      }
    }
  }

  // Warning alert样式
  .warning-alert {
    margin-top: 0;

    :deep(.el-alert__title) {
      font-size: 13px;
      line-height: 1.6;
    }

    .alert-content {
      font-size: 13px;
      font-weight: normal;

      strong {
        font-weight: 600;
      }
    }
  }
}
</style>
