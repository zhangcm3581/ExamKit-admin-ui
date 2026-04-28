<template>
  <div class="admin-dashboard">
    <!-- 顶部：标题 + 时间切换器 -->
    <div class="admin-dashboard__header">
      <h2 class="admin-dashboard__title">{{ $t("dashboard.title") }}</h2>
      <el-radio-group v-model="range" size="default">
        <el-radio-button :value="7">{{ $t("dashboard.range.7d") }}</el-radio-button>
        <el-radio-button :value="30">{{ $t("dashboard.range.30d") }}</el-radio-button>
        <el-radio-button :value="90">{{ $t("dashboard.range.90d") }}</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 加载/错误态：整页保留布局，每个区域内自处理 -->
    <div v-if="errorMsg" class="admin-dashboard__error">
      <el-empty :description="errorMsg">
        <el-button type="primary" @click="loadData()">{{ $t("dashboard.error.retry") }}</el-button>
      </el-empty>
    </div>

    <template v-else>
      <!-- KPI 三卡 -->
      <div v-loading="loading" class="admin-dashboard__kpi">
        <KpiCard
          accent="blue"
          :title="$t('dashboard.kpi.newUsers')"
          :value="overview?.newUsers ?? 0"
          :trend="newUsersSpark"
        />
        <KpiCard
          accent="green"
          :title="$t('dashboard.kpi.codeUsed')"
          :value="overview?.codeUsed ?? 0"
          :trend="codeUsedSpark"
        />
        <KpiCard
          accent="gray"
          :title="$t('dashboard.kpi.totalUsers')"
          :value="overview?.totalUsers ?? 0"
          :trend="totalUsersSpark"
        />
      </div>

      <!-- 趋势图 -->
      <TrendChart :data="overview?.newUsersTrend ?? []" :loading="loading" />

      <!-- 待办两卡 -->
      <div class="admin-dashboard__todos">
        <TodoCard
          accent="red"
          :icon="WarningFilled"
          :title="$t('dashboard.todo.pendingReports')"
          :count="overview?.pendingReports ?? 0"
          action-to="/exam/question-report"
        />
        <TodoCard
          accent="amber"
          :icon="ChatDotRound"
          :title="$t('dashboard.todo.pendingFeedbacks')"
          :count="overview?.pendingFeedbacks ?? 0"
          action-to="/exam/feedback"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { WarningFilled, ChatDotRound } from "@element-plus/icons-vue";
import DashboardAPI, { type DashboardOverviewVO } from "@/api/dashboard-api";
import KpiCard from "./KpiCard.vue";
import TrendChart from "./TrendChart.vue";
import TodoCard from "./TodoCard.vue";

const range = ref<7 | 30 | 90>(7);
const overview = ref<DashboardOverviewVO | null>(null);
const loading = ref(false);
const errorMsg = ref<string>("");

let abortController: AbortController | null = null;

async function loadData() {
  abortController?.abort();
  abortController = new AbortController();
  loading.value = true;
  errorMsg.value = "";
  try {
    overview.value = await DashboardAPI.getOverview(range.value, abortController.signal);
  } catch (e: any) {
    if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
    errorMsg.value = e?.message ?? "加载失败";
  } finally {
    loading.value = false;
  }
}

const debouncedLoad = useDebounceFn(loadData, 200);

onMounted(loadData);
watch(range, () => debouncedLoad());
onBeforeUnmount(() => abortController?.abort());

// sparkline 数据派生
const newUsersSpark = computed(() => overview.value?.newUsersTrend.map((p) => p.count) ?? []);
const codeUsedSpark = computed(() => overview.value?.codeUsedTrend.map((p) => p.count) ?? []);
// 总用户 sparkline：用 totalUsers 与 newUsersTrend 反推每日累计
const totalUsersSpark = computed(() => {
  if (!overview.value) return [];
  const trend = overview.value.newUsersTrend;
  const sumNew = trend.reduce((a, p) => a + p.count, 0);
  let cur = overview.value.totalUsers - sumNew;
  return trend.map((p) => (cur += p.count));
});
</script>

<style lang="scss" scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8fafc;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #0f172a;
  }

  &__kpi {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  &__todos {
    display: flex;
    gap: 16px;
  }

  &__error {
    padding: 64px 0;
    background: #fff;
    border-radius: 12px;
  }
}
</style>
