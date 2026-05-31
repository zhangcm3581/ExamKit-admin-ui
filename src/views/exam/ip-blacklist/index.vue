<!-- IP 黑名单管理 -->
<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="page-header">
        <div class="header-left">
          <el-input
            v-model="keywords"
            placeholder="搜索 IP 或备注"
            clearable
            style="width: 240px; margin-right: 12px"
            @keyup.enter="handleSearch"
          />
          <el-select
            v-model="query.enabled"
            placeholder="状态"
            clearable
            style="width: 120px"
            @change="handleSearch"
          >
            <el-option label="启用" :value="true" />
            <el-option label="停用" :value="false" />
          </el-select>
        </div>
        <el-button type="primary" @click="openCreate">新增黑名单</el-button>
      </div>

      <el-table v-loading="loading" :data="rows" stripe>
        <el-table-column label="IP / 网段" prop="ipValue" min-width="180">
          <template #default="{ row }">
            <span class="ip-mono">{{ row.ipValue }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'danger' : 'info'" size="small">
              {{ row.enabled ? "启用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180" align="center">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="toggleEnabled(row)">
              {{ row.enabled ? "停用" : "启用" }}
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <el-dialog v-model="createVisible" title="新增 IP 黑名单" width="480px" destroy-on-close>
      <el-form label-width="90px">
        <el-form-item label="IP / 网段" required>
          <el-input
            v-model="createForm.ipValue"
            placeholder="如 119.84.150.101 或 119.84.150.0/24"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import IpBlacklistAPI, {
  type IpBlacklistPageQuery,
  type IpBlacklistVO,
} from "@/api/exam/ip-blacklist-api";
import { formatDateTime } from "@/utils/datetime";

defineOptions({ name: "IpBlacklist", inheritAttrs: false });

const loading = ref(false);
const total = ref(0);
const rows = ref<IpBlacklistVO[]>([]);
const keywords = ref("");

const query = reactive<IpBlacklistPageQuery>({
  pageNum: 1,
  pageSize: 10,
});

const createVisible = ref(false);
const createLoading = ref(false);
const createForm = reactive({ ipValue: "", remark: "" });

function fetchData() {
  loading.value = true;
  IpBlacklistAPI.getPage(query)
    .then((data) => {
      rows.value = data.data;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

function handleSearch() {
  query.keywords = keywords.value;
  query.pageNum = 1;
  fetchData();
}

function openCreate() {
  createForm.ipValue = "";
  createForm.remark = "";
  createVisible.value = true;
}

function submitCreate() {
  const ipValue = createForm.ipValue.trim();
  if (!ipValue) {
    ElMessage.warning("请输入 IP 或网段");
    return;
  }
  createLoading.value = true;
  IpBlacklistAPI.create({ ipValue, remark: createForm.remark.trim() || undefined })
    .then(() => {
      ElMessage.success("已添加");
      createVisible.value = false;
      fetchData();
    })
    .finally(() => {
      createLoading.value = false;
    });
}

function toggleEnabled(row: IpBlacklistVO) {
  IpBlacklistAPI.updateEnabled(row.id, !row.enabled).then(() => {
    ElMessage.success(row.enabled ? "已停用" : "已启用");
    fetchData();
  });
}

function handleDelete(row: IpBlacklistVO) {
  ElMessageBox.confirm(`确认删除黑名单「${row.ipValue}」吗？`, "删除确认", {
    type: "warning",
  }).then(() => {
    IpBlacklistAPI.remove(row.id).then(() => {
      ElMessage.success("已删除");
      fetchData();
    });
  });
}

onMounted(() => {
  handleSearch();
});
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ip-mono {
  font-family: monospace;
  font-size: 13px;
}
</style>
