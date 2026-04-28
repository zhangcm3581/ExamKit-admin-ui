<template>
  <div class="trend">
    <div class="trend__head">
      <div class="trend__title">{{ $t("dashboard.trend.title") }}</div>
    </div>
    <div v-if="loading" v-loading="true" class="trend__placeholder"></div>
    <el-empty
      v-else-if="!data || data.length === 0"
      :description="$t('dashboard.trend.empty')"
      :image-size="80"
      class="trend__placeholder"
    />
    <div v-else ref="chartRef" class="trend__canvas"></div>
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
  if (chart && chart.getDom() !== chartRef.value) {
    chart.dispose();
    chart = null;
  }
  if (!chart) chart = echarts.init(chartRef.value);

  const STROKE = "#1e3a8a";
  const FILL_TOP = "rgb(30 58 138 / 14%)";
  const FILL_BOTTOM = "rgb(30 58 138 / 0%)";

  chart.setOption({
    grid: { left: 32, right: 8, top: 12, bottom: 28 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgb(11 18 32 / 92%)",
      borderColor: "transparent",
      textStyle: { color: "#fff", fontSize: 12 },
      padding: [8, 12],
      axisPointer: {
        type: "line",
        lineStyle: { color: "#cbd5e1", width: 1, type: "dashed" },
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: props.data.map((p) => p.date.slice(5)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11, margin: 12 },
    },
    yAxis: {
      type: "value",
      splitNumber: 3,
      splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
      axisLabel: {
        color: "#94a3b8",
        fontSize: 11,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      },
    },
    series: [
      {
        type: "line",
        smooth: 0.32,
        symbol: "circle",
        symbolSize: 5,
        showSymbol: false,
        emphasis: { focus: "series", scale: 1.4 },
        data: props.data.map((p) => p.count),
        lineStyle: { width: 1.5, color: STROKE },
        itemStyle: { color: STROKE, borderColor: "#fff", borderWidth: 1.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: FILL_TOP },
            { offset: 1, color: FILL_BOTTOM },
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
.trend {
  padding: 18px 24px 22px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__title {
    font-size: 13px;
    font-weight: 500;
    color: #475569;
    letter-spacing: 0.02em;
  }

  &__canvas {
    width: 100%;
    height: 220px;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 220px;
  }
}
</style>
