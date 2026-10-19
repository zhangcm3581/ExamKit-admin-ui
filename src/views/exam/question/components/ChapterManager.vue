<template>
  <el-dialog
    v-model="visible"
    title="编辑章节"
    width="640px"
    append-to-body
    destroy-on-close
    @closed="emit('changed')"
  >
    <div v-loading="loading" class="chapter-editor">
      <div v-if="rows.length === 0" class="chapter-editor__empty">还没有章节，点击下方按钮添加</div>
      <div
        v-for="row in rows"
        :key="row.id"
        class="chapter-row"
        :style="{ paddingLeft: `${row.depth * 28 + 8}px` }"
      >
        <div class="chapter-row__name">
          <button
            v-if="row.hasChildren"
            type="button"
            class="chapter-row__arrow"
            @click="toggle(row.id)"
          >
            {{ expanded.has(row.id) ? "▾" : "▸" }}
          </button>
          <span v-else class="chapter-row__arrow chapter-row__arrow--placeholder" />
          <span>{{ row.name }}</span>
        </div>
        <div class="chapter-row__ops">
          <el-button v-if="row.depth === 0" link type="primary" @click="addChild(row.id)">
            添加子节
          </el-button>
          <el-button link type="primary" @click="rename(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row)">删除</el-button>
        </div>
      </div>
    </div>
    <div class="chapter-editor__add">
      <el-button plain type="primary" @click="addRoot">+ 添加章节</el-button>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ChapterAPI, { type ChapterNode } from "@/api/exam/chapter-api";

const emit = defineEmits<{ changed: [] }>();

const visible = ref(false);
const loading = ref(false);
const subjectId = ref("");
const tree = ref<ChapterNode[]>([]);
const expanded = ref<Set<number>>(new Set());

interface FlatRow {
  id: number;
  name: string;
  depth: number;
  hasChildren: boolean;
}

const rows = computed(() => {
  const list: FlatRow[] = [];
  const walk = (nodes: ChapterNode[], depth: number, parentOpen: boolean) => {
    if (!parentOpen) return;
    for (const node of nodes) {
      const hasChildren = !!node.children?.length;
      list.push({ id: node.id, name: node.name, depth, hasChildren });
      if (hasChildren) {
        walk(node.children || [], depth + 1, expanded.value.has(node.id));
      }
    }
  };
  walk(tree.value, 0, true);
  return list;
});

function open(id: string) {
  subjectId.value = id;
  visible.value = true;
  void load();
}

async function load() {
  if (!subjectId.value) return;
  loading.value = true;
  try {
    const data = await ChapterAPI.tree(subjectId.value);
    tree.value = data || [];
    const next = new Set(expanded.value);
    const collect = (nodes: ChapterNode[]) => {
      for (const node of nodes) {
        if (node.children?.length && !next.has(node.id)) next.add(node.id);
        if (node.children?.length) collect(node.children);
      }
    };
    collect(tree.value);
    expanded.value = next;
  } finally {
    loading.value = false;
  }
}

function toggle(id: number) {
  const next = new Set(expanded.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expanded.value = next;
}

async function addRoot() {
  await ChapterAPI.create(subjectId.value);
  await load();
}

async function addChild(parentId: number) {
  await ChapterAPI.create(subjectId.value, parentId);
  expanded.value = new Set(expanded.value).add(parentId);
  await load();
}

async function rename(row: FlatRow) {
  try {
    const { value } = await ElMessageBox.prompt("章节名称", "编辑章节", {
      inputValue: row.name,
      inputPattern: /\S/,
      inputErrorMessage: "名称不能为空",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });
    await ChapterAPI.rename(row.id, value.trim());
    await load();
  } catch {
    /* 取消 */
  }
}

async function remove(row: FlatRow) {
  if (row.hasChildren) {
    ElMessage.warning("请先删除子节");
    return;
  }
  try {
    await ElMessageBox.confirm("删除后，该章节下的题目会变成无章节", "删除章节", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  await ChapterAPI.remove(row.id);
  await load();
}

defineExpose({ open });
</script>

<style scoped>
.chapter-editor {
  min-height: 160px;
  max-height: 420px;
  overflow: auto;
}
.chapter-editor__empty {
  padding: 48px 0;
  color: #9ca3af;
  text-align: center;
}
.chapter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  border-radius: 6px;
}
.chapter-row:hover {
  background: #f8fafc;
}
.chapter-row__name {
  display: flex;
  gap: 4px;
  align-items: center;
  color: #374151;
}
.chapter-row__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: #6b7280;
  cursor: pointer;
  background: transparent;
  border: 0;
}
.chapter-row__arrow--placeholder {
  cursor: default;
}
.chapter-row__ops {
  display: flex;
  flex-shrink: 0;
  gap: 4px;
  align-items: center;
}
.chapter-editor__add {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
</style>
