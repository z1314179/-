<template>

  <div class="flex-1 flex flex-column" v-if="templateCategory === 1">
    <div v-if="options.length" class="flex-1 flex flex-wrap">
      <div class="variable-item" v-for="(item, index) in options" :key="index">
        <span :class="item.props.required ? 'header-required-a' : ''"> {{ item.props.label }}</span>
      </div>
    </div>
    <div v-else class="flex-1 flex justify-center align-center">
      <EmptyInfo style="width: 110px; height: 100%;">
        暂无内容
      </EmptyInfo>
    </div>
  </div>
  <div v-else-if="templateCategory === 2" class="variable-box flex flex-1">
    <div class="flex-1" style="max-width: 1200px;" v-if="selectBusinessVariableOptions.length">
      <div class="flex flex-wrap variable-options">
        <div class="flex align-center variable-item mg-y-small" v-for="(item, index) in selectBusinessVariableOptions"
          :key="index">
          <div class="flex-1 flex align-center">
            <div class="text-ellipsis">
              {{ item.props.label }}
            </div>
            <div class="flex-1" style="min-width: fit-content; margin-left: 4px; margin-right: 4px;">
              <a-radio-group v-model:value="item.props.required" name="radioGroup">
                <a-radio :value="0">非必填</a-radio>
                <a-radio :value="1">必填</a-radio>
              </a-radio-group>
            </div>
          </div>
          <div @click="item.checked = false" class="iconfont icon-shanchu" style="color: #EE245E;font-size: 18px;">
          </div>
        </div>

      </div>
    </div>
    <div  style="max-width: 1200px;" class="flex-1 flex justify-center align-center variable-options" v-else>


      <EmptyInfo style="width: 110px; height: 100%;">
        暂无内容
      </EmptyInfo>

    </div>
    <div  style="min-width: 370px;">
      <div class="setting-panel__title flex align-center">
        <i class="iconfont icon-shezhi"></i>
        设置变量
      </div>

      <div class="mg-t-1" style="width: 370px;">
        <VariableSettingPanel :options="options" />
      </div>
    </div>
  </div>
  <div v-else class="flex-1 flex justify-center align-center">
      <EmptyInfo style="width: 110px; height: 100%;">
        暂无内容
      </EmptyInfo>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import VariableSettingPanel from './VariableSettingPanel.vue'
import EmptyInfo from "@/components/system/EmptyInfo.vue";
defineOptions({
  name: 'VariableSection'
})

const props = defineProps({
  options: {
    type: Array,
    default: () => []
  },
  templateCategory: {
    type: [Number,String],
    default: ''
  }
})

const selectBusinessVariableOptions = computed(() => {
  return props.options.filter(item => item.checked)
})
</script>

<style scoped lang="scss">
.setting-panel__title {
  font-weight: 400;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
}

.variable-options {
  // width: 1200px;
  // height: 100%;
}

.variable-item {
  width: 368px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: fit-content;
  margin: 8px 16px;
}
</style>
