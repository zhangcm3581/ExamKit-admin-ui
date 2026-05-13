<template>
  <el-drawer
    v-model="visible"
    title="选择要覆盖的科目"
    size="560px"
    direction="rtl"
    destroy-on-close
    append-to-body
    :with-header="true"
    class="subject-picker-drawer"
  >
    <div class="picker-toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索科目名 / 提供商"
        clearable
        :prefix-icon="Search"
        size="default"
      />
      <span class="count-hint">
        <template v-if="selectedIds.size > 0">
          本次将加入
          <b>{{ selectedIds.size }}</b>
          个
        </template>
        <template v-else>未选择</template>
      </span>
    </div>

    <div class="picker-body">
      <div v-for="group in filteredGroups" :key="group.providerId" class="provider-group">
        <div class="group-header" @click="toggleGroup(group.providerId)">
          <el-icon class="caret">
            <CaretRight v-if="collapsed.has(group.providerId)" />
            <CaretBottom v-else />
          </el-icon>
          <span @click.stop>
            <el-checkbox
              :model-value="groupAllSelected(group)"
              :indeterminate="groupIndeterminate(group)"
              @change="(v: boolean | string | number) => toggleGroupAll(group, Boolean(v))"
            />
          </span>
          <span class="group-name">{{ group.providerName }}</span>
          <span class="group-meta">
            {{ groupSelectedCount(group) }} / {{ group.subjects.length }}
          </span>
        </div>
        <div v-if="!collapsed.has(group.providerId)" class="group-rows">
          <div
            v-for="s in group.subjects"
            :key="s.id"
            class="subject-row"
            :class="{ active: selectedIds.has(s.id) }"
            @click="toggleSubject(s.id)"
          >
            <span @click.stop>
              <el-checkbox :model-value="selectedIds.has(s.id)" @change="toggleSubject(s.id)" />
            </span>
            <div class="subject-name">
              <div class="zh">{{ subjectLabel(s) }}</div>
              <div v-if="s.nameZh && s.nameEn" class="en">{{ s.nameEn }}</div>
            </div>
            <div class="subject-price">¥{{ s.price / 100 }}</div>
          </div>
        </div>
      </div>

      <el-empty v-if="filteredGroups.length === 0" :description="emptyHint" :image-size="72" />
    </div>

    <template #footer>
      <div class="drawer-footer">
        <span v-if="alreadyPickedIds.length > 0" class="footer-hint">
          已加入 {{ alreadyPickedIds.length }} 个，不再展示
        </span>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :disabled="selectedIds.size === 0" @click="confirm">
          加入 {{ selectedIds.size }} 个科目
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { Search, CaretRight, CaretBottom } from "@element-plus/icons-vue";
import type { SubjectVO } from "@/api/exam/subject-api";

interface Props {
  modelValue: boolean;
  subjects: SubjectVO[];
  alreadyPickedIds: string[];
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "confirm", subjectIds: string[]): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const keyword = ref("");
const selectedIds = reactive(new Set<string>());
const collapsed = reactive(new Set<number>());

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selectedIds.clear();
      keyword.value = "";
      collapsed.clear();
    }
  }
);

interface Group {
  providerId: number;
  providerName: string;
  subjects: SubjectVO[];
}

function subjectLabel(s: SubjectVO) {
  return s.nameZh && s.nameZh.length ? s.nameZh : (s.nameEn ?? s.id);
}

function matches(s: SubjectVO, q: string): boolean {
  if (!q) return true;
  const lq = q.toLowerCase();
  return (
    (s.nameZh ?? "").toLowerCase().includes(lq) ||
    (s.nameEn ?? "").toLowerCase().includes(lq) ||
    (s.providerName ?? "").toLowerCase().includes(lq)
  );
}

const filteredGroups = computed<Group[]>(() => {
  const taken = new Set(props.alreadyPickedIds);
  const pickable = props.subjects.filter(
    (s) => !taken.has(s.id) && matches(s, keyword.value.trim())
  );
  const map = new Map<number, Group>();
  for (const s of pickable) {
    const pid = s.providerId ?? 0;
    if (!map.has(pid)) {
      map.set(pid, {
        providerId: pid,
        providerName: s.providerName || "其他",
        subjects: [],
      });
    }
    map.get(pid)!.subjects.push(s);
  }
  for (const g of map.values()) {
    g.subjects.sort((a, b) => subjectLabel(a).localeCompare(subjectLabel(b)));
  }
  return Array.from(map.values()).sort((a, b) => a.providerName.localeCompare(b.providerName));
});

const emptyHint = computed(() => (keyword.value ? "没有匹配的科目" : "所有科目都已加入"));

function groupSelectedCount(g: Group) {
  let n = 0;
  for (const s of g.subjects) {
    if (selectedIds.has(s.id)) n++;
  }
  return n;
}
function groupAllSelected(g: Group) {
  return g.subjects.length > 0 && g.subjects.every((s) => selectedIds.has(s.id));
}
function groupIndeterminate(g: Group) {
  const some = g.subjects.some((s) => selectedIds.has(s.id));
  return some && !groupAllSelected(g);
}
function toggleGroupAll(g: Group, check: boolean) {
  for (const s of g.subjects) {
    if (check) selectedIds.add(s.id);
    else selectedIds.delete(s.id);
  }
}
function toggleGroup(pid: number) {
  if (collapsed.has(pid)) collapsed.delete(pid);
  else collapsed.add(pid);
}
function toggleSubject(id: string) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
}
function confirm() {
  if (selectedIds.size === 0) return;
  emit("confirm", Array.from(selectedIds));
  visible.value = false;
}
</script>

<style scoped lang="scss">
/* 让 drawer body 内部成为可滚动区域，footer 始终贴底 */
:deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  padding: 0 20px 12px;
  overflow: hidden;
}

:deep(.el-drawer__header) {
  padding: 18px 20px 14px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .el-drawer__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

:deep(.el-drawer__footer) {
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.picker-toolbar {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;
  padding-top: 4px;
  margin-bottom: 12px;

  :deep(.el-input) {
    flex: 1;
  }

  .count-hint {
    flex-shrink: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);

    b {
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }
}

.picker-body {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.drawer-footer {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
}

.provider-group + .provider-group {
  border-top: 1px solid var(--el-border-color-lighter);
}

.group-header {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  cursor: pointer;
  user-select: none;
  background: var(--el-fill-color-light);

  .caret {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .group-name {
    flex: 1;
  }

  .group-meta {
    font-size: 12px;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-secondary);
  }

  &:hover {
    background: var(--el-fill-color);
  }
}

.subject-row {
  display: grid;
  grid-template-columns: 24px 1fr 96px;
  gap: 12px;
  align-items: center;
  padding: 8px 14px 8px 28px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.12s;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.active {
    background: var(--el-color-primary-light-9);

    &:hover {
      background: var(--el-color-primary-light-8);
    }
  }

  .subject-name {
    overflow: hidden;
    line-height: 1.35;

    .zh {
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--el-text-color-primary);
      white-space: nowrap;
    }

    .en {
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }
  }

  .subject-price {
    font-size: 12.5px;
    font-variant-numeric: tabular-nums;
    color: var(--el-text-color-secondary);
    text-align: right;
  }
}

.footer-hint {
  margin-right: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
