<!-- C 端订单管理 -->
<template>
  <div class="app-container app-order-admin">
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

    <!-- 激活码弹窗 — 票据风 -->
    <el-dialog
      v-model="codesVisible"
      width="520px"
      destroy-on-close
      append-to-body
      :show-close="false"
      class="examkit-codes-dialog"
    >
      <template #header>
        <div class="rcpt-head">
          <div class="rcpt-eyebrow">
            <span class="rcpt-eyebrow-en">ACTIVATION CODES</span>
            <button class="rcpt-close" aria-label="关闭" @click="codesVisible = false">×</button>
          </div>
          <h2 class="rcpt-title">激活码明细</h2>
          <div class="rcpt-meta">
            <span class="rcpt-meta-label">订单号</span>
            <span class="rcpt-meta-value" :title="currentOrderNo">{{ currentOrderNo }}</span>
          </div>
        </div>
      </template>

      <div v-loading="codesLoading" class="rcpt-body">
        <!-- 计数条 -->
        <div class="rcpt-counts">
          <span class="rcpt-count rcpt-count-total">
            <span class="rcpt-count-num">{{ codes.length }}</span>
            <span class="rcpt-count-label">总计</span>
          </span>
          <span class="rcpt-dash" />
          <template v-for="seg in countSegments" :key="seg.key">
            <span v-if="seg.value > 0" class="rcpt-count" :class="`rcpt-count-${seg.key}`">
              <span class="rcpt-count-num">{{ seg.value }}</span>
              <span class="rcpt-count-label">{{ seg.label }}</span>
            </span>
          </template>
        </div>

        <div class="rcpt-divider" aria-hidden="true" />

        <!-- 空态 -->
        <div v-if="!codesLoading && !codes.length" class="rcpt-empty">
          <span class="rcpt-empty-glyph">∅</span>
          <span class="rcpt-empty-text">该订单暂无激活码</span>
        </div>

        <!-- 列表 -->
        <ul v-else class="rcpt-list">
          <li
            v-for="(c, i) in codes"
            :key="c.code"
            class="rcpt-row"
            :class="`is-${c.status}`"
            @click="copyOne(c.code)"
          >
            <div class="rcpt-row-seq">{{ String(i + 1).padStart(2, "0") }}</div>
            <div class="rcpt-row-main">
              <div class="rcpt-row-code">{{ c.code }}</div>
              <div class="rcpt-row-meta">
                <span class="rcpt-row-dot" />
                <span class="rcpt-row-status">{{ codeStatusLabel(c.status) }}</span>
                <span class="rcpt-row-sep">·</span>
                <span>有效 {{ c.validDays }} 天</span>
                <template v-if="c.usedAt">
                  <span class="rcpt-row-sep">·</span>
                  <span>{{ formatDateTime(c.usedAt) }} 已激活</span>
                </template>
              </div>
            </div>
            <div class="rcpt-row-action" aria-label="复制">
              <el-icon><CopyDocument /></el-icon>
            </div>
          </li>
        </ul>

        <div class="rcpt-divider rcpt-divider-end" aria-hidden="true" />
      </div>

      <template #footer>
        <div class="rcpt-foot">
          <span class="rcpt-foot-hint">单击任意一行即可复制</span>
          <button class="rcpt-foot-btn" :disabled="!codes.length" @click="copyAll">
            <el-icon class="rcpt-foot-btn-icon"><CopyDocument /></el-icon>
            <span>复制全部</span>
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, Refresh, CopyDocument, DocumentCopy } from "@element-plus/icons-vue";
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
const loading = ref(false);

function onDateRangeChange(v: [string, string] | null) {
  query.startTime = v?.[0];
  query.endTime = v?.[1];
  handleSearch();
}

async function loadOrders() {
  loading.value = true;
  try {
    const res = await AppOrderAdminAPI.page(query);
    rows.value = res.data;
    total.value = res.total;
  } catch {
    rows.value = [];
    total.value = 0;
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

const countSegments = computed(() => [
  { key: "unused", label: "未使用", value: codeSummary.value.unused },
  { key: "used", label: "已使用", value: codeSummary.value.used },
  { key: "expired", label: "已过期", value: codeSummary.value.expired },
  { key: "recycled", label: "已回收", value: codeSummary.value.recycled },
]);

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
/* 票据风激活码弹窗 — 非 scoped，命中 append-to-body 后的 DOM */
$rcpt-paper: #fbfaf5;
$rcpt-ink: #1a1a1a;
$rcpt-ink-soft: #555048;
$rcpt-ink-mute: #8b857a;
$rcpt-accent: #d4644a;

$mono: "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, "Liberation Mono", monospace;

.examkit-codes-dialog {
  --dlg-pad-x: 32px;
  position: relative;
  overflow: hidden;

  background-color: $rcpt-paper !important;
  background-image:
    radial-gradient(rgba(180, 165, 130, 0.06) 1px, transparent 1px),
    linear-gradient(180deg, $rcpt-paper 0%, #f7f4eb 100%);
  background-size:
    3px 3px,
    100% 100%;
  border-radius: 4px !important;
  box-shadow:
    0 24px 48px -16px rgba(26, 21, 16, 0.28),
    0 4px 12px rgba(26, 21, 16, 0.08) !important;

  .el-dialog__header {
    padding: 26px var(--dlg-pad-x) 14px !important;
    margin: 0 !important;
    border: none !important;
  }

  .el-dialog__body {
    padding: 0 !important;
  }

  .el-dialog__footer {
    padding: 16px var(--dlg-pad-x) 24px !important;
    border: none !important;
  }

  /* ====== Header ====== */
  .rcpt-head {
    color: $rcpt-ink;
  }

  .rcpt-eyebrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .rcpt-eyebrow-en {
    font-family: $mono;
    font-size: 10px;
    font-weight: 600;
    color: $rcpt-ink-mute;
    text-transform: uppercase;
    letter-spacing: 0.22em;
  }

  .rcpt-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    margin: -4px -6px 0 0;
    font-size: 20px;
    line-height: 1;
    color: $rcpt-ink-mute;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 2px;
    transition: all 0.15s;

    &:hover {
      color: $rcpt-ink;
      background: rgba(26, 21, 16, 0.06);
    }
  }

  .rcpt-title {
    margin: 0 0 14px;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
    color: $rcpt-ink;
    letter-spacing: -0.01em;
  }

  .rcpt-meta {
    display: flex;
    gap: 10px;
    align-items: baseline;
    padding-bottom: 14px;
    border-bottom: 1.5px dashed rgba(42, 37, 32, 0.22);
  }

  .rcpt-meta-label {
    flex-shrink: 0;
    font-family: $mono;
    font-size: 11px;
    font-weight: 600;
    color: $rcpt-ink-mute;
    text-transform: uppercase;
    letter-spacing: 0.16em;
  }

  .rcpt-meta-value {
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: $mono;
    font-size: 13px;
    font-weight: 600;
    color: $rcpt-ink;
    white-space: nowrap;
  }

  /* ====== Counts ====== */
  .rcpt-body {
    padding: 18px var(--dlg-pad-x) 0;
  }

  .rcpt-counts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    margin-bottom: 14px;
  }

  .rcpt-count {
    display: inline-flex;
    gap: 5px;
    align-items: baseline;
    font-family: $mono;
    line-height: 1;
  }

  .rcpt-count-num {
    font-size: 18px;
    font-weight: 700;
    font-feature-settings: "tnum";
    color: $rcpt-ink;
  }

  .rcpt-count-label {
    font-size: 11px;
    font-weight: 500;
    color: $rcpt-ink-mute;
    letter-spacing: 0.08em;
  }

  .rcpt-count-total .rcpt-count-num {
    color: $rcpt-accent;
  }

  .rcpt-dash {
    flex: 1;
    min-width: 16px;
    height: 0;
    border-top: 1.5px dashed rgba(42, 37, 32, 0.22);
  }

  /* ====== Divider ====== */
  .rcpt-divider {
    height: 0;
    margin: 4px 0 6px;
    border-top: 1.5px dashed rgba(42, 37, 32, 0.22);
  }

  .rcpt-divider-end {
    margin: 8px 0 0;
  }

  /* ====== List ====== */
  .rcpt-list {
    max-height: 52vh;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    list-style: none;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(42, 37, 32, 0.2);
      border-radius: 3px;
    }
  }

  .rcpt-row {
    display: grid;
    grid-template-columns: 32px 1fr auto;
    gap: 14px;
    align-items: center;
    padding: 14px 4px;
    cursor: pointer;
    border-bottom: 1px solid rgba(42, 37, 32, 0.08);
    transition: background 0.15s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: rgba(212, 100, 74, 0.04);

      .rcpt-row-action {
        color: $rcpt-accent;
        opacity: 1;
      }
    }

    &:active {
      background: rgba(212, 100, 74, 0.08);
    }
  }

  .rcpt-row-seq {
    font-family: $mono;
    font-size: 11px;
    font-weight: 600;
    color: $rcpt-ink-mute;
    text-align: center;
    letter-spacing: 0.1em;
  }

  .rcpt-row-main {
    min-width: 0;
  }

  .rcpt-row-code {
    font-family: $mono;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.1;
    color: $rcpt-ink;
    letter-spacing: 0.04em;
    word-break: break-all;
    user-select: all;
  }

  .rcpt-row-meta {
    display: flex;
    gap: 5px;
    align-items: center;
    margin-top: 6px;
    font-family: $mono;
    font-size: 11px;
    line-height: 1;
    color: $rcpt-ink-mute;
  }

  .rcpt-row-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: currentColor;
    border-radius: 50%;
  }

  .rcpt-row-status {
    font-weight: 600;
    letter-spacing: 0.04em;
  }

  .rcpt-row-sep {
    margin: 0 1px;
    opacity: 0.5;
  }

  .rcpt-row.is-0 {
    .rcpt-row-dot,
    .rcpt-row-status {
      color: #c87a2e;
    }
  }
  .rcpt-row.is-1 {
    .rcpt-row-dot,
    .rcpt-row-status {
      color: #5a8a3a;
    }
    .rcpt-row-code {
      color: $rcpt-ink-soft;
      text-decoration: line-through;
      text-decoration-thickness: 1.5px;
      text-decoration-color: rgba(90, 138, 58, 0.4);
    }
  }
  .rcpt-row.is-2 {
    .rcpt-row-dot,
    .rcpt-row-status {
      color: #8b857a;
    }
    .rcpt-row-code {
      color: $rcpt-ink-mute;
      opacity: 0.7;
    }
  }
  .rcpt-row.is-3 {
    .rcpt-row-dot,
    .rcpt-row-status {
      color: #b04030;
    }
    .rcpt-row-code {
      color: $rcpt-ink-mute;
      text-decoration: line-through;
      text-decoration-color: rgba(176, 64, 48, 0.5);
    }
  }

  .rcpt-row-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 15px;
    color: $rcpt-ink-mute;
    opacity: 0.5;
    transition: all 0.15s;
  }

  /* ====== Empty ====== */
  .rcpt-empty {
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: center;
    justify-content: center;
    padding: 56px 0 40px;
  }

  .rcpt-empty-glyph {
    font-family: $mono;
    font-size: 48px;
    font-weight: 300;
    line-height: 1;
    color: rgba(42, 37, 32, 0.18);
  }

  .rcpt-empty-text {
    font-size: 13px;
    color: $rcpt-ink-mute;
    letter-spacing: 0.04em;
  }

  /* ====== Footer ====== */
  .rcpt-foot {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }

  .rcpt-foot-hint {
    font-family: $mono;
    font-size: 11px;
    color: $rcpt-ink-mute;
    letter-spacing: 0.06em;
  }

  .rcpt-foot-btn {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 10px 20px;
    font-family: $mono;
    font-size: 12px;
    font-weight: 600;
    color: $rcpt-paper;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    background: $rcpt-ink;
    border: none;
    border-radius: 2px;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
    transition: all 0.15s;

    &:hover:not(:disabled) {
      background: $rcpt-accent;
      box-shadow: 0 3px 0 rgba(0, 0, 0, 0.18);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      box-shadow: 0 1px 0 rgba(0, 0, 0, 0.15);
      transform: translateY(1px);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.35;
    }
  }

  .rcpt-foot-btn-icon {
    font-size: 14px;
  }
}
</style>
