<template>
  <div class="approval-process flex flex-column">
    <a-form class="info_form" :label-col="{ style: { width: '61px' } }">
      <div
        v-for="(item, index) in items"
        :key="index"
        class="flex div-item"
        @click="handleButtonClick(item)"
      >
        <div class="left flex-1">
          <div class="title">
            <span v-if="isContractBorrow(item)" class="tag borrow">
              [合同借阅审批]
            </span>
            <span v-if="isContractCopy(item)" class="tag copy">
              [合同抄送]
            </span>

            <span v-if="isContractApproval(item)" class="tag approval">
              [合同审批]
            </span>

            <span v-if="isContractBorrow(item)" class="info-text">
              借阅人：{{ item.submitterName || "-" }}
            </span>

            <template v-if="isContractApprovalOrCopy(item)">
              <span class="info-text" v-if="item.contractName">
                {{ item.contractName }}
              </span>
              <span v-if="item.contractNo" class="right-text gray">
                {{ item.contractNo }}
              </span>
            </template>

            <span v-if="item.stagnationTime" class="right-text error">
              已等待{{ item.stagnationTime }}
            </span>
          </div>
          <template v-if="!isContractBorrow(item)">
            <div class="flex flex-wrap" style="gap: 0 24px">
              <a-form-item label="合同类型">
                {{ contractTypeMap[item.contractType] || "-" }}
              </a-form-item>
              <a-form-item
                label="合同起止日期"
                :label-col="{ style: { width: '85px' } }"
              >
                {{ item.contractDate || "-" }}
              </a-form-item>
            </div>
            <div class="flex flex-wrap" style="gap: 0 12px">
              <a-form-item label="对方客商">
                {{ item.counterpartyName || "-" }}
              </a-form-item>
              <a-form-item label="发起人">
                {{ item.submitterName || "-" }}
              </a-form-item>
            </div>
          </template>

          <a-form-item label="流程时间">
            {{ item.processTime || "-" }}
          </a-form-item>
        </div>
        <div class="right mg-l-small flex align-center">
          <a-button
            type="primary"
            ghost
            class="btn"
            @click.stop="handleButtonClick(item)"
          >
            {{ getButtonText(item) }}
          </a-button>
        </div>
      </div>
    </a-form>
  </div>
</template>

<script setup>
import { computed, inject } from "vue";

defineOptions({ name: "HomeApprovalProcess" });

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  status: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(["click"]);

const PERM = inject("PERM");

const NOTICE_TYPE = {
  CONTRACT_BORROW: 5,
};

const PROCESS_SUBTYPE = {
  APPROVAL: 1,
  COPY: 2,
};

const DATA_TYPE = {
  INTENTION: 1,
};

const contractTypeMap = {
  1: "新签合同审批",
  2: "变更合同审批",
  3: "续签合同审批",
  4: "终止合同审批",
};

const isContractBorrow = (item) =>
  item.noticeType === NOTICE_TYPE.CONTRACT_BORROW &&
  item.processSubtype === PROCESS_SUBTYPE.APPROVAL;
const isContractCopy = (item) => item.processSubtype === PROCESS_SUBTYPE.COPY;
const isContractApproval = (item) =>
  item.processSubtype === PROCESS_SUBTYPE.APPROVAL && !isContractBorrow(item);
const isContractApprovalOrCopy = (item) =>
  isContractCopy(item) || isContractApproval(item);

const getButtonText = (item) =>
  isContractCopy(item) || props.status === 2 || item.operateTag === "view"
    ? "去查看"
    : "去审批";

const handleClick = (item) => {
  if (canShowButton(item)) {
    emit("click", item);
  }
};

const handleButtonClick = (item) => {
  emit("click", item);
};
</script>

<style scoped lang="scss">
.approval-process {
  .radio-class {
    gap: 0 8px;
    display: flex;
    :deep(.ant-radio-button-wrapper) {
      background: rgba(0, 0, 0, 0.04);
      border-radius: 16px;
      border-inline-start-width: 1px;
      padding: 0px 16px;
      font-weight: 400;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
      border: none;
      &::before {
        display: none;
      }
      &.ant-radio-button-wrapper-checked {
        background: #1677ff;
        color: rgba(255, 255, 255, 0.9);
        border-radius: 16px;
      }
    }
  }

  .info_form {
    .div-item {
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      padding: 16px 8px;
      cursor: pointer;

      &:hover {
        background: rgba(0, 0, 0, 0.03);
        border-radius: 6px;
      }
      .ant-form-item {
        :deep(.ant-form-item-control-input) {
          min-height: 21px !important;
        }
      }
    }

    .title {
      font-weight: 500;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0 8px;
    }

    .tag {
      font-weight: 500;

      &.borrow {
        color: #7c3cc9;
      }

      &.copy {
        color: #03a3a3;
      }

      &.approval {
        color: #fb9a0e;
      }
    }

    .info-text {
      padding-right: 10px;
    }

    .right-text {
      font-weight: 400;
      font-size: 12px;
      padding-right: 10px;

      &.gray {
        color: rgba(0, 0, 0, 0.45);
      }

      &.error {
        color: #ee245e;
      }
    }

    .ant-form-item {
      padding: 2px 0;

      :deep(.ant-form-item-row) {
        .ant-form-item-control-input-content {
          font-size: 12px;
        }
        label {
          font-size: 12px;
        }
      }

      &:last-child {
        padding-bottom: 0;
      }
    }
  }

  .btn {
    background: rgba(22, 122, 255, 0.09);
    border-radius: 16px;
    border: 1px solid #1677ff;
  }
}
</style>
