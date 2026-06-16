<template>
  <a-table :columns="columns" :data-source="approvalTableData || []" :pagination="false" row-key="id"
    class="approval-detail__table">
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'line'">
        <ApprovalTimelineLine :state="record.statusCode || -1" />
      </template>
      <template v-else-if="column.key === 'userId'">
        {{ getApproverDisplay(record) }}
      </template>
      <template v-else-if="column.key === 'status'">
        {{ record.showName }}
        <!-- <span v-if="record.statusCode === 1" class="p-color">
          {{ record.msg || '-' }}
        </span>
        <span v-else-if="record.msg === '审批通过'" style="color: #007F56;">
          {{ record.msg || '-' }}
        </span>
        <span v-else-if="record.statusCode === 0" style="color: #d8d8d8;">
          {{ record.msg || '-' }}
        </span>
        <span v-else-if="record.statusCode === 3" style="color: #E5484D;">
          {{ record.msg || '-' }}
        </span>
        <span v-else>
          {{ record.msg || '-' }}
        </span> -->
      </template>
      <template v-else-if="column.key === 'remark'">
        {{ record.remark || '-' }}
      </template>
      <template v-else-if="column.key === 'date'">
        {{ formatDateTime(record.date) || '-' }}
      </template>
    </template>
  </a-table>
</template>

<script setup>
defineOptions({ name: 'ApprovalDetailTimeline' })
import { toRef, watch } from 'vue'
import ApprovalTimelineLine from '@/components/system/ApprovalTimelineLine.vue'
import { formatDateTime } from '@/utils/com'
import { useApprovalDetailTimeline } from '@/views/Contract/useApprovalDetailTimeline'

const { approvalTableData, getApproverDisplay, getData } = useApprovalDetailTimeline()
const props = defineProps({
  workflowForeData: { type: Object, default: () => { } },
})

watch(
  () => props.workflowForeData,
  (v) => {
    getData(props.workflowForeData);
  },
  {
    immediate: true,
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
