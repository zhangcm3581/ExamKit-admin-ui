<!-- C 端订单管理 -->
<template>
  <div class="app-container app-order-admin">
    <el-card shadow="never">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-form inline :model="query">
          <el-form-item label="订单号">
            <el-input
              v-model="query.orderNo"
              placeholder="支持模糊匹配"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="激活码">
            <el-input
              v-model="query.code"
              placeholder="精确匹配反查订单"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="query.status"
              placeholder="全部状态"
              clearable
              style="width: 130px"
              @change="handleSearch"
            >
              <el-option label="待支付" value="PENDING" />
              <el-option label="已支付" value="PAID" />
              <el-option label="已关闭" value="CLOSED" />
            </el-select>
          </el-form-item>
          <el-form-item label="支付方式">
            <el-select
              v-model="query.payType"
              placeholder="全部"
              clearable
              style="width: 130px"
              @change="handleSearch"
            >
              <el-option label="扫码" value="NATIVE" />
              <el-option label="H5" value="H5" />
              <el-option label="小程序" value="JSAPI" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="—"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DDTHH:mm:ss"
              @change="onDateRangeChange"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        v-loading="loading"
        :data="rows"
        stripe
        empty-text="未找到符合条件的订单"
        :header-cell-style="{ background: 'var(--el-fill-color-light)' }"
      >
        <el-table-column label="订单号" min-width="220">
          <template #default="{ row }">
            <span class="mono">{{ row.orderNo }}</span>
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
        <el-table-column label="科目" min-width="220">
          <template #default="{ row }">
            <div class="subject-cell">
              <div class="zh">{{ row.subjectName || row.subjectNameEn || "—" }}</div>
              <div v-if="row.subjectName && row.subjectNameEn" class="en">
                {{ row.subjectNameEn }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="数量" prop="quantity" width="70" align="center" />
        <el-table-column label="单价" width="90" align="right">
          <template #default="{ row }">
            <span class="price-cell">
              <span class="currency">¥</span>
              {{ row.unitPriceYuan }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="总额" width="110" align="right">
          <template #default="{ row }">
            <span class="total-cell">
              <span class="currency">¥</span>
              {{ row.totalYuan }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" effect="light">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="90" align="center">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ payTypeLabel(row.payType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="激活码" width="100" align="center">
          <template #default="{ row }">
            <span class="mono">{{ row.generatedCount }}/{{ row.quantity }}</span>
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
        <el-table-column label="操作" width="110" fixed="right">
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
      width="560px"
      destroy-on-close
      append-to-body
      :show-close="true"
      class="codes-dialog"
    >
      <template #header>
        <div class="codes-header">
          <div class="codes-header-main">
            <div class="codes-title">激活码明细</div>
            <div class="codes-order-no mono" :title="currentOrderNo">{{ currentOrderNo }}</div>
          </div>
          <div class="codes-stats">
            <span class="stat-total">共 {{ codes.length }} 个</span>
            <span v-if="codeSummary.used > 0" class="stat-item stat-used">
              已用 {{ codeSummary.used }}
            </span>
            <span v-if="codeSummary.unused > 0" class="stat-item stat-unused">
              未用 {{ codeSummary.unused }}
            </span>
            <span v-if="codeSummary.expired > 0" class="stat-item stat-expired">
              已过期 {{ codeSummary.expired }}
            </span>
            <span v-if="codeSummary.recycled > 0" class="stat-item stat-recycled">
              已回收 {{ codeSummary.recycled }}
            </span>
          </div>
        </div>
      </template>

      <div v-loading="codesLoading" class="codes-body">
        <div v-if="!codesLoading && !codes.length" class="codes-empty">
          <el-icon :size="32"><DocumentRemove /></el-icon>
          <span>该订单暂无激活码</span>
        </div>

        <ul v-else class="code-list">
          <li v-for="(c, i) in codes" :key="c.code" class="code-card" :class="`status-${c.status}`">
            <div class="code-index">{{ i + 1 }}</div>
            <div class="code-main">
              <div class="code-row-1">
                <span class="code-value mono">{{ c.code }}</span>
                <el-button
                  link
                  type="primary"
                  size="small"
                  class="code-copy"
                  @click="copyOne(c.code)"
                >
                  <el-icon><CopyDocument /></el-icon>
                </el-button>
              </div>
              <div class="code-row-2">
                <el-tag :type="codeStatusTag(c.status)" size="small" effect="light" round>
                  {{ codeStatusLabel(c.status) }}
                </el-tag>
                <span class="code-meta">有效 {{ c.validDays }} 天</span>
                <span v-if="c.usedAt" class="code-meta">
                  · 使用于 {{ formatDateTime(c.usedAt) }}
                </span>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <template #footer>
        <div class="codes-footer">
          <span class="footer-hint">点击激活码右侧图标可单独复制</span>
          <el-button type="primary" :icon="CopyDocument" :disabled="!codes.length" @click="copyAll">
            复制全部
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Search, Refresh, CopyDocument, DocumentRemove } from "@element-plus/icons-vue";
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
const codeStatusTag = (s: number): TagType =>
  (({ 0: "warning", 1: "success", 2: "info", 3: "danger" }) as Record<number, TagType>)[s] ??
  "info";
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

onMounted(loadOrders);
</script>

<style scoped lang="scss">
.app-order-admin {
  .toolbar {
    margin-bottom: 12px;
  }

  .mono {
    font-family: "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 12.5px;
  }

  .nowrap {
    display: inline-block;
    white-space: nowrap;
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

  .code-cell {
    font-weight: 600;
    color: var(--el-color-primary);
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

// ============ 激活码弹窗（append-to-body，作用域穿透） ============
:deep(.codes-dialog) {
  overflow: hidden;
  border-radius: 12px;

  .el-dialog__header {
    padding: 18px 20px 14px;
    margin-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .el-dialog__body {
    padding: 0;
  }

  .el-dialog__footer {
    padding: 12px 20px 16px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .codes-header {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .codes-header-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .codes-title {
    font-size: 15px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--el-text-color-primary);
  }

  .codes-order-no {
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  .codes-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
    font-size: 12px;
  }

  .stat-total {
    padding: 2px 8px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color);
    border-radius: 4px;
  }

  .stat-item {
    padding: 2px 8px;
    border-radius: 4px;
  }

  .stat-used {
    color: #5daf34;
    background: rgba(103, 194, 58, 0.12);
  }

  .stat-unused {
    color: #b88230;
    background: rgba(230, 162, 60, 0.14);
  }

  .stat-expired {
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
  }

  .stat-recycled {
    color: #c45656;
    background: rgba(245, 108, 108, 0.12);
  }

  .codes-body {
    max-height: 60vh;
    padding: 14px 20px 6px;
    overflow-y: auto;
  }

  .codes-empty {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    justify-content: center;
    padding: 48px 0;
    color: var(--el-text-color-placeholder);

    .el-icon {
      color: var(--el-text-color-disabled);
    }

    span {
      font-size: 13px;
    }
  }

  .code-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .code-card {
    position: relative;
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 14px 12px 18px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    transition: border-color 0.15s;

    &::before {
      position: absolute;
      top: 12px;
      bottom: 12px;
      left: 8px;
      width: 3px;
      content: "";
      background: var(--el-color-info-light-5);
      border-radius: 2px;
    }

    &.status-0::before {
      background: var(--el-color-warning);
    }

    &.status-1::before {
      background: var(--el-color-success);
    }

    &.status-2::before {
      background: var(--el-color-info);
    }

    &.status-3::before {
      background: var(--el-color-danger);
    }

    &:hover {
      border-color: var(--el-color-primary-light-5);
    }
  }

  .code-index {
    flex-shrink: 0;
    width: 22px;
    font-family: "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    text-align: center;
  }

  .code-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .code-row-1 {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .code-value {
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: "SFMono-Regular", Menlo, Consolas, monospace;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-color-primary);
    letter-spacing: 0.6px;
    white-space: nowrap;
    user-select: all;
  }

  .code-copy {
    padding: 0 4px;
    opacity: 0.7;
    transition: opacity 0.15s;

    &:hover {
      opacity: 1;
    }
  }

  .code-row-2 {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-size: 12px;
    line-height: 1;
  }

  .code-meta {
    color: var(--el-text-color-secondary);
  }

  .codes-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-hint {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
