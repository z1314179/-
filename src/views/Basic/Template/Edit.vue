<template>
  <div>
    <div class="page-content">
      <a-form class="form-meta-form" ref="formRef" :model="formState">
        <a-card title="模版信息" :bordered="false">
          <div class="flex">
            <a-form-item
              name="templateName"
              label="模版名称"
              :rules="[{ required: true, message: '请输入模版名称' }]"
              class="mg-b-medium"
            >
              <a-input
                style="width: 260px"
                v-model:value="formState.templateName"
                placeholder="请输入模版名称"
                allow-clear
              />
            </a-form-item>
            <a-form-item
              name="type"
              label="模版分类"
              :rules="[{ required: true, message: '请选择模版分类' }]"
              class="mg-b-medium"
            >
              <a-select
                @change="handleChangeTemplateCategory"
                style="width: 260px"
                v-model:value="formState.type"
                :options="categoryOptions"
                placeholder="请选择"
                allow-clear
              />
            </a-form-item>

            <a-form-item
              v-if="formState.type === 1"
              name="dingProcessCode"
              label="模版ID"
              :rules="[{ required: true, message: '请输入模板钉钉模版ID' }]"
              class="mg-b-medium"
            >
              <a-space-compact style="width: 260px">
                <a-input
                  v-model:value="formState.dingProcessCode"
                  placeholder="请输入钉钉模版ID"
                  allow-clear
                />
                <a-button
                  type="primary"
                  @click="getTemplateCategoryLists()"
                  ghost
                  >匹配</a-button
                >
              </a-space-compact>
            </a-form-item>
          </div>
          <a-form-item
            name="templateDescription"
            label="模版描述"
            style="margin-left: 8px"
            class="mg-b-medium"
          >
            <a-textarea
              style="width: 638px"
              showCount
              v-model:value="formState.templateDescription"
              :auto-size="{ minRows: 3, maxRows: 6 }"
              :maxlength="200"
              show-count
              placeholder="请输入"
            />
          </a-form-item>

          <a-form-item
            v-if="formState.type === 1"
            name="departmentIds"
            label="适用部门"
            :rules="[{ required: true, message: '请选择适用部门' }]"
            class="mg-b-medium"
          >
            <cascaderCheck
              v-model:value="formState.departmentIds"
              :options="deptListAll"
              :field-names="deptTreeFieldNames"
              multiple
              check-strictly
              show-search
              tree-node-filter-prop="name"
              tree-default-expand-all
              show-checked-strategy="SHOW_ALL"
              placeholder="请选择适用部门"
              style="width: 638px"
              allow-clear
            />
          </a-form-item>
          <a-form-item
            name="status"
            style="margin-left: 8px"
            label="是否启用"
            class="mg-b-0"
          >
            <a-switch v-model:checked="formState.status" />
          </a-form-item>
        </a-card>
        <a-card title="附件" :bordered="false" class="mg-t-small">
          <div>
            <a-form-item
              name="file"
              label="文档上传"
              :rules="[{ required: true, message: '请上传附件' }]"
              class="hideAfter mg-b-0 vertical-item"
            >
              <a-upload
                action="#"
                :before-upload="customRequest"
                :show-upload-list="false"
                :accept="accept"
              >
                <a-button
                  type="primary"
                  ghost
                  style="margin-top: 4px"
                  class="shadow-btn iconfont icon-a-shangchuan3"
                >
                  上传附件
                </a-button>
              </a-upload>
              <div
                class="flex flex-wrap mg-t-small"
                v-if="formState.file.length"
              >
                <div
                  style="width: 367px"
                  class="flex mg-r-medium mg-y-small"
                  v-for="(item, index) in formState.file"
                  :key="index"
                >
                  <FileRowItem class="flex-1" style="min-width: 0" :item="item">
                  </FileRowItem>
                  <div class="pd-l-medium flex align-center">
                    <i
                      @click="handleDownload(item)"
                      class="iconfont icon-xiazai"
                      style="color: rgba(0, 0, 0, 0.45)"
                    >
                    </i>
                    <i
                      @click.stop="formState.file.splice(index, 1)"
                      class="iconfont icon-guanbi1 mg-l-small"
                      style="font-size: 20px; color: rgba(0, 0, 0, 0.45)"
                    >
                    </i>
                  </div>
                </div>
              </div>
            </a-form-item>
          </div>
        </a-card>
        <a-card
          title="业务变量"
          :bordered="false"
          class="mg-t-small card-content"
        >
          <VariableSection
            :templateCategory="formState.type"
            :options="businessVariableOptions"
          />
        </a-card>
        <a-card
          title="财务变量"
          :bordered="false"
          class="mg-t-small card-content"
        >
          <VariableSection
            :templateCategory="formState.type"
            :options="financeVariableOptions"
          />
        </a-card>
      </a-form>
    </div>
    <div class="page-content-footer">
      <a-popconfirm
        title="关闭后，当前页面后填写的内容将会被清空，请确认是否关闭？"
        placement="topRight"
        ok-text="确定"
        cancel-text="取消"
        @confirm="toBack()"
      >
        <a-button type="default">关闭</a-button>
      </a-popconfirm>

      <a-button type="primary" class="mg-l-small" @click="onSubmit"
        >保存</a-button
      >
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "BasicTemplateEditPage",
});
import FileRowItem from "@/components/upload/FileRowItem.vue";
import { onActivated, ref, computed } from "vue";
import { message } from "ant-design-vue";
import FileRow from "@/components/upload/FileRow.vue";
import cascaderCheck from "@/components/system/cascaderCheck.vue";
import VariableSection from "./common/VariableSection.vue";
import useTabs from "@/hook/useTabs.js";
import useUpload from "@/hook/useUpload.js";
import { getTemplateCategoryList } from "@/views/Contract/contractProcessMap.js";
import {
  addTemplate,
  getTemplateDetail,
  updateTemplate,
} from "@/api/Basic/template.js";
import { downloadFile } from "@/utils/preview.js";
const { toBack, deptList, route } = useTabs({ dept: true });
const { uploadFile } = useUpload();

const deptListAll = computed(() => {
  return deptList.value;
});
const deptTreeFieldNames = {
  children: "children",
  value: "id",
  label: "name",
};

const formRef = ref(null);
const categoryOptions = [
  { label: "合同", value: 1 },
  { label: "资产台账", value: 2 },
];
const handleDownload = (item) => {
  downloadFile(item);
};
/** 树下所有节点 id（提交、全选用纯 id） */
const collectAllDeptIds = (nodes) => {
  const { children, value: vk } = deptTreeFieldNames;
  const out = [];
  if (!nodes?.length) return out;
  for (const node of nodes) {
    if (node[vk] != null) out.push(node[vk]);
    if (node[children]?.length) out.push(...collectAllDeptIds(node[children]));
  }
  return out;
};

const normalizeToDeptIds = (arr) => {
  if (!arr || !Array.isArray(arr)) return [];
  return arr.map((item) =>
    item != null && typeof item === "object" && "value" in item
      ? item.value
      : item,
  );
};

const formState = ref({
  file: [],
  departmentIds: [],
  businessVariableOptions: [],
  financeVariableOptions: [],
  type: 1,
  status: true,
});

const businessVariableOptions = computed(
  () => formState.value.businessVariableOptions ?? [],
);
const financeVariableOptions = computed(
  () => formState.value.financeVariableOptions ?? [],
);

const getTemplateCategoryLists = async (sectionKeys = {}) => {
  const { businessVariableOptions: biz, financeVariableOptions: fin } =
    await getTemplateCategoryList(
      {
        type: formState.value.type,
        dingProcessCode: formState.value.dingProcessCode,
      },
      sectionKeys,
    );
  formState.value.businessVariableOptions = biz ?? [];
  formState.value.financeVariableOptions = fin ?? [];
};

const allDeptIdsFlat = computed(() => collectAllDeptIds(deptList.value));

const isAllChecked = computed(() => {
  const all = allDeptIdsFlat.value;
  const cur = normalizeToDeptIds(formState.value.departmentIds);
  if (!all.length || cur.length !== all.length) return false;
  const s = new Set(cur.map(String));
  return all.every((id) => s.has(String(id)));
});

const handleChangeTemplateCategory = async (value) => {
  formState.value.dingProcessCode = "";
  formState.value.businessVariableOptions = [];
  formState.value.financeVariableOptions = [];
  if (value === 1) {
    //
  } else {
    await getTemplateCategoryLists();
  }
};

const accept = ".docx,.doc,.pdf,.txt";
const customRequest = async (file) => {
  const res = await uploadFile(file);
  formState.value.file.push(res.data);
  formRef.value.validateFields(["file"]);
};
const handleRemoveFileByIndex = (item, index) => {
  formState.value.file.splice(index, 1);
  formRef.value.validateFields(["file"]);
};

const init = async () => {};

const onSubmit = async () => {
  try {
    await formRef.value.validate();
  } catch (error) {
    console.error(error);
    let arr = error.errorFields;
    if (arr.length) {
      message.warning(arr[0].errors[0]);
    }
    return;
  }
  let checkedBusiness = [];
  let checkedFinance = [];
  if (formState.value.type === 2) {
    checkedBusiness = (formState.value.businessVariableOptions ?? []).filter(
      (item) => item.checked,
    );
    checkedFinance = (formState.value.financeVariableOptions ?? []).filter(
      (item) => item.checked,
    );
    // if (!checkedBusiness.length) {
    //   return message.error("请选择业务变量");
    // }
    // if (!checkedFinance.length) {
    //   return message.error("请选择财务变量");
    // }
  } else {
    // if (!formState.value.businessVariableOptions.length) {
    //   return message.error("暂无业务变量");
    // }
    // if (!formState.value.financeVariableOptions.length) {
    //   return message.error("暂无财务变量");
    // }
  }
  const query = {
    ...formState.value,
    status: formState.value.status ? 1 : 0,
    isAllDepartment: isAllChecked.value ? 1 : 0,
  };
  if (formState.value.type === 2) {
    query.templateContent = {
      businessVariableOptions: checkedBusiness,
      financeVariableOptions: checkedFinance,
    };
    query.templateContent = JSON.stringify(query.templateContent);
  } else {
    query.templateContent = JSON.stringify({
      businessVariableOptions: formState.value.businessVariableOptions,
      financeVariableOptions: formState.value.financeVariableOptions,
    });
  }
  if (route.query.id) {
    query.id = route.query.id;
    const res = await updateTemplate(query);
    if (res.errno === 0) {
      message.success("保存成功");
      toBack();
    }
  } else {
    const res = await addTemplate(query);
    if (res.errno === 0) {
      message.success("保存成功");
      toBack();
    }
  }
};

const getInfo = async () => {
  const res = await getTemplateDetail({ id: route.query.id });
  if (res.errno !== 0) return;
  formState.value = {
    templateName: res.data.templateName,
    type: res.data.type,
    dingProcessCode: res.data.dingProcessCode,
    templateDescription: res.data.templateDescription,
    departmentIds: res.data.departments?.map((item) => item.departmentId) ?? [],
    status: res.data.status === 1,
    file: res.data.file,
    templateContent: res.data.templateContent,
    businessVariableOptions: [],
    financeVariableOptions: [],
  };
  let sectionKeys = {};
  if (formState.value.templateContent) {
    const templateContent = JSON.parse(formState.value.templateContent);
    sectionKeys = {
      1: templateContent.businessVariableOptions,
      2: templateContent.financeVariableOptions,
    };
  }
  await getTemplateCategoryLists(sectionKeys);
};
if (route.query.id) {
  getInfo();
}
onActivated(() => {
  init();
});
</script>

<style lang="scss" scoped>
.template-edit-dept-dropdown__toolbar {
  padding: 4px 12px 8px;
  border-bottom: 1px solid #f0f0f0;
}

.page-content {
  .ant-form-item {
    margin-right: 40px;
  }

  .card-content {
    height: 100%;

    :deep(.ant-card-body) {
      padding: 8px 8px;
      min-height: 116px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
  }
}
</style>
