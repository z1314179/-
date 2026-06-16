<template>
  <div class="notice-panel">
    <a-form class="info_form" :label-col="{ style: { width: '61px' } }">
      <div
        class="flex div-item"
        v-for="(item, index) in dataSource"
        :key="index"
        @click="emit('click', item)"
      >
        <div class="left">
          <span class="bg" :class="statusType[item.warningType]?.class">
            {{ statusType[item.warningType]?.label || "-" }}
          </span>
        </div>
        <div class="right mg-l-small">
          <div class="flex">
            <span> {{ item.content }} </span>
          </div>
          <div class="flex flex-wrap" style="margin-top: 4px">
            <a-form-item label="预警时间">
              {{ formatCreateTime(item.createTime) || "-" }}
            </a-form-item>
            <a-form-item
              :label="statusType[item.warningType]?.formLabel"
              class="alert"
              :label-col="{ style: { width: '73px' } }"
            >
              {{ item.businessDate }}
            </a-form-item>
          </div>
        </div>
      </div>
    </a-form>
  </div>
</template>

<script setup>
import { ref, computed, h, reactive, watch } from "vue";
import dayjs from "dayjs";
defineOptions({ name: "HomeNoticePanel" });

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["click"]);

const statusType = {
  1: { label: "期", formLabel: "到期日", class: "bg-qi" },
  2: { label: "收", formLabel: "应收日", class: "bg-shou" },
  3: { label: "付", formLabel: "应付日", class: "bg-fu" },
};

const formatCreateTime = (time) => {
  if (!time) return "-";
  return dayjs(time).format("YYYY-MM-DD") + " 09:00:00";
};

const dataSource = computed(() => {
  return props.items;
});
</script>

<style scoped lang="scss">
.notice-panel {
  .bg {
    display: inline-block;
    background: #e6f4f7;
    border-radius: 4px;
    padding: 6px 9px;
    color: #0066ff;
    &.bg-qi {
      background: #e6f4f7;
      color: #166c86;
    }
    &.bg-shou {
      background: #e9f5ec;
      color: #177748;
    }
    &.bg-fu {
      background: #fff0db;
      color: #b54707;
    }
  }
  .info_form {
    .div-item {
      // cursor: pointer;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      padding: 16px 8px;
      &:hover {
        background: rgba(0, 0, 0, 0.03);
        border-radius: 6px;
      }
    }
    .ant-form-item {
      padding: 0;
      font-size: 12px;
      :deep(label) {
        font-size: 12px;
      }
      :deep(.ant-form-item-control-input-content) {
        font-size: 12px;
      }
      :deep(.ant-form-item-control-input) {
        min-height: 21px !important;
      }
    }
    .notice-content {
      width: 100%;
    }
    .alert {
      color: #ee245e;
      :deep(label) {
        color: #ee245e;
      }
    }
  }
}
</style>
