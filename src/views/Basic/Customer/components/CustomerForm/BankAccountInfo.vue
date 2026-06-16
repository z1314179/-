<template>
  <div class="bank-account-info flex flex-wrap">
    <div v-for="(item, index) in formState.supplierAccountsList" :key="index">
      <BankCard :data="item">
        <template #[slotName]>
          <div class="flex bank-item">
            <div class="flex-1" v-if="formState.type === 1">
              <div class="title">
                <i class="iconfont icon-yinhang" />
                {{ item.accountType === 1 ? "基本账户" : "一般账户" }}
              </div>
            </div>
            <div class="right">
              <i
                class="iconfont icon-bianji1 mg-l-small"
                @click="handleEdit(item, index)"
              />
              <a-popconfirm
                placement="top"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(index)"
              >
                <template #title>
                  <div>你确定要删除吗？</div>
                </template>
                <i class="iconfont icon-shanchu1 mg-l-10" />
              </a-popconfirm>
              <span
                class="text-spare mg-l-10"
                :class="{ 'text-default': item.isDefault }"
              >
                {{ item.isDefault ? "默认" : "备用" }}
              </span>
            </div>
          </div>
        </template>
      </BankCard>
    </div>
    <div class="flex align-center justify-center add-class" @click="handleAdd">
      <a-button type="link">+ 添加账户</a-button>
    </div>
  </div>
  <BankModal
    v-model:open="openState"
    :detailsInfo="cardData"
    :type="formState.type"
    @change="handleBankChange"
  />
</template>

<script setup>
import { ref, computed } from "vue";
import BankModal from "../../modals/BankModal.vue";
import BankCard from "../BankCard.vue";

const props = defineProps({
  title: String,
  formState: Object,
  formRef: {
    type: [Object, null],
    default: () => {
      return {};
    },
  },
});
const openState = ref(false);
const cardData = ref({});
const cardIndex = ref(null);

const handleSort = (index) => {
  props.formState.supplierAccountsList.sort((a, b) => {
    if (a.isDefault) {
      return -1;
    }
    return 1;
  });
};

const handleBankChange = async (val) => {
  if (val.isDefault) {
    props.formState.supplierAccountsList.forEach((item) => {
      if (item.isDefault) {
        item.isDefault = 0;
      }
    });
  }
  if (cardIndex.value != null) {
    props.formState.supplierAccountsList.splice(cardIndex.value, 1, { ...val });
  } else {
    props.formState.supplierAccountsList.push({ ...val });
  }
  await handleSort();
};
const handleAdd = () => {
  cardIndex.value = null;
  cardData.value = {};
  openState.value = true;
};
const handleDelete = (index) => {
  props.formState.supplierAccountsList.splice(index, 1);
};
const handleEdit = (record, index) => {
  cardIndex.value = index;
  cardData.value = { ...record };
  openState.value = true;
};
const slotName = computed(() =>
  props.formState.type === 1 ? "card-title" : "content-right",
);
</script>

<style lang="scss" scoped>
.bank-account-info {
  gap: 24px 24px;
  .mg-l-10 {
    margin-left: 10px;
  }
  .bank-item {
    .title {
      font-weight: 500;
      padding-bottom: 5px;
    }
    .right {
      .text-spare {
        background: #d9d9d9;
        border-radius: 4px;
        color: rgba(0, 0, 0, 0.45);
        font-size: 12px;
        padding: 0px 8px;
        line-height: 22px;
        display: inline-block;
      }
      .text-default {
        background: #d0f6e0;
        color: #007f56;
      }
    }
  }
  .add-class {
    background: #fafbff;
    border-radius: 4px;
    border: 1px dashed #cbe1ff;
    width: 400px;
    min-height: 124px;
  }
  .icon-bianji1,
  .icon-yinhang {
    color: #1677ff;
  }
  .icon-shanchu1 {
    color: #ee245e;
  }
}
</style>
