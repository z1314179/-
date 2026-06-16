<template>
  <a-drawer class="user-modal" destroy-on-close :open="visible" :title="drawerTitle" placement="right" width="720"
    @close="handleCancel" @after-open-change="afterOpenChange">
    <a-form :disabled="props.config.type === 'look'" ref="formRef" :model="formState"
      :label-col="{ style: { width: '85px' } }">
      <div class="is-bg mg-b-medium">
        <h3 class="is-bg-title">基础信息</h3>
        <div class="pd-y-medium pd-l-medium pd-r-medium">
          <a-form-item label="所属公司" name="companyIds" :rules="[{ required: true, message: '请选择所属公司' }]">
            <a-select v-model:value="formState.companyIds" allow-clear placeholder="请选择" :options="companyListAll"
              :field-names="{ label: 'companyName', value: 'id' }" style="width: 393px" />
          </a-form-item>
          <a-form-item label="部门" name="organizationIds" :rules="[{ required: true, message: '请选择部门' }]">
            <cascaderCheck v-model:value="formState.organizationIds" :options="deptList" :fieldNames="{
              children: 'children',
              label: 'name',
              value: 'id',
            }" tree-node-filter-prop="name" checkStrictly placeholder="请选择" allowClear multiple style="width: 393px" />
          </a-form-item>
          <a-form-item label="用户编码" name="userCode" :rules="[{ required: true, message: '请输入用户编码' }]">
            <a-input v-model:value="formState.userCode" placeholder="请输入" :maxlength="10" allowClear
              style="width: 393px" />
          </a-form-item>
          <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名' }]">
            <a-input v-model:value="formState.username" placeholder="请输入" :maxlength="10" allowClear
              style="width: 393px" />
          </a-form-item>
          <a-form-item label="登录账户" name="mobile" :rules="[{ required: true, message: '请输入登录账户' }]">
            <a-input autocomplete="username" v-model:value="formState.mobile" placeholder="请输入" allowClear
              style="width: 393px" />
          </a-form-item>
          <a-form-item label="密码" name="password"
            :rules="[{ required: props.config.type === 'add', message: '请输入密码' }]">
            <a-input-password v-model:value="formState.password" autocomplete="new-password" placeholder="请输入"
              @change="passChange" allowClear style="width: 393px" />
          </a-form-item>
          <!-- <a-form-item label="确认密码" v-if="props.config.type !== 'look'" name="isPassword" ref="isPasswordRef"
            :autoLink="false" :rules="[
              { required: props.config.type === 'add', message: '请输入' },
              { validator: validPassword, trigger: 'change' },
            ]">
            <a-input-password v-model:value="formState.isPassword" autocomplete="new-password" placeholder="请输入"
              @change="isPasswordRef.onFieldChange()" allowClear style="width: 393px" />
          </a-form-item> -->
          <a-form-item label="数据权限" name="dataPermissions" :rules="[{ required: true, message: '请选择数据权限' }]">
            <a-select :options="dataPermissionsList" :fieldNames="{ label: 'label', value: 'value' }"
              v-model:value="formState.dataPermissions" placeholder="请选择" allowClear style="width: 393px">
              <a-select-option v-for="item in dataPermissionsList" :key="item.value" :value="item.value">
                {{ item.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </div>
      </div>
      <div class="is-bg mg-b-medium">
        <h3 class="is-bg-title">角色权限</h3>
        <div class="pd-t-medium pd-l-medium pd-r-medium" style="padding-bottom: 1px;">
          <a-form-item label="角色" name="roles" :label-col="{ style: { width: '55px' } }"
            :rules="[{ required: true, message: '请选择角色权限' }]">
            <a-checkbox-group v-model:value="formState.roles" style="width: 100%">
              <a-checkbox class="mg-r-medium" v-for="item in roleList" :key="item.id" :value="item.id"
                style="line-height: 32px">
                {{ item.name }}
              </a-checkbox>
            </a-checkbox-group>
          </a-form-item>
        </div>
      </div>
      <div class="is-bg">
        <h3 class="is-bg-title">使用状态</h3>
        <div class="pd-t-medium pd-l-medium pd-r-medium" style="padding-bottom: 1px;">
          <a-form-item label="状态" name="type" :label-col="{ style: { width: '55px' } }"
            :rules="[{ required: true, message: '请选择使用状态' }]">
            <a-radio-group name="radioGroup" v-model:value="formState.type">
              <a-radio :value="1">启用</a-radio>
              <a-radio :value="0">停用</a-radio>
            </a-radio-group>
          </a-form-item>
        </div>
      </div>
    </a-form>
    <template #footer>
      <a-button @click="handleCancel">关 闭</a-button>
      <a-button class="mg-l-medium" type="primary" v-if="props.config.type !== 'look'" @click="handleOk">保 存</a-button>
    </template>
  </a-drawer>
</template>

<script setup>
import { ref, computed, reactive, watch } from "vue";
import { validPhone } from "@/utils/com.js";
import { getTableList } from "@/api/roles";
import { addUser, updateUser, getUserDetails } from "@/api/users";
import { message } from "ant-design-vue";
import cascaderCheck from "@/components/system/cascaderCheck.vue";
defineOptions({
  name: "userModal",
});
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  config: {
    type: Object,
    default: () => {
      return {
        type: "",
        depOption: [],
        obj: {},
      };
    },
  },
  dataPermissionsList: {
    type: Array,
    default: () => [],
  },
  companyListAll: {
    type: Array,
    default: () => [],
  },
  deptList: {
    type: Array,
    default: () => [],
  },
});
const replaceFields = {
  children: "children",
  label: "name",
  value: "id",
};
const $emit = defineEmits(["update:visible", "change"]);
let formData = {
  username: "",
  mobile: "",
  companyIds: undefined,
  organizationIds: [],
  password: "",
  isPassword: "",
  dingAccount: "",
  roles: [],
  type: 1,
};
const formState = ref({ ...formData });
const formRef = ref();
const roleList = ref([]);
const isPasswordRef = ref(null);
const fieldNames = reactive({
  children: "children",
  label: "name",
  value: "id",
});
const afterOpenChange = async (visible) => {
  if (!visible) return;
  if (props.config.id) {
    init();
  } else {
    formState.value = { ...formData };
  }
  getTableList({ isPage: 0 }).then((res) => {
    roleList.value = res.data || []
  });
};
const filter = (inputValue, path) => {
  return path.some(
    (option) =>
      option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
  );
};

const drawerTitle = computed(() => {
  return props.config.type === "add" ? "新增" : props.config.type === "edit" ? "编辑" : "查看";
});

const handleCancel = (e) => {
  formState.value = {};
  formRef.value.resetFields();
  $emit("update:visible", false);
};
const handleOk = async (e) => {
  try {
    await formRef.value.validate();
    const params = {
      ...formState.value,
    };
    params.companyIds = [params.companyIds]
    delete params.isPassword;
    let res = {};
    if (props.config.type === "add") {
      res = await addUser(params);
    } else {
      if (!params.password) {
        delete params.password;
      }
      res = await updateUser(params);
    }
    if (res.errno !== 0) return;
    message.success("保存成功！");
    handleCancel();
    $emit("change");
  } catch (error) {
    console.error(error);
    return;
  }
};
const passChange = () => {
  // if (formState.value.isPassword) {
  //   isPasswordRef.value.onFieldChange();
  // }
  // if (!formState.value.password) {
  //   isPasswordRef.value.onFieldChange();
  // }
};
const validPassword = async (rule, value) => {
  if (!value && formState.value.password) {
    return Promise.reject("请输入");
  }
  if (
    formState.value.password &&
    formState.value.password !== formState.value.isPassword
  ) {
    return Promise.reject("两次密码不一致");
  } else {
    return Promise.resolve();
  }
};
const validMobile = async (rule, value) => {
  if (!value) {
    return Promise.reject("请输入");
  }
  if (!validPhone(value)) {
    return Promise.reject("请填写正确的电话");
  } else {
    return Promise.resolve();
  }
};
const init = () => {
  if (props.config.type === "edit" || props.config.type === "look") {
    getUserDetails({ id: props.config.id }).then((res) => {
      if (res.data) {
        formState.value.id = res.data.id
        formState.value.companyIds = res.data.companyIds?.[0]
        formState.value.organizationIds = res.data.organizationIds
        formState.value.userCode = res.data.userCode
        formState.value.username = res.data.username
        formState.value.mobile = res.data.mobile
        formState.value.dataPermissions = res.data.dataPermissions
        formState.value.roles = res.data.roles.map((item) => item.id)
        formState.value.type = res.data.type
        formState.value.password = "";
        formState.value.isPassword = "";
      }
    });
  }
};
</script>

<style lang="scss" scoped>
:deep(.ant-form-item) {
  margin-bottom: 16px;
}

.user-modal {
  .is-bg {
    background: rgba(22, 80, 255, 0.04);
    border-radius: 8px;

    .is-bg-title {
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
}
</style>
