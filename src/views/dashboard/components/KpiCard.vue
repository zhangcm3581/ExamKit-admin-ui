<template>
  <div class="kpi-stat" :class="{ 'kpi-stat--last': last }">
    <div class="kpi-stat__head">
      <span v-if="icon" class="kpi-stat__icon" :class="`tone-${tone}`">
        <el-icon :size="14"><component :is="icon" /></el-icon>
      </span>
      <span class="kpi-stat__label">{{ title }}</span>
    </div>
    <div class="kpi-stat__value">{{ display }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useTransition, TransitionPresets } from "@vueuse/core";

interface Props {
  title: string;
  value: number;
  icon?: any;
  tone?: "indigo" | "emerald" | "slate";
  // 布局开关：true 表示该列右边不再渲染竖向 hairline 分隔
  last?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  last: false,
  icon: undefined,
  tone: "indigo",
});

// count-up：源值从 0 起步，挂载后或 value 变化时过渡到目标，约 900ms easeOutCubic
const source = ref<number>(0);

onMounted(() => {
  source.value = props.value ?? 0;
});

watch(
  () => props.value,
  (v) => {
    source.value = v ?? 0;
  }
);

const animated = useTransition(source, {
  duration: 900,
  transition: TransitionPresets.easeOutCubic,
});

const display = computed(() => Math.round(animated.value).toLocaleString("en-US"));
</script>

<style lang="scss" scoped>
.kpi-stat {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  padding: 22px 28px;

  &::after {
    position: absolute;
    top: 22px;
    right: 0;
    bottom: 22px;
    width: 1px;
    content: "";
    background: #eef0f3;
  }

  &--last::after {
    display: none;
  }

  &__head {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 8px;

    &.tone-indigo {
      color: #4338ca;
      background: #eef2ff;
    }

    &.tone-emerald {
      color: #047857;
      background: #ecfdf5;
    }

    &.tone-slate {
      color: #475569;
      background: #f1f5f9;
    }
  }

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__value {
    font-size: 34px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    color: #0b1220;
    letter-spacing: -0.015em;
  }
}
</style>
