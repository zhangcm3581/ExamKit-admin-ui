<template>
  <el-dialog v-model="visible" :title="title" width="720px" destroy-on-close @closed="handleClosed">
    <div v-loading="loading" class="config-dialog-body">
      <!-- 默认比例 -->
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

      <!-- 固定价覆盖 -->
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

        <el-button type="primary" plain :icon="Plus" class="add-btn" @click="pickerVisible = true">
          添加固定价覆盖
        </el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>

    <SubjectPickerDialog
      v-model="pickerVisible"
      :subjects="subjects"
      :already-picked-ids="pickedIds"
      @confirm="onPickerConfirm"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { Delete, Plus } from "@element-plus/icons-vue";
import { AgentAdminAPI, type AgentPriceSaveRequest } from "@/api/agent-api";
import SubjectAPI, { type SubjectVO } from "@/api/exam/subject-api";
import SubjectPickerDialog from "./SubjectPickerDialog.vue";

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
const title = computed(() => (props.agentName ? `配置定价 - ${props.agentName}` : "配置定价"));

const loading = ref(false);
const saving = ref(false);
const pickerVisible = ref(false);

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

watch(
  () => props.modelValue,
  async (open) => {
    if (open && props.agentId != null) {
      await loadData(props.agentId);
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
}

function onPickerConfirm(ids: string[]) {
  const subjectById = new Map(subjects.value.map((s) => [s.id, s]));
  for (const id of ids) {
    const s = subjectById.get(id);
    overrides.push({
      subjectId: id,
      subjectName: s ? subjectLabel(s) : id,
      subjectNameEn: s?.nameZh && s?.nameEn ? s.nameEn : undefined,
      fixedPriceYuan: undefined,
    });
  }
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
</style>
