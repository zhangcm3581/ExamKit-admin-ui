<template>
  <el-table class="cet-group-table" :data="rows" row-key="id" empty-text="暂无题组">
    <el-table-column prop="id" label="题组编号" min-width="190" show-overflow-tooltip />
    <el-table-column v-if="showSource" label="关联试卷" min-width="165" show-overflow-tooltip>
      <template #default="{ row }">{{ row.paper || "—" }}</template>
    </el-table-column>
    <el-table-column label="题型" width="78">
      <template #default="{ row }">{{ categories[row.category as Category] }}</template>
    </el-table-column>
    <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
    <el-table-column prop="questions" label="小题数" width="88" align="center" />
    <el-table-column label="AI 改写" width="116" align="center">
      <template #default="{ row }">
        <el-tag v-if="row.generated" size="small" type="success">有改写稿</el-tag>
        <span v-else class="group-status-empty">未改写</span>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="82">
      <template #default="{ row }">
        <el-button link type="primary" @click="$emit('open', row.id)">查看</el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script lang="ts">
export const categories = {
  writing: "写作",
  listening: "听力",
  reading: "阅读",
  translation: "翻译",
};
export type Category = keyof typeof categories;
export interface GroupRow {
  id: string;
  category: Category;
  paper?: string;
  title?: string;
  questions: number;
  generated: boolean;
}
</script>

<script setup lang="ts">
defineProps<{ rows: GroupRow[]; showSource?: boolean }>();
defineEmits<{ open: [id: string] }>();
</script>

<style scoped>
.cet-group-table {
  --el-table-header-bg-color: var(--el-fill-color-light);
}
.group-status-empty {
  color: var(--el-text-color-secondary);
}
</style>
