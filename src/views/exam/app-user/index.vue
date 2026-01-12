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
        <el-table-column label="邮箱" prop="email" min-width="200" show-overflow-tooltip />
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
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.emailVerified ? 'success' : 'warning'"
              size="small"
              effect="plain"
            >
              {{ scope.row.emailVerified ? "已验证" : "未验证" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
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
  </div>
</template>

<script setup lang="ts">
import { CircleCheck, Search } from "@element-plus/icons-vue";

defineOptions({
  name: "AppUser",
  inheritAttrs: false,
});

import AppUserAPI, { type AppUserPageQuery, type AppUserVO } from "@/api/exam/app-user-api";
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
  font-size: 13px;
  font-weight: 500;
  color: #67c23a;
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
