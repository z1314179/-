// 模块公用钩子
import { ref, onActivated } from 'vue'
import { getCompanyList } from '@/api/Settings/company'

function fn(arr, key = 'value') {
  return arr.reduce((acc, item) => {
    acc[item[key]] = item
    return acc
  }, {})
}

// 数字资产管理-资产类型
export function assetTypeAll() {
  const arr = [
    { label: "板块合规", value: 1 },
    { label: "联名台账", value: 2 },
    { label: "诉讼案件", value: 3 },
    { label: "办公文件", value: 4 },
    { label: "知识储能", value: 5 },
    { label: "知识产权", value: 6 },
    { label: "荣誉奖项", value: 7 },
  ]
  return { arr, obj: fn(arr) }
}

// 数字资产管理-状态
export function assetStatusAll() {
  const arr = [
    { label: "有效", value: 1 },
    { label: "失效", value: 0 },
  ]
  return { arr, obj: fn(arr) }
}

/** 模块加载时执行一次，与 hookMap() 返回中的静态字段为同一份引用 */
export const assetTypeList = assetTypeAll()
export const assetStatusList = assetStatusAll()

export default function hookMap(option = {}) {
  const { isCompany = false } = option
  const companyListAll = ref({ arr: [], obj: {} })
  const getCompanyListAll = async () => {
    const { data } = await getCompanyList({
      isPage: 0,
    })
    companyListAll.value = {
      arr: data,
    }
  }

  onActivated(() => {
    if (isCompany) {
      getCompanyListAll()
    }
  })

  return {
    assetTypeList,
    assetStatusList,
    companyListAll,
  }
}
