<template>
  <div class="trend-chart">
    <div class="trend-chart__title">{{ $t("dashboard.trend.title") }}</div>
    <div v-if="loading" v-loading="true" class="trend-chart__placeholder"></div>
    <el-empty
      v-else-if="!data || data.length === 0"
      :description="$t('dashboard.trend.empty')"
      class="trend-chart__placeholder"
    />
    <div v-else ref="chartRef" class="trend-chart__canvas"></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

interface TrendPoint {
  date: string;
  count: number;
}

interface Props {
  data: TrendPoint[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), { loading: false });

const chartRef = ref<HTMLDivElement>();
let chart: echarts.ECharts | null = null;

function render() {
  if (!chartRef.value) return;
  // 错误恢复后 v-if 会重建 DOM，旧 chart 实例绑死被销毁的元素，需重置
  if (chart && chart.getDom() !== chartRef.value) {
    chart.dispose();
    chart = null;
  }
  if (!chart) chart = echarts.init(chartRef.value);
  chart.setOption({
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: "#cbd5e1" } },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: props.data.map((p) => p.date.slice(5)),
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisLabel: { color: "#64748b", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "#f1f5f9" } },
      axisLabel: { color: "#94a3b8" },
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 4,
        data: props.data.map((p) => p.count),
        lineStyle: { width: 2, color: "#3b82f6" },
        itemStyle: { color: "#3b82f6" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgb(59 130 246 / 30%)" },
            { offset: 1, color: "rgb(59 130 246 / 0%)" },
          ]),
        },
      },
    ],
  });
}

watch(
  () => props.data,
  () => nextTick(render),
  { deep: true }
);
onMounted(() => nextTick(render));

const onResize = () => chart?.resize();
onMounted(() => window.addEventListener("resize", onResize));
onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  chart?.dispose();
  chart = null;
});
</script>

<style lang="scss" scoped>
.trend-chart {
  padding: 20px 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 6%);

  &__title {
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
  }

  &__canvas {
    width: 100%;
    height: 320px;
  }

  &__placeholder {
    height: 320px;
  }
}
</style>
