<template>
  <div class="contact-info flex flex-wrap">
    <div v-for="(item, index) in formState.supplierPersonsList" :key="index">
      <ContactCard :data="item">
        <template #card-title>
          <div class="flex contact-item">
            <div class="flex-1 flex left">
              <span class="default-icon flex align-center justify-center">
                <i class="iconfont icon-geren" />
              </span>
              <div class="flex flex-column mg-l-small">
                <span class="name">{{ item.name }}</span>
                <span v-if="formState.type === 1">
                  {{ item.position }}
                </span>
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
              <span class="text-tag mg-l-10" v-if="item.isAuthorize">
                授权代表
              </span>
            </div>
          </div>
        </template>
      </ContactCard>
    </div>
    <div class="flex align-center justify-center add-class" @click="handleAdd">
      <a-button type="link">+ 添加联系人</a-button>
    </div>
  </div>
  <ContactModal
    v-model:open="openState"
    :detailsInfo="cardData"
    :type="formState.type"
    @change="handleContactChange"
  />
</template>

<script setup>
import { ref } from "vue";
import ContactModal from "../../modals/ContactModal.vue";
import ContactCard from "../ContactCard.vue";

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
  props.formState.supplierPersonsList.sort((a, b) => {
    if (a.isAuthorize) {
      return -1;
    }
    return 1;
  });
};

const handleContactChange = async (val) => {
  if (cardIndex.value != null) {
    props.formState.supplierPersonsList.splice(cardIndex.value, 1, { ...val });
  } else {
    if (val.isAuthorize) {
      props.formState.supplierPersonsList.forEach((item) => {
        if (item.isAuthorize) {
          item.isAuthorize = 0;
        }
      });
    }
    props.formState.supplierPersonsList.push({ ...val });
  }
  await handleSort();
};
const handleAdd = () => {
  cardIndex.value = null;
  cardData.value = {};
  openState.value = true;
};
const handleDelete = (index) => {
  props.formState.supplierPersonsList.splice(index, 1);
};
const handleEdit = (record, index) => {
  cardIndex.value = index;
  cardData.value = { ...record };
  openState.value = true;
};
</script>

<style lang="scss" scoped>
.contact-info {
  gap: 24px 24px;
  font-weight: 400;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.85);

  .mg-l-10 {
    margin-left: 10px;
  }

  .contact-item {
    .default-icon {
      background: rgba(22, 122, 255, 0.09);
      border-radius: 6px;
      color: var(--color-primary);
      padding: 2px;
      width: 32px;
      height: 32px;
      margin-top: 3px;
    }

    .text-default {
      background: #d0f6e0;
      color: #007f56;
      border-radius: 4px;
      padding: 1px 8px;
      font-weight: 400;
      font-size: 12px;
      line-height: 22px;
    }

    .left {
      margin-bottom: 8px;
    }

    .right {
      .text-tag {
        background: #d0f6e0;
        border-radius: 4px;
        color: #007f56;
        padding: 0 8px;
        line-height: 22px;
        height: 22px;
        display: inline-block;
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

  .name {
    font-weight: 500;
    font-size: 14px;
    line-height: 20px;
  }
  .icon-bianji1 {
    color: #1677ff;
  }
  .icon-shanchu1 {
    color: #ee245e;
  }
  .icon-geren {
    font-size: 27px;
  }
}
</style>
