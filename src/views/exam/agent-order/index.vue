<template>
  <div class="app-container">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <span v-if="total > 0" class="total-tip">共 {{ total }} 条订单</span>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="query.orderNo"
            placeholder="订单号"
            clearable
            style="width: 220px; margin-right: 8px"
            @keyup.enter="handleSearch"
          />
          <el-select
            v-model="query.agentId"
            placeholder="代理"
            clearable
            filterable
            style="width: 180px; margin-right: 8px"
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
        <el-table-column label="订单号" width="200">
          <template #default="{ row }">
            <div class="order-no-cell">
              <div class="order-no-line">
                <span class="mono" :title="row.orderNo">{{ row.orderNo }}</span>
                <el-icon class="copy-icon" title="复制订单号" @click="copy(row.orderNo)">
                  <DocumentCopy />
                </el-icon>
              </div>
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
        <el-table-column label="操作" width="110" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'PAID'"
              type="primary"
              size="small"
              text
              bg
              @click="openCodesDialog(row)"
            >
              查看激活码
            </el-button>
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

    <!-- 激活码弹窗 -->
    <el-dialog
      v-model="codesDialogVisible"
      :title="codesDialogTitle"
      width="780px"
      destroy-on-close
    >
      <div class="codes-summary">
        <el-tag size="small" type="info" effect="plain">共 {{ dialogCodes.length }} 条</el-tag>
        <el-button size="small" :icon="CopyDocument" @click="copyAllCodes">复制全部</el-button>
      </div>
      <el-table v-loading="dialogLoading" :data="dialogCodes" max-height="500" stripe size="small">
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column label="激活码" width="180">
          <template #default="{ row }">
            <span class="mono">{{ row.code }}</span>
            <el-icon class="copy-icon" @click="copy(row.code)">
              <DocumentCopy />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column label="天数" prop="validDays" width="70" align="center" />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="codeStatusTag(row.status)" size="small" effect="plain">
              {{ codeStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="使用人" prop="usedByName" min-width="130">
          <template #default="{ row }">
            <span v-if="row.usedByName">{{ row.usedByName }}</span>
            <span v-else class="text-secondary">—</span>
          </template>
        </el-table-column>
        <el-table-column label="使用时间" width="170" align="center">
          <template #default="{ row }">
            <span v-if="row.usedAt" class="nowrap">{{ formatDateTime(row.usedAt) }}</span>
            <span v-else class="text-secondary">—</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, Refresh, DocumentCopy, CopyDocument } from "@element-plus/icons-vue";
import { AgentAdminAPI, type AgentOrderVO } from "@/api/agent-api";
import UserAPI from "@/api/system/user-api";
import { formatDateTime } from "@/utils/datetime";

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  orderNo: "",
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
const codeStatusTag = (s: number): TagType =>
  (({ 0: "warning", 1: "success", 2: "info", 3: "danger" }) as Record<number, TagType>)[s] ??
  "info";
const codeStatusLabel = (s: number) =>
  (({ 0: "未使用", 1: "已使用", 2: "已过期", 3: "已回收" }) as Record<number, string>)[s] ?? "未知";

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
  query.orderNo = "";
  query.agentId = undefined;
  query.status = "";
  load();
}

async function loadAgents() {
  agents.value = await UserAPI.listByRoleCode("AGENT");
}

async function copy(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制");
  } catch {
    ElMessage.error("复制失败，请手动选择");
  }
}

// ===== 激活码弹窗 =====
const codesDialogVisible = ref(false);
const codesDialogTitle = ref("");
const dialogCodes = ref<any[]>([]);
const dialogLoading = ref(false);

async function openCodesDialog(row: AgentOrderVO) {
  codesDialogTitle.value = `订单 ${row.orderNo} 的激活码`;
  codesDialogVisible.value = true;
  dialogCodes.value = [];
  dialogLoading.value = true;
  try {
    dialogCodes.value = await AgentAdminAPI.listCodesForOrder(row.id);
  } catch {
    ElMessage.error("加载激活码失败");
  } finally {
    dialogLoading.value = false;
  }
}

async function copyAllCodes() {
  if (!dialogCodes.value.length) return;
  const text = dialogCodes.value.map((c) => c.code).join("\n");
  await navigator.clipboard.writeText(text);
  ElMessage.success(`已复制 ${dialogCodes.value.length} 条激活码`);
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

  .order-no-line {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .mono {
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--el-color-primary);
    white-space: nowrap;
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

.copy-icon {
  flex-shrink: 0;
  color: #909399;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--el-color-primary);
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

.codes-summary {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

:deep(.table-header) {
  font-weight: 600;
  color: #606266;
  background-color: #f5f7fa !important;
}
</style>
