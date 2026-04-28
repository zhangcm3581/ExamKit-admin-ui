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
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

interface Props {
  title: string;
  count: number;
  accent: "red" | "amber";
  icon: any;
  // 候选 name 或 path 列表，按顺序解析；任何一个匹配到已注册路由即跳转
  // 设计目的：菜单是后端动态下发的，避免在看板硬编码路径导致 404
  candidates: string[];
}

const props = defineProps<Props>();
const router = useRouter();

function resolveTarget(): string | null {
  const routes = router.getRoutes();
  // 1) 精确匹配 name 或 path
  for (const c of props.candidates) {
    const hit = routes.find((r) => r.path === c || r.name === c);
    if (hit) return hit.path;
  }
  // 2) 模糊匹配 name（去掉斜杠/连字符/下划线后包含）
  const norm = (s: string) => s.toLowerCase().replace(/[/\-_]/g, "");
  for (const c of props.candidates) {
    const target = norm(c);
    const hit = routes.find((r) => typeof r.name === "string" && norm(r.name).includes(target));
    if (hit) return hit.path;
  }
  return null;
}

const onClick = () => {
  const target = resolveTarget();
  if (target) {
    router.push(target);
  } else {
    ElMessage.warning("找不到对应页面，请从侧边栏进入");
  }
};
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
