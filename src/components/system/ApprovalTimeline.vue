<template>
  <div class="line-box-h line-box-ok" v-if="state === 2">
    <div class="line-box-row">
      <i class="iconfont icon-duigou1"></i>
    </div>
  </div>
  <div class="line-box-h line-box-no" v-else-if="state === 3">
    <div class="line-box-row">
      <i class="iconfont icon-guanbi1"></i>
    </div>
  </div>
  <div class="line-box-h line-box-wait" v-else-if="state === 1">
    <div class="line-box-row">
      <i class="iconfont icon-shijian"></i>
    </div>
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

    .line-box-row {
      background: #30a46c;
    }
  }

  &.line-box-no {
    &::before {
      background: #ff4d4f;
    }

    .line-box-row {
      background: #ff4d4f;
    }
  }

  &.line-box-wait {
    &::before {
      background: var(--color-primary);
    }

    .line-box-row {
      background: var(--color-primary);
    }
  }

  &.line-box-start {
    &::before {
      background: #d8d8d8;
    }

    .line-box-row {
      width: 18px;
      height: 18px;
      background: #d8d8d8;
    }
  }

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    z-index: 999;
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
    top: 0;
    transform: translate(-50%, 0%);
    z-index: 1001;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
