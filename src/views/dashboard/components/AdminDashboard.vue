<template>
  <div class="dash">
    <!-- 顶部：标题 + 副标题 + 极简时间切换 -->
    <header class="dash__head">
      <div class="dash__head-text">
        <h1 class="dash__title">{{ $t("dashboard.title") }}</h1>
        <p class="dash__caption">{{ today }} · {{ rangeLabel }}</p>
      </div>
      <nav class="dash__range" role="tablist">
        <button
          v-for="opt in rangeOptions"
          :key="opt.value"
          type="button"
          role="tab"
          :class="['dash__range-btn', { active: range === opt.value }]"
          :aria-selected="range === opt.value"
          @click="range = opt.value"
        >
          {{ opt.label }}
        </button>
      </nav>
    </header>

    <!-- 错误态 -->
    <div v-if="errorMsg" class="dash__error">
      <el-empty :description="errorMsg" :image-size="80">
        <el-button type="primary" @click="loadData()">
          {{ $t("dashboard.error.retry") }}
        </el-button>
      </el-empty>
    </div>

    <template v-else>
      <!-- 主面板：3 列 KPI 上半 + hairline + 趋势图下半 -->
      <section v-loading="loading" class="dash__panel dash__main">
        <div class="dash__kpis">
          <KpiCard
            :title="$t('dashboard.kpi.newUsers')"
            :value="overview?.newUsers ?? 0"
            :icon="User"
            tone="indigo"
          />
          <KpiCard
            :title="$t('dashboard.kpi.codeUsed')"
            :value="overview?.codeUsed ?? 0"
            :icon="Key"
            tone="emerald"
          />
          <KpiCard
            :title="$t('dashboard.kpi.totalUsers')"
            :value="overview?.totalUsers ?? 0"
            :icon="UserFilled"
            tone="slate"
            last
          />
        </div>
        <div class="dash__rule"></div>
        <TrendChart :data="overview?.newUsersTrend ?? []" :loading="loading" />
      </section>

      <!-- 待办面板：双行 + hairline -->
      <section class="dash__panel">
        <TodoCard
          accent="red"
          :icon="WarningFilled"
          :title="$t('dashboard.todo.pendingReports')"
          :count="overview?.pendingReports ?? 0"
          :candidates="[
            '/exam/question-report',
            'QuestionReport',
            '/question-report',
            'questionreport',
          ]"
        />
        <TodoCard
          accent="amber"
          :icon="ChatDotRound"
          :title="$t('dashboard.todo.pendingFeedbacks')"
          :count="overview?.pendingFeedbacks ?? 0"
          :candidates="['/exam/feedback', 'Feedback', '/feedback', 'feedback']"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { WarningFilled, ChatDotRound, UserFilled, Key, User } from "@element-plus/icons-vue";
import DashboardAPI, { type DashboardOverviewVO } from "@/api/dashboard-api";
import KpiCard from "./KpiCard.vue";
import TrendChart from "./TrendChart.vue";
import TodoCard from "./TodoCard.vue";

const { t } = useI18n();

const range = ref<7 | 30 | 90>(7);
const overview = ref<DashboardOverviewVO | null>(null);
const loading = ref(false);
const errorMsg = ref<string>("");

const rangeOptions = computed<Array<{ value: 7 | 30 | 90; label: string }>>(() => [
  { value: 7, label: t("dashboard.range.7d") },
  { value: 30, label: t("dashboard.range.30d") },
  { value: 90, label: t("dashboard.range.90d") },
]);

const rangeLabel = computed(
  () => rangeOptions.value.find((o) => o.value === range.value)?.label ?? ""
);

const today = computed(() => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${m}.${day}`;
});

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
    errorMsg.value = e?.message ?? t("dashboard.error.loadFailed");
  } finally {
    loading.value = false;
  }
}

const debouncedLoad = useDebounceFn(loadData, 200);

onMounted(loadData);
watch(range, () => debouncedLoad());
onBeforeUnmount(() => abortController?.abort());
</script>

<style lang="scss" scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 16px;

  // —— 顶部 ————————————————————————————————
  &__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: 4px 4px 0;
  }

  &__head-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #0b1220;
    letter-spacing: -0.01em;
  }

  &__caption {
    margin: 0;
    font-size: 12px;
    color: #94a3b8;
    letter-spacing: 0.02em;
  }

  &__range {
    display: inline-flex;
    gap: 18px;
    align-items: center;
  }

  &__range-btn {
    position: relative;
    padding: 6px 0;
    font-family: inherit;
    font-size: 13px;
    color: #94a3b8;
    cursor: pointer;
    background: transparent;
    border: 0;
    transition: color 0.15s ease;

    &::after {
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 1.5px;
      content: "";
      background: #0b1220;
      transition:
        width 0.2s ease,
        left 0.2s ease;
    }

    &:hover {
      color: #475569;
    }

    &.active {
      font-weight: 500;
      color: #0b1220;

      &::after {
        left: 0;
        width: 100%;
      }
    }
  }

  // —— 通用面板 ————————————————————————————
  &__panel {
    overflow: hidden;
    background: #fff;
    border: 1px solid #eef0f3;
    border-radius: 12px;
  }

  &__main {
    display: flex;
    flex-direction: column;
  }

  &__kpis {
    display: flex;
    align-items: stretch;
  }

  &__rule {
    height: 1px;
    background: #eef0f3;
  }

  &__error {
    padding: 64px 0;
    background: #fff;
    border: 1px solid #eef0f3;
    border-radius: 12px;
  }
}
</style>
