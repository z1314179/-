<template>
  <div class="company-info">
    <a-row>
      <a-col :span="8">
        <div class="flex align-center border item">
          <span class="label">社会统一信用代码</span>
          <span class="value flex-1">
            {{ formState.creditCode || "-" }}
          </span>
        </div>
      </a-col>
      <a-col :span="16">
        <div class="flex align-center border item">
          <span class="label">企业名称</span>
          <span class="value">{{ formState.name || "-" }}</span>
        </div>
      </a-col>
      <a-col :span="8">
        <div class="flex align-center border item">
          <span class="label flex align-center">法定代表人</span>
          <span class="value">{{ formState.legalPerson || "-" }}</span>
        </div>
      </a-col>
      <a-col :span="16">
        <div class="flex">
          <div class="flex-1">
            <div class="flex align-center border item">
              <span class="label">经营状态</span>
              <span class="value">
                {{ businessStatusList.obj[formState.status]?.label || "-" }}
              </span>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex align-center border item">
              <span class="label">成立日期</span>
              <span class="value">{{ formState.establishDate || "-" }}</span>
            </div>
          </div>
        </div>
        <div class="flex">
          <div class="flex-1">
            <div class="flex align-center border item">
              <span class="label">注册资本</span>
              <span class="value">{{ formState.registeMoney || "-" }}</span>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex align-center border item">
              <span class="label">所属行业</span>
              <span class="value">{{ formState.industry || "-" }}</span>
            </div>
          </div>
        </div>
      </a-col>
      <a-col :span="24">
        <div class="flex align-center border item">
          <span class="label">联系电话</span>
          <span class="value">{{ formState.mobile || "-" }}</span>
        </div>
      </a-col>
      <a-col :span="24">
        <div class="flex align-center border item">
          <span class="label">注册地址</span>
          <span class="value">{{
            formatAddress(
              formState.registeProvince,
              formState.registeCity,
              formState.registeAddress,
            )
          }}</span>
        </div>
      </a-col>
      <a-col :span="24">
        <div class="flex align-center border item">
          <span class="label">经营范围</span>
          <span class="value">{{ formState.businessScope || "-" }}</span>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref } from "vue";
import hookMap from "@/views/Basic/hookMap";

const { businessStatusList } = hookMap();

const props = defineProps({
  formState: Object,
});
const formatAddress = (province, city, detailAddress = "") => {
  const parts = [province, city, detailAddress].filter(Boolean);
  return parts.join("") || "-";
};
</script>

<style lang="scss" scoped>
.company-info {
  max-width: 1080px;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  .border {
    border-right: 1px solid rgba(0, 0, 0, 0.06);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
  .item {
    height: 100%;
    .label {
      height: 100%;
      background: #f3f9fc;
      padding: 5px 12px;
      width: 140px;
      flex-shrink: 0;
      border-right: 1px solid rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
    }
    .value {
      padding: 5px 12px;
      word-break: break-all;
      display: flex;
      align-items: center;
    }
  }
}
</style>
