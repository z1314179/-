<template>
  <a-spin wrapperClassName="department-form" :spinning="loading" size="large">
    <div class="flex flex-column main-content">
      <div class="page-content flex-1">
        <a-form
          ref="formRef"
          layout="vertical"
          :model="formState"
          :rules="rules"
        >
          <a-card title="基本信息" :bordered="false">
            <a-row :gutter="24">
              <a-col :xs="24" :md="8">
                <a-form-item label="部门编码" name="code">
                  <a-input
                    v-model:value="formState.code"
                    placeholder="请输入"
                    :maxlength="50"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="部门名称" name="name">
                  <a-input
                    v-model:value="formState.name"
                    placeholder="请输入"
                    :maxlength="50"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="部门级别" name="level">
                  <a-select
                    v-model:value="formState.level"
                    placeholder="请选择"
                    :options="levelOptions"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="24">
              <a-col :xs="24" :md="8">
                <a-form-item label="上级部门" name="parentDept">
                  <a-select
                    v-model:value="formState.parentDept"
                    placeholder="请选择"
                    :options="parentDeptOptions"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item label="所属公司" name="companyName">
                  <a-select
                    v-model:value="formState.companyName"
                    placeholder="请选择"
                    :options="companyOptions"
                    allow-clear
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="8">
                <a-form-item
                  label="部门内共享合同数据"
                  name="shareContractInDept"
                >
                  <a-switch v-model:checked="formState.shareContractInDept" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="描述" name="description">
              <a-textarea
                v-model:value="formState.description"
                placeholder="请输入"
                :auto-size="{ minRows: 4, maxRows: 8 }"
                :maxlength="500"
                show-count
                allow-clear
              />
            </a-form-item>
          </a-card>
        </a-form>
      </div>

      <div class="page-content-footer">
        <a-popconfirm
          placement="top"
          ok-text="确定"
          cancel-text="取消"
          @confirm="handleCancel"
        >
          <template #title>
            <div>关闭后，当前页面后填写的内容将会被清空，请确认是否关闭？</div>
          </template>
          <a-button>关闭</a-button>
        </a-popconfirm>
        <a-button class="mg-l-small" @click="handleSave" type="primary">
          保存
        </a-button>
      </div>
    </div>
  </a-spin>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { message } from "ant-design-vue";
import { addDepartment, updateDepartment } from "@/api/users.js";
import useTabs from "@/hook/useTabs.js";

defineOptions({ name: "SettingsDepartmentEditPage" });

const COMPANY_NAME = "上海丽知品牌管理有限公司";

const levelOptions = [
  { label: "一级", value: "一级" },
  { label: "二级", value: "二级" },
  { label: "三级", value: "三级" },
  { label: "四级", value: "四级" },
];

const parentDeptOptions = [
  { label: "无（顶级部门）", value: "" },
  { label: "人力行政中心", value: "人力行政中心" },
  { label: "供应链中心", value: "供应链中心" },
  { label: "法务部", value: "法务部" },
];

const companyOptions = [
  { label: COMPANY_NAME, value: COMPANY_NAME },
  { label: "杭州心慕与你有限公司", value: "杭州心慕与你有限公司" },
];

const rules = {
  code: [{ required: true, message: "请输入部门编码", trigger: "blur" }],
  name: [{ required: true, message: "请输入部门名称", trigger: "blur" }],
  level: [{ required: true, message: "请选择部门级别", trigger: "change" }],
};

function listLevelToForm(level) {
  if (!level) return "一级";
  const m = {
    一级部门: "一级",
    二级部门: "二级",
    三级部门: "三级",
    四级部门: "四级",
  };
  return m[level] || "一级";
}

const formState = ref({
  code: "",
  name: "",
  level: "一级",
  parentDept: undefined,
  companyName: COMPANY_NAME,
  shareContractInDept: true,
  description: "",
});
const formRef = ref(null);
const route = useRoute();
const { toBack } = useTabs();
const saving = ref(false);
const loading = ref(false);

function applyMockDetail(id) {
  const map = {
    1: {
      code: "001",
      name: "法务部",
      level: listLevelToForm("一级部门"),
      parentDept: "",
      companyName: COMPANY_NAME,
      shareContractInDept: true,
      description: "",
    },
    2: {
      code: "002",
      name: "组织发展",
      level: listLevelToForm("四级部门"),
      parentDept: "人力行政中心",
      companyName: COMPANY_NAME,
      shareContractInDept: false,
      description: "",
    },
    3: {
      code: "003",
      name: "设计一组",
      level: listLevelToForm("三级部门"),
      parentDept: "供应链中心",
      companyName: COMPANY_NAME,
      shareContractInDept: true,
      description: "",
    },
  };
  const row = map[id];
  if (!row) return;
  formState.value = row;
}

onMounted(() => {
  const id = route.query.id;
  if (id != null && id !== "") {
    applyMockDetail(Number(id));
  }
});

function handleCancel() {
  toBack();
}

const apiFunctions = async (data) => {
  return route.query.id
    ? await updateDepartment(data)
    : await addDepartment(data);
};

async function handleSave() {
  await formRef.value.validate();
  try {
    loading.value = true;
    const params = { ...formState.value };
    const res = await apiFunctions(params);
    loading.value = false;
    if (res.errno === 0) {
      message.success("保存成功");
      handleCancel();
    }
  } catch (error) {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
.department-form {
  height: 100%;
  :deep(.ant-spin-container) {
    height: 100%;
  }
  .main-content {
    height: 100%;
    .page-content {
      height: auto;
    }
    .ant-form-item {
      margin-bottom: 16px;
    }
  }
}
</style>
