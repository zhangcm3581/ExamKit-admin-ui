<template>
  <div class="app-container">
    <el-card shadow="never" class="import-card">
      <div class="content-wrapper">
        <div class="import-header">
          <h2 class="import-title">模板导入试题</h2>
          <p class="import-subtitle">
            请先下载格式化模板，参考模板，调整自己的文档格式，再进行上传
          </p>
        </div>
        <div class="import-content">
          <!-- Excel导入 -->
          <div class="import-section">
            <div class="icon-wrapper">
              <el-icon class="import-icon" color="#67C23A" :size="80">
                <DocumentCopy />
              </el-icon>
            </div>
            <h3 class="section-title">Excel模板导入</h3>
            <div class="section-description">
              <ol>
                <li>支持图片上传，图片放在单元格以内</li>
                <li>不支持公式</li>
                <li>支持富文本编辑导入</li>
                <li>按照模板格式，编辑输入试题文档</li>
                <li>
                  案例分析/案列题批量导入，请单独下载Excel案例分析模板
                  <a href="#" class="link">查看教程</a>
                </li>
              </ol>
            </div>
            <div class="button-group">
              <el-button plain class="download-button" @click="handleDownloadExcelTemplate">
                Excel模板下载
              </el-button>
              <el-button plain class="download-button" @click="handleDownloadExcelExample">
                Excel案例分析模板下载
              </el-button>
            </div>
            <div class="upload-button-wrapper">
              <el-upload
                ref="uploadRef"
                class="upload-area"
                :action="uploadAction"
                :headers="uploadHeaders"
                :data="uploadData"
                :on-success="handleUploadSuccess"
                :on-error="handleUploadError"
                :before-upload="beforeUpload"
                :show-file-list="false"
                accept=".xlsx,.xls"
              >
                <el-button type="primary" size="large" class="upload-button">
                  <el-icon class="el-icon--left"><UploadFilled /></el-icon>
                  上传题库
                </el-button>
              </el-upload>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { UploadFilled, DocumentCopy } from "@element-plus/icons-vue";
import { useRoute } from "vue-router";

defineOptions({
  name: "QuestionImport",
  inheritAttrs: false,
});

const route = useRoute();
const uploadRef = ref();

// 获取科目ID（从路由参数中获取）
const subjectId = ref(route.query.subjectId || "");

// 上传配置
const uploadAction = ref(`${import.meta.env.VITE_APP_BASE_API}/v1/questions/import/excel`);
const uploadHeaders = ref({
  Authorization: localStorage.getItem("accessToken") || "",
});
const uploadData = ref({
  subjectId: subjectId.value,
});

// 下载Excel模板
const handleDownloadExcelTemplate = () => {
  const link = document.createElement("a");
  link.href = "/docs/example.xlsx";
  link.download = "Excel模板.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  ElMessage.success("模板下载成功");
};

// 下载Excel案例分析模板
const handleDownloadExcelExample = () => {
  const link = document.createElement("a");
  link.href = "/docs/example_case.xlsx";
  link.download = "Excel案例分析模板.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  ElMessage.success("案例分析模板下载成功");
};

// 上传前校验
const beforeUpload = (file: File) => {
  const isExcel =
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel";
  const isLt10M = file.size / 1024 / 1024 < 10;

  if (!isExcel) {
    ElMessage.error("只能上传 Excel 文件！");
    return false;
  }
  if (!isLt10M) {
    ElMessage.error("文件大小不能超过 10MB！");
    return false;
  }
  return true;
};

// 上传成功
const handleUploadSuccess = (response: any) => {
  if (response.code === "00000") {
    ElMessage.success("导入成功！");
  } else {
    ElMessage.error(response.msg || "导入失败！");
  }
};

// 上传失败
const handleUploadError = () => {
  ElMessage.error("上传失败，请稍后重试！");
};
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}

.import-card {
  min-height: 650px;

  :deep(.el-card__body) {
    min-height: 650px;
    padding: 20px;
  }
}

.content-wrapper {
  box-sizing: border-box;
  width: 100%;
  min-height: calc(650px - 40px);
  padding: 30px;
  background-color: #f8f9fa;
  border: 2px dashed #409eff;
  border-radius: 4px;
}

.import-header {
  margin-bottom: 20px;
  text-align: center;

  .import-title {
    margin: 0 0 10px 0;
    font-size: 20px;
    font-weight: bold;
    color: #303133;
  }

  .import-subtitle {
    margin: 0;
    font-size: 14px;
    color: #f56c6c;
  }
}

.import-content {
  display: flex;
  justify-content: center;
  margin-bottom: 0;
}

.import-section {
  min-width: 500px;
  padding: 20px;
  text-align: center;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;

  .icon-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 15px;

    .import-icon {
      width: 60px;
      height: 60px;
    }
  }

  .section-title {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }

  .section-description {
    margin-bottom: 20px;
    text-align: left;

    ol {
      padding-left: 20px;
      margin: 0;

      li {
        font-size: 13px;
        line-height: 1.8;
        color: #606266;
      }
    }

    .link {
      color: #409eff;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .button-group {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 15px;

    .el-button {
      flex: 1;
      font-weight: bold;
    }

    .download-button {
      color: #67c23a !important;
      background-color: #fff !important;
      border-color: #67c23a !important;

      &:hover {
        background-color: #fff !important;
        opacity: 0.8;
      }

      &:active {
        opacity: 0.9;
      }
    }
  }

  .upload-button-wrapper {
    display: flex;
    justify-content: center;

    .upload-area {
      width: 100%;

      :deep(.el-upload) {
        display: block;
        width: 100%;
      }
    }

    .upload-button {
      width: 100%;
      height: auto;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: bold;

      .el-icon--left {
        font-size: 16px;
      }
    }
  }
}
</style>
