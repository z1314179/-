<template>
  <a-modal
    :open="open"
    :title="modalTitle"
    :mask-closable="false"
    width="436px"
    destroy-on-close
    @cancel="onCancel"
  >
    <div class="apr-modal__tip flex align-center">
      <ExclamationCircleFilled class="apr-modal__icon" />
      <span class="apr-modal__tip-text">{{ confirmText }}</span>
    </div>
    <a-form ref="formRef" class="apr-modal__form mg-t-medium" :model="formState" layout="vertical">
      <a-form-item :label="reasonLabel" class="mg-b-0" name="reason" :rules="reasonRules">
        <a-textarea
          v-model:value="formState.reason"
          placeholder="请输入"
          :auto-size="{ minRows: 3, maxRows: 8 }"
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="onCancel">取 消</a-button>
      <a-button type="primary" class="mg-l-small" @click="onConfirm">确 定</a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ExclamationCircleFilled } from '@ant-design/icons-vue'

defineOptions({ name: 'ApprovalPassRejectModal' })

const props = defineProps({
  open: { type: Boolean, default: false },
  /** 通过 pass | 拒绝 reject */
  type: { type: String, default: 'pass' },
})

const emit = defineEmits(['update:open', 'confirm'])

const formRef = ref(null)
const formState = reactive({
  reason: '',
})

watch(
  () => props.open,
  (v) => {
    if (v) formState.reason = ''
  },
)

const modalTitle = computed(() => (props.type === 'reject' ? '拒绝' : '通过'))

const confirmText = computed(() =>
  props.type === 'reject' ? '请确认是否要审批拒绝？' : '请确认是否要审批通过？',
)

const reasonLabel = computed(() => (props.type === 'reject' ? '不通过理由' : '通过理由'))

const reasonRules = computed(() => [
  {
    required: props.type === 'reject',
    message: '请输入拒绝理由',
  },
])

function onCancel() {
  formState.reason = ''
  emit('update:open', false)
}

async function onConfirm() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  emit('confirm', {
    type: props.type,
    reason: formState.reason,
  })
  formState.reason = ''
  emit('update:open', false)
}
</script>

<style lang="scss" scoped>
.apr-modal__tip {
  margin-left: 3px;
  line-height: normal;
}

.apr-modal__icon {
  color: #faad14;
  font-size: 21px;
  flex-shrink: 0;
  margin-right: 14px;
}

.apr-modal__tip-text {
  font-weight: 500;
  font-size: 16px;
}

.apr-modal__form {
  padding: 0 36px;
}
</style>
