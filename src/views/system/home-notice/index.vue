<!-- 首页公告 -->
<template>
  <div class="app-container">
    <!-- 搜索 -->
    <div class="search-container">
      <el-form :model="queryParams" :inline="true">
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keywords"
            placeholder="公告内容(中/英)"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="search" @click="handleQuery">搜索</el-button>
          <el-button icon="refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card shadow="hover" class="data-table">
      <div class="data-table__toolbar">
        <el-button
          v-hasPerm="['sys:home-notice:add']"
          type="success"
          icon="plus"
          @click="openDialog()"
        >
          新增
        </el-button>
        <el-button
          v-hasPerm="['sys:home-notice:delete']"
          type="danger"
          icon="delete"
          :disabled="ids.length === 0"
          @click="handleDelete()"
        >
          批量删除
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="pageData"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column
          label="内容(中文)"
          prop="contentZh"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column
          label="内容(英文)"
          prop="contentEn"
          min-width="220"
          show-overflow-tooltip
        />
        <el-table-column label="启用" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled === 1"
              :disabled="!hasPerm('sys:home-notice:edit')"
              @change="handleToggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sortOrder" width="80" align="center" />
        <el-table-column label="创建时间" prop="createTime" width="180" />
        <el-table-column label="操作" fixed="right" width="160" align="center">
          <template #default="{ row }">
            <el-button
              v-hasPerm="['sys:home-notice:edit']"
              type="primary"
              link
              size="small"
              icon="edit"
              @click="openDialog(row.id)"
            >
              编辑
            </el-button>
            <el-button
              v-hasPerm="['sys:home-notice:delete']"
              type="danger"
              link
              size="small"
              icon="delete"
              @click="handleDelete(row.id)"
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
        @pagination="loadData"
      />
    </el-card>

    <!-- 编辑/新增弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="640px" @closed="resetForm">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
        <el-form-item label="内容(中文)" prop="contentZh">
          <el-input
            v-model="formData.contentZh"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="内容(英文)" prop="contentEn">
          <el-input
            v-model="formData.contentEn"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="可选,留空则英文状态下回退中文"
          />
        </el-form-item>
        <el-form-item label="启用" prop="enabled">
          <el-switch v-model="enabledBool" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="9999" />
          <span class="form-hint">数字大的优先,首页只取最高优先级的启用公告</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";
import HomeNoticeAPI, {
  type HomeNoticeForm,
  type HomeNoticeVO,
  type HomeNoticePageQuery,
} from "@/api/system/home-notice-api";
import { hasPerm } from "@/utils/auth";

defineOptions({ name: "HomeNotice" });

const loading = ref(false);
const submitting = ref(false);
const pageData = ref<HomeNoticeVO[]>([]);
const total = ref(0);
const ids = ref<number[]>([]);

const queryParams = reactive<HomeNoticePageQuery>({
  pageNum: 1,
  pageSize: 10,
  keywords: "",
});

const dialog = reactive<{ visible: boolean; title: string; id?: number }>({
  visible: false,
  title: "",
});

const formRef = ref<FormInstance>();
const formData = reactive<HomeNoticeForm>({
  contentZh: "",
  contentEn: "",
  enabled: 1,
  sortOrder: 0,
});

const enabledBool = computed({
  get: () => formData.enabled === 1,
  set: (v) => {
    formData.enabled = v ? 1 : 0;
  },
});

const rules: FormRules = {
  contentZh: [{ required: true, message: "请输入公告中文内容", trigger: "blur" }],
};

async function loadData() {
  loading.value = true;
  try {
    const result = await HomeNoticeAPI.getPage(queryParams);
    pageData.value = result.data;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  loadData();
}

function handleReset() {
  queryParams.keywords = "";
  handleQuery();
}

function handleSelectionChange(rows: HomeNoticeVO[]) {
  ids.value = rows.map((r) => r.id);
}

async function openDialog(id?: number) {
  resetForm();
  if (id) {
    dialog.title = "编辑公告";
    dialog.id = id;
    const data = await HomeNoticeAPI.getFormData(id);
    Object.assign(formData, {
      contentZh: data.contentZh,
      contentEn: data.contentEn ?? "",
      enabled: data.enabled,
      sortOrder: data.sortOrder,
    });
  } else {
    dialog.title = "新增公告";
    dialog.id = undefined;
  }
  dialog.visible = true;
}

function resetForm() {
  formRef.value?.resetFields();
  Object.assign(formData, { contentZh: "", contentEn: "", enabled: 1, sortOrder: 0 });
}

async function handleSubmit() {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    if (dialog.id) {
      await HomeNoticeAPI.update(dialog.id, { ...formData });
    } else {
      await HomeNoticeAPI.create({ ...formData });
    }
    ElMessage.success("保存成功");
    dialog.visible = false;
    loadData();
  } finally {
    submitting.value = false;
  }
}

async function handleToggle(row: HomeNoticeVO) {
  await HomeNoticeAPI.toggle(row.id);
  ElMessage.success("状态已更新");
  loadData();
}

async function handleDelete(id?: number) {
  const targets = id ? [id] : ids.value;
  if (targets.length === 0) return;
  await ElMessageBox.confirm(`确定删除 ${targets.length} 条公告吗?`, "提示", {
    type: "warning",
  });
  await HomeNoticeAPI.deleteByIds(targets.join(","));
  ElMessage.success("删除成功");
  loadData();
}

onMounted(loadData);
</script>

<style scoped>
.form-hint {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
