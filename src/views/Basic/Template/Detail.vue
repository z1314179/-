<template>
  <div>
    <div class="page-content">
      <a-form class="form-meta-form " ref="formRef" :model="formState">
        <a-card title="模版信息" :bordered="false" class="info_form">
          <div class="flex flex-wrap">
            <a-form-item style=" width: 360px" name="templateName" label="模版名称">
              {{ formState.templateName }}
            </a-form-item>
            <a-form-item style=" width: 360px" name="type" label="模版分类">
              {{ formState.type === 1 ? '合同' : '资产台账' }}
            </a-form-item>
            <a-form-item style=" width: 360px" v-if="formState.type === 1" name="templateId" label="模版ID">
              {{ formState.dingProcessCode }}
            </a-form-item>
            <a-form-item style=" width: 360px" name="enabled" label="是否启用">

              {{ formState.status === 1 ? '是' : '否' }}

            </a-form-item>
          </div>
          <a-form-item style="width: 100%" name="description" label="模版描述">
            {{ formState.templateDescription }}
          </a-form-item>

          <a-form-item style="width: 100%" name="organizationIds" label="适用部门" v-if="formState.type === 1">
            {{formState.departments?.map(item => item.departmentName).join('、')}}
          </a-form-item>

        </a-card>
        <a-card title="附件" :bordered="false" class="mg-t-small card-content">

          <div class="flex flex-wrap">
            <div style="width:367px" class="flex mg-x-medium mg-y-small" v-for="(item, index) in formState.file"
              :key="index">
              <!-- <FileRow :showDownload="PERM('模版附件下载')" :showRemove="false" :item="item" /> -->
              <FileRowItem class="flex-1" style="min-width:0;" :item="item">
              </FileRowItem>
              <div class="pd-l-medium flex align-center">
                <i @click="handleDownload(item)" class="iconfont icon-xiazai" style="color:rgba(0,0,0,0.45)">
                </i>
              </div>
            </div>

          </div>

        </a-card>
        <a-card title="业务变量" :bordered="false" class="mg-t-small card-content">
          <VariableSection :templateCategory="1" :options="businessVariableOptions" />
        </a-card>
        <a-card title="财务变量" :bordered="false" class="mg-t-small card-content">
          <VariableSection :templateCategory="1" :options="financeVariableOptions" />
        </a-card>


      </a-form>
    </div>
    <div class="page-content-footer">
      <a-button type="default" @click="toBack()">关闭</a-button>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'BasicTemplateDetailPage'
})
import FileRowItem from '@/components/upload/FileRowItem.vue'
import { onActivated, ref, inject } from 'vue'
const PERM = inject('PERM');
import { getTemplateDetail } from "@/api/Basic/template.js";
import FileRow from '@/components/upload/FileRow.vue'
import VariableSection from './common/VariableSection.vue'
import useTabs from '@/hook/useTabs.js'
import { getTemplateCategoryList } from '@/views/Contract/contractProcessMap.js'
import { downloadFile } from '@/utils/preview.js'
const { toBack, route } = useTabs()

const formRef = ref(null)

const businessVariableOptions = ref([])
const financeVariableOptions = ref([])

const formState = ref({
  file: [],
})

const handleDownload = (item) => {
  downloadFile(item)
}
const getTemplateCategoryLists = async () => {
  const { businessVariableOptions: biz, financeVariableOptions: fin } =
    await getTemplateCategoryList(
      {
        type: formState.value.type,
        dingProcessCode: formState.value.dingProcessCode,
      },
      {},
    )
  businessVariableOptions.value = biz ?? []
  financeVariableOptions.value = fin ?? []
}

const getInfo = async () => {
  const res = await getTemplateDetail({ id: route.query.id })
  if (res.errno !== 0) return
  formState.value = res.data
  businessVariableOptions.value = []
  financeVariableOptions.value = []
  if (res.data.templateContent) {
    try {
      const templateContent = JSON.parse(res.data.templateContent)
      businessVariableOptions.value = templateContent.businessVariableOptions ?? []
      financeVariableOptions.value = templateContent.financeVariableOptions ?? []
    } catch {
      /* empty */
    }
  } else if (res.data.type === 1 && res.data.dingProcessCode) {
    await getTemplateCategoryLists()
  }
}

onActivated(() => {
  if (route.query.id) getInfo()
})
</script>

<style lang="scss" scoped>
.page-content {
  :deep(.ant-form-item) {
    margin-right: 40px;

  }

  .card-content {
    :deep(.ant-card-body) {
      padding: 8px;
    }
  }
}
</style>
