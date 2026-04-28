<template>
  <div class="kpi-card" :class="`accent-${accent}`">
    <div class="kpi-card__bar"></div>
    <div class="kpi-card__body">
      <div class="kpi-card__title">{{ title }}</div>
      <div class="kpi-card__value">{{ formattedValue }}</div>
    </div>
    <div v-if="trend && trend.length > 0" ref="sparkRef" class="kpi-card__spark"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([LineChart, GridComponent, CanvasRenderer]);

interface Props {
  title: string;
  value: number;
  trend?: number[];
  accent?: "blue" | "green" | "gray";
}

const props = withDefaults(defineProps<Props>(), {
  trend: () => [],
  accent: "blue",
});

const sparkRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

const accentColor = computed(() => {
  switch (props.accent) {
    case "green":
      return "#22c55e";
    case "gray":
      return "#94a3b8";
    case "blue":
    default:
      return "#3b82f6";
  }
});

const formattedValue = computed(() => props.value.toLocaleString("en-US"));

function renderChart() {
  if (!sparkRef.value || !props.trend || props.trend.length === 0) return;
  if (!chart) {
    chart = echarts.init(sparkRef.value);
  }
  const color = accentColor.value;
  chart.setOption({
    grid: { left: 0, right: 0, top: 4, bottom: 4 },
    xAxis: { type: "category", show: false, data: props.trend.map((_, i) => i) },
    yAxis: { type: "value", show: false },
    series: [
      {
        type: "line",
        data: props.trend,
        smooth: true,
        symbol: "none",
        lineStyle: { width: 2, color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: color + "4D" },
            { offset: 1, color: color + "00" },
          ]),
        },
      },
    ],
  });
}

onMounted(renderChart);
watch(() => props.trend, renderChart, { deep: true });

const onResize = () => chart?.resize();
onMounted(() => window.addEventListener("resize", onResize));
onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  chart?.dispose();
  chart = null;
});
</script>

<style lang="scss" scoped>
.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px 20px 12px 24px;
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 6%);

  &__bar {
    position: absolute;
    top: 16px;
    bottom: 16px;
    left: 0;
    width: 4px;
    border-radius: 0 4px 4px 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__title {
    font-size: 14px;
    color: #64748b;
  }

  &__value {
    font-size: 32px;
    font-weight: 600;
    line-height: 1.1;
    color: #0f172a;
  }

  &__spark {
    width: 100%;
    height: 36px;
    margin-top: 12px;
  }

  &.accent-blue .kpi-card__bar {
    background: #3b82f6;
  }

  &.accent-green .kpi-card__bar {
    background: #22c55e;
  }

  &.accent-gray .kpi-card__bar {
    background: #94a3b8;
  }
}
</style>
