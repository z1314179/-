<template>
  <div class="page-content">
    <a-tabs class="mg-b-small" size="large" v-model:activeKey="activeKey" destroy-inactive-tab-pane
      @change="handleTabChange">
      <a-tab-pane key="contract" tab="合同列表">
      </a-tab-pane>
      <a-tab-pane key="terminate" tab="终止合同">
      </a-tab-pane>
    </a-tabs>
    <div class="flex-1" style="min-height: 0;">
      <ContractList :userInfos="userInfos" :borrowContracts="borrowContracts" ref="contractListRef"
        v-show="activeKey === 'contract'" :subject-options-with-all="subjectOptionsWithAll"
        :category-options-with-all="categoryOptionsWithAll" :brand-options-with-all="brandOptionsWithAll"
        :contract-type-list="contractTypeList" :dept-list="deptList" />
      <TerminateContractList :find-current-user-running-task="findCurrentUserRunningTask"
        :borrowContracts="borrowContracts" ref="terminateContractListRef" v-show="activeKey === 'terminate'"
        :subject-options-with-all="subjectOptionsWithAll" :dept-list="deptList" />
    </div>
  </div>
</template>

<script setup>
import { ref, onActivated, nextTick, computed } from 'vue'
import ContractList from './ContractList.vue'
import TerminateContractList from './TerminateContractList.vue'
import hookMap, {
  categoryOptionsWithAll,
  brandOptionsWithAll,
  contractTypeList,
} from '../hookMap.js'
import useTabs from '@/hook/useTabs.js'

defineOptions({ name: 'ContractLifecyclePage' })

const { subjectOptionsWithAll } = hookMap([1])
const { deptList, userInfos, findCurrentUserRunningTask } = useTabs({ dept: true, userType: true })

const activeKey = ref('contract')
const contractListRef = ref(null)
const terminateContractListRef = ref(null)
const borrowContracts = computed(() => {
  let obj = userInfos.value?.borrowContracts?.reduce((acc, item) => {
    acc[item.contractId] = item
    return acc
  }, {})
  return obj || {}
})
async function handleTabChange(key) {
  await nextTick()
  if (key === 'contract') {
    contractListRef.value?.getloadTable?.()
  } else if (key === 'terminate') {
    terminateContractListRef.value?.getloadTable?.()
  }
}

onActivated(() => {
  handleTabChange(activeKey.value)
})
</script>

<style scoped lang="less">
// :deep(.ant-tabs-tab-btn) {
//   font-size: 16px;
// }
</style>
