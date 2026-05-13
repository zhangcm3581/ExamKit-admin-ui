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
        <el-table-column label="订单号" min-width="260">
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
        <el-table-column label="单价" prop="unitPriceYuan" width="100" align="right">
          <template #default="{ row }">
            <span class="price-cell">
              <span class="currency">¥</span>
              {{ row.unitPriceYuan }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="总额" prop="totalYuan" width="120" align="right">
          <template #default="{ row }">
            <span class="total-cell">
              <span class="currency">¥</span>
              {{ row.totalYuan }}
            </span>
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
        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'PAID'"
              size="small"
              class="codes-btn"
              @click="openCodesDialog(row)"
            >
              <el-icon class="codes-btn-icon"><Key /></el-icon>
              <span>查看激活码</span>
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
      width="820px"
      destroy-on-close
      align-center
      class="codes-dialog"
      :show-close="false"
    >
      <template #header="{ close }">
        <div class="codes-dialog-header">
          <div class="header-main">
            <div class="header-icon">
              <el-icon><Key /></el-icon>
            </div>
            <div class="header-text">
              <div class="header-title">订单激活码</div>
              <div v-if="currentOrder" class="header-subtitle">
                <span class="mono order-no">{{ currentOrder.orderNo }}</span>
                <el-icon
                  class="header-copy-icon"
                  title="复制订单号"
                  @click="copy(currentOrder.orderNo)"
                >
                  <DocumentCopy />
                </el-icon>
              </div>
            </div>
          </div>
          <el-icon class="header-close" @click="close">
            <Close />
          </el-icon>
        </div>
      </template>

      <div class="codes-dialog-body">
        <div class="codes-stats">
          <div class="stat-item stat-total">
            <div class="stat-label">总数</div>
            <div class="stat-value">{{ dialogCodes.length }}</div>
          </div>
          <div class="stat-item stat-unused">
            <div class="stat-label">未使用</div>
            <div class="stat-value">{{ codeStats.unused }}</div>
          </div>
          <div class="stat-item stat-used">
            <div class="stat-label">已使用</div>
            <div class="stat-value">{{ codeStats.used }}</div>
          </div>
          <div class="stat-item stat-expired">
            <div class="stat-label">已过期</div>
            <div class="stat-value">{{ codeStats.expired }}</div>
          </div>
          <div class="stats-spacer" />
          <el-button
            type="primary"
            :icon="CopyDocument"
            :disabled="!dialogCodes.length"
            @click="copyAllCodes"
          >
            复制全部
          </el-button>
        </div>

        <el-table
          v-loading="dialogLoading"
          :data="dialogCodes"
          max-height="460"
          class="codes-table"
          size="default"
        >
          <el-table-column label="#" type="index" width="50" align="center" />
          <el-table-column label="激活码" min-width="220">
            <template #default="{ row }">
              <div class="code-chip" @click="copy(row.code)">
                <span class="code-text">{{ row.code }}</span>
                <el-icon class="code-chip-icon">
                  <DocumentCopy />
                </el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="有效天数" prop="validDays" width="90" align="center">
            <template #default="{ row }">
              <span class="days-pill">{{ row.validDays }}天</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="codeStatusTag(row.status)" size="small" effect="light" round>
                {{ codeStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="使用人" prop="usedByName" min-width="120">
            <template #default="{ row }">
              <span v-if="row.usedByName">{{ row.usedByName }}</span>
              <span v-else class="text-secondary">—</span>
            </template>
          </el-table-column>
          <el-table-column label="使用时间" width="160" align="center">
            <template #default="{ row }">
              <span v-if="row.usedAt" class="nowrap">{{ formatDateTime(row.usedAt) }}</span>
              <span v-else class="text-secondary">—</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, Refresh, DocumentCopy, CopyDocument, Key, Close } from "@element-plus/icons-vue";
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
const currentOrder = ref<AgentOrderVO | null>(null);
const dialogCodes = ref<any[]>([]);
const dialogLoading = ref(false);

const codeStats = computed(() => {
  const acc = { unused: 0, used: 0, expired: 0, recycled: 0 };
  for (const c of dialogCodes.value) {
    if (c.status === 0) acc.unused++;
    else if (c.status === 1) acc.used++;
    else if (c.status === 2) acc.expired++;
    else if (c.status === 3) acc.recycled++;
  }
  return acc;
});

async function openCodesDialog(row: AgentOrderVO) {
  currentOrder.value = row;
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
.price-cell,
.total-cell {
  font-family:
    "SF Pro Display",
    "PingFang SC",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;

  .currency {
    margin-right: 2px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }
}

.price-cell {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.total-cell {
  font-size: 16px;
  font-weight: 600;
  color: #fa541c;

  .currency {
    color: #fa541c;
    opacity: 0.7;
  }
}

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

:deep(.table-header) {
  font-weight: 600;
  color: #606266;
  background-color: #f5f7fa !important;
}

/* ===== 查看激活码按钮 ===== */
.codes-btn {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  letter-spacing: 0.2px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, #fff 100%);
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 999px;
  transition: all 0.18s ease;

  &:hover,
  &:focus {
    color: #fff;
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 12px -2px rgba(64, 158, 255, 0.45);
    transform: translateY(-1px);
  }

  &:active {
    box-shadow: 0 2px 6px -2px rgba(64, 158, 255, 0.45);
    transform: translateY(0);
  }

  .codes-btn-icon {
    font-size: 13px;
  }
}

/* ===== 激活码弹窗 ===== */
:deep(.codes-dialog) {
  overflow: hidden;
  border-radius: 14px;
  box-shadow:
    0 20px 60px -20px rgba(0, 21, 41, 0.25),
    0 8px 24px -8px rgba(0, 21, 41, 0.12);

  .el-dialog__header {
    padding: 0;
    margin: 0;
  }

  .el-dialog__body {
    padding: 0;
  }
}

.codes-dialog-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px;
  overflow: hidden;
  background: linear-gradient(135deg, #4f7df3 0%, #6b8df4 45%, #8aa3f7 100%);

  &::before {
    position: absolute;
    top: -40%;
    right: -10%;
    width: 220px;
    height: 220px;
    pointer-events: none;
    content: "";
    background: radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 70%);
    border-radius: 50%;
  }

  .header-main {
    z-index: 1;
    display: flex;
    gap: 14px;
    align-items: center;
  }

  .header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    font-size: 22px;
    color: #fff;
    background: rgba(255, 255, 255, 0.22);
    border-radius: 12px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(4px);
  }

  .header-text {
    line-height: 1.35;
  }

  .header-title {
    font-size: 17px;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.3px;
  }

  .header-subtitle {
    display: flex;
    gap: 6px;
    align-items: center;
    margin-top: 4px;
    color: rgba(255, 255, 255, 0.88);

    .order-no {
      font-size: 12.5px;
      letter-spacing: 0.3px;
    }
  }

  .header-copy-icon {
    cursor: pointer;
    opacity: 0.85;
    transition: opacity 0.15s;

    &:hover {
      opacity: 1;
    }
  }

  .header-close {
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    color: #fff;
    cursor: pointer;
    border-radius: 50%;
    transition: background-color 0.15s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.18);
    }
  }
}

.codes-dialog-body {
  padding: 20px 24px 24px;
  background: #fff;
}

.codes-stats {
  display: flex;
  gap: 12px;
  align-items: stretch;
  margin-bottom: 18px;

  .stat-item {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    justify-content: center;
    min-width: 84px;
    padding: 10px 16px;
    line-height: 1.2;
    background: #fafbfd;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;

    .stat-label {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .stat-value {
      margin-top: 4px;
      font-size: 20px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--el-text-color-primary);
    }

    &.stat-unused {
      background: linear-gradient(180deg, #fff8ec 0%, #fffdf7 100%);
      border-color: #fde8c5;

      .stat-value {
        color: #e6a23c;
      }
    }

    &.stat-used {
      background: linear-gradient(180deg, #effaf0 0%, #f8fdf9 100%);
      border-color: #c8eccc;

      .stat-value {
        color: #67c23a;
      }
    }

    &.stat-expired {
      background: linear-gradient(180deg, #f6f7fa 0%, #fcfcfd 100%);
      border-color: #e4e7ed;

      .stat-value {
        color: #909399;
      }
    }
  }

  .stats-spacer {
    flex: 1;
  }
}

.codes-table {
  overflow: hidden;
  border-radius: 10px;

  :deep(.el-table__header) th {
    font-weight: 600;
    color: var(--el-text-color-regular);
    background-color: #f5f7fa;
  }

  :deep(.el-table__row) td {
    padding: 10px 0;
  }
}

.code-chip {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 5px 12px;
  font-family: "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  letter-spacing: 0.6px;
  cursor: pointer;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, #fff 100%);
  border: 1px dashed var(--el-color-primary-light-5);
  border-radius: 8px;
  transition: all 0.15s ease;

  &:hover {
    background: var(--el-color-primary-light-8);
    border-style: solid;

    .code-chip-icon {
      opacity: 1;
    }
  }

  .code-chip-icon {
    font-size: 13px;
    color: var(--el-color-primary);
    opacity: 0.6;
    transition: opacity 0.15s;
  }
}

.days-pill {
  display: inline-block;
  padding: 2px 10px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 999px;
}
</style>
