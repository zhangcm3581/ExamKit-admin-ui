<!-- 注册用户管理 -->
<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <el-input
            v-model="searchKeyword"
            placeholder="输入昵称或邮箱搜索"
            clearable
            style="width: 280px; margin-right: 12px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon class="el-input__icon">
                <Search />
              </el-icon>
            </template>
          </el-input>
          <el-select
            v-model="queryParams.emailVerified"
            placeholder="验证状态"
            clearable
            style="width: 120px"
            @change="handleQuery"
          >
            <el-option label="已验证" :value="true" />
            <el-option label="未验证" :value="false" />
          </el-select>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        header-cell-class-name="table-header"
        class="user-table"
        stripe
      >
        <el-table-column label="索引" width="80" align="center">
          <template #default="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="头像" width="80" align="center">
          <template #default="scope">
            <el-avatar v-if="scope.row.avatar" :src="scope.row.avatar" :size="40" />
            <el-avatar v-else :size="40">
              {{ scope.row.nickname?.substring(0, 1) }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="昵称" prop="nickname" min-width="140" show-overflow-tooltip />
        <el-table-column label="邮箱" prop="email" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.email">{{ scope.row.email }}</span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" min-width="180" align="center">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="最后登录时间" min-width="180" align="center">
          <template #default="scope">
            <span v-if="scope.row.lastLoginAt" class="login-time">
              {{ formatDateTime(scope.row.lastLoginAt) }}
            </span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="登录IP" min-width="160" align="center" show-overflow-tooltip>
          <template #default="scope">
            <div v-if="scope.row.lastLoginIp" class="ip-cell">
              <span class="ip-text">{{ scope.row.lastLoginIp }}</span>
              <el-button type="danger" link size="small" @click.stop="handleBlockIp(scope.row)">
                拉黑
              </el-button>
            </div>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="登录地区" min-width="140" align="center" show-overflow-tooltip>
          <template #default="scope">
            <span v-if="scope.row.lastLoginRegion">
              {{ scope.row.lastLoginRegion }}
            </span>
            <span v-else class="text-secondary">-</span>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" width="100" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 1 ? 'success' : 'danger'"
              size="small"
              effect="plain"
            >
              {{ scope.row.status === 1 ? "正常" : "已禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click.stop="openAuthDialog(scope.row)">
              题库权限
            </el-button>
            <el-button
              v-if="scope.row.status === 1"
              type="danger"
              link
              size="small"
              @click.stop="handleDisableUser(scope.row)"
            >
              禁用
            </el-button>
            <el-button
              v-else
              type="success"
              link
              size="small"
              @click.stop="handleEnableUser(scope.row)"
            >
              启用
            </el-button>
            <el-button
              v-if="!scope.row.emailVerified"
              type="primary"
              link
              size="small"
              @click.stop="handleVerifyEmail(scope.row)"
            >
              验证通过
            </el-button>
            <span v-else class="verified-text">
              <el-icon><CircleCheck /></el-icon>
              已验证
            </span>
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

    <el-dialog
      v-model="authDialogVisible"
      :title="authDialogUser ? `${authDialogUser.nickname} - 题库权限` : '题库权限'"
      width="1000px"
      destroy-on-close
    >
      <SubjectAuthTab :user-id="authDialogUser?.id" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { CircleCheck, Search } from "@element-plus/icons-vue";
import SubjectAuthTab from "./components/SubjectAuthTab.vue";

defineOptions({
  name: "AppUser",
  inheritAttrs: false,
});

import AppUserAPI, { type AppUserPageQuery, type AppUserVO } from "@/api/exam/app-user-api";
import IpBlacklistAPI from "@/api/exam/ip-blacklist-api";
import { formatDateTime } from "@/utils/datetime";

const loading = ref(false);
const total = ref(0);
const searchKeyword = ref("");

const queryParams = reactive<AppUserPageQuery>({
  pageNum: 1,
  pageSize: 10,
});

const tableData = ref<AppUserVO[]>();

// 获取数据
function fetchData() {
  loading.value = true;
  AppUserAPI.getPage(queryParams)
    .then((data) => {
      tableData.value = data.data;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
    });
}

const authDialogVisible = ref(false);
const authDialogUser = ref<AppUserVO | null>(null);

function openAuthDialog(row: AppUserVO) {
  authDialogUser.value = row;
  authDialogVisible.value = true;
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

// 管理员验证邮箱
function handleVerifyEmail(row: AppUserVO) {
  ElMessageBox.confirm(`确认验证用户 "${row.nickname}" 的邮箱吗？`, "验证确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(
    () => {
      AppUserAPI.verifyEmail(row.id).then(() => {
        ElMessage.success("验证成功");
        fetchData();
      });
    },
    () => {
      ElMessage.info("已取消验证");
    }
  );
}

function handleDisableUser(row: AppUserVO) {
  ElMessageBox.confirm(
    `确认禁用用户 "${row.nickname}" 吗？禁用后将无法登录，已登录会话会被踢下线。`,
    "禁用确认",
    { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
  ).then(() => {
    AppUserAPI.updateStatus(row.id, 0).then(() => {
      ElMessage.success("已禁用");
      fetchData();
    });
  });
}

function handleEnableUser(row: AppUserVO) {
  AppUserAPI.updateStatus(row.id, 1).then(() => {
    ElMessage.success("已启用");
    fetchData();
  });
}

function handleBlockIp(row: AppUserVO) {
  if (!row.lastLoginIp) return;
  ElMessageBox.prompt(
    `将 IP「${row.lastLoginIp}」加入黑名单，命中后无法访问服务。可改为网段，如 119.84.150.0/24`,
    "拉黑 IP",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: row.lastLoginIp,
      inputPlaceholder: "IP 或 CIDR",
    }
  ).then(({ value }) => {
    const ipValue = value?.trim();
    if (!ipValue) {
      ElMessage.warning("IP 不能为空");
      return;
    }
    IpBlacklistAPI.create({
      ipValue,
      remark: `来自用户 ${row.nickname}（ID ${row.id}）`,
    }).then(() => {
      ElMessage.success("已加入 IP 黑名单");
    });
  });
}

onMounted(() => {
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
}

.header-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-table {
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
      padding: 8px 0;
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

// 登录时间样式
.login-time {
  font-size: 14px;
  color: #606266;
}

// 次要文字样式
.text-secondary {
  font-size: 14px;
  color: #909399;
}

.verified-text {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 24px;
  margin-left: 8px;
  font-size: 13px;
  font-weight: 500;
  line-height: 24px;
  vertical-align: middle;
  color: #67c23a;
}

.ip-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.ip-text {
  font-family: monospace;
  font-size: 13px;
}

:deep(.table-header) {
  font-weight: 600;
  color: #606266;
  background-color: #f5f7fa !important;
}

// 优化搜索框样式
:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 0 0 1px #c0c4cc inset;
  }

  &.is-focus {
    box-shadow: 0 0 0 1px #409eff inset;
  }
}

// 优化Tag样式
:deep(.el-tag) {
  font-weight: 500;
  border-radius: 4px;
}
</style>
