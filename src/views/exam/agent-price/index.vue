<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar">
        <el-form inline :model="query">
          <el-form-item label="代理">
            <el-select
              v-model="query.agentId"
              clearable
              filterable
              placeholder="全部代理"
              style="width: 220px"
              @change="handleSearch"
            >
              <el-option
                v-for="a in agents"
                :key="a.id"
                :label="a.nickname || a.username"
                :value="a.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table v-loading="loading" :data="rows" stripe>
        <el-table-column label="序号" type="index" width="60" align="center">
          <template #default="{ $index }">
            {{ (query.pageNum - 1) * query.pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="代理" min-width="220">
          <template #default="{ row }">
            <span>{{ row.agentName || `#${row.agentId}` }}</span>
          </template>
        </el-table-column>
        <el-table-column label="默认比例" width="160" align="center">
          <template #default="{ row }">
            <template v-if="row.discountBasisPoints != null">
              <span class="mono">{{ (row.discountBasisPoints / 100).toFixed(2) }}%</span>
            </template>
            <template v-else>
              <span class="mono muted" title="系统默认">
                33.33%
                <span class="asterisk">*</span>
              </span>
            </template>
          </template>
        </el-table-column>
        <el-table-column label="固定价覆盖" width="130" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.overrideCount > 0" type="warning" size="small" effect="plain">
              {{ row.overrideCount }} 个
            </el-tag>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180" align="center">
          <template #default="{ row }">
            <span v-if="row.updateTime" class="nowrap">{{ formatDateTime(row.updateTime) }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="primary" plain size="small" @click="openConfig(row)">配置</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="total > 0"
        v-model:total="total"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        @pagination="load"
      />
    </el-card>

    <AgentConfigDialog
      v-model="dialogVisible"
      :agent-id="dialogAgentId"
      :agent-name="dialogAgentName"
      @saved="load"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  AgentAdminAPI,
  type AgentPriceSummaryVO,
  type AgentPriceSummaryPageQuery,
} from "@/api/agent-api";
import UserAPI from "@/api/system/user-api";
import { formatDateTime } from "@/utils/datetime";
import AgentConfigDialog from "./AgentConfigDialog.vue";

const query = reactive<AgentPriceSummaryPageQuery>({
  pageNum: 1,
  pageSize: 10,
  agentId: undefined,
  keyword: "",
});
const rows = ref<AgentPriceSummaryVO[]>([]);
const total = ref(0);
const agents = ref<any[]>([]);
const loading = ref(false);

const dialogVisible = ref(false);
const dialogAgentId = ref<number | null>(null);
const dialogAgentName = ref("");

async function load() {
  loading.value = true;
  try {
    const r = await AgentAdminAPI.pageAgentPriceSummaries(query);
    rows.value = r.data;
    total.value = r.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.pageNum = 1;
  load();
}

function handleReset() {
  query.pageNum = 1;
  query.agentId = undefined;
  query.keyword = "";
  load();
}

async function loadAgents() {
  agents.value = await UserAPI.listByRoleCode("AGENT");
}

function openConfig(row: AgentPriceSummaryVO) {
  dialogAgentId.value = row.agentId;
  dialogAgentName.value = row.agentName ?? `#${row.agentId}`;
  dialogVisible.value = true;
}

onMounted(() => {
  load();
  loadAgents();
});
</script>

<style scoped lang="scss">
.toolbar {
  margin-bottom: 12px;
}

.mono {
  font-family: "SFMono-Regular", Menlo, Consolas, monospace;
  font-variant-numeric: tabular-nums;
}

.muted {
  color: var(--el-text-color-secondary);
}

.asterisk {
  margin-left: 2px;
  color: var(--el-color-warning);
}

.nowrap {
  display: inline-block;
  white-space: nowrap;
}
</style>
