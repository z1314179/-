// 模块公用钩子
import { ref, onActivated } from 'vue'
import { getCompanyList } from '@/api/Settings/company'

function fn(arr, key = 'value') {
  return arr.reduce((acc, item) => {
    acc[item[key]] = item
    return acc
  }, {})
}

// 公司管理-银行账户类型
export function bankAccountTypeAll() {
  const arr = [
    { label: "基本账户", value: 1 },
    { label: "一般账户", value: 2 },
  ]
  return { arr, obj: fn(arr) }
}

// 公司管理-银行账户默认账户
export function bankAccountDefault() {
  const arr = [
    { label: "是", value: 1 },
    { label: "否", value: 0 },
  ]
  return { arr, obj: fn(arr) }
}

// 预警管理-预警类型
export function alertTypeAll() {
  const arr = [
    { label: "合同到期预警", value: 1 },
    { label: "收款预警", value: 2 },
    { label: "付款预警", value: 3 },
  ]
  return { arr, obj: fn(arr) }
}

// 预警管理-生效状态
export function alertStatusAll() {
  const arr = [
    { label: "生效", value: 1 },
    { label: "失效", value: 2 },
  ]
  return { arr, obj: fn(arr) }
}

// 用户管理-数据权限
// 1全部，2本部门及下级，3本部门，4本人
export function dataPermissionsAll() {
  const arr = [
    { label: "全部", value: 1 },
    { label: "所在部门及下级部门", value: 2 },
    { label: "所在部门", value: 3 },
    { label: "仅个人", value: 4 },
  ]
  return { arr, obj: fn(arr) }
}
// 预警管理-预警规则
export function alertRuleAll() {
  const arr = [
    { label: "到期前", value: 1 },
    { label: "到期后", value: 2 },
  ]
  return { arr, obj: fn(arr) }
}

// 数据管理-处理类型
export function dealTypeAll() {
  const arr = [
    { label: "转移", value: 1 },
    { label: "共享", value: 2 },
  ]
  return { arr, obj: fn(arr) }
}

/** 模块加载时执行一次，与 hookMap() 返回字段为同一份引用 */
export const alertTypeList = alertTypeAll()
export const alertStatusList = alertStatusAll()
export const alertRuleList = alertRuleAll()
export const dealTypeList = dealTypeAll()

export const bankAccountTypeList = bankAccountTypeAll()
export const bankAccountDefaultList = bankAccountDefault()
export const dataPermissionsList = dataPermissionsAll()

export default function hookMap(option = {}) {
  const { isCompany = false } = option
  const companyListAll = ref({ arr: [], obj: {}, all: [] })
  const getCompanyListAll = async () => {
    const { data } = await getCompanyList({
      isPage: 0,
    })
    companyListAll.value = {
      arr: data.filter(item => item.status === 1),
      all: data,
      obj: fn(data, 'id'),
    }
  }

  onActivated(() => {
    if (isCompany) {
      getCompanyListAll()
    }
  })

  return {
    dataPermissionsList,
    companyListAll,
    bankAccountTypeList,
    bankAccountDefaultList,
    alertTypeList,
    alertStatusList,
    alertRuleList,
    dealTypeList,
  }
}
