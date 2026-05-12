<template>
  <div class="app-container agent-purchase">
    <el-row :gutter="16">
      <!-- 左：表单 -->
      <el-col :xs="24" :md="15" :lg="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="title">购买激活码</span>
              <span class="subtitle">先选提供商再选具体科目，扫码支付后系统自动生成激活码</span>
            </div>
          </template>
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="90px"
            @submit.prevent="submit"
          >
            <el-form-item label="提供商" prop="providerId">
              <el-select
                v-model="form.providerId"
                placeholder="请选择考试提供商"
                filterable
                style="width: 100%"
                @change="onProviderChange"
              >
                <el-option
                  v-for="p in providers"
                  :key="p.providerId"
                  :label="p.providerName"
                  :value="p.providerId"
                >
                  <span>{{ p.providerName }}</span>
                  <span class="provider-count">{{ p.count }} 个科目</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="科目" prop="subjectId">
              <el-select
                v-model="form.subjectId"
                :placeholder="form.providerId ? '搜索/选择题库科目' : '请先选择提供商'"
                :disabled="!form.providerId"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="s in filteredSubjects"
                  :key="s.subjectId"
                  :label="s.subjectName || s.subjectNameEn"
                  :value="s.subjectId"
                >
                  <div class="opt-info">
                    <div class="opt-name">{{ s.subjectName || s.subjectNameEn }}</div>
                    <div v-if="s.subjectName && s.subjectNameEn" class="opt-name-en">
                      {{ s.subjectNameEn }}
                    </div>
                  </div>
                  <span class="opt-price">
                    <span class="opt-original">¥{{ s.originalPriceYuan }}</span>
                    <span class="opt-agent">¥{{ s.agentUnitPriceYuan }}</span>
                  </span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="数量" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" :max="1000" />
              <span class="hint">每次最多 1000 个</span>
            </el-form-item>

            <el-form-item label="有效天数" prop="validDays">
              <el-input-number v-model="form.validDays" :min="30" :max="730" :step="30" />
              <span class="hint">激活后开始计算（30 ~ 730 天）</span>
            </el-form-item>

            <el-form-item label="备注">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="2"
                maxlength="255"
                show-word-limit
                placeholder="可选，给自己看的标记"
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="submitting"
                :disabled="!selectedSubject"
                @click="submit"
              >
                立即购买
                <template v-if="totalYuan">
                  <el-divider direction="vertical" />
                  ¥{{ totalYuan }}
                </template>
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右：订单摘要 -->
      <el-col :xs="24" :md="9" :lg="8">
        <el-card shadow="never" class="summary-card">
          <template #header>
            <span class="title">订单摘要</span>
          </template>

          <div v-if="!selectedSubject" class="empty">
            <el-icon class="empty-icon"><ShoppingCart /></el-icon>
            <p>请先选择提供商和科目</p>
          </div>

          <template v-else>
            <div class="summary-row block">
              <span class="label">提供商</span>
              <span class="value">{{ selectedSubject.providerName || "—" }}</span>
            </div>
            <div class="summary-row block">
              <span class="label">科目</span>
              <span class="value">
                <span class="subject-name">
                  {{ selectedSubject.subjectName || selectedSubject.subjectNameEn }}
                </span>
                <span
                  v-if="selectedSubject.subjectName && selectedSubject.subjectNameEn"
                  class="subject-name-en"
                >
                  {{ selectedSubject.subjectNameEn }}
                </span>
              </span>
            </div>
            <div class="summary-row">
              <span class="label">单价</span>
              <span class="value">
                <span class="strike">¥{{ selectedSubject.originalPriceYuan }}</span>
                <span class="now">¥{{ selectedSubject.agentUnitPriceYuan }}</span>
              </span>
            </div>
            <div class="summary-row">
              <span class="label">数量</span>
              <span class="value">× {{ form.quantity }}</span>
            </div>
            <div class="summary-row">
              <span class="label">有效期</span>
              <span class="value">{{ form.validDays }} 天</span>
            </div>

            <el-divider class="thin" />

            <div class="summary-row total">
              <span class="label">应付</span>
              <span class="value">¥{{ totalYuan }}</span>
            </div>

            <div class="meta">
              <el-tag size="small" type="success" effect="plain">折扣 {{ discountRate }}%</el-tag>
              <span class="saved">为你省 ¥{{ savedYuan }}</span>
            </div>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <!-- 微信扫码支付弹窗 -->
    <el-dialog
      v-model="payDialogVisible"
      title="微信扫码支付"
      width="380px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="qrcode-wrap">
        <img v-if="qrcodeDataUrl" :src="qrcodeDataUrl" alt="支付二维码" class="qrcode-img" />
        <p class="line">
          订单号
          <span class="mono">{{ payInfo?.orderNo }}</span>
        </p>
        <p class="line">
          金额
          <strong class="amount">¥{{ payInfo?.totalYuan }}</strong>
        </p>
        <p class="line">
          剩余时间
          <strong class="countdown">{{ countdownText }}</strong>
        </p>
        <p class="status-hint">{{ statusHint }}</p>
      </div>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, type FormRules } from "element-plus";
import { ShoppingCart } from "@element-plus/icons-vue";
import QRCode from "qrcode";
import AgentAPI, { type AgentSubjectOption, type AgentOrderCreateResponse } from "@/api/agent-api";

const router = useRouter();
const subjects = ref<AgentSubjectOption[]>([]);
const formRef = ref();
const form = reactive({
  providerId: undefined as number | undefined,
  subjectId: "",
  quantity: 10,
  validDays: 365,
  remark: "",
});
const rules: FormRules = {
  providerId: [{ required: true, message: "请选择提供商", trigger: "change" }],
  subjectId: [{ required: true, message: "请选择科目", trigger: "change" }],
  quantity: [{ required: true, type: "number", message: "请填写数量", trigger: "blur" }],
  validDays: [{ required: true, type: "number", message: "请填写有效天数", trigger: "blur" }],
};

// 从 subjects 推导提供商列表（含每个提供商的科目数）
interface ProviderOption {
  providerId: number;
  providerName: string;
  count: number;
}
const providers = computed<ProviderOption[]>(() => {
  const acc = new Map<number, ProviderOption>();
  for (const s of subjects.value) {
    if (s.providerId == null) continue;
    const cur = acc.get(s.providerId);
    if (cur) {
      cur.count += 1;
    } else {
      acc.set(s.providerId, {
        providerId: s.providerId,
        providerName: s.providerName || `#${s.providerId}`,
        count: 1,
      });
    }
  }
  // 保留后端返回顺序（已按 provider.sort_order 排好）
  return Array.from(acc.values());
});

const filteredSubjects = computed(() =>
  form.providerId == null ? [] : subjects.value.filter((s) => s.providerId === form.providerId)
);

const selectedSubject = computed(() => subjects.value.find((s) => s.subjectId === form.subjectId));
const totalYuan = computed(() =>
  selectedSubject.value ? selectedSubject.value.agentUnitPriceYuan * form.quantity : 0
);
const savedYuan = computed(() =>
  selectedSubject.value
    ? (selectedSubject.value.originalPriceYuan - selectedSubject.value.agentUnitPriceYuan) *
      form.quantity
    : 0
);
const discountRate = computed(() => {
  if (!selectedSubject.value || !selectedSubject.value.originalPriceYuan) return 0;
  const rate =
    (selectedSubject.value.agentUnitPriceYuan / selectedSubject.value.originalPriceYuan) * 100;
  return Math.round(rate * 100) / 100;
});

function onProviderChange() {
  // 切换提供商时清空已选科目
  form.subjectId = "";
}

const submitting = ref(false);
const payDialogVisible = ref(false);
const payInfo = ref<AgentOrderCreateResponse | null>(null);
const qrcodeDataUrl = ref<string>("");
const countdownSec = ref(0);
const statusHint = ref("等待扫码支付...");
let pollTimer: number | null = null;
let countdownTimer: number | null = null;

const countdownText = computed(() => {
  const m = Math.floor(countdownSec.value / 60)
    .toString()
    .padStart(2, "0");
  const s = (countdownSec.value % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
});

onMounted(async () => {
  subjects.value = await AgentAPI.listSubjects();
});

onUnmounted(() => {
  stopTimers();
});

async function submit() {
  await formRef.value.validate();
  submitting.value = true;
  try {
    const resp = await AgentAPI.createOrder({
      subjectId: form.subjectId,
      quantity: form.quantity,
      validDays: form.validDays,
      remark: form.remark,
    });
    try {
      qrcodeDataUrl.value = await QRCode.toDataURL(resp.codeUrl, { width: 240 });
    } catch (qrErr) {
      console.error("QR render failed", qrErr);
      ElMessage.error("二维码生成失败，请重试");
      return;
    }
    payInfo.value = resp;
    payDialogVisible.value = true;
    statusHint.value = "等待扫码支付...";
    startCountdown(new Date(resp.expiresAt).getTime());
    startPolling(resp.orderNo);
  } catch (e: any) {
    ElMessage.error(e?.message || "创建订单失败");
  } finally {
    submitting.value = false;
  }
}

function startCountdown(expiresAtMs: number) {
  countdownSec.value = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
  countdownTimer = window.setInterval(() => {
    countdownSec.value -= 1;
    if (countdownSec.value <= 0) {
      stopTimers();
      statusHint.value = "订单已超时，请重新下单";
    }
  }, 1000);
}

function startPolling(orderNo: string) {
  let consecutiveErrors = 0;
  pollTimer = window.setInterval(async () => {
    try {
      const status = await AgentAPI.getOrderStatus(orderNo);
      consecutiveErrors = 0;
      if (status.status === "PAID") {
        stopTimers();
        payDialogVisible.value = false;
        ElMessage.success(`购买成功，已生成 ${status.generatedCount ?? form.quantity} 个激活码`);
        router.push("/agent/orders");
      } else if (status.status === "CLOSED") {
        stopTimers();
        statusHint.value = "订单已关闭";
      }
    } catch (e) {
      consecutiveErrors += 1;
      console.warn("订单状态查询失败", consecutiveErrors, e);
      if (consecutiveErrors >= 5) {
        stopTimers();
        statusHint.value = "状态查询失败，请刷新页面或稍后到「我的订单」页查看";
      }
    }
  }, 2000);
}

function stopTimers() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

async function closeDialog() {
  await ElMessageBox.confirm("确定取消支付？订单将在超时后自动关闭。", "提示", { type: "warning" });
  stopTimers();
  qrcodeDataUrl.value = "";
  payDialogVisible.value = false;
}
</script>

<style scoped lang="scss">
.agent-purchase {
  .card-header {
    display: flex;
    gap: 12px;
    align-items: baseline;

    .title {
      font-size: 16px;
      font-weight: 600;
    }

    .subtitle {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .hint {
    margin-left: 12px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  /* 摘要卡 */
  .summary-card {
    position: sticky;
    top: 16px;

    .title {
      font-size: 15px;
      font-weight: 600;
    }

    .empty {
      padding: 32px 0;
      color: var(--el-text-color-placeholder);
      text-align: center;

      .empty-icon {
        font-size: 36px;
        color: var(--el-color-info-light-5);
      }

      p {
        margin: 8px 0 0;
        font-size: 13px;
      }
    }

    .summary-row {
      display: flex;
      gap: 12px;
      align-items: baseline;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;

      .label {
        flex-shrink: 0;
        color: var(--el-text-color-secondary);
      }

      .value {
        max-width: 70%;
        color: var(--el-text-color-primary);
        text-align: right;
        overflow-wrap: anywhere;
      }

      &.block {
        /* 提供商/科目 行允许换行，避免长名被截断 */
        .value {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: flex-end;
          line-height: 1.4;
        }

        .subject-name {
          font-weight: 500;
        }

        .subject-name-en {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      .strike {
        margin-right: 6px;
        color: var(--el-text-color-placeholder);
        text-decoration: line-through;
      }

      .now {
        font-weight: 600;
        color: var(--el-color-danger);
      }

      &.total {
        padding: 12px 0 4px;

        .label {
          font-size: 14px;
          color: var(--el-text-color-primary);
        }

        .value {
          font-size: 22px;
          font-weight: 700;
          color: var(--el-color-danger);
        }
      }
    }

    .thin {
      margin: 8px 0;
    }

    .meta {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-top: 8px;

      .saved {
        font-size: 12px;
        color: var(--el-color-success);
      }
    }
  }

  /* 支付弹窗 */
  .qrcode-wrap {
    text-align: center;

    .qrcode-img {
      width: 240px;
      height: 240px;
      margin-bottom: 8px;
    }

    .line {
      margin: 4px 0;
      font-size: 13px;
      color: var(--el-text-color-secondary);

      .mono {
        font-family: "SFMono-Regular", Menlo, monospace;
        font-size: 12px;
        color: var(--el-text-color-primary);
      }

      .amount {
        font-size: 18px;
        color: var(--el-color-danger);
      }

      .countdown {
        color: var(--el-color-warning);
      }
    }

    .status-hint {
      margin-top: 8px;
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
}
</style>

<!--
  全局样式：下拉选项内部布局。
  el-select 的 popper 会被 Teleport 到 body，无法用 <style scoped> 命中，
  所以这部分必须放在非 scoped 的 style 块里。
-->
<style lang="scss">
.el-select-dropdown__item {
  /* 含 .opt-price 的选项：左侧科目信息（可两行），右侧价格 */
  &:has(.opt-price) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: auto;
    min-height: 34px;
    padding-top: 6px;
    padding-bottom: 6px;
    line-height: 1.3;
  }

  .opt-info {
    flex: 1 1 auto;
    min-width: 0;
    padding-right: 12px;
  }

  .opt-name {
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }

  .opt-name-en {
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  .opt-price {
    display: inline-flex;
    flex-shrink: 0;
    gap: 8px;
    align-items: baseline;
    font-size: 12px;
    line-height: 1;

    .opt-original {
      color: var(--el-text-color-placeholder);
      text-decoration: line-through;
    }

    .opt-agent {
      font-weight: 600;
      color: var(--el-color-danger);
    }
  }

  .provider-count {
    margin-left: 8px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
