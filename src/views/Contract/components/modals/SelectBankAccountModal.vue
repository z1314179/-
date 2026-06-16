<template>
  <a-modal :open="openState" title="选择银行账户" @cancel="close" width="1000px" destroy-on-close
    wrap-class-name="select-bank-account-modal">
    <div class="select-bank-account-modal__list">
      <div v-for="acc in sortedAccounts" :key="acc.id" class="bank-acc-card"
        :class="{ 'bank-acc-card--active': tempSelectedId === acc.id }" role="button" tabindex="0"
        @click="tempSelectedId = acc.id" @keydown.enter.prevent="tempSelectedId = acc.id">
        <div class="bank-acc-card__head">
          <div class="bank-acc-card__title-row">
            <BankOutlined class="bank-acc-card__icon" />
            <span class="bank-acc-card__title">{{ acc.accountType == 1 ? '基本账户' : '一般账户' }}</span>
          </div>
          <div class="card__tag card__default" v-if="acc.isDefault == 1">
            默认
          </div>
          <div class="card__tag card__backup" v-else>
            备用
          </div>
        </div>
        <div class="bank-acc-card__body">
          <div class="bank-acc-card__row">
            <span class="bank-acc-card__label">开户银行</span>
            <span class="bank-acc-card__value">{{ acc.accountOpen }}</span>
          </div>
          <div class="bank-acc-card__row">
            <span class="bank-acc-card__label">开户支行</span>
            <span class="bank-acc-card__value">{{ acc.accountOpenBranch }}</span>
          </div>
          <div class="bank-acc-card__row">
            <span class="bank-acc-card__label">银行账号</span>
            <span class="bank-acc-card__value">{{ acc.accountNumber }}</span>
          </div>
          <div class="bank-acc-card__row">
            <span class="bank-acc-card__label">账户名称</span>
            <span class="bank-acc-card__value">{{ acc.accountName }}</span>
          </div>
        </div>
        <div class="bank-acc-card__corner" aria-hidden="true">
          <CheckCircleFilled v-if="tempSelectedId === acc.id" class="bank-acc-card__check" />
          <span v-else class="bank-acc-card__radio" />
        </div>
      </div>
    </div>
    <template #footer>
      <a-button @click="close">取消</a-button>
      <a-button type="primary" @click="onOk">确定</a-button>

    </template>
  </a-modal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { BankOutlined, CheckCircleFilled } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

defineOptions({ name: 'SelectBankAccountModal' })

const props = defineProps({
  openState: { type: Boolean, default: false },
  /** 当前客商可选账户列表 */
  accounts: { type: Array, default: () => [] },
  /** 已选账户 id */
  selectedId: { type: [String, Number], default: '' },
})

const emit = defineEmits(['update:openState', 'confirm'])

const sortedAccounts = computed(() => {
  const list = [...(props.accounts || [])]
  list.sort((a, b) => (b.isDefault == 1 ? 1 : 0) - (a.isDefault == 1 ? 1 : 0))
  return list
})

const close = () => {
  emit('update:openState', false)
}
const tempSelectedId = ref('')

watch(
  () => props.openState,
  (v) => {
    if (!v) return
    tempSelectedId.value = props.selectedId
  }
)

function onOk() {
  if (!tempSelectedId.value) {
    message.warning('请选择银行账户')
    return
  }
  const obj = sortedAccounts.value.find((a) => a.id === tempSelectedId.value)
  emit('confirm', obj)
  close()
}
</script>

<style lang="scss" scoped>
.select-bank-account-modal__list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.bank-acc-card {
  position: relative;
  width: 400px;
  flex: 0 0 auto;
  width: 400px;
  // height: 160px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid #D9D9D9;
  padding: 10px;
  border-radius: 4px;

  &--active {
    background: #FAFBFF;
    border: 1px solid #4791FF;
    box-shadow: 0px 0px 1px 0px rgba(0, 0, 0, 0.08), 0px 1px 2px 0px rgba(0, 0, 0, 0.07), 0px 2px 4px 0px rgba(0, 0, 0, 0.05);
    border-radius: 4px;

  }
}

.bank-acc-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bank-acc-card__title-row {
  display: flex;
  align-items: center;
  min-width: 0;
}

.bank-acc-card__icon {
  font-size: 16px;
  color: var(--color-primary);
  margin-right: 4px;
}

.bank-acc-card__title {
  font-weight: 500;
  font-size: 14px;
}

.card__tag {
  border-radius: 4px;
  padding: 1px 8px;
  font-weight: 400;
  font-size: 12px;
  line-height: normal;
}

.card__default {
  background: #D0F6E0;
  color: #007F56;
}

.card__backup {
  background: #D9D9D9;
  color: rgba(0, 0, 0, 0.45);
}

.bank-acc-card__body {
  display: flex;
  flex-direction: column;
}

.bank-acc-card__row {
  display: flex;
  margin-top: 10px;
}

.bank-acc-card__label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  margin-right: 20px;
  line-height: normal;
}

.bank-acc-card__value {
  flex: 1;
  min-width: 0;
  line-height: normal;
}

.bank-acc-card__corner {
  position: absolute;
  right: 12px;
  bottom: 10px;
  line-height: 1;
}

.bank-acc-card__check {
  font-size: 20px;
  color: var(--color-primary, #1677ff);
}

.bank-acc-card__radio {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 1px solid #d9d9d9;
  border-radius: 50%;
  box-sizing: border-box;
  vertical-align: middle;
}
</style>
