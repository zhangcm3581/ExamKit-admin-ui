<!-- 科目管理 -->
<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 页面头部 -->
      <div class="page-header">
        <span class="page-title">科目管理</span>
        <div class="page-actions">
          <el-button type="success" icon="plus" @click="handleAddClick()">新增</el-button>
          <el-button
            type="danger"
            :disabled="ids.length === 0"
            icon="delete"
            @click="handleDelete()"
          >
            删除
          </el-button>
        </div>
      </div>

      <!-- 搜索区域 -->
      <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="search-form">
        <el-form-item label="关键字" prop="keywords">
          <el-input
            v-model="queryParams.keywords"
            placeholder="科目名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>

        <el-form-item label="供应商" prop="providerId">
          <el-select
            v-model="queryParams.providerId"
            placeholder="全部"
            clearable
            style="width: 180px"
            @change="handleQuery"
          >
            <el-option
              v-for="item in providerOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="全部"
            style="width: 100px"
            clearable
            @change="handleQuery"
          >
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="handleResetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        highlight-current-row
        :data="tableData"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="科目名称(中文)" prop="nameZh" min-width="180" />
        <el-table-column label="科目名称(英文)" prop="nameEn" min-width="180" />
        <el-table-column label="供应商" prop="providerName" width="120" />
        <el-table-column label="题目数量" prop="totalQuestions" width="100" align="center" />
        <el-table-column label="支持语言" width="140" align="center">
          <template #default="scope">
            <template v-if="scope.row.supportLanguages">
              <el-tag
                v-for="lang in scope.row.supportLanguages.split(',')"
                :key="lang"
                size="small"
                style="margin-right: 4px"
              >
                {{ langMap[lang] || lang }}
              </el-tag>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sortOrder" width="80" align="center" />
        <el-table-column label="状态" prop="status" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" align="center" width="150">
          <template #default="scope">
            <el-button
              type="primary"
              link
              size="small"
              icon="edit"
              @click.stop="handleEditClick(scope.row.id)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              icon="delete"
              @click.stop="handleDelete(scope.row.id)"
            >
              删除
            </el-button>
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

    <!--科目弹窗-->
    <el-dialog
      v-if="dialog.visible"
      v-model="dialog.visible"
      :title="dialog.title"
      width="800px"
      class="subject-dialog"
      @closed="handleDialogClosed"
    >
      <el-form ref="dataFormRef" :model="formData" :rules="computedRules" label-width="80px">
        <el-form-item label="中文名称" prop="nameZh">
          <el-input v-model="formData.nameZh" placeholder="请输入科目名称（中文）" />
        </el-form-item>

        <el-form-item label="英文名称" prop="nameEn">
          <el-input v-model="formData.nameEn" placeholder="请输入科目名称（英文）" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-select
                v-model="formData.providerId"
                placeholder="请选择供应商（可不选）"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in providerOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支持语言" prop="supportLanguages">
              <el-select
                v-model="selectedLanguages"
                multiple
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option label="中文" value="zh" />
                <el-option label="English" value="en" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="中文描述">
          <el-input
            v-model="formData.descriptionZh"
            type="textarea"
            :rows="3"
            placeholder="请输入科目描述（中文）"
          />
        </el-form-item>

        <el-form-item label="英文描述">
          <el-input
            v-model="formData.descriptionEn"
            type="textarea"
            :rows="3"
            placeholder="请输入科目描述（英文）"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number
                v-model="formData.sortOrder"
                :min="0"
                :max="9999"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="中文考试信息">
          <WangEditor v-model:model-value="formData.examInfoZh" height="300px" />
        </el-form-item>

        <el-form-item label="英文考试信息">
          <WangEditor v-model:model-value="formData.examInfoEn" height="300px" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button style="font-weight: bold" @click="handleCloseDialog">取 消</el-button>
          <el-button type="primary" style="font-weight: bold" @click="handleSubmitClick">
            确 定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: "Subject",
  inheritAttrs: false,
});

import SubjectAPI, {
  type SubjectPageQuery,
  type SubjectVO,
  type SubjectForm,
} from "@/api/exam/subject-api";
import ProviderAPI, { type ProviderOptionVO } from "@/api/exam/provider-api";
import WangEditor from "@/components/WangEditor/index.vue";
import { formatDateTime } from "@/utils/datetime";

const queryFormRef = ref();
const dataFormRef = ref();

const loading = ref(false);
const ids = ref<string[]>([]);
const total = ref(0);

const queryParams = reactive<SubjectPageQuery>({
  pageNum: 1,
  pageSize: 10,
});

const tableData = ref<SubjectVO[]>();
const providerOptions = ref<ProviderOptionVO[]>([]);

// 语言编码映射
const langMap: Record<string, string> = {
  zh: "中文",
  en: "英文",
};

const dialog = reactive({
  title: "",
  visible: false,
});

const formData = reactive<SubjectForm>({
  sortOrder: 0,
  status: 1,
});

// 支持语言多选
const selectedLanguages = ref<string[]>([]);

// 监听选中语言变化，同步到formData
watch(selectedLanguages, (val) => {
  formData.supportLanguages = val.join(",");
});

const computedRules = computed(() => {
  const rules: Partial<Record<string, any>> = {
    nameZh: [{ required: true, message: "请输入科目名称（中文）", trigger: "blur" }],
    supportLanguages: [{ required: true, message: "请选择支持的语言", trigger: "change" }],
  };
  return rules;
});

// 加载供应商选项
function loadProviderOptions() {
  ProviderAPI.getOptions().then((data) => {
    providerOptions.value = data || [];
  });
}

// 获取数据
function fetchData() {
  loading.value = true;
  SubjectAPI.getPage(queryParams)
    .then((data) => {
      tableData.value = data.data;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 查询（重置页码后获取数据）
function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

// 重置查询
function handleResetQuery() {
  queryFormRef.value.resetFields();
  queryParams.pageNum = 1;
  fetchData();
}

// 行选择
function handleSelectionChange(selection: any) {
  ids.value = selection.map((item: any) => item.id);
}

// 新增科目
function handleAddClick() {
  dialog.visible = true;
  dialog.title = "新增科目";
}

/**
 * 编辑科目
 *
 * @param id 科目ID
 */
function handleEditClick(id: string) {
  // 先加载数据，再打开对话框
  SubjectAPI.getFormData(id).then((data) => {
    // 先设置表单数据
    formData.id = data.id;
    formData.providerId = data.providerId;
    formData.nameZh = data.nameZh || "";
    formData.nameEn = data.nameEn || "";
    formData.descriptionZh = data.descriptionZh || "";
    formData.descriptionEn = data.descriptionEn || "";
    formData.supportLanguages = data.supportLanguages || "";
    formData.examInfoZh = data.examInfoZh || "";
    formData.examInfoEn = data.examInfoEn || "";
    formData.sortOrder = data.sortOrder || 0;
    formData.status = data.status !== undefined ? data.status : 1;

    // 解析支持语言到多选数组
    if (data.supportLanguages) {
      selectedLanguages.value = data.supportLanguages.split(",").filter(Boolean);
    }

    // 数据设置完成后再打开对话框，这样 WangEditor 初始化时就有正确的值
    dialog.visible = true;
    dialog.title = "修改科目";
  });
}

// 提交科目表单
function handleSubmitClick() {
  dataFormRef.value.validate((isValid: boolean) => {
    if (isValid) {
      loading.value = true;
      const id = formData.id;
      if (id) {
        SubjectAPI.update(id, formData)
          .then(() => {
            ElMessage.success("修改成功");
            handleCloseDialog();
            handleQuery();
          })
          .finally(() => (loading.value = false));
      } else {
        SubjectAPI.create(formData)
          .then(() => {
            ElMessage.success("新增成功");
            handleCloseDialog();
            handleQuery();
          })
          .finally(() => (loading.value = false));
      }
    }
  });
}

// 关闭科目弹窗
function handleCloseDialog() {
  dialog.visible = false;
}

// 对话框关闭动画完成后的回调
function handleDialogClosed() {
  // 在对话框完全关闭后再重置表单，避免影响 WangEditor
  nextTick(() => {
    if (dataFormRef.value) {
      dataFormRef.value.resetFields();
      dataFormRef.value.clearValidate();
    }

    formData.id = undefined;
    formData.providerId = undefined;
    formData.nameZh = undefined;
    formData.nameEn = undefined;
    formData.descriptionZh = undefined;
    formData.descriptionEn = undefined;
    formData.supportLanguages = undefined;
    formData.examInfoZh = undefined;
    formData.examInfoEn = undefined;
    formData.sortOrder = 0;
    formData.status = 1;
    selectedLanguages.value = [];
  });
}

/**
 * 删除科目
 *
 * @param id 科目ID
 */
function handleDelete(id?: string) {
  const subjectIds = [id || ids.value].join(",");
  if (!subjectIds) {
    ElMessage.warning("请勾选删除项");
    return;
  }
  ElMessageBox.confirm("确认删除已选中的数据项?", "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      SubjectAPI.deleteByIds(subjectIds).then(() => {
        ElMessage.success("删除成功");
        handleResetQuery();
      });
    },
    () => {
      ElMessage.info("已取消删除");
    }
  );
}

onMounted(() => {
  loadProviderOptions();
  handleQuery();
});
</script>

<style lang="scss" scoped>
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

.page-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  margin-bottom: 16px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

:deep(.subject-dialog) {
  .el-dialog__body {
    padding: 20px 24px;
  }

  .el-form-item {
    margin-bottom: 18px;
  }

  .el-form-item__label {
    font-weight: 500;
  }
}
</style>
