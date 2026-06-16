<template>
  <a-modal :open="open" wrap-class-name="partner_info_modal" title="客商信息" width="1000px" @cancel="close">

    <div class="partner-modal-body flex flex-column">
      <a-tabs v-model:activeKey="companyKey" v-if="tabState" @change="handleTabChange">
        <a-tab-pane v-for="value in bankPickerRows" :key="value.id" :tab="value.counterpartyName || '-'" />
      </a-tabs>
      <div class="mg-y-medium">
        <a-radio-group @change="handleRadioChange" v-model:value="activeTab" button-style="solid"
          class="radio_group_bg">
          <a-radio-button value="info">客商信息</a-radio-button>
          <a-radio-button value="history">历史合作信息</a-radio-button>
        </a-radio-group>
      </div>
      <a-form class="info_form" size="small" v-if="activeTab === 'info'">
        <div class="partner-info-section">
          <div class="flex align-center">
            <span class="section_text_small">基础信息</span>
          </div>
          <a-row :gutter="[16, 0]" class="info_form_row">
            <a-col :span="item.span" v-for="(item, index) in baseInfoFields" :key="index">
              <a-form-item :label="item.label">{{ detail[item.key] || '—' }}</a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="partner-info-section">
          <div class="flex align-center">
            <span class="section_text_small">银行账户信息</span>
          </div>
          <a-row :gutter="[16, 0]" class="info_form_row">
            <a-col :span="7">
              <a-form-item label="账户名称">{{ detail.supplierAccountsObj.accountName || '—' }}</a-form-item>
            </a-col>
            <a-col :span="7">
              <a-form-item label="开户银行">{{ detail.supplierAccountsObj.accountOpen || '—' }}</a-form-item>
            </a-col>
            <a-col :span="10">
              <a-form-item label="开户支行">{{ detail.supplierAccountsObj.accountOpenBranch || '—' }}</a-form-item>
            </a-col>
            <a-col :span="24">
              <a-form-item label="银行账号">{{ detail.supplierAccountsObj.accountNumber || '—' }}</a-form-item>
            </a-col>
          </a-row>
        </div>

        <div class="partner-info-section">
          <div class="flex align-center">
            <span class="section_text_small">联系人信息</span>
          </div>
          <a-row :gutter="[16, 0]" class="info_form_last">
            <a-col :span="7">
              <a-form-item label="联系人">{{ detail.supplierPersonsObj.name || '—' }}</a-form-item>
            </a-col>
            <a-col :span="7">
              <a-form-item label="联系电话">{{ detail.supplierPersonsObj.mobile || '—' }}</a-form-item>
            </a-col>
            <a-col :span="10">
              <a-form-item label="邮箱">{{ detail.supplierPersonsObj.email || '—' }}</a-form-item>
            </a-col>
            <a-col :span="24">
              <a-form-item label="联系地址">{{ detail.supplierPersonsObj.address || '—' }}</a-form-item>
            </a-col>
          </a-row>
        </div>
      </a-form>
      <div class="card_table" v-if="activeTab === 'history'">
        <a-table row-key="id" :columns="columns" :data-source="dataSource" :loading="loadTable"
          :pagination="searchQuery" @change="handleTableChange">
          <template #bodyCell="{ column, text, record }">
            <template v-if="column.dataIndex === 'contractNo'">
              <a-button v-if="record.id" type="link" class="pd-0" @click="goContractDetail(record)">
                {{ text || '-' }}
              </a-button>
              <span v-else>{{ text || '-' }}</span>
            </template>
            <template v-else-if="column.dataIndex === 'status'">
              <span class="tag_base" :class="contractStatusObj[text]?.class || ''">
                {{ contractStatusObj[text]?.label || "-" }}
              </span>

            </template>
            <template v-else>{{ text }}</template>
          </template>
        </a-table>
      </div>
    </div>
    <template #footer>
      <a-button @click="close">关闭</a-button>
    </template>
  </a-modal>
</template>

<script setup>
import { idCardTypeList } from "@/views/Basic/hookMap.js";
import { computed, ref, watch } from 'vue'
import useTable from '@/hook/useTable.js'
import { nFormat } from "@/utils/com.js";
defineOptions({ name: 'PartnerInfoModal' })
import { getCustomerDetail } from "@/api/Basic/customer.js";
const props = defineProps({
  open: { type: Boolean, default: false },
  /** 每项含 key、label、各展示字段、historyList（由使用页传入） */
  bankPickerRows: { type: Array, default: () => [] },
  tabState: { type: Boolean, default: false },
})
import { contractStatusFn } from "@/utils/codeMap/basic.js";
const { contractStatusObj } = contractStatusFn();
const emit = defineEmits(['update:open'])

const companyKey = ref('')
const activeTab = ref('info')
const detail = ref({
  supplierAccountsObj: {},
  supplierPersonsObj: {}
})
const baseInfoFields = computed(() => {
  let arr = [{
    label: '税号',
    key: 'creditCode',
    span: 7
  },
  {
    label: '法定代表人',
    key: 'legalPerson',
    span: 7
  },
  {
    label: '注册地址',
    key: 'registerAddressText',
    span: 10
  },
  {
    label: '联系电话',
    key: 'mobile',
    span: 7
  },
  {
    label: '合作内容',
    key: 'cooperateContent',
    span: 17
  }]
  if (detail.value.type == 2) {
    arr = [
      {
        label: '客商名称',
        key: 'name',
        value: '',
        span: 7

      },
      {
        label: '证照类型',
        key: 'licenseType',
        value: '',
        span: 7
      },
      {
        label: '证照号码',
        key: 'licenseCode',
        value: '',
        span: 10
      }, {
        label: '联系电话',
        key: 'mobile',
        value: '',
        span: 7
      },
      {
        label: '合作内容',
        key: 'cooperateContent',
        value: '',
        span: 10
      }
    ]
  } else if (detail.value.type == 3) {
    arr = [
      {
        label: '客商名称',
        key: 'name',
        value: '',
        span: 7
      },
      {
        label: '证照类型',
        key: 'licenseType',
        value: '',
        span: 7
      },
      {
        label: '证照号码',
        key: 'licenseCode',
        value: '',
        span: 10
      }, {
        label: '联系电话',
        key: 'mobile',
        value: '',
        span: 7
      }, {
        label: '达人机构',
        key: 'platform',
        value: '',
        span: 7
      }, {
        label: '合作内容',
        key: 'cooperateContent',
        value: '',
        span: 17
      }
    ]
  }
  arr = arr.map(item => {
    return {
      label: item.label,
      key: item.key,
      value: detail.value[item.key],
      span: item.span
    }
  })
  return arr
}
)
const handleTabChange = (key) => {
  const row = props.bankPickerRows.find(item => item.id === key)
  if (row) {
    if (activeTab.value === 'info') {
      getDetail(row)
    } else {
      search()
    }
  }
}
const handleRadioChange = (key) => {
  const row = props.bankPickerRows.find(item => item.id === companyKey.value)
  if (row) {
    if (activeTab.value === 'info') {
      getDetail(row)
    } else {
      search()
    }
  }
}
const columns = [
  {
    title: "合同编号",
    dataIndex: "contractNo",
    key: "contractNo",
    width: 200,
  },
  {
    title: "合同名称",
    dataIndex: "contractName",
    key: "contractName",
    width: 200,
  },
  {
    title: "签订日期",
    dataIndex: "signDate",
    key: "signDate",
    width: 200,
  },
  {
    title: "金额(元)",
    dataIndex: "amountTaxIncluded",
    key: "amountTaxIncluded",
    width: 200,
    customRender: ({ record }) => nFormat(record.amountTaxIncluded) || "0.00",
  },
  {
    title: "合同状态",
    dataIndex: "status",
    key: "status",
    width: 200,
  },
];
const historyGetApi = async (query) => {
  const { data } = await getCustomerDetail(query);
  return { data: data.contractList.data, total: data.contractList.total }
}
const getSearchQuery = (query) => {
  return { ...query, id: companyKey.value };
};
const {
  dataSource,
  searchQuery,
  handleTableChange,
  getList,
  search,
  loadTable,
  toRouterQuery,
} = useTable(historyGetApi, {
  current: 1,
  pageSize: 8,
  pageSizeOptions: ['8', '10', '20', '50'],
}, { getSearchQuery: getSearchQuery });

const getDetail = async (row) => {
  const res = await getCustomerDetail({ id: row.id })
  let bankInfoId = row.bankInfo.id
  res.data.supplierAccountsObj = {}
  res.data.supplierPersonsObj = {}
  if (res.data.licenseType) {
    res.data.licenseType = idCardTypeList.obj[res.data.licenseType].label
  }
  const { registeProvince, registeCity, registeAddress } = res.data
  res.data.registerAddressText = `${registeProvince || ''}${registeCity || ''}${registeAddress || ''}`
  if (bankInfoId) {
    res.data.supplierAccountsObj = res.data.supplierAccounts.find(item => item.id === bankInfoId) || {}
  }
  if (res.data.supplierPersons?.length) {
    res.data.supplierPersonsObj = res.data.supplierPersons[0]
    if (res.data.supplierPersons.length > 1) {
      let obj = res.data.supplierPersons.find(item => item.isAuthorize === 1)
      if (obj) {
        res.data.supplierPersonsObj = obj
      }
    }
  }
  detail.value = res.data
}
watch(
  () => props.open,
  (v) => {
    if (v) {
      activeTab.value = 'info'
      companyKey.value = props.bankPickerRows[0].id
      getDetail(props.bankPickerRows[0])
    }
  }
)

// watch([() => props.open, companyKey, activeTab], () => {
//   if (props.open && activeTab.value === 'history') getList()
// })

function close() {
  emit('update:open', false)
}

function goContractDetail(record) {
  close()
  toRouterQuery('/contract/lifecycle/detail', { id: record.id })
}
</script>

<style lang="scss">
.partner_info_modal {
  .ant-modal-body {
    padding: 0 16px 16px !important;


  }
}
</style>
<style lang="scss" scoped>
.partner-modal-body {
  max-height: 70vh;
}

.info_form {
  .info_form_row {
    padding: 4px 0;
  }

  .info_form_last {
    padding-top: 4px;
  }
}
</style>
