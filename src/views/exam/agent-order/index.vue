<template>
  <div class="app-container">
    <el-form inline :model="query">
      <el-form-item label="代理">
        <el-select
          v-model="query.agentId"
          clearable
          filterable
          placeholder="全部"
          style="width: 200px"
        >
          <el-option
            v-for="a in agents"
            :key="a.id"
            :label="a.nickname || a.username"
            :value="a.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
          <el-option label="待支付" value="PENDING" />
          <el-option label="已支付" value="PAID" />
          <el-option label="已关闭" value="CLOSED" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table :data="rows" border>
      <el-table-column prop="orderNo" label="订单号" width="220" />
      <el-table-column prop="agentName" label="代理" />
      <el-table-column label="科目" min-width="240">
        <template #default="{ row }">
          <div class="subject-cell">
            <div class="zh">{{ row.subjectName || row.subjectNameEn || "—" }}</div>
            <div v-if="row.subjectName && row.subjectNameEn" class="en">
              {{ row.subjectNameEn }}
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="数量" width="80" />
      <el-table-column prop="unitPriceYuan" label="单价(¥)" width="100" />
      <el-table-column prop="totalYuan" label="总额(¥)" width="100" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="paidAt" label="支付时间" width="180" />
    </el-table>
    <pagination
      v-if="total > 0"
      v-model:page="query.pageNum"
      v-model:limit="query.pageSize"
      :total="total"
      @pagination="load"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { AgentAdminAPI, type AgentOrderVO } from "@/api/agent-api";
import UserAPI from "@/api/system/user-api";

const query = reactive({
  pageNum: 1,
  pageSize: 10,
  agentId: undefined as number | undefined,
  status: "",
});
const rows = ref<AgentOrderVO[]>([]);
const total = ref(0);
const agents = ref<any[]>([]);

async function load() {
  const r = await AgentAdminAPI.pageAgentOrders(query);
  rows.value = r.data;
  total.value = r.total;
}

async function loadAgents() {
  agents.value = await UserAPI.listByRoleCode("AGENT");
}

onMounted(() => {
  load();
  loadAgents();
});
</script>

<style scoped lang="scss">
.subject-cell {
  line-height: 1.4;

  .zh {
    color: var(--el-text-color-primary);
  }

  .en {
    margin-top: 2px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
