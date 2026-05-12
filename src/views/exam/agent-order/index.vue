<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <span v-if="total > 0" class="total-tip">共 {{ total }} 条订单</span>
        </div>
        <div class="toolbar-right">
          <el-select
            v-model="query.agentId"
            placeholder="代理"
            clearable
            filterable
            style="width: 200px; margin-right: 8px"
            @change="handleSearch"
          >
            <el-option
              v-for="a in agents"
              :key="a.id"
              :label="a.nickname || a.username"
              :value="a.id"
            />
          </el-select>
          <el-select
            v-model="query.status"
            placeholder="状态"
            clearable
            style="width: 110px; margin-right: 8px"
            @change="handleSearch"
          >
            <el-option label="待支付" value="PENDING" />
            <el-option label="已支付" value="PAID" />
            <el-option label="已关闭" value="CLOSED" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="handleSearch" />
          <el-button :icon="Refresh" @click="handleReset" />
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="rows"
        row-key="id"
        header-cell-class-name="table-header"
        class="order-table"
        stripe
      >
        <el-table-column label="序号" width="60" align="center">
          <template #default="{ $index }">
            {{ (query.pageNum - 1) * query.pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="订单号" min-width="220">
          <template #default="{ row }">
            <div class="order-no-cell">
              <div class="mono">{{ row.orderNo }}</div>
              <div v-if="row.remark" class="remark" :title="row.remark">备注：{{ row.remark }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="代理" prop="agentName" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag size="small" type="success" effect="plain">
              {{ row.agentName || `#${row.agentId}` }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="科目" min-width="280">
          <template #default="{ row }">
            <div class="subject-cell">
              <div class="zh">{{ row.subjectName || row.subjectNameEn || "—" }}</div>
              <div v-if="row.subjectName && row.subjectNameEn" class="en">
                {{ row.subjectNameEn }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="数量" prop="quantity" width="80" align="center" />
        <el-table-column label="单价" prop="unitPriceYuan" width="90" align="right">
          <template #default="{ row }">¥{{ row.unitPriceYuan }}</template>
        </el-table-column>
        <el-table-column label="总额" prop="totalYuan" width="100" align="right">
          <template #default="{ row }">
            <strong>¥{{ row.totalYuan }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small" effect="plain">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170" align="center">
          <template #default="{ row }">
            <span class="nowrap">{{ formatDateTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="支付时间" width="170" align="center">
          <template #default="{ row }">
            <span v-if="row.paidAt" class="nowrap">{{ formatDateTime(row.paidAt) }}</span>
            <span v-else class="text-secondary">—</span>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        @pagination="load"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { Search, Refresh } from "@element-plus/icons-vue";
import { AgentAdminAPI, type AgentOrderVO } from "@/api/agent-api";
import UserAPI from "@/api/system/user-api";
import { formatDateTime } from "@/utils/datetime";

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  agentId: undefined as number | undefined,
  status: "",
});
const rows = ref<AgentOrderVO[]>([]);
const total = ref(0);
const agents = ref<any[]>([]);
const loading = ref(false);

type TagType = "primary" | "success" | "warning" | "info" | "danger";
const statusTag = (s: string): TagType =>
  (({ PENDING: "warning", PAID: "success", CLOSED: "info" }) as Record<string, TagType>)[s] ??
  "info";
const statusLabel = (s: string) =>
  (({ PENDING: "待支付", PAID: "已支付", CLOSED: "已关闭" }) as Record<string, string>)[s] ?? s;

async function load() {
  loading.value = true;
  try {
    const r = await AgentAdminAPI.pageAgentOrders(query);
    rows.value = r.data;
    total.value = r.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.pageNum = 1;
  load();
}

function handleReset() {
  query.pageNum = 1;
  query.agentId = undefined;
  query.status = "";
  load();
}

async function loadAgents() {
  agents.value = await UserAPI.listByRoleCode("AGENT");
}

onMounted(() => {
  load();
  loadAgents();
});
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .toolbar-left {
    display: flex;
    gap: 8px;
    align-items: center;

    .total-tip {
      font-size: 13px;
      color: var(--el-text-color-secondary);
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

.order-table {
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
  }
}

.order-no-cell {
  line-height: 1.4;

  .mono {
    font-family: "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .remark {
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }
}

.subject-cell {
  line-height: 1.4;

  .zh {
    color: var(--el-text-color-primary);
  }

  .en {
    margin-top: 2px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.nowrap {
  display: inline-block;
  white-space: nowrap;
}

.text-secondary {
  color: var(--el-text-color-placeholder);
}

:deep(.table-header) {
  font-weight: 600;
  color: #606266;
  background-color: #f5f7fa !important;
}
</style>
