<template>
  <div class="group-num">
    <div class="group-num__inputs">
      <a-input-number
        class="group-num__field"
        :value="start"
        :min="0"
        :controls="false"
        :precision="precision"
        allow-clear
        placeholder="请输入"
        @change="onStartChange"
      />
      <span class="group-num__sep" aria-hidden="true">-</span>
      <a-input-number
        class="group-num__field"
        :value="end"
        :min="0"
        :controls="false"
        :precision="precision"
        allow-clear
        placeholder="请输入"
        @change="onEndChange"
      />
    </div>
    <span class="group-num__unit">{{ unit }}</span>
  </div>
</template>

<script setup>
defineOptions({
  name: 'GroupNum',
})

defineProps({
  start: {
    type: Number,
    default: undefined,
  },
  end: {
    type: Number,
    default: undefined,
  },
  precision: {
    type: Number,
    default: 0,
  },
  /** 金额单位文案，默认「元」 */
  unit: {
    type: String,
    default: '元',
  },
})

const emit = defineEmits(['update:start', 'update:end'])

const onStartChange = (val) => {
  emit('update:start', val ?? undefined)
}

const onEndChange = (val) => {
  emit('update:end', val ?? undefined)
}
</script>

<style lang="scss" scoped>
.group-num {
  display: flex;
  align-items: center;
  width: 260px;
  gap: 8px;
}

.group-num__inputs {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
  gap: 6px;
}

.group-num__field {
  flex: 1;
  min-width: 0;
}

.group-num__field :deep(.ant-input-number) {
  width: 100%;
}

.group-num__sep {
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  line-height: 32px;
  user-select: none;
}

.group-num__unit {
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.88);
  font-size: 14px;
  line-height: 32px;
  user-select: none;
}
</style>
