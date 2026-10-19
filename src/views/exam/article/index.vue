<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input
            v-model="keywords"
            placeholder="搜索标题"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
          <span class="sort-hint">拖动行首图标调整顺序</span>
        </div>
        <el-button type="primary" @click="openCreate">写文章</el-button>
      </div>
      <el-table ref="tableRef" v-loading="loading" :data="rows" row-key="id" stripe>
        <el-table-column width="46" align="center">
          <template #default>
            <el-icon class="drag-handle" title="拖动排序"><Rank /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="title" min-width="220" show-overflow-tooltip />
        <el-table-column label="标签" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags || []" :key="tag" size="small" class="tag">
              {{ tag }}
            </el-tag>
            <span v-if="!row.tags?.length">--</span>
          </template>
        </el-table-column>
        <el-table-column label="置顶" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.pinned === 1" type="warning" size="small">置顶</el-tag>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180" align="center">
          <template #default="{ row }">{{ formatDateTime(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openPreview(row)">预览</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        @pagination="fetchData"
      />
    </el-card>

    <el-dialog
      v-model="visible"
      :title="form.id ? '编辑文章' : '写文章'"
      width="860px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" maxlength="200" />
        </el-form-item>
        <el-form-item label="封面">
          <div class="cover-row">
            <el-upload :show-file-list="false" accept="image/*" :http-request="uploadCover">
              <el-button>上传图片</el-button>
            </el-upload>
            <el-button v-if="form.coverUrl" link type="danger" @click="form.coverUrl = ''">
              移除
            </el-button>
          </div>
          <img v-if="form.coverUrl" :src="form.coverUrl" class="cover" alt="" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后回车，最多 8 个"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="正文" required>
          <WangEditor v-model="form.content" height="360px" placeholder="支持标题、正文和图片" />
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="pinned" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button @click="openPreview()">预览</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" title="预览" width="720px" append-to-body>
      <article class="preview">
        <h2 class="preview-title">{{ preview.title || "未填写标题" }}</h2>
        <div class="preview-meta">
          <el-tag v-if="preview.pinned === 1" type="warning" size="small">置顶</el-tag>
          <span v-if="preview.updateTime">{{ formatDateTime(preview.updateTime) }}</span>
        </div>
        <div v-if="preview.tags.length" class="preview-tags">
          <el-tag v-for="tag in preview.tags" :key="tag" size="small">{{ tag }}</el-tag>
        </div>
        <img v-if="preview.coverUrl" :src="preview.coverUrl" class="preview-cover" alt="" />
        <div v-if="hasBody(preview.content)" class="preview-content" v-html="preview.content"></div>
        <p v-else class="preview-empty">暂无正文</p>
      </article>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox, type UploadRequestOptions } from "element-plus";
import { Rank } from "@element-plus/icons-vue";
import Sortable from "sortablejs";
import ArticleAPI, { type ArticleForm, type ArticleVO } from "@/api/exam/article-api";
import FileManageAPI from "@/api/file-api";
import WangEditor from "@/components/WangEditor/index.vue";
import { formatDateTime } from "@/utils/datetime";

defineOptions({ name: "ArticleManage", inheritAttrs: false });

const loading = ref(false);
const saving = ref(false);
const visible = ref(false);
const previewVisible = ref(false);
const preview = reactive({
  title: "",
  coverUrl: "",
  content: "",
  tags: [] as string[],
  pinned: 0,
  updateTime: "",
});
const total = ref(0);
const keywords = ref("");
const rows = ref<ArticleVO[]>([]);
const tableRef = ref();
let sortable: Sortable | null = null;
const query = reactive({ pageNum: 1, pageSize: 10, keywords: "" });
const form = reactive<ArticleForm & { id?: number }>({
  title: "",
  coverUrl: "",
  content: "",
  tags: [],
  pinned: 0,
});

const pinned = computed({
  get: () => form.pinned === 1,
  set: (value: boolean) => {
    form.pinned = value ? 1 : 0;
  },
});

function fetchData() {
  loading.value = true;
  ArticleAPI.getPage(query)
    .then((data) => {
      rows.value = data.data;
      total.value = data.total;
    })
    .finally(() => {
      loading.value = false;
      nextTick(() => initSortable());
    });
}

function initSortable() {
  sortable?.destroy();
  const tbody = tableRef.value?.$el?.querySelector(".el-table__body-wrapper tbody");
  if (!tbody) return;
  sortable = Sortable.create(tbody, {
    handle: ".drag-handle",
    animation: 150,
    onEnd(evt) {
      const oldIndex = evt.oldIndex;
      const newIndex = evt.newIndex;
      if (oldIndex == null || newIndex == null || oldIndex === newIndex) return;
      const list = [...rows.value];
      const [moved] = list.splice(oldIndex, 1);
      if (!moved) return;
      list.splice(newIndex, 0, moved);
      rows.value = list;
      ArticleAPI.sort(list.map((item) => item.id)).catch(() => fetchData());
    },
  });
}

function handleSearch() {
  query.keywords = keywords.value;
  query.pageNum = 1;
  fetchData();
}

function resetForm() {
  form.id = undefined;
  form.title = "";
  form.coverUrl = "";
  form.content = "";
  form.tags = [];
  form.pinned = 0;
}

function openPreview(row?: ArticleVO) {
  if (row) {
    preview.title = row.title;
    preview.coverUrl = row.coverUrl || "";
    preview.content = row.content || "";
    preview.tags = row.tags ? [...row.tags] : [];
    preview.pinned = row.pinned || 0;
    preview.updateTime = row.updateTime || "";
  } else {
    preview.title = form.title;
    preview.coverUrl = form.coverUrl || "";
    preview.content = form.content || "";
    preview.tags = form.tags ? [...form.tags] : [];
    preview.pinned = form.pinned || 0;
    preview.updateTime = "";
  }
  previewVisible.value = true;
}

function openCreate() {
  resetForm();
  visible.value = true;
}

function openEdit(row: ArticleVO) {
  form.id = row.id;
  form.title = row.title;
  form.coverUrl = row.coverUrl || "";
  form.content = row.content || "";
  form.tags = row.tags ? [...row.tags] : [];
  form.pinned = row.pinned || 0;
  visible.value = true;
}

async function uploadCover(options: UploadRequestOptions) {
  const data = new FormData();
  data.append("file", options.file);
  const uploaded = await FileManageAPI.upload(data);
  form.coverUrl = uploaded.url;
}

function hasBody(html: string) {
  const plain = html
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, "")
    .trim();
  return plain.length > 0 || html.includes("<img");
}

async function submit() {
  if (!form.title.trim() || !hasBody(form.content || "")) {
    ElMessage.warning("请填写标题和正文");
    return;
  }
  const tags = form.tags || [];
  if (
    tags.length > 8 ||
    tags.some((tag) => tag.length > 20 || tag.includes(",") || tag.includes("，"))
  ) {
    ElMessage.warning("标签最多 8 个，每个不超过 20 字，且不能包含逗号");
    return;
  }
  saving.value = true;
  try {
    const payload: ArticleForm = {
      title: form.title.trim(),
      coverUrl: form.coverUrl || "",
      content: form.content,
      tags: form.tags,
      pinned: form.pinned,
    };
    if (form.id) await ArticleAPI.update(form.id, payload);
    else await ArticleAPI.create(payload);
    ElMessage.success("已保存");
    visible.value = false;
    fetchData();
  } finally {
    saving.value = false;
  }
}

function handleDelete(row: ArticleVO) {
  ElMessageBox.confirm(`删除「${row.title}」？`, "删除文章", { type: "warning" }).then(async () => {
    await ArticleAPI.remove(row.id);
    ElMessage.success("已删除");
    fetchData();
  });
}

onMounted(fetchData);
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
}
.sort-hint {
  font-size: 13px;
  color: #9ca3af;
}
.drag-handle {
  color: #9ca3af;
  cursor: grab;
}
.cover-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.cover {
  display: block;
  max-width: 240px;
  max-height: 140px;
  margin-top: 12px;
  object-fit: cover;
}
.tag {
  margin-right: 6px;
}
.preview-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.4;
  color: #111827;
}
.preview-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
  font-size: 13px;
  color: #9ca3af;
}
.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.preview-cover {
  display: block;
  width: 100%;
  max-height: 280px;
  margin-top: 16px;
  object-fit: cover;
  border-radius: 8px;
}
.preview-content {
  margin-top: 16px;
  font-size: 15px;
  line-height: 1.7;
  color: #1f2937;
}
.preview-content :deep(img) {
  max-width: 100%;
}
.preview-empty {
  margin-top: 16px;
  color: #9ca3af;
}
</style>
