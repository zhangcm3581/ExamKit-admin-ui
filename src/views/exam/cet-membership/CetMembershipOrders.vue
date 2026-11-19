<template>
  <div>
    <el-form class="order-toolbar" @submit.prevent="applyFilters">
      <el-input
        v-model="filters.keyword"
        aria-label="订单号或微信支付单号"
        placeholder="输入完整订单号或微信支付单号"
        maxlength="64"
        class="order-keyword"
        clearable
        @clear="applyFilters"
      />
      <el-select
        v-model="filters.examType"
        aria-label="考试级别"
        class="order-filter"
        @change="applyFilters"
      >
        <el-option label="全部级别" value="" />
        <el-option v-for="(label, level) in labels" :key="level" :label="label" :value="level" />
      </el-select>
      <el-select
        v-model="filters.status"
        aria-label="支付状态"
        class="order-filter"
        @change="applyFilters"
      >
        <el-option label="全部状态" value="" />
        <el-option label="已支付" value="paid" />
        <el-option label="未支付" value="unpaid" />
      </el-select>
      <el-select
        v-model="filters.dateField"
        aria-label="日期类型"
        class="order-filter"
        @change="applyFilters"
      >
        <el-option label="支付日期" value="PAID" />
        <el-option label="下单日期" value="CREATED" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        value-format="YYYY-MM-DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        aria-label="查询日期范围（北京时间）"
        class="order-dates"
        @change="applyFilters"
      />
      <el-button type="primary" native-type="submit" :icon="Search">搜索</el-button>
      <el-button :icon="Refresh" aria-label="刷新订单" @click="loadOrders" />
    </el-form>

    <p class="order-total" aria-live="polite">
      当前筛选已支付金额
      <strong>{{ paidTotalCents === null ? "—" : amount(paidTotalCents) }}</strong>
    </p>

    <el-table v-loading="loading" :data="items" row-key="orderNo" stripe :empty-text="emptyText">
      <el-table-column prop="orderNo" label="平台订单号" min-width="200" show-overflow-tooltip />
      <el-table-column label="微信支付单号" min-width="200" show-overflow-tooltip>
        <template #default="{ row }: { row: Order }">{{ row.wxTransactionId || "—" }}</template>
      </el-table-column>
      <el-table-column label="用户" min-width="110" show-overflow-tooltip>
        <template #default="{ row }: { row: Order }">
          <span :title="'用户 ID ' + row.userId">{{ row.userName || "ID " + row.userId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="考试级别" width="100">
        <template #default="{ row }: { row: Order }">{{ labels[row.examType] }}</template>
      </el-table-column>
      <el-table-column label="金额" width="96" align="right">
        <template #default="{ row }: { row: Order }">{{ amount(row.priceCents) }}</template>
      </el-table-column>
      <el-table-column prop="durationMonths" label="有效期（月）" width="106" align="center" />
      <el-table-column label="支付状态" width="94" align="center">
        <template #default="{ row }: { row: Order }">
          <el-tag :type="row.paidAt ? 'success' : 'info'" size="small" effect="plain">
            {{ row.paidAt ? "已支付" : "未支付" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付时间（北京时间）" min-width="176">
        <template #default="{ row }: { row: Order }">{{ date(row.paidAt) }}</template>
      </el-table-column>
      <el-table-column label="下单时间（北京时间）" min-width="176">
        <template #default="{ row }: { row: Order }">{{ date(row.createdAt) }}</template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > 0"
      :current-page="page"
      :page-size="size"
      :page-sizes="[20, 50, 100]"
      :total="total"
      layout="total, sizes, prev, pager, next"
      background
      class="order-pagination"
      @update:current-page="selectPage"
      @update:page-size="selectSize"
    />
  </div>
</template>

<script setup lang="ts">
import { Refresh, Search } from "@element-plus/icons-vue";
import request from "@/utils/request";

type Level = "CET4" | "CET6";
defineProps<{ labels: Record<Level, string> }>();

interface Order {
  orderNo: string;
  wxTransactionId: string | null;
  userId: string;
  userName: string | null;
  examType: Level;
  priceCents: number;
  durationMonths: number;
  createdAt: string;
  paidAt: string | null;
}

const filters = reactive({ keyword: "", examType: "", status: "paid", dateField: "PAID" });
const dateRange = ref<[string, string] | null>(null);
const page = ref(1);
const size = ref(20);
const total = ref(0);
const paidTotalCents = ref<number | null>(null);
const items = ref<Order[]>([]);
const loading = ref(false);
const emptyText = ref("暂无符合条件的微信订单");
let loadId = 0;

const timeFormat = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  dateStyle: "short",
  timeStyle: "medium",
});
const date = (value: string | null) => (value ? timeFormat.format(new Date(value)) : "—");
const currency = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" });
const amount = (cents: number) => currency.format(cents / 100);

async function loadOrders() {
  const id = ++loadId;
  loading.value = true;
  paidTotalCents.value = null;
  try {
    const result = await request.get<
      unknown,
      { items: Order[]; total: number; paidTotalCents: number }
    >("/v1/cet-membership/orders", {
      params: {
        ...filters,
        keyword: filters.keyword.trim(),
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1],
        page: page.value,
        size: size.value,
      },
    });
    if (id === loadId) {
      items.value = result.items;
      total.value = result.total;
      paidTotalCents.value = result.paidTotalCents ?? null;
      emptyText.value = "暂无符合条件的微信订单";
    }
  } catch {
    if (id === loadId) {
      items.value = [];
      total.value = 0;
      emptyText.value = "微信订单加载失败，请刷新";
    }
  } finally {
    if (id === loadId) loading.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  void loadOrders();
}

function selectPage(next: number) {
  if (next === page.value) return;
  page.value = next;
  void loadOrders();
}

function selectSize(next: number) {
  size.value = next;
  applyFilters();
}

onMounted(loadOrders);
</script>

<style scoped>
.order-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

.order-toolbar :deep(.el-button + .el-button) {
  margin-left: 0;
}

.order-keyword {
  width: 265px;
}

.order-filter {
  width: 120px;
}

.order-dates {
  max-width: 100%;
}

.order-total {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.order-total strong {
  font-size: 18px;
  font-variant-numeric: tabular-nums;
  color: var(--el-color-success);
}

.order-pagination {
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
