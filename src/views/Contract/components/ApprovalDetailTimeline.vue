<template>
  <a-table :columns="columns" :data-source="approvalTableData || []" :pagination="false" row-key="id"
    class="approval-detail__table">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'line'">
        <ApprovalTimelineLine :state="record.statusCode || -1" />
      </template>
    </template>
  </a-table>
</template>

<script setup>
defineOptions({ name: 'ApprovalDetailTimeline' })
import { watch } from 'vue'
import ApprovalTimelineLine from '@/components/system/ApprovalTimelineLine.vue'
import { useApprovalDetailTimeline } from '@/views/Contract/useApprovalDetailTimeline'
import { buildDingApprovalFlowWithHistories } from '@/views/Contract/test copy.js'
const { approvalTableData, getApproverDisplay, getData } = useApprovalDetailTimeline()
const props = defineProps({
  workflowForeData: { type: Object, default: () => { } },
})

watch(
  () => props.workflowForeData,
  async (v) => {
    if (v && typeof v === 'object' && Object.keys(v).length) {
      console.log('[test copy]', buildDingApprovalFlowWithHistories(v))
      await getData(v)
    }
  },
  {
    immediate: true,
    deep: true,
  },
)


const columns = [
  { title: '', key: 'line', dataIndex: 'approver', width: 50, className: 'line-box' },
  { title: '流程节点', key: 'userId', dataIndex: 'displayApprover', width: 200 },
  { title: '流程类型', key: 'status', dataIndex: 'status', width: 200 },
  { title: '审批意见', key: 'remark', dataIndex: 'remark', width: 400 },
  { title: '操作时间', key: 'date', dataIndex: 'displayDate', width: 290 },
]
</script>
<style lang="scss" scoped>
:deep(.ant-table-content) {
  .ant-table-thead {
    .line-box {
      &::before {
        height: 0 !important;
      }
    }
  }

  .ant-table-tbody {
    .ant-table-row {
      &:first-child {
        .line-box {
          &::after {
            content: '';
            position: absolute;
            left: 50%;
            top: 0;
            z-index: 100;
            background: #fff;
            width: 1px;
            height: 50%;
          }
        }
      }

      &:last-child {
        .line-box {
          &::after {
            content: '';
            position: absolute;
            left: 50%;
            bottom: 0;
            z-index: 100;
            background: #fff;
            width: 1px;
            height: 50%;
          }
        }
      }
    }

    .line-box {
      border: none !important;
      padding: 0 !important;
    }
  }
}
</style>
