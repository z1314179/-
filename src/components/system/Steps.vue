<template>
  <a-steps :current="current" type="navigation" size="small" :style="stepStyle" :items="items"></a-steps>
</template>

<script setup>
import { ref, defineProps } from "vue";
const stepStyle = {
  boxShadow: "0px -1px 0 0 #e8e8e8 inset",
};
defineOptions({
  name: "",
});
const props = defineProps({
  items: {
    type: Array,
    default: [{ title: 1 }],
  },
  current: {
    type: Number,
    default: 0,
  },
});
</script>

<style lang="scss" scoped>
.ant-steps {
  color: red;
  padding-top: 0;

  :deep(.ant-steps-item) {
    &.ant-steps-item-finish {
      .ant-steps-item-icon {
        border-color: var(--color-primary);

        svg {
          color: var(--color-primary);
          font-size: 12px;
        }
      }
    }

    &:first-child {
      .ant-steps-item-container {
        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          border-top: 1px solid #fff;
          box-shadow: rgb(232, 232, 232) 0px -1px 0px 0px inset;
          width: calc((100% - 170px) / 2);
        }
      }
    }

    &:last-child {
      .ant-steps-item-container {
        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          right: 0;
          height: 2px;
          border-top: 1px solid #fff;
          box-shadow: rgb(232, 232, 232) 0px -1px 0px 0px inset;
          width: calc((100% - 66px) / 2);
        }
      }
    }

    .ant-steps-item-title {
      font-size: 16px;
    }

    .ant-steps-item-container {
      padding: 20px 0;
    }

    .ant-steps-item-icon {
      background: #fff;
      border-color: rgba(0, 0, 0, 0.15);

      .ant-steps-icon {
        font-size: 14px;
        color: rgba(0, 0, 0, 0.25);
      }
    }

    &::after {
      border-color: var(--color-primary);
      border-inline-end-width: 2px;
      border-top-width: 2px;
      top: 50%;
    }

    &.ant-steps-item-active {
      .ant-steps-item-title {
        font-weight: 600;
      }

      .ant-steps-item-icon {
        background: var(--color-primary);
        border: 1px solid var(--color-primary);

        .ant-steps-icon {
          font-size: 14px;
          color: #fff;
        }
      }
    }
  }
}
</style>
