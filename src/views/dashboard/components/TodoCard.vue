<template>
  <div class="todo-card" :class="`accent-${accent}`">
    <div class="todo-card__icon">
      <el-icon :size="32"><component :is="icon" /></el-icon>
    </div>
    <div class="todo-card__main">
      <div class="todo-card__title">{{ title }}</div>
      <div class="todo-card__count">
        {{ count }}
        <span class="todo-card__unit">{{ $t("dashboard.todo.unit") }}</span>
      </div>
    </div>
    <el-button class="todo-card__action" plain @click="onClick">
      {{ $t("dashboard.todo.goHandle") }}
      <el-icon class="ml-1"><ArrowRight /></el-icon>
    </el-button>
  </div>
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
.todo-card {
  display: flex;
  flex: 1;
  gap: 16px;
  align-items: center;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 6%);

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 12px;
  }

  &__main {
    flex: 1;
  }

  &__title {
    font-size: 14px;
    color: #64748b;
  }

  &__count {
    margin-top: 4px;
    font-size: 36px;
    font-weight: 600;
    line-height: 1;
    color: #0f172a;
  }

  &__unit {
    margin-left: 4px;
    font-size: 14px;
    font-weight: 400;
    color: #64748b;
  }

  &.accent-red {
    .todo-card__icon {
      color: #dc2626;
      background: #fee2e2;
    }
    .todo-card__count {
      color: #dc2626;
    }
  }

  &.accent-amber {
    .todo-card__icon {
      color: #d97706;
      background: #fef3c7;
    }
    .todo-card__count {
      color: #d97706;
    }
  }
}
</style>
