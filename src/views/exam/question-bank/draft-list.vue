<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <span class="page-title">草稿题库</span>
          <el-button
            type="primary"
            class="action-btn"
            icon="Upload"
            style="margin-left: 16px"
            @click="handleUpload"
          >
            上传题库
          </el-button>
        </div>
      </div>

      <!-- 搜索表单 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="文件名">
          <el-input
            v-model="queryParams.fileName"
            placeholder="请输入文件名"
            clearable
            style="width: 300px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="语言">
          <el-select
            v-model="queryParams.language"
            placeholder="全部"
            clearable
            style="width: 120px"
            @change="handleQuery"
          >
            <el-option label="中文" value="zh" />
            <el-option label="英文" value="en" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="action-btn" icon="Search" @click="handleQuery">
            搜索
          </el-button>
          <el-button icon="Refresh" class="action-btn" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 表格 -->
      <el-table v-loading="loading" :data="draftList" style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="fileName" label="文件名" min-width="200" />
        <el-table-column prop="language" label="语言" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.language === 'zh'" type="success">中文</el-tag>
            <el-tag v-else type="primary">English</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalCount" label="题目数量" width="120" align="center" />
        <el-table-column prop="createTime" label="上传时间" width="200" />
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              class="action-btn"
              type="primary"
              link
              icon="View"
              @click="handlePreview(row)"
            >
              预览
            </el-button>
            <el-button
              class="action-btn"
              type="danger"
              link
              icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="handleQuery"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import QuestionBankAPI, { DraftMetadata } from "@/api/exam/question-bank-api";

defineOptions({
  name: "QuestionBankDraftList",
  inheritAttrs: false,
});

const router = useRouter();
const loading = ref(false);
const draftList = ref<DraftMetadata[]>([]);
const total = ref(0);

const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  fileName: "",
  language: "",
});

// 查询草稿列表
const handleQuery = async () => {
  loading.value = true;
  try {
    const response = await QuestionBankAPI.getDraftList(
      queryParams.value.pageNum,
      queryParams.value.pageSize,
      queryParams.value.fileName,
      queryParams.value.language
    );
    draftList.value = response.records;
    total.value = response.total;
  } catch (error) {
    console.error(error);
    ElMessage.error("加载草稿列表失败");
  } finally {
    loading.value = false;
  }
};

// 重置搜索
const handleReset = () => {
  queryParams.value.fileName = "";
  queryParams.value.language = "";
  queryParams.value.pageNum = 1;
  handleQuery();
};

// 上传题库
const handleUpload = () => {
  router.push({
    path: "/exam/question-bank/upload",
    query: { activeMenu: "/exam/question-bank" },
  });
};

// 预览草稿
const handlePreview = (row: any) => {
  router.push({
    name: "QuestionBankPreview",
    query: {
      batchId: row.batchId,
      activeMenu: "/exam/question-bank",
    },
  });
};

// 删除草稿
const handleDelete = async (row: DraftMetadata) => {
  try {
    await ElMessageBox.confirm(`确定要删除草稿“${row.fileName}”吗？删除后无法恢复。`, "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await QuestionBankAPI.deleteDraft(row.batchId);

    ElMessage.success("删除成功");
    handleQuery();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="scss">
.app-container {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.search-form {
  margin-top: 16px;
  margin-bottom: 16px;
}

.action-btn {
  font-weight: bold;
}
</style>
