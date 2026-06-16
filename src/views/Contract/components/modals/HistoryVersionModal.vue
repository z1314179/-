<template>
  <a-modal :open="open" wrap-class-name="history-version-modal-wrap" title="历史版本查看" :mask-closable="false"
    width="1000px" destroy-on-close @cancel="handleCancel">
    <div class="modal-content-wrap">
      <div>
        <a-radio-group v-model:value="activeTab" button-style="solid" class="mg-b-medium radio_group_bg">
          <a-radio-button value="history">历史版本</a-radio-button>
          <a-radio-button value="change" :disabled="activeTab === 'history'">变更明细</a-radio-button>
        </a-radio-group>
      </div>
      <div class="card_table">
        <HistoryVersionTable v-if="activeTab === 'history'" 
        :rowData="rowData"
          @changeActiveTab="handleChangeActiveTab" />
        <ChangeDetailTable :rowData="displayChangeDetails" v-if="activeTab === 'change'"  />
      </div>
    </div>
    <template #footer>
      <div class="text-right">
        <a-button @click="handleCancel">关 闭</a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import HistoryVersionTable from './HistoryVersionTable.vue'
import ChangeDetailTable from './ChangeDetailTable.vue'

defineOptions({ name: 'HistoryVersionModal' })

const props = defineProps({
  open: { type: Boolean, default: false },
  rowData: { type: Object, default: () => { } },
})

const emit = defineEmits(['update:open'])

const activeTab = ref('history')
/** 当前「查看明细」对应的历史版本详情对象，变更表格数据在 ChangeDetailTable 内从该对象解析 */
const displayChangeDetails = ref(null)

watch(
  () => props.open,
  (v) => {
    if (v) {
      activeTab.value = 'history'
      displayChangeDetails.value = null
    }
  },
)

function handleChangeActiveTab(tab, record) {
  activeTab.value = tab
  displayChangeDetails.value = record ?? null
}

function handleCancel() {
  emit('update:open', false)
}
</script>

<style lang="scss">
.modal-content-wrap {
  display: flex;
  flex-direction: column;
  height: 60vh;
}
</style>