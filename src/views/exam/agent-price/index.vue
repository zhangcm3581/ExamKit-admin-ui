<template>
  <div class="app-container">
    <el-form inline :model="query">
      <el-form-item label="代理">
        <el-select v-model="query.agentId" clearable filterable style="width: 200px">
          <el-option
            v-for="a in agents"
            :key="a.id"
            :label="a.nickname || a.username"
            :value="a.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="科目">
        <el-select v-model="query.subjectId" clearable filterable style="width: 280px">
          <el-option v-for="s in subjects" :key="s.id" :label="s.nameZh" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
        <el-button type="success" @click="openSaveDialog()">新增配置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="rows" border>
      <el-table-column prop="agentName" label="代理" />
      <el-table-column prop="subjectName" label="科目" />
      <el-table-column prop="originalPriceYuan" label="原价(¥)" width="120" />
      <el-table-column prop="pricingType" label="定价方式" width="120">
        <template #default="{ row }">
          {{ row.pricingType === "PERCENT" ? "按比例" : "固定价" }}
        </template>
      </el-table-column>
      <el-table-column label="价格" width="180">
        <template #default="{ row }">
          <template v-if="row.pricingType === 'PERCENT'">
            {{ (row.discountBasisPoints / 100).toFixed(2) }}%
          </template>
          <template v-else>¥{{ row.fixedPriceCents / 100 }}</template>
        </template>
      </el-table-column>
      <el-table-column prop="agentUnitPriceYuan" label="代理单价(¥)" width="120" />
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button link type="primary" @click="openSaveDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="remove(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <pagination
      v-if="total > 0"
      v-model:page="query.pageNum"
      v-model:limit="query.pageSize"
      :total="total"
      @pagination="load"
    />

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑配置' : '新增配置'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="代理">
          <el-select v-model="form.agentId" filterable :disabled="!!form.id">
            <el-option
              v-for="a in agents"
              :key="a.id"
              :label="a.nickname || a.username"
              :value="a.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="科目">
          <el-select v-model="form.subjectId" filterable :disabled="!!form.id">
            <el-option v-for="s in subjects" :key="s.id" :label="s.nameZh" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="定价方式">
          <el-radio-group v-model="form.pricingType">
            <el-radio value="PERCENT">按比例</el-radio>
            <el-radio value="FIXED">固定价</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.pricingType === 'PERCENT'" label="比例(%)">
          <el-input-number v-model="percentValue" :min="1" :max="100" :step="0.01" :precision="2" />
          <span style="margin-left: 8px; color: #909399">系统默认 33.33%</span>
        </el-form-item>
        <el-form-item v-else label="固定价(元)">
          <el-input-number v-model="form.fixedPriceYuan" :min="1" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { AgentAdminAPI, type AgentPriceConfigVO } from "@/api/agent-api";
import SubjectAPI, { type SubjectVO } from "@/api/exam/subject-api";
import UserAPI from "@/api/system/user-api";

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  agentId: undefined as number | undefined,
  subjectId: "",
});
const rows = ref<AgentPriceConfigVO[]>([]);
const total = ref(0);
const agents = ref<any[]>([]);
const subjects = ref<SubjectVO[]>([]);

const dialogVisible = ref(false);
const form = reactive({
  id: undefined as number | undefined,
  agentId: undefined as number | undefined,
  subjectId: "",
  pricingType: "PERCENT" as "PERCENT" | "FIXED",
  discountBasisPoints: undefined as number | undefined,
  fixedPriceYuan: undefined as number | undefined,
});
const percentValue = computed({
  get: () => (form.discountBasisPoints != null ? form.discountBasisPoints / 100 : undefined),
  set: (v) => {
    form.discountBasisPoints = v != null ? Math.round(v * 100) : undefined;
  },
});

async function load() {
  const r = await AgentAdminAPI.pagePriceConfigs(query);
  rows.value = r.data;
  total.value = r.total;
}

async function loadAgents() {
  agents.value = await UserAPI.listByRoleCode("AGENT");
}
async function loadSubjects() {
  const res = await SubjectAPI.getPage({ pageNum: 1, pageSize: 1000 });
  subjects.value = res.data;
}

function openSaveDialog(row?: AgentPriceConfigVO) {
  if (row) {
    Object.assign(form, {
      id: row.id,
      agentId: row.agentId,
      subjectId: row.subjectId,
      pricingType: row.pricingType,
      discountBasisPoints: row.discountBasisPoints ?? undefined,
      fixedPriceYuan: row.fixedPriceCents != null ? row.fixedPriceCents / 100 : undefined,
    });
  } else {
    Object.assign(form, {
      id: undefined,
      agentId: undefined,
      subjectId: "",
      pricingType: "PERCENT",
      discountBasisPoints: 3333,
      fixedPriceYuan: undefined,
    });
  }
  dialogVisible.value = true;
}

async function submit() {
  if (!form.agentId || !form.subjectId) {
    ElMessage.warning("请选择代理和科目");
    return;
  }
  await AgentAdminAPI.savePriceConfig({
    agentId: form.agentId,
    subjectId: form.subjectId,
    pricingType: form.pricingType,
    discountBasisPoints: form.pricingType === "PERCENT" ? form.discountBasisPoints : undefined,
    fixedPriceYuan: form.pricingType === "FIXED" ? form.fixedPriceYuan : undefined,
  });
  ElMessage.success("已保存");
  dialogVisible.value = false;
  load();
}

async function remove(id: number) {
  await ElMessageBox.confirm("删除后该 (代理,科目) 将回退到默认 33.33%，是否确认？", "提示", {
    type: "warning",
  });
  await AgentAdminAPI.deletePriceConfig(id);
  ElMessage.success("已删除");
  load();
}

watch(
  () => form.pricingType,
  (t) => {
    if (t === "PERCENT" && !form.discountBasisPoints) form.discountBasisPoints = 3333;
  }
);

onMounted(() => {
  load();
  loadAgents();
  loadSubjects();
});
</script>
