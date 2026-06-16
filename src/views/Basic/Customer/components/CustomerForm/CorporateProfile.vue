<template>
  <div class="corporate-profile">
    <div class="flex flex-column" style="max-width: 1396px">
      <div class="flex flex-wrap gap-24">
        <a-form-item
          label="客商名称"
          name="name"
          :rules="[
            { required: true, message: '请输入客商名称', trigger: 'change' },
          ]"
        >
          <a-input
            v-model:value="formState.name"
            placeholder="请输入客商名称"
            :maxlength="200"
            allow-clear
            style="width: 260px"
          />
        </a-form-item>
        <template v-if="formState.type === 1">
          <a-form-item
            label="统一信用代码"
            name="creditCode"
            :rules="[
              {
                required: true,
                message: '请输入统一信用代码',
                trigger: 'change',
              },
            ]"
          >
            <a-input
              v-model:value="formState.creditCode"
              placeholder="请输入统一信用代码"
              :maxlength="200"
              allow-clear
              style="width: 260px"
            />
          </a-form-item>
          <a-form-item
            label="法定代表人"
            name="legalPerson"
            :rules="[
              {
                required: true,
                message: '请输入法定代表人',
                trigger: 'change',
              },
            ]"
          >
            <a-input
              v-model:value="formState.legalPerson"
              placeholder="请输入法定代表人"
              :maxlength="200"
              allow-clear
              style="width: 260px"
            />
          </a-form-item>
          <a-form-item
            label="经营状态"
            name="status"
            :rules="[
              {
                required: true,
                message: '请选择经营状态',
                trigger: 'change',
              },
            ]"
          >
            <a-select
              v-model:value="formState.status"
              :options="businessStatusList.arr"
              placeholder="请选择经营状态"
              allow-clear
              style="width: 260px"
            >
            </a-select>
          </a-form-item>
          <a-form-item
            label="联系电话"
            name="mobile"
            :rules="[
              {
                required: true,
                message: '请输入联系电话',
                trigger: 'change',
              },
            ]"
          >
            <a-input
              v-model:value="formState.mobile"
              placeholder="请输入联系电话"
              :maxlength="200"
              allow-clear
              style="width: 260px"
            />
          </a-form-item>
          <a-form-item label="注册资本" name="registeMoney">
            <a-input
              v-model:value="formState.registeMoney"
              placeholder="请输入注册资本"
              :maxlength="200"
              allow-clear
              style="width: 260px"
            />
          </a-form-item>
          <a-form-item label="成立日期" name="establishDate">
            <a-date-picker
              v-model:value="formState.establishDate"
              :format="'YYYY-MM-DD'"
              :value-format="'YYYY-MM-DD'"
              placeholder="年/月/日"
              style="width: 260px"
            />
          </a-form-item>
          <a-form-item label="所属行业" name="industry">
            <a-input
              v-model:value="formState.industry"
              placeholder="请输入所属行业"
              :maxlength="200"
              allow-clear
              style="width: 260px"
            />
          </a-form-item>
        </template>
        <template v-else>
          <a-form-item
            label="证照类型"
            name="licenseType"
            :rules="[
              {
                required: true,
                message: '请选择证照类型',
                trigger: 'change',
              },
            ]"
          >
            <a-select
              v-model:value="formState.licenseType"
              :options="idCardTypeList.arr"
              placeholder="请选择证照类型"
              allow-clear
              style="width: 260px"
            >
            </a-select>
          </a-form-item>
          <a-form-item
            label="证照号码"
            name="licenseCode"
            :rules="[
              {
                required: true,
                message: '请输入证照号码',
                trigger: 'change',
              },
            ]"
          >
            <a-input
              v-model:value="formState.licenseCode"
              placeholder="请输入证照号码"
              :maxlength="200"
              allow-clear
              style="width: 260px"
            />
          </a-form-item>
          <a-form-item
            label="联系电话"
            name="mobile"
            :rules="[
              {
                required: true,
                message: '请输入联系电话',
                trigger: 'change',
              },
            ]"
          >
            <a-input
              v-model:value="formState.mobile"
              placeholder="请输入联系电话"
              :maxlength="200"
              allow-clear
              style="width: 260px"
            />
          </a-form-item>
        </template>
      </div>
      <template v-if="formState.type === 1">
        <div class="flex">
          <a-form-item label="注册地址" name="registeProvince">
            <a-select
              v-model:value="formState.registeProvince"
              placeholder="省"
              showSearch
              allowClear
              :filter-option="filterOption"
              @change="formState.registeCity = undefined"
              style="width: 120px"
            >
              <a-select-option
                :value="item.ext_name"
                :name="item.ext_name"
                v-for="item in province"
                :key="item.id"
                >{{ item.ext_name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label=" " name="registeCity" class="mg-l-small no-label">
            <a-select
              v-model:value="formState.registeCity"
              placeholder="市"
              showSearch
              allowClear
              :filter-option="filterOption"
              style="width: 120px"
            >
              <a-select-option
                :value="item.ext_name"
                :name="item.ext_name"
                v-for="item in province[formState.registeProvince]?.children ||
                []"
                :key="item.id"
                >{{ item.ext_name }}</a-select-option
              >
            </a-select>
          </a-form-item>
          <a-form-item
            label=" "
            name="registeAddress"
            class="mg-l-small flex-1 no-label"
          >
            <a-input
              v-model:value="formState.registeAddress"
              :maxlength="200"
              allowClear
              placeholder="请输入详细地址"
            />
          </a-form-item>
        </div>
        <a-form-item label="经营范围" name="businessScope">
          <a-textarea
            v-model:value="formState.businessScope"
            :auto-size="{ minRows: 2 }"
            placeholder="请输入经营范围"
            :maxlength="200"
            allow-clear
            style="width: 100%"
          />
        </a-form-item>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import hookMap from "@/views/Basic/hookMap";

const { idCardTypeList, businessStatusList } = hookMap();

const filterOption = (input, option) => {
  return option.name.indexOf(input) >= 0;
};

const props = defineProps({
  province: Object,
  formState: Object,
  formRef: {
    type: [Object, null],
    default: () => {
      return {};
    },
  },
});
</script>

<style lang="scss" scoped>
.corporate-profile {
  .gap-24 {
    gap: 0 24px;
  }
  .ant-form-item {
    margin-bottom: 16px;
  }
}
</style>
