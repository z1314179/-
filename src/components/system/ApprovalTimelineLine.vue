<template>
  <div class="line-box-h line-box-ok" v-if="[0, 2].includes(state)">
    <CheckCircleFilled />
  </div>
  <div class="line-box-h line-box-no" v-else-if="state === 3">
    <CloseCircleFilled />
  </div>
  <div class="line-box-h line-box-wait" v-else-if="state === 1">
    <ClockCircleFilled />
  </div>
  <div class="line-box-h line-box-start" v-else-if="state === 0">
    <div class="line-box-row"></div>
  </div>
  <div class="line-box-h line-box-start" v-else>
    <div class="line-box-row"></div>
  </div>
</template>

<script setup>
defineOptions({ name: 'ApprovalTimelineLine' })
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  SwapOutlined,
} from '@ant-design/icons-vue'
defineProps({
  state: {
    type: Number,
    required: true,
  },
})
</script>

<style lang="scss" scoped>
.line-box-h {
  .iconfont {
    font-size: 11px;
  }

  &.line-box-ok {
    &::before {
      background: #30a46c;
    }

    .anticon {
      color: #30a46c;
    }
  }

  &.line-box-no {
    &::before {
      background: #ff4d4f;
    }

    .anticon {
      color: #ff4d4f;
    }
  }

  &.line-box-wait {
    &::before {
      background: var(--color-primary);
    }

    .anticon {
      color: var(--color-primary);
    }
  }

  &.line-box-ing {
    &::before {
      background: #fa8c16;
    }

    .anticon {
      color: #fa8c16;
    }
  }

  &.line-box-start {
    &::before {
      background: #d8d8d8;
    }

    .line-box-row {
      width: 10px;
      height: 10px;
      background: #d8d8d8;
    }
  }

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    z-index: 99;
    background: #30a46c;
    width: 1px;
    height: 100%;
  }

  .line-box-row {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #30a46c;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 101;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .anticon {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 101;
    background: #fff;
    font-size: 16px;
  }
}
</style>
