<!-- 我的题库 -->
<template>
  <div class="app-container">
    <el-card shadow="never" class="question-bank-card">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary">上传题库</el-button>
          <!--          <el-button type="warning">人工导题</el-button>-->
          <el-button>下载模板</el-button>
          <el-button @click="handleNewFolder">新建文件夹</el-button>
          <el-button v-if="currentFolder" @click="handleBackToRoot">
            <el-icon><ArrowLeft /></el-icon>
            返回上级
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-input
            v-model="queryParams.keywords"
            placeholder="输入您想搜索的题库名称"
            clearable
            style="width: 220px"
            @keyup.enter="handleQuery"
          >
            <template #suffix>
              <el-icon class="search-icon" @click="handleQuery"><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 表格 -->
      <el-table
        v-if="tableData.length > 0"
        v-loading="loading"
        :data="tableData"
        class="bank-table"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="编号" type="index" width="70" align="center" />
        <el-table-column label="名称" min-width="200">
          <template #default="scope">
            <div class="name-cell">
              <!-- 文件夹(Provider) -->
              <template v-if="scope.row.isFolder">
                <el-image
                  v-if="scope.row.logo"
                  :src="scope.row.logo"
                  fit="contain"
                  class="provider-logo"
                />
                <img v-else :src="folderIcon" alt="文件夹" class="folder-icon-img" />
                <span class="name-text">{{ scope.row.folderName }}</span>
              </template>
              <!-- 题库(Subject) -->
              <template v-else>
                <img :src="examIcon" alt="题库" class="subject-icon-img" />
                <span class="name-text">{{ scope.row.nameZh || scope.row.folderName }}</span>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="添加时间" width="180" align="center">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="题目数量" width="150" align="center">
          <template #default="scope">
            {{ scope.row.isFolder ? "--" : scope.row.totalQuestions || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="left">
          <template #default="scope">
            <div class="action-buttons">
              <!-- 文件夹操作 -->
              <template v-if="scope.row.isFolder">
                <el-button type="primary" link @click="handleSetCover(scope.row)">
                  设置封面
                </el-button>
                <el-button type="primary" link @click="handleViewFolder(scope.row)">查看</el-button>
                <el-button type="primary" link @click="handleEditFolder(scope.row)">编辑</el-button>
                <el-button type="danger" link @click="handleDeleteFolder(scope.row)">
                  删除
                </el-button>
              </template>
              <!-- 题库操作 -->
              <template v-else>
                <el-button type="primary" link @click="handleAddQuestion(scope.row)">
                  添加试题
                </el-button>
                <el-button type="primary" link @click="handleManageQuestion(scope.row)">
                  试题管理
                </el-button>
                <el-button type="primary" link @click="handlePractice(scope.row)">练习</el-button>
                <el-dropdown
                  trigger="click"
                  @command="(cmd: string) => handleRowMoreAction(cmd, scope.row)"
                >
                  <el-button type="primary" link>
                    更多
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="move">移动</el-dropdown-item>
                      <el-dropdown-item command="export">导出</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <img :src="examIcon" alt="没有题库" class="empty-icon" />
        <h3 class="empty-title">没有题库</h3>
        <p class="empty-tip">您可以上传自己的题库,进行练习</p>
        <el-button v-if="currentFolder" type="primary" plain @click="handleBackToRoot">
          返回上级
        </el-button>
      </div>

      <!-- 分页 (只在根目录显示) -->
      <div v-if="tableData.length > 0 && !currentFolder" class="pagination-wrapper">
        <span class="total-text">共 {{ total }} 条</span>
        <el-select v-model="queryParams.pageSize" style="width: 100px" @change="handleQuery">
          <el-option label="10条/页" :value="10" />
          <el-option label="20条/页" :value="20" />
          <el-option label="50条/页" :value="50" />
        </el-select>
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchData"
        />
        <span class="goto-text">前往</span>
        <el-input v-model="gotoPage" style="width: 50px" @keyup.enter="handleGotoPage" />
        <span class="goto-text">页</span>
      </div>
    </el-card>

    <!-- 新建文件夹弹窗 -->
    <el-dialog v-model="folderDialog.visible" :title="folderDialog.title" width="500px">
      <el-form ref="folderFormRef" :model="folderForm" :rules="folderRules" label-width="110px">
        <el-form-item label="文件夹名称" prop="folderName">
          <el-input v-model="folderForm.folderName" placeholder="请输入文件夹名称(管理后台显示)" />
        </el-form-item>
        <el-form-item label="前端显示名称" prop="displayName">
          <el-input
            v-model="folderForm.displayName"
            placeholder="请输入前端显示名称(用户界面显示)"
          />
        </el-form-item>
        <el-form-item label="封面Logo">
          <ImagePicker v-model="folderForm.logo" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="folderForm.sortOrder" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="folderForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitFolder">确定</el-button>
      </template>
    </el-dialog>

    <!-- 移动至弹窗 -->
    <el-dialog v-model="moveDialog.visible" title="移动至" width="400px">
      <el-form label-width="80px">
        <el-form-item label="目标位置">
          <el-select v-model="moveDialog.targetProviderId" placeholder="请选择" style="width: 100%">
            <el-option label="无" :value="-1" />
            <el-option
              v-for="item in providerOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moveDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmMove">确定</el-button>
      </template>
    </el-dialog>

    <!-- 设置封面弹窗 -->
    <el-dialog v-model="coverDialog.visible" title="设置封面" width="400px">
      <div class="cover-picker-wrapper">
        <ImagePicker v-model="coverDialog.logo" :width="200" :height="150" />
      </div>
      <template #footer>
        <el-button @click="coverDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmCover">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowLeft, Search } from "@element-plus/icons-vue";
import ProviderAPI, {
  type ProviderPageQuery,
  type ProviderVO,
  type ProviderForm,
  type ProviderOptionVO,
} from "@/api/exam/provider-api";
import SubjectAPI, { type SubjectVO } from "@/api/exam/subject-api";
import ImagePicker from "@/components/ImagePicker/index.vue";
import { formatDateTime } from "@/utils/datetime";
import { useRoute, useRouter } from "vue-router";

const examIcon = "/exam.png";
const folderIcon = "/folder.png";

const route = useRoute();
const router = useRouter();

defineOptions({
  name: "QuestionBank",
  inheritAttrs: false,
});

// 表格数据类型
interface TableRow {
  id: number | string;
  isFolder: boolean;
  folderName?: string;
  displayName?: string;
  nameZh?: string;
  logo?: string;
  totalQuestions?: number;
  createTime: string;
  sortOrder?: number;
  status?: number;
  providerId?: number;
  isTop?: boolean;
}

const loading = ref(false);
const total = ref(0);
const gotoPage = ref("");
const selectedRows = ref<TableRow[]>([]);

const queryParams = reactive<ProviderPageQuery>({
  pageNum: 1,
  pageSize: 10,
});

const tableData = ref<TableRow[]>([]);
const providerOptions = ref<ProviderOptionVO[]>([]);

// 当前所在文件夹
const currentFolder = ref<{ id: number; folderName: string } | null>(null);

// 文件夹弹窗
const folderFormRef = ref();
const folderDialog = reactive({
  visible: false,
  title: "新建文件夹",
  editId: null as number | null,
});
const folderForm = reactive<ProviderForm>({
  sortOrder: 0,
  status: 1,
});
const folderRules = {
  folderName: [{ required: true, message: "请输入文件夹名称", trigger: "blur" }],
  displayName: [{ required: true, message: "请输入前端显示名称", trigger: "blur" }],
};

// 移动弹窗
const moveDialog = reactive({
  visible: false,
  targetProviderId: -1 as number,
  subjectId: "" as string,
});

// 设置封面弹窗
const coverDialog = reactive({
  visible: false,
  logo: "",
  itemId: null as number | string | null,
  isFolder: false,
});

// 加载供应商选项
function loadProviderOptions() {
  ProviderAPI.getOptions().then((data) => {
    providerOptions.value = data || [];
  });
}

// 获取数据 - 根据当前文件夹状态获取不同数据
async function fetchData() {
  loading.value = true;
  try {
    // 如果在文件夹内，只显示该文件夹下的题库(不分页，全部列出)
    if (currentFolder.value) {
      const subjectRes = await SubjectAPI.getPage({
        pageNum: 1,
        pageSize: 9999,
        keywords: queryParams.keywords,
        providerId: currentFolder.value.id,
      });
      tableData.value = (subjectRes.data || []).map((s: SubjectVO) => ({
        id: s.id,
        isFolder: false,
        nameZh: s.nameZh,
        totalQuestions: s.totalQuestions,
        createTime: s.createTime,
        sortOrder: s.sortOrder,
        status: s.status,
        providerId: s.providerId,
      }));
      total.value = subjectRes.total || 0;
    } else {
      // 根目录：显示文件夹和未分类的题库
      const providerRes = await ProviderAPI.getPage(queryParams);
      const providers: TableRow[] = (providerRes.data || []).map((p: ProviderVO) => ({
        id: p.id,
        isFolder: true,
        folderName: p.folderName,
        displayName: p.displayName,
        logo: p.logo,
        createTime: p.createTime,
        sortOrder: p.sortOrder,
        status: p.status,
      }));

      // 获取未分类的题库(没有关联Provider的)
      const subjectRes = await SubjectAPI.getPage({
        pageNum: 1,
        pageSize: 100,
        keywords: queryParams.keywords,
      });
      const subjects: TableRow[] = (subjectRes.data || [])
        .filter((s: SubjectVO) => !s.providerId)
        .map((s: SubjectVO) => ({
          id: s.id,
          isFolder: false,
          nameZh: s.nameZh,
          totalQuestions: s.totalQuestions,
          createTime: s.createTime,
          sortOrder: s.sortOrder,
          status: s.status,
          providerId: s.providerId,
        }));

      tableData.value = [...providers, ...subjects];
      total.value = providers.length + subjects.length;
    }
  } finally {
    loading.value = false;
  }
}

// 查询
function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

// 行点击 - 进入文件夹
function handleRowClick(row: TableRow) {
  if (row.isFolder) {
    router.push({
      path: route.path,
      query: { folderId: String(row.id), folderName: row.folderName || "" },
    });
  }
}

// 返回上级
function handleBackToRoot() {
  router.push({ path: route.path });
}

// 跳转页码
function handleGotoPage() {
  const page = parseInt(gotoPage.value);
  if (page > 0) {
    queryParams.pageNum = page;
    fetchData();
  }
  gotoPage.value = "";
}

// 行选择
function handleSelectionChange(selection: TableRow[]) {
  selectedRows.value = selection;
}

// 新建文件夹
function handleNewFolder() {
  folderDialog.visible = true;
  folderDialog.title = "新建文件夹";
  folderDialog.editId = null;
  resetFolderForm();
}

// 行更多操作
function handleRowMoreAction(command: string, row: TableRow) {
  switch (command) {
    case "setCover":
      handleSetCover(row);
      break;
    case "toggleTop":
      ElMessage.info("置顶功能开发中");
      break;
    case "rename":
      ElMessage.info("重命名功能开发中");
      break;
    case "move":
      moveDialog.visible = true;
      moveDialog.subjectId = row.id as string;
      moveDialog.targetProviderId = row.providerId || -1;
      break;
    case "export":
      ElMessage.info("导出功能开发中");
      break;
    case "password":
      ElMessage.info("密码设置功能开发中");
      break;
    case "customType":
      ElMessage.info("自定义题型功能开发中");
      break;
    case "editChapter":
      ElMessage.info("编辑章节功能开发中");
      break;
    case "examTemplate":
      ElMessage.info("配置模拟考试模板功能开发中");
      break;
    case "delete":
      handleDeleteSubject(row);
      break;
  }
}

// 设置封面
function handleSetCover(row: TableRow) {
  coverDialog.visible = true;
  coverDialog.itemId = row.id;
  coverDialog.isFolder = row.isFolder;
  coverDialog.logo = row.logo || "";
}

// 确认设置封面
function handleConfirmCover() {
  if (coverDialog.isFolder && coverDialog.itemId) {
    ProviderAPI.update(coverDialog.itemId as number, { logo: coverDialog.logo }).then(() => {
      ElMessage.success("封面设置成功");
      coverDialog.visible = false;
      fetchData();
    });
  } else {
    ElMessage.info("题库封面设置功能开发中");
    coverDialog.visible = false;
  }
}

// 查看文件夹
function handleViewFolder(row: TableRow) {
  currentFolder.value = {
    id: row.id as number,
    folderName: row.folderName || "",
  };
  queryParams.pageNum = 1;
  fetchData();
}

// 编辑文件夹
function handleEditFolder(row: TableRow) {
  folderDialog.visible = true;
  folderDialog.title = "编辑文件夹";
  folderDialog.editId = row.id as number;
  ProviderAPI.getFormData(row.id as number).then((data) => {
    Object.assign(folderForm, data);
  });
}

// 删除文件夹
function handleDeleteFolder(row: TableRow) {
  ElMessageBox.confirm(`确认删除文件夹 "${row.folderName}"?`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    ProviderAPI.deleteByIds(String(row.id)).then(() => {
      ElMessage.success("删除成功");
      fetchData();
      loadProviderOptions();
    });
  });
}

// 删除题库
function handleDeleteSubject(row: TableRow) {
  ElMessageBox.confirm(`确认删除题库 "${row.nameZh}"?`, "警告", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    SubjectAPI.deleteByIds(String(row.id)).then(() => {
      ElMessage.success("删除成功");
      fetchData();
    });
  });
}

// 提交文件夹
function handleSubmitFolder() {
  folderFormRef.value.validate((valid: boolean) => {
    if (valid) {
      loading.value = true;
      const action = folderDialog.editId
        ? ProviderAPI.update(folderDialog.editId, folderForm)
        : ProviderAPI.create(folderForm);

      action
        .then(() => {
          ElMessage.success(folderDialog.editId ? "修改成功" : "新增成功");
          folderDialog.visible = false;
          resetFolderForm();
          fetchData();
          loadProviderOptions();
        })
        .finally(() => {
          loading.value = false;
        });
    }
  });
}

// 重置文件夹表单
function resetFolderForm() {
  folderForm.id = undefined;
  folderForm.folderName = undefined;
  folderForm.displayName = undefined;
  folderForm.logo = undefined;
  folderForm.sortOrder = 0;
  folderForm.status = 1;
}

// 确认移动
function handleConfirmMove() {
  if (moveDialog.subjectId) {
    const providerId = moveDialog.targetProviderId === -1 ? null : moveDialog.targetProviderId;
    SubjectAPI.move(moveDialog.subjectId, providerId).then(() => {
      ElMessage.success("移动成功");
      moveDialog.visible = false;
      fetchData();
    });
  }
}

// 添加试题
function handleAddQuestion(row: TableRow) {
  ElMessage.info(`添加试题到: ${row.nameZh}`);
}

// 试题管理
function handleManageQuestion(row: TableRow) {
  ElMessage.info(`管理试题: ${row.nameZh}`);
}

// 练习
function handlePractice(row: TableRow) {
  ElMessage.info(`开始练习: ${row.nameZh}`);
}

// 监听路由变化
watch(
  () => route.query,
  (query) => {
    if (query.folderId) {
      currentFolder.value = {
        id: Number(query.folderId),
        folderName: String(query.folderName || ""),
      };
    } else {
      currentFolder.value = null;
    }
    queryParams.pageNum = 1;
    fetchData();
  },
  { immediate: true }
);

onMounted(() => {
  loadProviderOptions();
});
</script>

<style lang="scss" scoped>
.question-bank-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-icon {
  cursor: pointer;
  &:hover {
    color: var(--el-color-primary);
  }
}

.bank-table {
  min-height: 400px;

  :deep(.el-table__row) {
    cursor: pointer;
  }
}

.name-cell {
  display: flex;
  gap: 10px;
  align-items: center;
}

.folder-icon-img {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.provider-logo {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.subject-icon-img {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
}

.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid #ebeef5;
}

.total-text,
.goto-text {
  font-size: 14px;
  color: #606266;
}

.cover-picker-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.breadcrumb {
  display: flex;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.breadcrumb-separator {
  margin: 0 8px;
  color: #909399;
}

.breadcrumb-current {
  font-weight: 500;
  color: #303133;
}

.empty-state {
  padding: 80px 0;
  text-align: center;
}

.empty-icon {
  width: 100px;
  height: 100px;
  opacity: 0.4;
}

.empty-title {
  margin: 20px 0 10px;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.empty-tip {
  margin-bottom: 20px;
  font-size: 14px;
  color: #909399;
}
</style>
