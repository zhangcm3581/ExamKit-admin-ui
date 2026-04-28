<template>
  <button class="todo-row" :class="`tone-${accent}`" type="button" @click="onClick">
    <span class="todo-row__icon">
      <el-icon :size="16"><component :is="icon" /></el-icon>
    </span>
    <span class="todo-row__label">{{ title }}</span>
    <span class="todo-row__count">
      <span class="todo-row__num">{{ count }}</span>
      <span class="todo-row__unit">{{ $t("dashboard.todo.unit") }}</span>
    </span>
    <span class="todo-row__cta">
      {{ $t("dashboard.todo.goHandle") }}
      <el-icon class="todo-row__arrow" :size="12"><ArrowRight /></el-icon>
    </span>
  </button>
</template>

<script setup lang="ts">
import { ArrowRight } from "@element-plus/icons-vue";
import { useRouter, type RouteLocationRaw } from "vue-router";

interface Props {
  title: string;
  count: number;
  accent: "red" | "amber";
  icon: any;
  actionTo: RouteLocationRaw;
}
const props = defineProps<Props>();
const router = useRouter();
const onClick = () => router.push(props.actionTo);
</script>

<style lang="scss" scoped>
.todo-row {
  display: flex;
  flex: 1;
  gap: 14px;
  align-items: center;
  width: 100%;
  padding: 18px 24px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  transition: background-color 0.15s ease;

  &:hover {
    background: #f8fafc;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #eef0f3;
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
  }

  &__label {
    flex-shrink: 0;
    min-width: 120px;
    font-size: 14px;
    color: #334155;
  }

  &__count {
    display: inline-flex;
    flex: 1;
    gap: 4px;
    align-items: baseline;
  }

  &__num {
    font-size: 22px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    letter-spacing: -0.01em;
  }

  &__unit {
    font-size: 12px;
    color: #94a3b8;
  }

  &__cta {
    display: inline-flex;
    flex-shrink: 0;
    gap: 4px;
    align-items: center;
    font-size: 12px;
    color: #64748b;
    transition: color 0.15s ease;
  }

  &:hover &__cta {
    color: #0b1220;
  }

  &__arrow {
    transition: transform 0.2s ease;
  }

  &:hover &__arrow {
    transform: translateX(2px);
  }

  // tone presets
  &.tone-red {
    .todo-row__icon {
      color: #b91c1c;
      background: #fee2e2;
    }
    .todo-row__num {
      color: #b91c1c;
    }
  }

  &.tone-amber {
    .todo-row__icon {
      color: #b45309;
      background: #fef3c7;
    }
    .todo-row__num {
      color: #b45309;
    }
  }
}
</style>
