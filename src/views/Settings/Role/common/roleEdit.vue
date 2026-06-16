<template>
  <a-drawer class="role-drawer" destroy-on-close :open="roleOpen" :title="drawerTitle" placement="right" width="720"
    @close="close" @after-open-change="afterOpenChange">
    <a-form ref="formRef" :disabled="props.config.type === 'look'" :model="formState"
      :label-col="{ style: { width: '85px' } }" autocomplete="off">
      <div class="role-bg mg-b-medium">
        <h3 class="role-bg-title">基础信息</h3>
        <a-row class="pd-t-medium pd-l-medium pd-r-medium">
          <a-col :span="12">
            <a-form-item label="角色编码" name="roleCode" :rules="[{ required: true, message: '请输入角色编码' }]">
              <a-input v-model:value="formState.roleCode" placeholder="请输入" allowClear style="width: 200px" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="角色名称" name="name" :rules="[{ required: true, message: '请输入角色名称' }]">
              <a-input v-model:value="formState.name" placeholder="请输入" :maxlength="10" allowClear
                style="width: 200px" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="使用状态" name="type" :rules="[{ required: true, message: '请选择' }]">
              <a-radio-group name="radioGroup" v-model:value="formState.type">
                <a-radio :value="1">启用</a-radio>
                <a-radio :value="0">禁用</a-radio>
              </a-radio-group>
            </a-form-item>
          </a-col>
        </a-row>
      </div>
      <div class="role-bg mg-b-medium">
        <h3 class="role-bg-title">权限设置</h3>
        <a-row class="pd-t-medium pd-l-medium pd-r-medium">
          <a-col :span="24">
            <a-form-item label="公司" name="companyIds">
              <a-select v-model:value="formState.companyIds" mode="multiple" allow-clear placeholder="请选择"
                :options="companyListAll.all" :field-names="{ label: 'companyName', value: 'id' }" style="width: 393px" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="部门" name="departmentIds">
              <cascaderCheck v-model:value="formState.departmentIds" :options="deptList" multiple :fieldNames="{
                children: 'children',
                label: 'name',
                value: 'id',
              }" tree-node-filter-prop="name" checkStrictly placeholder="请选择" allowClear style="width: 393px" />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="参考角色">
              <a-select allowClear v-model:value="referenceRole" :filter-option="filterOption"
                :options="props.config.roleList" :fieldNames="{ label: 'name', value: 'id' }" showSearch
                placeholder="请选择" style="width: 393px" @change="referenceRoleChange">
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </div>

      <div class="role-bg">
        <h3 class="role-bg-title">功能权限</h3>
        <div class="pd-t-medium pd-l-medium pd-r-medium pd-b-large">
          <a-table class="is-radius" :columns="columns" :data-source="dataSource" :pagination="false" bordered
            childrenColumnName="'22'">
            <template #bodyCell="{ record, column }">
              <template v-if="column.dataIndex === '1'">
                <div>
                  <a-checkbox :disabled="props.config.type === 'look'" v-model:checked="groupSource[record.ID].checked"
                    @change="checkboxChange($event, record.ID, 3)">{{ groupSource[record.ID].name }}</a-checkbox>
                </div>
              </template>
              <template v-if="column.dataIndex === '2'">
                <div>
                  <a-checkbox :disabled="props.config.type === 'look'" v-model:checked="groupSource[record.id].checked"
                    @change="checkboxChange($event, record.id, 2)">{{ groupSource[record.id].name }}</a-checkbox>
                </div>
              </template>
              <template v-if="column.dataIndex === '3'">
                <div v-if="groupSource[record.id].children?.length">
                  <a-checkbox :disabled="props.config.type === 'look'" v-for="item in groupSource[record.id].children"
                    :key="item.id" v-model:checked="item.checked" @change="checkboxChange($event, record.id, 1)">{{
                      item.title }}</a-checkbox>
                </div>
              </template>
            </template>
          </a-table>
        </div>
      </div>
    </a-form>
    <template #footer>
      <a-button class="mg-r-medium" @click="close">{{
        props.config.type !== "look" ? "取 消" : "关 闭"
      }}</a-button>
      <a-button v-if="props.config.type !== 'look'" type="primary" @click="onSave">保 存</a-button>
    </template>
  </a-drawer>
</template>

<script setup>
import { getRoleDetails, addRole, updateRole } from "@/api/roles";
import { getAdminPermissions, getDepartmentList } from "@/api/users";
import hookMap from "../../hookMap.js";
import cascaderCheck from "@/components/system/cascaderCheck.vue";
import childBtn from "./childBtn.vue";
import { ref, computed, onActivated } from "vue";
import { message } from "ant-design-vue";
import { roleTypes } from "@/utils/codeMap/index.js";
defineOptions({
  name: "roleEdit",
});
const { arr: roleTypesList } = roleTypes();
const { companyListAll, dataPermissionsList } = hookMap({ isCompany: true });
const deptList = ref([]);
const drawerTitle = computed(() => {
  const type = {
    add: "新增",
    edit: "编辑",
    look: "查看",
  };
  return type[props.config.type];
});
const props = defineProps({
  roleOpen: {
    type: Boolean,
    default: false,
  },
  config: {
    type: Object,
    default: {
      type: "add",
      id: null,
      roleList: [],
    },
  },
});
let referenceRole = undefined;
const checkedIds = ref([]);
const columns = [
  {
    title: "一级菜单",
    dataIndex: "1",
    width: "150px",
    customCell: (row) => {
      return { rowSpan: row.row };
    },
  },
  {
    title: "二级菜单",
    dataIndex: "2",
    width: "180px",
  },
  {
    title: "功能权限",
    dataIndex: "3",
  },
];
const dataSource = ref([]);
const groupSource = ref({});
let initForm = {
  name: "",
  roleCode: "",
  category: 0,
  description: "",
  dataPermissions: 1,
  type: 1,
  companyIds: [],
  departmentIds: [],
  permissions: [],
};
const formState = ref({ ...initForm });
const formRef = ref();
const $emit = defineEmits(["update:roleOpen", "update:checkedIds", "change"]);
const filterOption = (input, option) => {
  return option.name.toLowerCase().indexOf(input.toLowerCase()) >= 0;
};
const onSave = async () => {
  await formRef.value.validate();
  const params = {
    ...formState.value,
  };
  let arr = Object.values(groupSource.value).reduce((t, e) => {
    if (e.checked) {
      if (e.pid > 0) {
        t.push(e.id);
        if (e.children?.length) {
          let selects = e.children.filter((v) => v.checked).map((z) => z.id);
          t.push(...selects);
        }
      } else {
        t.push(e.ID);
      }
    }
    return t;
  }, []);
  if (!arr.length) return message.warning("请选择功能权限！");
  params.permissions = arr;
  let res = {};
  if (props.config.type == "add") {
    res = await addRole(params);
  } else {
    res = await updateRole(params);
  }
  if (res.errno !== 0) return;
  message.success("保存成功");
  close();
  $emit("change");
};
const getCheckboxIds = (arr = [], ids = []) => {
  arr.forEach((e) => {
    ids.push(e.id);
    if (e.children?.length) {
      getCheckboxIds(e.children, ids);
    }
  });
  return ids;
};
const loadDeptList = async () => {
  const res = await getDepartmentList();
  deptList.value = res.data || [];
};

const normalizeRoleFormData = (data) => {
  if (!Array.isArray(data.companyIds)) {
    if (Array.isArray(data.companyId)) {
      data.companyIds = data.companyId;
    } else if (data.companyId != null && data.companyId !== "") {
      data.companyIds = [data.companyId];
    } else {
      data.companyIds = [];
    }
  }
  if (!Array.isArray(data.departmentIds)) {
    if (Array.isArray(data.organizationIds)) {
      data.departmentIds = data.organizationIds;
    } else if (Array.isArray(data.organizationId)) {
      data.departmentIds = data.organizationId;
    } else if (data.organizationId != null && data.organizationId !== "") {
      data.departmentIds = [data.organizationId];
    } else {
      data.departmentIds = [];
    }
  }
  delete data.organizationIds;
  delete data.organizationId;
  if (data.dataPermissions != null && data.dataPermissions !== "") {
    data.dataPermissions = Number(data.dataPermissions);
  }
  return data;
};

const afterOpenChange = async (visible) => {
  if (visible) {
    await loadDeptList();
    if (props.config.id) {
      const { data } = await getRoleDetails({ id: props.config.id });
      if (data) {
        data.category = data.category ? data.category : 0;
        formState.value = normalizeRoleFormData(data);
        checkedIds.value = formState.value.permissions || [];
        setCheckeds(checkedIds.value);
      }
    }else{
      formState.value = { ...initForm };
    }
  }
};
const checkboxChange = (e, id, i) => {
  if (i === 1 && e.target.checked) {
    groupSource.value[id].checked = true;
    groupSource.value[groupSource.value[id].ID].checked = true;
  } else if (i === 2) {
    if (e.target.checked) {
      groupSource.value[groupSource.value[id].ID].checked = true;
    }
    groupSource.value[id]?.children?.forEach((z) => {
      z.checked = e.target.checked;
      z.children?.forEach((y) => {
        y.checked = e.target.checked;
      });
    });
  } else if (i === 3) {
    groupSource.value[id]?.children?.forEach((z) => {
      z.checked = e.target.checked;
      z.children?.forEach((y) => {
        y.checked = e.target.checked;
      });
    });
  }
};
const close = () => {
  for (const key in initForm) {
    formState.value[key] = initForm[key];
  }
  formRef.value.resetFields();
  checkedIds.value = [];
  referenceRole = undefined;
  setCheckeds(checkedIds.value);
  $emit("update:roleOpen", false);
};
const referenceRoleChange = async (val) => {
  checkedIds.value = [];
  if (val) {
    const inx = props.config.roleList.findIndex((o) => o.id == val);
    inx !== -1 && (checkedIds.value = props.config.roleList[inx].permissions);
  }
  setCheckeds(checkedIds.value);
};
async function getList() {
  const { data } = await getAdminPermissions();
  let arr = [];
  data.forEach((e) => {
    e.row = 1;
    e.ID = e.id;
    groupSource.value[e.id] = e;
    if (e.children?.length) {
      e.children.forEach((c, i) => {
        c.ID = e.id;
        groupSource.value[c.id] = c;
        c.row = i === 0 ? e.children.length : 0;
        arr.push(c);
      });
    } else {
      arr.push(e);
    }
  });
  dataSource.value = arr;
}
onActivated(() => {
  getList();
});
function setCheckeds(checks) {
  for (const key in groupSource.value) {
    groupSource.value[key].checked = checks.includes(Number(key));
    if (groupSource.value[key]?.children) {
      groupSource.value[key].children.forEach((z) => {
        z.checked = checks.includes(Number(z.id));
      });
    }
  }
}
</script>

<style lang="scss" scoped>
:deep(.ant-table-tbody) {
  .ant-table-cell {
    padding: 5px !important;

    .ant-checkbox-wrapper {
      padding: 5px;
    }
  }
}

.level2cell {
  position: absolute;
  width: 100%;
  top: 0;
  height: 100%;
  z-index: 999;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  //   > div {
  //     flex: 1;
  //     display: flex;
  //     justify-content: center;
  //     align-items: center;
  //     border-top: 1px solid #ebeef5;
  //   }
}

.role-drawer {
  .role-bg {
    background: rgba(22, 80, 255, 0.04);
    border-radius: 8px;

    .role-bg-title {
      font-weight: 500;
      font-size: 16px;
      color: var(--text-color);
      line-height: 56px;
      height: 56px;
      border-bottom: 1px rgba(0, 0, 0, 0.06) solid;
      padding: 0 16px;
      margin: 0;
    }
  }

  .is-radius {
    border-radius: 20px;
    // :deep(.ant-table) {
    //   border-radius: 8px;
    //   table {
    //     border-radius: 8px;
    //   }
    //   .ant-table-container {
    //     border-start-start-radius: 8px;
    //     border-start-end-radius: 8px;
    //     table > thead > tr:first-child > *:first-child {
    //       border-start-start-radius: 8px;
    //     }
    //     table > thead > tr:first-child > *:last-child {
    //       border-start-end-radius: 8px;
    //     }
    //   }
    // }
  }
}
</style>
