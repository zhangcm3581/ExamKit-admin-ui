<!-- 我的题库 -->
<template>
  <div class="app-container">
    <el-card shadow="never" class="question-bank-card">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button type="primary" @click="handleToolbarUpload">上传题库</el-button>
          <el-button type="success" @click="handleNewSubject">新建科目</el-button>
          <!--          <el-button type="warning">人工导题</el-button>-->
          <el-button @click="handleDownloadTemplate">下载模板</el-button>
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
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        class="bank-table"
        :row-key="(row) => row.id"
        @row-click="handleRowClick"
      >
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
                <div class="subject-name-wrapper">
                  <span class="name-text">{{ getSubjectPrimaryName(scope.row) }}</span>
                  <span
                    v-if="getSubjectSecondaryName(scope.row)"
                    class="name-text subject-name-secondary"
                  >
                    {{ getSubjectSecondaryName(scope.row) }}
                  </span>
                </div>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="添加时间" width="200" align="center">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="题目数量" width="120" align="center">
          <template #default="scope">
            {{ scope.row.isFolder ? "--" : scope.row.totalQuestions || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <template v-if="scope.row.isFolder">
              <el-tag v-if="scope.row.status === 1" type="success">启用</el-tag>
              <el-tag v-else type="info">禁用</el-tag>
            </template>
            <template v-else>
              <el-switch
                :model-value="scope.row.status === 1"
                @change="(val: boolean) => handleSubjectStatusChange(scope.row, val)"
              />
            </template>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="350" align="left">
          <template #default="scope">
            <div class="action-buttons">
              <!-- 文件夹操作 -->
              <template v-if="scope.row.isFolder">
                <el-button type="primary" link @click.stop="handleSetCover(scope.row)">
                  设置封面
                </el-button>
                <el-button type="primary" link @click.stop="handleViewFolder(scope.row)">
                  查看
                </el-button>
                <el-button type="primary" link @click.stop="handleEditFolder(scope.row)">
                  编辑
                </el-button>
                <el-button type="danger" link @click.stop="handleDeleteFolder(scope.row)">
                  删除
                </el-button>
              </template>
              <!-- 题库操作 -->
              <template v-else>
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
                    <el-dropdown-menu class="subject-dropdown-menu">
                      <el-dropdown-item command="editSubject">编辑题库信息</el-dropdown-item>
                      <el-dropdown-item command="move">移动</el-dropdown-item>
                      <el-dropdown-item command="export">导出</el-dropdown-item>
                      <el-dropdown-item command="delete" divided class="delete-item">
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </div>
          </template>
        </el-table-column>

        <!-- 空状态 -->
        <template #empty>
          <div class="empty-state">
            <img :src="examIcon" alt="没有题库" class="empty-icon" />
            <h3 class="empty-title">没有题库</h3>
            <p class="empty-tip">您可以上传自己的题库,进行练习</p>
            <el-button v-if="currentFolder" type="primary" plain @click="handleBackToRoot">
              返回上级
            </el-button>
          </div>
        </template>
      </el-table>

      <!-- 分页 (只在根目录显示) -->
      <div v-if="tableData.length > 0 && !currentFolder" class="pagination-wrapper">
        <span class="total-text">共 {{ total }} 条</span>
        <el-select
          v-model="queryParams.pageSize"
          style="width: 100px"
          @change="handlePageSizeChange"
        >
          <el-option label="10条/页" :value="10" />
          <el-option label="20条/页" :value="20" />
          <el-option label="50条/页" :value="50" />
        </el-select>
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
        <span class="goto-text">前往</span>
        <el-input v-model="gotoPage" style="width: 50px" @keyup.enter="handleGotoPage" />
        <span class="goto-text">页</span>
      </div>
    </el-card>

    <!-- 新建文件夹弹窗 -->
    <!-- 文件夹弹窗 -->
    <Dialog
      v-model="folderDialog.visible"
      :title="folderDialog.title"
      width="500px"
      @confirm="handleSubmitFolder"
      @cancel="() => (folderDialog.visible = false)"
    >
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
    </Dialog>

    <!-- 移动至弹窗 -->
    <Dialog
      v-model="moveDialog.visible"
      title="移动至"
      width="400px"
      @confirm="handleConfirmMove"
      @cancel="() => (moveDialog.visible = false)"
    >
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
    </Dialog>

    <!-- 重命名弹窗（文件夹用） -->
    <Dialog
      v-model="renameDialog.visible"
      title="编辑文件夹"
      width="400px"
      :destroy-on-close="true"
      @confirm="handleConfirmRename"
      @cancel="() => (renameDialog.visible = false)"
    >
      <el-input v-model="renameDialog.name" placeholder="请输入文件夹名称" />
    </Dialog>

    <!-- 编辑题库信息弹窗 -->
    <!-- 编辑科目信息弹窗 -->
    <el-dialog
      v-if="subjectEditDialog.visible"
      v-model="subjectEditDialog.visible"
      :title="subjectEditDialog.title"
      width="800px"
      class="subject-dialog"
      @closed="handleSubjectEditDialogClosed"
    >
      <el-form
        ref="subjectEditFormRef"
        :model="subjectEditForm"
        :rules="subjectEditRules"
        label-width="80px"
      >
        <el-form-item label="中文名称" prop="nameZh">
          <el-input v-model="subjectEditForm.nameZh" placeholder="请输入科目名称（中文）" />
        </el-form-item>

        <el-form-item label="英文名称" prop="nameEn">
          <el-input v-model="subjectEditForm.nameEn" placeholder="请输入科目名称（英文）" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-select
                v-model="subjectEditForm.providerId"
                placeholder="请选择供应商（可不选）"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in providerOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支持语言" prop="supportLanguages">
              <el-select
                v-model="selectedLanguagesForEdit"
                multiple
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option label="中文" value="zh" />
                <el-option label="英文" value="en" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="中文描述">
          <el-input
            v-model="subjectEditForm.descriptionZh"
            type="textarea"
            :rows="3"
            placeholder="请输入科目描述（中文）"
          />
        </el-form-item>

        <el-form-item label="英文描述">
          <el-input
            v-model="subjectEditForm.descriptionEn"
            type="textarea"
            :rows="3"
            placeholder="请输入科目描述（英文）"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number
                v-model="subjectEditForm.sortOrder"
                :min="0"
                :max="9999"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="subjectEditForm.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="中文考试信息">
          <WangEditor v-model:model-value="subjectEditForm.examInfoZh" height="300px" />
        </el-form-item>

        <el-form-item label="英文考试信息">
          <WangEditor v-model:model-value="subjectEditForm.examInfoEn" height="300px" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button style="font-weight: bold" @click="handleCloseSubjectEditDialog">
            取 消
          </el-button>
          <el-button type="primary" style="font-weight: bold" @click="handleSubmitSubjectEdit">
            确 定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新建科目弹窗 -->
    <el-dialog
      v-if="subjectCreateDialog.visible"
      v-model="subjectCreateDialog.visible"
      title="新建科目"
      width="800px"
      class="subject-dialog"
      @closed="handleSubjectCreateDialogClosed"
    >
      <el-form
        ref="subjectCreateFormRef"
        :model="subjectCreateForm"
        :rules="subjectCreateRules"
        label-width="80px"
      >
        <el-form-item label="中文名称" prop="nameZh">
          <el-input v-model="subjectCreateForm.nameZh" placeholder="请输入科目名称（中文）" />
        </el-form-item>

        <el-form-item label="英文名称" prop="nameEn">
          <el-input v-model="subjectCreateForm.nameEn" placeholder="请输入科目名称（英文）" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-select
                v-model="subjectCreateForm.providerId"
                placeholder="请选择供应商（可不选）"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in providerOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支持语言" prop="supportLanguages">
              <el-select
                v-model="selectedLanguagesForCreate"
                multiple
                placeholder="请选择"
                style="width: 100%"
              >
                <el-option label="中文" value="zh" />
                <el-option label="英文" value="en" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="中文描述">
          <el-input
            v-model="subjectCreateForm.descriptionZh"
            type="textarea"
            :rows="3"
            placeholder="请输入科目描述（中文）"
          />
        </el-form-item>

        <el-form-item label="英文描述">
          <el-input
            v-model="subjectCreateForm.descriptionEn"
            type="textarea"
            :rows="3"
            placeholder="请输入科目描述（英文）"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序" prop="sortOrder">
              <el-input-number
                v-model="subjectCreateForm.sortOrder"
                :min="0"
                :max="9999"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-radio-group v-model="subjectCreateForm.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="中文考试信息">
          <WangEditor v-model:model-value="subjectCreateForm.examInfoZh" height="300px" />
        </el-form-item>

        <el-form-item label="英文考试信息">
          <WangEditor v-model:model-value="subjectCreateForm.examInfoEn" height="300px" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button style="font-weight: bold" @click="handleCloseSubjectCreateDialog">
            取 消
          </el-button>
          <el-button type="primary" style="font-weight: bold" @click="handleSubmitSubjectCreate">
            确 定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 设置封面弹窗 -->
    <Dialog
      v-model="coverDialog.visible"
      title="设置封面"
      width="400px"
      @confirm="handleConfirmCover"
      @cancel="() => (coverDialog.visible = false)"
    >
      <div class="cover-picker-wrapper">
        <ImagePicker v-model="coverDialog.logo" :width="200" :height="150" />
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowLeft, Search } from "@element-plus/icons-vue";
import ProviderAPI, {
  type ProviderPageQuery,
  type ProviderForm,
  type ProviderOptionVO,
  type BankItemVO,
} from "@/api/exam/provider-api";
import SubjectAPI, { type SubjectVO } from "@/api/exam/subject-api";
import ImagePicker from "@/components/ImagePicker/index.vue";
import WangEditor from "@/components/WangEditor/index.vue";
import Dialog from "@/components/Dialog/index.vue";
import { formatDateTime } from "@/utils/datetime";
import { useRoute, useRouter } from "vue-router";
import Sortable from "sortablejs";

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
  nameEn?: string;
  supportLanguages?: string;
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
const tableRef = ref(); // 表格引用

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

// 重命名弹窗
const renameDialog = reactive({
  visible: false,
  name: "",
  id: null as number | null,
});

// 设置封面弹窗
const coverDialog = reactive({
  visible: false,
  logo: "",
  itemId: null as number | string | null,
  isFolder: false,
});

// 编辑题库信息弹窗
const subjectEditFormRef = ref();
const subjectEditDialog = reactive({
  visible: false,
  title: "编辑题库信息",
  subjectId: "" as string,
});
const subjectEditForm = reactive({
  nameZh: "",
  nameEn: "",
  providerId: undefined as number | undefined,
  supportLanguages: "",
  descriptionZh: "",
  descriptionEn: "",
  sortOrder: 0,
  status: 1,
  examInfoZh: "",
  examInfoEn: "",
});

// 支持语言多选
const selectedLanguagesForEdit = ref<string[]>([]);

// 监听选中语言变化，同步到formData
watch(selectedLanguagesForEdit, (val) => {
  subjectEditForm.supportLanguages = val.join(",");
});

// 编辑科目表单验证规则
const subjectEditRules = computed(() => {
  const rules: Partial<Record<string, any>> = {
    supportLanguages: [{ required: true, message: "请选择支持的语言", trigger: "change" }],
  };

  // 根据支持语言动态设置必填规则
  const languages = selectedLanguagesForEdit.value;
  if (languages.includes("zh")) {
    rules.nameZh = [{ required: true, message: "请输入科目名称（中文）", trigger: "blur" }];
  }
  if (languages.includes("en")) {
    rules.nameEn = [{ required: true, message: "请输入科目名称（英文）", trigger: "blur" }];
  }

  return rules;
});

// 新建科目弹窗
const subjectCreateFormRef = ref();
const subjectCreateDialog = reactive({
  visible: false,
});
const subjectCreateForm = reactive({
  nameZh: "",
  nameEn: "",
  providerId: undefined as number | undefined,
  supportLanguages: "",
  descriptionZh: "",
  descriptionEn: "",
  sortOrder: 0,
  status: 1,
  examInfoZh: "",
  examInfoEn: "",
});

// 新建科目 - 支持语言多选
const selectedLanguagesForCreate = ref<string[]>([]);

// 监听选中语言变化，同步到formData
watch(selectedLanguagesForCreate, (val) => {
  subjectCreateForm.supportLanguages = val.join(",");
});

// 新建科目表单验证规则
const subjectCreateRules = computed(() => {
  const rules: Partial<Record<string, any>> = {
    supportLanguages: [{ required: true, message: "请选择支持的语言", trigger: "change" }],
  };

  // 根据支持语言动态设置必填规则
  const languages = selectedLanguagesForCreate.value;
  if (languages.includes("zh")) {
    rules.nameZh = [{ required: true, message: "请输入科目名称（中文）", trigger: "blur" }];
  }
  if (languages.includes("en")) {
    rules.nameEn = [{ required: true, message: "请输入科目名称（英文）", trigger: "blur" }];
  }

  return rules;
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
        nameEn: s.nameEn,
        supportLanguages: s.supportLanguages,
        totalQuestions: s.totalQuestions,
        createTime: s.createTime,
        sortOrder: s.sortOrder,
        status: s.status,
        providerId: s.providerId,
      }));
      total.value = subjectRes.total || 0;

      // 在文件夹内时，初始化拖拽排序
      nextTick(() => {
        initSortable();
      });
    } else {
      // 根目录：使用后端统一分页接口
      // 后端会自动合并Provider和未分类Subject，并进行分页
      const bankItemRes = await ProviderAPI.getBankItemPage(queryParams);

      tableData.value = (bankItemRes.data || []).map((item: BankItemVO) => ({
        id: item.id,
        isFolder: item.isFolder,
        folderName: item.folderName,
        displayName: item.displayName,
        nameZh: item.nameZh,
        nameEn: item.nameEn,
        supportLanguages: item.supportLanguages,
        logo: item.logo,
        totalQuestions: item.totalQuestions,
        createTime: item.createTime,
        sortOrder: item.sortOrder,
        status: item.status,
        providerId: item.providerId,
      }));

      total.value = bankItemRes.total || 0;
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

// 页码改变
function handlePageChange(page: number) {
  queryParams.pageNum = page;
  fetchData();
}

// 每页大小改变
function handlePageSizeChange() {
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
    case "editSubject":
      // 统一编辑题库信息
      handleEditSubject(row);
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
  // 通过路由导航，避免直接修改状态，让路由监听器统一处理
  router.push({
    path: route.path,
    query: { folderId: String(row.id), folderName: row.folderName || "" },
  });
}

// 编辑文件夹
function handleEditFolder(row: TableRow) {
  folderDialog.visible = true;
  folderDialog.title = "编辑文件夹";
  folderDialog.editId = row.id as number;

  // 加载文件夹详情
  ProviderAPI.getFormData(row.id as number).then((data) => {
    folderForm.folderName = data.folderName;
    folderForm.displayName = data.displayName;
    folderForm.logo = data.logo;
    folderForm.sortOrder = data.sortOrder;
    folderForm.status = data.status;
  });
}

// 确认重命名
function handleConfirmRename() {
  if (renameDialog.id && renameDialog.name.trim()) {
    ProviderAPI.update(renameDialog.id, { folderName: renameDialog.name.trim() }).then(() => {
      ElMessage.success("重命名成功");
      renameDialog.visible = false;
      fetchData();
      loadProviderOptions();
    });
  } else {
    ElMessage.warning("请输入名称");
  }
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

// 上传题库(工具栏按钮)
function handleToolbarUpload() {
  // 跳转到新的题库上传页面
  router.push({
    path: "/exam/question-bank/upload",
    query: { activeMenu: "/exam/provider" },
  });
}

// 试题管理
function handleManageQuestion(row: TableRow) {
  router.push({
    path: "/exam/question",
    query: {
      subjectId: row.id as string,
      subjectName: row.nameZh || row.nameEn || "",
      activeMenu: "/exam/provider",
    },
  });
}

// 练习
function handlePractice(row: TableRow) {
  ElMessage.info(`开始练习: ${row.nameZh}`);
}

// 下载模板
function handleDownloadTemplate() {
  const link = document.createElement("a");
  link.href = "/docs/example.xlsx";
  link.download = "题库导入模板.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  ElMessage.success("模板下载成功");
}

// 编辑题库信息(合并:重命名、编辑描述、编辑考试信息)
function handleEditSubject(row: TableRow) {
  subjectEditDialog.subjectId = row.id as string;

  // 先加载数据，再打开对话框
  SubjectAPI.getFormData(row.id as string).then((data) => {
    // 先设置表单数据
    subjectEditForm.nameZh = data.nameZh || "";
    subjectEditForm.nameEn = data.nameEn || "";
    subjectEditForm.providerId = data.providerId;
    subjectEditForm.supportLanguages = data.supportLanguages || "";
    subjectEditForm.descriptionZh = data.descriptionZh || "";
    subjectEditForm.descriptionEn = data.descriptionEn || "";
    subjectEditForm.sortOrder = data.sortOrder || 0;
    subjectEditForm.status = data.status !== undefined ? data.status : 1;
    subjectEditForm.examInfoZh = data.examInfoZh || "";
    subjectEditForm.examInfoEn = data.examInfoEn || "";

    // 解析支持语言到多选数组
    if (data.supportLanguages) {
      selectedLanguagesForEdit.value = data.supportLanguages.split(",").filter(Boolean);
    }

    // 数据设置完成后再打开对话框，这样 WangEditor 初始化时就有正确的值
    subjectEditDialog.visible = true;
    subjectEditDialog.title = "编辑题库信息";
  });
}

// 提交编辑科目信息
function handleSubmitSubjectEdit() {
  subjectEditFormRef.value.validate((valid: boolean) => {
    if (valid) {
      const updateData = {
        nameZh: subjectEditForm.nameZh,
        nameEn: subjectEditForm.nameEn,
        providerId: subjectEditForm.providerId,
        supportLanguages: subjectEditForm.supportLanguages,
        descriptionZh: subjectEditForm.descriptionZh,
        descriptionEn: subjectEditForm.descriptionEn,
        sortOrder: subjectEditForm.sortOrder,
        status: subjectEditForm.status,
        examInfoZh: subjectEditForm.examInfoZh,
        examInfoEn: subjectEditForm.examInfoEn,
      };

      SubjectAPI.update(subjectEditDialog.subjectId, updateData).then(() => {
        ElMessage.success("修改成功");
        handleCloseSubjectEditDialog();
        fetchData();
      });
    }
  });
}

// 关闭编辑科目弹窗
function handleCloseSubjectEditDialog() {
  subjectEditDialog.visible = false;
}

// 编辑科目对话框关闭动画完成后的回调
function handleSubjectEditDialogClosed() {
  // 在对话框完全关闭后再重置表单，避免影响 WangEditor
  nextTick(() => {
    if (subjectEditFormRef.value) {
      subjectEditFormRef.value.resetFields();
      subjectEditFormRef.value.clearValidate();
    }

    subjectEditForm.nameZh = "";
    subjectEditForm.nameEn = "";
    subjectEditForm.providerId = undefined;
    subjectEditForm.supportLanguages = "";
    subjectEditForm.descriptionZh = "";
    subjectEditForm.descriptionEn = "";
    subjectEditForm.sortOrder = 0;
    subjectEditForm.status = 1;
    subjectEditForm.examInfoZh = "";
    subjectEditForm.examInfoEn = "";
    selectedLanguagesForEdit.value = [];
  });
}

// 新建科目
function handleNewSubject() {
  subjectCreateDialog.visible = true;
}

// 提交新建科目
function handleSubmitSubjectCreate() {
  subjectCreateFormRef.value.validate((valid: boolean) => {
    if (valid) {
      const createData = {
        nameZh: subjectCreateForm.nameZh,
        nameEn: subjectCreateForm.nameEn,
        providerId: subjectCreateForm.providerId,
        supportLanguages: subjectCreateForm.supportLanguages,
        descriptionZh: subjectCreateForm.descriptionZh,
        descriptionEn: subjectCreateForm.descriptionEn,
        sortOrder: subjectCreateForm.sortOrder,
        status: subjectCreateForm.status,
        examInfoZh: subjectCreateForm.examInfoZh,
        examInfoEn: subjectCreateForm.examInfoEn,
      };

      SubjectAPI.create(createData).then(() => {
        ElMessage.success("新建成功");
        handleCloseSubjectCreateDialog();
        fetchData();
      });
    }
  });
}

// 关闭新建科目弹窗
function handleCloseSubjectCreateDialog() {
  subjectCreateDialog.visible = false;
}

// 新建科目对话框关闭动画完成后的回调
function handleSubjectCreateDialogClosed() {
  // 在对话框完全关闭后再重置表单，避免影响 WangEditor
  nextTick(() => {
    if (subjectCreateFormRef.value) {
      subjectCreateFormRef.value.resetFields();
      subjectCreateFormRef.value.clearValidate();
    }

    subjectCreateForm.nameZh = "";
    subjectCreateForm.nameEn = "";
    subjectCreateForm.providerId = undefined;
    subjectCreateForm.supportLanguages = "";
    subjectCreateForm.descriptionZh = "";
    subjectCreateForm.descriptionEn = "";
    subjectCreateForm.sortOrder = 0;
    subjectCreateForm.status = 1;
    subjectCreateForm.examInfoZh = "";
    subjectCreateForm.examInfoEn = "";
    selectedLanguagesForCreate.value = [];
  });
}

// 科目状态切换
function handleSubjectStatusChange(row: TableRow, newStatus: boolean) {
  const statusValue = newStatus ? 1 : 0;
  const statusText = newStatus ? "启用" : "禁用";

  ElMessageBox.confirm(`确认${statusText}科目 "${row.nameZh}" ？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      SubjectAPI.update(row.id as string, { status: statusValue }).then(() => {
        ElMessage.success(`${statusText}成功`);
        fetchData();
      });
    })
    .catch(() => {
      // 用户取消，不需要做任何操作
    });
}

// 获取科目主要显示名称
function getSubjectPrimaryName(row: TableRow): string {
  const supportLanguages = row.supportLanguages || "";

  // 如果支持中文，优先显示中文
  if (supportLanguages.includes("zh") && row.nameZh) {
    return row.nameZh;
  }

  // 否则显示英文
  if (supportLanguages.includes("en") && row.nameEn) {
    return row.nameEn;
  }

  // 兜底：返回任何可用的名称
  return row.nameZh || row.nameEn || "";
}

// 获取科目次要显示名称（多语言时显示）
function getSubjectSecondaryName(row: TableRow): string {
  const supportLanguages = row.supportLanguages || "";

  // 只有当支持多语言时才显示次要名称
  if (supportLanguages.includes("zh") && supportLanguages.includes("en")) {
    // 主要显示中文时，次要显示英文
    if (row.nameZh && row.nameEn) {
      return row.nameEn;
    }
  }

  return "";
}

// 监听路由变化
watch(
  () => route.query,
  (query, oldQuery) => {
    // 防止重复触发
    if (JSON.stringify(query) === JSON.stringify(oldQuery)) {
      return;
    }

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

// 初始化拖拽排序
function initSortable() {
  // 只在文件夹内启用拖拽排序
  if (!currentFolder.value || !tableRef.value) {
    return;
  }

  const el = tableRef.value.$el.querySelector(".el-table__body-wrapper tbody");
  if (!el) return;

  Sortable.create(el, {
    handle: ".el-table__row", // 可拖拽的元素
    animation: 150,
    ghostClass: "sortable-ghost",
    onEnd: (evt: any) => {
      const { oldIndex, newIndex } = evt;
      if (oldIndex === newIndex) return;

      // 更新本地数据顺序
      const movedItem = tableData.value.splice(oldIndex, 1)[0];
      tableData.value.splice(newIndex, 0, movedItem);

      // 批量更新排序值
      updateSubjectSort();
    },
  });
}

// 更新科目排序
function updateSubjectSort() {
  // 根据当前顺序更新 sortOrder
  const updatePromises = tableData.value.map((item, index) => {
    if (!item.isFolder && item.sortOrder !== index) {
      return SubjectAPI.update(item.id as string, { sortOrder: index });
    }
    return Promise.resolve();
  });

  Promise.all(updatePromises)
    .then(() => {
      ElMessage.success("排序更新成功");
      fetchData();
    })
    .catch(() => {
      ElMessage.error("排序更新失败");
      fetchData(); // 失败时重新加载数据
    });
}

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

  // 工具栏按钮加粗
  .el-button {
    font-weight: 600;
  }
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

  :deep(.el-table__header-wrapper) {
    th.el-table__cell {
      height: 56px;
      padding: 16px 0;
      font-weight: 600;
      color: #606266;
      background-color: #f5f7fa;
    }
  }

  :deep(.el-table__row) {
    cursor: pointer;
  }

  // 状态列加粗
  :deep(.el-tag) {
    font-weight: 600;
  }
}

// 拖拽排序样式
.sortable-ghost {
  background-color: #f5f7fa;
  opacity: 0.5;
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
  font-weight: 600; // 名称列加粗
  overflow-wrap: break-word;
  white-space: normal;
}

.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;

  // 操作列按钮加粗
  .el-button {
    font-weight: 600;
  }

  :deep(.el-dropdown) {
    .el-button {
      font-weight: 600;
    }
  }
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

/* 科目名称样式 */
.subject-name-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.subject-name-secondary {
  font-size: 12px; /* 字体小一点，区分主次 */
  color: #909399; /* 稍微灰一点 */
}

/* 下拉菜单样式 */
.subject-dropdown-menu {
  :deep(.el-dropdown-menu__item) {
    font-size: 13px;
    font-weight: bold;
    color: #409eff;
  }

  :deep(.el-dropdown-menu__item.delete-item) {
    font-weight: bold;
    color: #f56c6c !important;
  }

  :deep(.el-dropdown-menu__item:hover) {
    background-color: #ecf5ff;
  }

  :deep(.el-dropdown-menu__item.delete-item:hover) {
    background-color: #fef0f0;
  }
}

/* MessageBox 确认框样式 */
:deep(.el-message-box) {
  .el-message-box__title {
    font-weight: bold;
  }

  .el-message-box__btns {
    .el-button {
      font-weight: bold;
    }
  }
}

/* 科目编辑弹窗样式 */
:deep(.subject-dialog) {
  .el-dialog__body {
    padding: 20px 24px;
  }

  .el-form-item {
    margin-bottom: 18px;
  }

  .el-form-item__label {
    font-weight: 500;
  }
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
