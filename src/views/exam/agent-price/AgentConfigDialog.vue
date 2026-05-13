<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="720px"
    destroy-on-close
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="config-dialog-body">
      <!-- ========== 主视图：默认比例 + 已加覆盖列表 ========== -->
      <div v-if="view === 'main'">
        <div class="section">
          <div class="section-title">默认比例</div>
          <div class="ratio-row">
            <el-input-number
              v-model="ratioPercent"
              :min="0.01"
              :max="100"
              :step="0.01"
              :precision="2"
              controls-position="right"
              style="width: 200px"
            />
            <span class="suffix">%</span>
            <span class="tip">系统默认 33.33%</span>
          </div>
        </div>

        <el-divider />

        <div class="section">
          <div class="section-title">
            <span>固定价覆盖</span>
            <span class="muted">（固定价优先于默认比例）</span>
          </div>

          <div v-if="overrides.length" class="overrides-table">
            <div class="overrides-header">
              <div class="col-subject">科目</div>
              <div class="col-price">价格(元)</div>
              <div class="col-action">操作</div>
            </div>
            <div v-for="(row, idx) in overrides" :key="row.subjectId" class="overrides-row">
              <div class="col-subject">
                <span class="subject-zh">{{ row.subjectName }}</span>
                <span v-if="row.subjectNameEn" class="subject-en">{{ row.subjectNameEn }}</span>
              </div>
              <div class="col-price">
                <el-input-number
                  v-model="row.fixedPriceYuan"
                  :min="1"
                  :step="1"
                  :precision="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </div>
              <div class="col-action">
                <el-icon class="del-icon" @click="removeOverride(idx)">
                  <Delete />
                </el-icon>
              </div>
            </div>
          </div>

          <el-button type="primary" plain :icon="Plus" class="add-btn" @click="openPicker">
            添加固定价覆盖
          </el-button>
        </div>
      </div>

      <!-- ========== 选科目视图 ========== -->
      <div v-else class="picker-view">
        <div class="picker-toolbar">
          <el-input
            v-model="pickerKeyword"
            placeholder="搜索科目名 / 提供商"
            clearable
            :prefix-icon="Search"
          />
          <span class="count-hint">
            <template v-if="pickerSelected.size > 0">
              本次将加入
              <b>{{ pickerSelected.size }}</b>
              个
            </template>
            <template v-else>未选择</template>
          </span>
        </div>

        <div class="picker-body">
          <div v-for="group in filteredGroups" :key="group.providerId" class="provider-group">
            <div class="group-header" @click="toggleGroupCollapse(group.providerId)">
              <el-icon class="caret">
                <CaretRight v-if="pickerCollapsed.has(group.providerId)" />
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
            <div v-if="!pickerCollapsed.has(group.providerId)" class="group-rows">
              <div
                v-for="s in group.subjects"
                :key="s.id"
                class="subject-row"
                :class="{ active: pickerSelected.has(s.id) }"
                @click="toggleSubject(s.id)"
              >
                <span @click.stop>
                  <el-checkbox
                    :model-value="pickerSelected.has(s.id)"
                    @change="toggleSubject(s.id)"
                  />
                </span>
                <div class="subject-name">
                  <div class="zh">{{ subjectLabel(s) }}</div>
                  <div v-if="s.nameZh && s.nameEn" class="en">{{ s.nameEn }}</div>
                </div>
                <div class="subject-price">¥{{ s.price / 100 }}</div>
              </div>
            </div>
          </div>

          <el-empty v-if="filteredGroups.length === 0" :description="emptyHint" :image-size="64" />
        </div>
      </div>
    </div>

    <template #footer>
      <template v-if="view === 'main'">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
      <template v-else>
        <div class="picker-footer">
          <span v-if="pickedIds.length > 0" class="footer-hint">
            已加入 {{ pickedIds.length }} 个，不在列表中显示
          </span>
          <span class="footer-buttons">
            <el-button :icon="ArrowLeft" @click="cancelPicker">返回</el-button>
            <el-button type="primary" :disabled="pickerSelected.size === 0" @click="confirmPicker">
              加入 {{ pickerSelected.size }} 个科目
            </el-button>
          </span>
        </div>
      </template>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { ArrowLeft, CaretBottom, CaretRight, Delete, Plus, Search } from "@element-plus/icons-vue";
import { AgentAdminAPI, type AgentPriceSaveRequest } from "@/api/agent-api";
import SubjectAPI, { type SubjectVO } from "@/api/exam/subject-api";

interface Props {
  modelValue: boolean;
  agentId: number | null;
  agentName: string;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "saved"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const view = ref<"main" | "picker">("main");

const dialogTitle = computed(() => {
  const base = props.agentName ? `配置定价 - ${props.agentName}` : "配置定价";
  return view.value === "picker" ? `${base} / 选择要覆盖的科目` : base;
});

const loading = ref(false);
const saving = ref(false);

const ratioPercent = ref(33.33);

interface OverrideRow {
  subjectId: string;
  subjectName: string;
  subjectNameEn?: string;
  fixedPriceYuan: number | undefined;
}
const overrides = reactive<OverrideRow[]>([]);
const subjects = ref<SubjectVO[]>([]);

const pickedIds = computed(() => overrides.map((o) => o.subjectId));

// ========== picker 状态 ==========
const pickerKeyword = ref("");
const pickerSelected = reactive(new Set<string>());
const pickerCollapsed = reactive(new Set<number>());

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      view.value = "main";
      if (props.agentId != null) {
        await loadData(props.agentId);
      }
    }
  }
);

function subjectLabel(s: SubjectVO): string {
  return s.nameZh && s.nameZh.length ? s.nameZh : (s.nameEn ?? s.id);
}

async function loadData(agentId: number) {
  loading.value = true;
  try {
    if (subjects.value.length === 0) {
      const res = await SubjectAPI.getPage({ pageNum: 1, pageSize: 1000 });
      subjects.value = res.data;
    }
    const subjectById = new Map(subjects.value.map((s) => [s.id, s]));
    const detail = await AgentAdminAPI.getAgentPriceConfig(agentId);
    ratioPercent.value =
      detail.discountBasisPoints != null ? detail.discountBasisPoints / 100 : 33.33;
    overrides.splice(0, overrides.length);
    detail.overrides.forEach((o) => {
      const s = subjectById.get(o.subjectId);
      overrides.push({
        subjectId: o.subjectId,
        subjectName: o.subjectName ?? (s ? subjectLabel(s) : o.subjectId),
        subjectNameEn: s?.nameZh && s?.nameEn ? s.nameEn : undefined,
        fixedPriceYuan: Math.round(o.fixedPriceCents / 100),
      });
    });
  } finally {
    loading.value = false;
  }
}

function handleClosed() {
  overrides.splice(0, overrides.length);
  ratioPercent.value = 33.33;
  view.value = "main";
  pickerKeyword.value = "";
  pickerSelected.clear();
  pickerCollapsed.clear();
}

function removeOverride(idx: number) {
  overrides.splice(idx, 1);
}

async function submit() {
  if (props.agentId == null) return;
  if (ratioPercent.value == null) {
    ElMessage.warning("请输入默认比例");
    return;
  }
  for (const [i, row] of overrides.entries()) {
    if (row.fixedPriceYuan == null || row.fixedPriceYuan < 1) {
      ElMessage.warning(`第 ${i + 1} 行（${row.subjectName}）价格必须 ≥ 1`);
      return;
    }
  }

  const payload: AgentPriceSaveRequest = {
    discountBasisPoints: Math.round(ratioPercent.value * 100),
    overrides: overrides.map((o) => ({
      subjectId: o.subjectId,
      fixedPriceYuan: o.fixedPriceYuan as number,
    })),
  };
  saving.value = true;
  try {
    await AgentAdminAPI.saveAgentPriceConfig(props.agentId, payload);
    ElMessage.success("已保存");
    emit("saved");
    visible.value = false;
  } finally {
    saving.value = false;
  }
}

// ========== picker 行为 ==========
function openPicker() {
  pickerKeyword.value = "";
  pickerSelected.clear();
  pickerCollapsed.clear();
  view.value = "picker";
}

function cancelPicker() {
  view.value = "main";
}

function confirmPicker() {
  if (pickerSelected.size === 0) return;
  const subjectById = new Map(subjects.value.map((s) => [s.id, s]));
  for (const id of pickerSelected) {
    const s = subjectById.get(id);
    overrides.push({
      subjectId: id,
      subjectName: s ? subjectLabel(s) : id,
      subjectNameEn: s?.nameZh && s?.nameEn ? s.nameEn : undefined,
      fixedPriceYuan: undefined,
    });
  }
  view.value = "main";
}

interface Group {
  providerId: number;
  providerName: string;
  subjects: SubjectVO[];
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
  const taken = new Set(pickedIds.value);
  const pickable = subjects.value.filter(
    (s) => !taken.has(s.id) && matches(s, pickerKeyword.value.trim())
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

const emptyHint = computed(() => (pickerKeyword.value ? "没有匹配的科目" : "所有科目都已加入"));

function groupSelectedCount(g: Group) {
  let n = 0;
  for (const s of g.subjects) {
    if (pickerSelected.has(s.id)) n++;
  }
  return n;
}
function groupAllSelected(g: Group) {
  return g.subjects.length > 0 && g.subjects.every((s) => pickerSelected.has(s.id));
}
function groupIndeterminate(g: Group) {
  const some = g.subjects.some((s) => pickerSelected.has(s.id));
  return some && !groupAllSelected(g);
}
function toggleGroupAll(g: Group, check: boolean) {
  for (const s of g.subjects) {
    if (check) pickerSelected.add(s.id);
    else pickerSelected.delete(s.id);
  }
}
function toggleGroupCollapse(pid: number) {
  if (pickerCollapsed.has(pid)) pickerCollapsed.delete(pid);
  else pickerCollapsed.add(pid);
}
function toggleSubject(id: string) {
  if (pickerSelected.has(id)) pickerSelected.delete(id);
  else pickerSelected.add(id);
}
</script>

<style scoped lang="scss">
.config-dialog-body {
  padding: 4px 4px 0;
}

.section {
  .section-title {
    margin-bottom: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .muted {
      margin-left: 6px;
      font-size: 12px;
      font-weight: 400;
      color: var(--el-text-color-secondary);
    }
  }
}

.ratio-row {
  display: flex;
  gap: 8px;
  align-items: center;

  .suffix {
    color: var(--el-text-color-regular);
  }

  .tip {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.overrides-table {
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  .overrides-header,
  .overrides-row {
    display: grid;
    grid-template-columns: 1fr 160px 56px;
    gap: 12px;
    align-items: center;
    padding: 10px 14px;
  }

  .overrides-header {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
  }

  .overrides-row {
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .col-subject {
    overflow: hidden;
    line-height: 1.35;

    .subject-zh {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--el-text-color-primary);
      white-space: nowrap;
    }

    .subject-en {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
    }
  }

  .col-action {
    text-align: center;
  }

  .del-icon {
    font-size: 16px;
    color: var(--el-color-danger);
    cursor: pointer;
  }
}

.add-btn {
  width: 100%;
}

/* ========== picker view ========== */
.picker-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.picker-toolbar {
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  align-items: center;

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
  max-height: 460px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
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

.picker-footer {
  display: flex;
  align-items: center;
  width: 100%;

  .footer-hint {
    flex: 1;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-align: left;
  }

  .footer-buttons {
    display: inline-flex;
    gap: 8px;
  }
}
</style>
