<template>
  <div class="business-info">
    <div class="flex flex-column" style="max-width: 1396px">
      <div class="flex flex-wrap gap-24">
        <a-form-item
          label="客商分类"
          name="custType"
          :rules="[
            { required: true, message: '请选择客商分类', trigger: 'change' },
          ]"
        >
          <a-select
            v-model:value="formState.custType"
            :options="guestClassifyList.arr"
            placeholder="请选择客商分类"
            allow-clear
            style="width: 260px"
          >
          </a-select>
        </a-form-item>
        <a-form-item
          label="引入渠道"
          name="channel"
          :rules="[{ required: true, message: '请选择引入渠道' }]"
        >
          <a-select
            v-model:value="formState.channel"
            :options="importChannelList.arr"
            placeholder="请选择引入渠道"
            allow-clear
            style="width: 260px"
          >
          </a-select>
        </a-form-item>
        <a-form-item
          label="达人机构"
          name="platform"
          :rules="[
            { required: true, message: '请输入达人机构', trigger: 'change' },
          ]"
          v-if="formState.type === 3"
        >
          <a-input
            v-model:value="formState.platform"
            placeholder="请输入达人机构"
            :maxlength="200"
            allow-clear
            style="width: 260px"
          />
        </a-form-item>
        <a-form-item
          label="合作进度"
          name="cooperateStatus"
          :rules="[
            { required: true, message: '请选择合作进度', trigger: 'change' },
          ]"
        >
          <a-select
            v-model:value="formState.cooperateStatus"
            :options="cooperationProgressList.arr"
            placeholder="请选择合作进度"
            allow-clear
            style="width: 260px"
            @change="handleProgressChange"
          >
          </a-select>
        </a-form-item>
        <a-form-item
          label="未合作原因"
          name="notReason"
          class="flex-1"
          style="min-width: 260px"
          v-if="formState.cooperateStatus === 1"
          :rules="[
            { required: true, message: '请输入未合作原因', trigger: 'change' },
          ]"
        >
          <a-input
            v-model:value="formState.notReason"
            placeholder="请输入未合作原因"
            :maxlength="200"
            allow-clear
            style="width: 260px"
          />
        </a-form-item>
        <template v-else>
          <a-form-item
            label="合作年限(年)"
            name="cooperateYears"
            :rules="[
              {
                required: REQUIRED_STATUS.COO_STATUS.includes(
                  formState.cooperateStatus,
                ),
                message: '请输入合作年限',
                trigger: 'change',
              },
            ]"
          >
            <a-input
              v-model:value="formState.cooperateYears"
              placeholder="请输入合作年限"
              :maxlength="200"
              allow-clear
              style="width: 260px"
            />
          </a-form-item>
          <a-form-item
            label="合作模式"
            name="cooperateMode"
            :rules="[
              {
                required: REQUIRED_STATUS.COO_STATUS.includes(
                  formState.cooperateStatus,
                ),
                message: '请输入合作模式',
                trigger: 'change',
              },
            ]"
          >
            <a-input
              v-model:value="formState.cooperateMode"
              placeholder="请输入合作模式"
              :maxlength="200"
              allow-clear
              style="width: 260px"
            />
          </a-form-item>
          <a-form-item
            label="合作内容"
            name="cooperateContent"
            class="flex-1"
            style="min-width: 1000px"
            :rules="[
              {
                required: REQUIRED_STATUS.COO_STATUS.includes(
                  formState.cooperateStatus,
                ),
                message: '请输入合作内容',
                trigger: 'change',
              },
            ]"
          >
            <a-input
              v-model:value="formState.cooperateContent"
              placeholder="请输入合作内容"
              :maxlength="200"
              allow-clear
            />
          </a-form-item>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import hookMap from "@/views/Basic/hookMap";

const { cooperationProgressList, guestClassifyList, importChannelList } =
  hookMap();

const REQUIRED_STATUS = {
  COO_STATUS: [3, 4, 5], // 合作进度
};

const props = defineProps({
  title: String,
  formState: Object,
  formRef: {
    type: [Object, null],
    default: () => {
      return {};
    },
  },
  // 客商类型 1: 公司 2: 达人 3: 个人
  type: {
    type: Number,
    default: 1,
  },
});

const handleProgressChange = async () => {
  await props.formRef.clearValidate([
    "notReason",
    "cooperateYears",
    "cooperateMode",
    "cooperateContent",
  ]);
  props.formState.notReason = "";
  props.formState.cooperateYears = "";
  props.formState.cooperateMode = "";
  props.formState.cooperateContent = "";
};
</script>

<style lang="scss" scoped>
.business-info {
  .gap-24 {
    gap: 0 24px;
  }
  .ant-form-item {
    margin-bottom: 16px;
  }
}
</style>
