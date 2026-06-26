<!-- C 端订单管理 -->
<template>
  <div class="app-container app-order-admin">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <span v-if="total > 0" class="total-tip">共 {{ total }} 条订单</span>
          <span v-if="total > 0" class="paid-total-tip">
            已支付总额
            <em>¥{{ paidTotalYuan }}</em>
          </span>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="query.orderNo"
            placeholder="订单号"
            clearable
            style="width: 200px; margin-right: 8px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-input
            v-model="query.code"
            placeholder="激活码"
            clearable
            style="width: 180px; margin-right: 8px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
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
          <el-select
            v-model="query.payType"
            placeholder="支付方式"
            clearable
            style="width: 120px; margin-right: 8px"
            @change="handleSearch"
          >
            <el-option label="扫码" value="NATIVE" />
            <el-option label="H5" value="H5" />
            <el-option label="小程序" value="JSAPI" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="—"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 360px; margin-right: 8px"
            @change="onDateRangeChange"
          />
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
        empty-text="未找到符合条件的订单"
      >
        <el-table-column label="序号" width="60" align="center">
          <template #default="{ $index }">
            {{ (query.pageNum - 1) * query.pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="订单号" min-width="240">
          <template #default="{ row }">
            <div class="order-no-cell">
              <div class="order-no-line">
                <span class="mono" :title="row.orderNo">{{ row.orderNo }}</span>
                <el-icon class="copy-icon" title="复制订单号" @click="copy(row.orderNo)">
                  <DocumentCopy />
                </el-icon>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar v-if="row.userAvatar" :src="row.userAvatar" :size="32" />
              <el-avatar v-else :size="32">
                {{ row.userNickname?.substring(0, 1) || "U" }}
              </el-avatar>
              <div class="user-info">
                <div class="user-name">{{ row.userNickname || `#${row.userId}` }}</div>
                <div class="user-email">{{ row.userEmail || "—" }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="科目" min-width="260">
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
        <el-table-column label="单价" width="100" align="right">
          <template #default="{ row }">
            <span class="price-cell">
              <span class="currency">¥</span>
              {{ row.unitPriceYuan }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="总额" width="120" align="right">
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
        <el-table-column label="支付方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">
              {{ payTypeLabel(row.payType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="激活码" width="100" align="center">
          <template #default="{ row }">
            <span class="mono code-count">{{ row.generatedCount }}/{{ row.quantity }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170" align="center">
          <template #default="{ row }">
            <span class="nowrap">{{ formatDateTime(row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="支付时间" width="170" align="center">
          <template #default="{ row }">
            <span class="nowrap">{{ row.paidAt ? formatDateTime(row.paidAt) : "—" }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'PAID' && row.generatedCount > 0"
              link
              type="primary"
              @click="openCodes(row)"
            >
              查看激活码
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :total="total"
        @pagination="loadOrders"
      />
    </el-card>

    <!-- 激活码弹窗 -->
    <el-dialog
      v-model="codesVisible"
      width="760px"
      destroy-on-close
      align-center
      append-to-body
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
              <div class="header-title">激活码明细</div>
              <div v-if="currentOrderNo" class="header-subtitle">
                <span class="mono order-no">{{ currentOrderNo }}</span>
                <el-icon class="header-copy-icon" title="复制订单号" @click="copy(currentOrderNo)">
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

      <div v-loading="codesLoading" class="codes-dialog-body">
        <div class="codes-stats">
          <div class="stat-item stat-total">
            <div class="stat-label">总数</div>
            <div class="stat-value">{{ codes.length }}</div>
          </div>
          <div class="stat-item stat-unused">
            <div class="stat-label">未使用</div>
            <div class="stat-value">{{ codeSummary.unused }}</div>
          </div>
          <div class="stat-item stat-used">
            <div class="stat-label">已使用</div>
            <div class="stat-value">{{ codeSummary.used }}</div>
          </div>
          <div class="stat-item stat-expired">
            <div class="stat-label">已过期</div>
            <div class="stat-value">{{ codeSummary.expired }}</div>
          </div>
          <div class="stats-spacer" />
          <el-button type="primary" :icon="CopyDocument" :disabled="!codes.length" @click="copyAll">
            复制全部
          </el-button>
        </div>

        <el-table :data="codes" max-height="460" class="codes-table" size="default">
          <el-table-column label="#" type="index" width="50" align="center" />
          <el-table-column label="激活码" min-width="220">
            <template #default="{ row }">
              <div class="code-chip" @click="copyOne(row.code)">
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
          <el-table-column label="激活时间" width="170" align="center">
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
import { Search, Refresh, CopyDocument, DocumentCopy, Key, Close } from "@element-plus/icons-vue";
import AppOrderAdminAPI, {
  type AppOrderAdminPageQuery,
  type AppOrderAdminVO,
  type AppOrderCodeVO,
} from "@/api/app-order-api";
import { formatDateTime } from "@/utils/datetime";

defineOptions({ name: "AppOrderAdmin" });

const query = reactive<AppOrderAdminPageQuery>({
  pageNum: 1,
  pageSize: 10,
  orderNo: "",
  code: "",
  status: "",
  payType: "",
  startTime: undefined,
  endTime: undefined,
});

const dateRange = ref<[string, string] | null>(null);
const rows = ref<AppOrderAdminVO[]>([]);
const total = ref(0);
const paidTotalCents = ref(0);
const loading = ref(false);

// 已支付总额（元，千分位，最多 2 位小数）
const paidTotalYuan = computed(() =>
  (paidTotalCents.value / 100).toLocaleString("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
);

function onDateRangeChange(v: [string, string] | null) {
  query.startTime = v?.[0];
  query.endTime = v?.[1];
  handleSearch();
}

async function loadOrders() {
  loading.value = true;
  try {
    const [res, paid] = await Promise.all([
      AppOrderAdminAPI.page(query),
      AppOrderAdminAPI.paidTotal(query),
    ]);
    rows.value = res.data;
    total.value = res.total;
    paidTotalCents.value = paid ?? 0;
  } catch {
    rows.value = [];
    total.value = 0;
    paidTotalCents.value = 0;
    ElMessage.error("加载订单失败");
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.pageNum = 1;
  loadOrders();
}

function handleReset() {
  query.orderNo = "";
  query.code = "";
  query.status = "";
  query.payType = "";
  query.startTime = undefined;
  query.endTime = undefined;
  dateRange.value = null;
  handleSearch();
}

type TagType = "primary" | "success" | "warning" | "info" | "danger";
const statusTag = (s: string): TagType =>
  (({ PENDING: "warning", PAID: "success", CLOSED: "info" }) as Record<string, TagType>)[s] ??
  "info";
const statusLabel = (s: string) =>
  (({ PENDING: "待支付", PAID: "已支付", CLOSED: "已关闭" }) as Record<string, string>)[s] ?? s;
const payTypeLabel = (s: string) =>
  (({ NATIVE: "扫码", H5: "H5", JSAPI: "小程序" }) as Record<string, string>)[s] ?? s;
const codeStatusLabel = (s: number) =>
  (({ 0: "未使用", 1: "已使用", 2: "已过期", 3: "已回收" }) as Record<number, string>)[s] ?? "未知";
const codeStatusTag = (s: number): TagType =>
  (({ 0: "warning", 1: "success", 2: "info", 3: "danger" }) as Record<number, TagType>)[s] ??
  "info";

const codesVisible = ref(false);
const codesLoading = ref(false);
const codes = ref<AppOrderCodeVO[]>([]);
const currentOrderNo = ref("");

const codeSummary = computed(() => {
  const acc = { unused: 0, used: 0, expired: 0, recycled: 0 };
  for (const c of codes.value) {
    if (c.status === 0) acc.unused++;
    else if (c.status === 1) acc.used++;
    else if (c.status === 2) acc.expired++;
    else if (c.status === 3) acc.recycled++;
  }
  return acc;
});

async function openCodes(row: AppOrderAdminVO) {
  currentOrderNo.value = row.orderNo;
  codes.value = [];
  codesVisible.value = true;
  codesLoading.value = true;
  try {
    codes.value = await AppOrderAdminAPI.listCodes(row.id);
  } catch {
    ElMessage.error("加载激活码失败");
  } finally {
    codesLoading.value = false;
  }
}

async function copyAll() {
  if (!codes.value.length) return;
  const text = codes.value.map((c) => c.code).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success(`已复制 ${codes.value.length} 个激活码`);
  } catch {
    ElMessage.error("复制失败，请手动选择");
  }
}

async function copyOne(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    ElMessage.success("已复制");
  } catch {
    ElMessage.error("复制失败，请手动选择");
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制订单号");
  } catch {
    ElMessage.error("复制失败，请手动选择");
  }
}

onMounted(loadOrders);
</script>

<style scoped lang="scss">
.app-order-admin {
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

      .paid-total-tip {
        padding-left: 12px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        border-left: 1px solid var(--el-border-color-lighter);

        em {
          font-style: normal;
          font-weight: 600;
          color: var(--el-color-danger);
        }
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

  .mono {
    font-family: "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 12.5px;
  }

  .nowrap {
    display: inline-block;
    white-space: nowrap;
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
  }

  .copy-icon {
    flex-shrink: 0;
    font-size: 14px;
    color: var(--el-text-color-placeholder);
    cursor: pointer;
    transition: color 0.15s;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .user-cell {
    display: flex;
    gap: 10px;
    align-items: center;

    .user-info {
      line-height: 1.35;
    }

    .user-name {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .user-email {
      font-size: 12px;
      color: var(--el-text-color-secondary);
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

  .code-count {
    font-weight: 600;
    color: var(--el-text-color-regular);
    letter-spacing: 0.5px;
  }

  .price-cell,
  .total-cell {
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;

    .currency {
      margin-right: 2px;
      font-size: 12px;
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
}
</style>

<style lang="scss">
/* 激活码弹窗 — 非 scoped（el-dialog 渲染到 body），统一命名空间到 .codes-dialog */
.codes-dialog {
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
        font-family: "SFMono-Regular", Menlo, Consolas, monospace;
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

    .el-table__header th {
      font-weight: 600;
      color: var(--el-text-color-regular);
      background-color: #f5f7fa;
    }

    .el-table__row td {
      padding: 10px 0;
    }

    .nowrap {
      white-space: nowrap;
    }

    .text-secondary {
      color: var(--el-text-color-secondary);
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
}
</style>
