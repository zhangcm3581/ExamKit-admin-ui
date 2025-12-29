<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="success" @click="handleExport">导出</el-button>
          <el-button type="primary" @click="handleAdd">生成激活码</el-button>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入激活码"
            clearable
            style="width: 200px; margin-right: 8px"
            @keyup.enter="handleSearch"
          />
          <el-select
            v-model="queryParams.subjectId"
            placeholder="科目"
            clearable
            style="width: 150px; margin-right: 8px"
            @change="handleQuery"
          >
            <el-option
              v-for="subject in subjectOptions"
              :key="subject.id"
              :label="subject.nameZh"
              :value="subject.id"
            />
          </el-select>
          <el-select
            v-model="queryParams.status"
            placeholder="状态"
            clearable
            style="width: 100px; margin-right: 8px"
            @change="handleQuery"
          >
            <el-option label="未使用" :value="0" />
            <el-option label="已使用" :value="1" />
            <el-option label="已过期" :value="2" />
          </el-select>
          <el-button type="primary" icon="Search" @click="handleSearch" />
          <el-button icon="Refresh" @click="handleReset" />
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        header-cell-class-name="table-header"
        class="code-table"
        stripe
      >
        <el-table-column label="序号" width="80" align="center">
          <template #default="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="激活码" prop="code" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            <span class="code-text">{{ scope.row.code }}</span>
            <el-icon class="copy-icon" @click="handleCopy(scope.row.code)">
              <DocumentCopy />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="科目" prop="subjectName" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag
              :type="
                scope.row.status === 0 ? 'success' : scope.row.status === 1 ? 'info' : 'warning'
              "
              size="small"
              effect="plain"
            >
              {{ scope.row.status === 0 ? "未使用" : scope.row.status === 1 ? "已使用" : "已过期" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用者" prop="usedByName" min-width="120" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.usedByName">{{ scope.row.usedByName }}</span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="使用时间" min-width="180" align="center">
          <template #default="scope">
            <span v-if="scope.row.usedAt" class="login-time">
              {{ formatDateTime(scope.row.usedAt) }}
            </span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="180" align="center">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <!-- 生成激活码对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="科目" prop="subjectId">
          <el-select v-model="formData.subjectId" placeholder="请选择科目" style="width: 100%">
            <el-option
              v-for="subject in subjectOptions"
              :key="subject.id"
              :label="subject.nameZh"
              :value="subject.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="生成方式" prop="generateType">
          <el-radio-group v-model="generateType">
            <el-radio value="batch">自动生成</el-radio>
            <el-radio value="custom">自定义输入</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="generateType === 'batch'" label="生成数量" prop="count">
          <el-input-number v-model="formData.count" :min="1" :max="10000" style="width: 100%" />
        </el-form-item>

        <el-form-item v-if="generateType === 'custom'" label="激活码列表" prop="codes">
          <el-input
            v-model="codesText"
            type="textarea"
            :rows="8"
            placeholder="请输入激活码，一行一个"
          />
          <div class="form-tip">
            激活码规则：12位字母和数字组合，字母全部大写，例如：2Y6D9KDJN2I4
          </div>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导出对话框 -->
    <el-dialog v-model="exportDialogVisible" title="导出激活码" width="500px">
      <el-form label-width="80px">
        <el-form-item label="科目">
          <el-select v-model="exportSubjectId" placeholder="请选择科目" style="width: 100%">
            <el-option
              v-for="subject in subjectOptions"
              :key="subject.id"
              :label="subject.nameZh"
              :value="subject.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmExport">确定导出</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { DocumentCopy } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import * as XLSX from "xlsx";

defineOptions({
  name: "ActivationCode",
  inheritAttrs: false,
});

import ActivationCodeAPI, {
  type ActivationCodePageQuery,
  type ActivationCodeVO,
  type BatchGenerateRequest,
  type CustomCreateRequest,
} from "@/api/exam/activation-code-api";
import SubjectAPI, { type SubjectVO } from "@/api/exam/subject-api";
import { formatDateTime } from "@/utils/datetime";

const formRef = ref();
const loading = ref(false);
const total = ref(0);
const searchKeyword = ref("");

const queryParams = reactive<ActivationCodePageQuery>({
  pageNum: 1,
  pageSize: 10,
});

const tableData = ref<ActivationCodeVO[]>();
const subjectOptions = ref<SubjectVO[]>([]);

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref("生成激活码");
const generateType = ref<"batch" | "custom">("batch");
const submitLoading = ref(false);
const codesText = ref("");

const formData = reactive<any>({
  subjectId: "",
  count: 10,
  validDays: 3650,
  remark: "",
});

const formRules = {
  subjectId: [{ required: true, message: "请选择科目", trigger: "change" }],
  count: [{ required: true, message: "请输入生成数量", trigger: "blur" }],
};

// 导出对话框
const exportDialogVisible = ref(false);
const exportSubjectId = ref("");

// 获取数据
function fetchData() {
  loading.value = true;
  ActivationCodeAPI.getPage(queryParams)
    .then((data) => {
      tableData.value = data.data;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 加载科目选项
function loadSubjectOptions() {
  SubjectAPI.getPage({ pageNum: 1, pageSize: 1000, status: 1 }).then((data) => {
    subjectOptions.value = data.data;
  });
}

// 搜索
function handleSearch() {
  queryParams.keywords = searchKeyword.value;
  handleQuery();
}

// 查询（重置页码后获取数据）
function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

// 重置查询
function handleReset() {
  searchKeyword.value = "";
  queryParams.keywords = undefined;
  queryParams.subjectId = undefined;
  queryParams.status = undefined;
  queryParams.pageNum = 1;
  fetchData();
}

// 新增
function handleAdd() {
  dialogTitle.value = "生成激活码";
  generateType.value = "batch";
  dialogVisible.value = true;
}

// 提交
function handleSubmit() {
  formRef.value.validate((valid: boolean) => {
    if (valid) {
      submitLoading.value = true;

      if (generateType.value === "batch") {
        // 批量生成
        const request: BatchGenerateRequest = {
          subjectId: formData.subjectId,
          count: formData.count,
          validDays: formData.validDays,
          remark: formData.remark,
        };

        ActivationCodeAPI.batchGenerate(request)
          .then(() => {
            ElMessage.success("生成成功");
            dialogVisible.value = false;
            fetchData();
          })
          .finally(() => {
            submitLoading.value = false;
          });
      } else {
        // 自定义创建
        const codes = codesText.value
          .split("\n")
          .map((c) => c.trim())
          .filter((c) => c.length > 0);

        if (codes.length === 0) {
          ElMessage.warning("请输入至少一个激活码");
          submitLoading.value = false;
          return;
        }

        const request: CustomCreateRequest = {
          subjectId: formData.subjectId,
          codes,
          validDays: formData.validDays,
          remark: formData.remark,
        };

        ActivationCodeAPI.customCreate(request)
          .then(() => {
            ElMessage.success("创建成功");
            dialogVisible.value = false;
            fetchData();
          })
          .finally(() => {
            submitLoading.value = false;
          });
      }
    }
  });
}

// 对话框关闭
function handleDialogClose() {
  formRef.value?.resetFields();
  formData.subjectId = "";
  formData.count = 10;
  formData.validDays = 3650;
  formData.remark = "";
  codesText.value = "";
  generateType.value = "batch";
}

// 导出
function handleExport() {
  exportDialogVisible.value = true;
}

// 确认导出
function handleConfirmExport() {
  if (!exportSubjectId.value) {
    ElMessage.warning("请选择科目");
    return;
  }

  ActivationCodeAPI.exportUnused(exportSubjectId.value).then((data) => {
    if (data.length === 0) {
      ElMessage.warning("没有可导出的激活码");
      return;
    }

    // 导出为Excel
    const worksheet = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        激活码: item.code,
        科目: item.subjectName,
        创建时间: formatDateTime(item.createTime),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "激活码");
    XLSX.writeFile(workbook, `激活码_${Date.now()}.xlsx`);

    ElMessage.success("导出成功");
    exportDialogVisible.value = false;
  });
}

// 复制激活码
function handleCopy(code: string) {
  navigator.clipboard.writeText(code).then(() => {
    ElMessage.success("复制成功");
  });
}

onMounted(() => {
  loadSubjectOptions();
  handleQuery();
});
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .toolbar-left {
    display: flex;
    gap: 8px;

    :deep(.el-button) {
      font-weight: 600;
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;

    :deep(.el-button) {
      font-weight: 600;
    }
  }
}

.code-table {
  :deep(.el-table__header) {
    th {
      padding: 14px 0;
      font-size: 14px;
      font-weight: 600;
      color: #606266;
      background-color: #fafafa;
    }
  }

  :deep(.el-table__body) {
    td {
      padding: 16px 0;
      font-size: 14px;
      color: #606266;
    }

    tr:hover {
      background-color: #fafafa;
    }

    .cell {
      font-family:
        -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB",
        "Microsoft YaHei", sans-serif;
      line-height: 1.1;
    }
  }
}

.code-text {
  margin-right: 8px;
  font-family: "Courier New", monospace;
  font-weight: 600;
  color: #409eff;
}

.copy-icon {
  color: #909399;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #409eff;
  }
}

.login-time {
  font-size: 14px;
  color: #606266;
}

.text-secondary {
  font-size: 14px;
  color: #909399;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
}

.mr-1 {
  margin-right: 4px;
}

:deep(.table-header) {
  font-weight: 600;
  color: #606266;
  background-color: #f5f7fa !important;
}

// 弹窗样式优化
:deep(.el-dialog) {
  .el-dialog__header {
    .el-dialog__title {
      font-weight: 500;
      color: #606266;
    }
  }

  .el-dialog__footer {
    .el-button {
      font-weight: 600;
    }
  }
}
</style>
