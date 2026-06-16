// import { fn } from "./index.js";
function fn(arr, key = 'label') {
  return arr.reduce((acc, item) => {
    acc[item.value] = item[key] || item
    return acc
  }, {})
}

// 合同状态
export const contractStatusFn = () => {
  const arr = [
    { label: "草稿", value: 0, class: 'tag_cg' },
    { label: "审批中", value: 1, class: 'tag_spz' },
    { label: "未开始", value: 10, class: 'tag_wks' },
    { label: "执行中", value: 11, class: 'tag_zxz' },
    { label: "已终止", value: 5, class: 'tag_yzz' },
    { label: "已到期", value: 4, class: 'tag_ydq' },
    { label: "已拒绝", value: 3, class: 'tag_yjj' },
    { label: "已变更", value: 6, class: 'tag_ybg' },
    { label: "已续签", value: 7, class: 'tag_yxz' },
    // { label: "已作废", value: 8, class: 'tag_yzf' },
    // { label: "审批通过", value: 2, class: 'tag_sptg' },
  ]
  return { contractStatusList: arr, contractStatusObj: fn(arr, null) }
}
// 货币类型（与后端 ISO 4217 代码对应）
export const currencyFn = () => {
  const arr = [
    { label: '人民币', value: 'CNY' },
    { label: '美元', value: 'USD' },
    { label: '欧元', value: 'EUR' },
    { label: '英镑', value: 'GBP' },
    { label: '日元', value: 'JPY' },
    { label: '港币', value: 'HKD' },
    { label: '澳门元', value: 'MOP' },
    { label: '新台币', value: 'TWD' },
    { label: '新加坡元', value: 'SGD' },
    { label: '澳大利亚元', value: 'AUD' },
    { label: '加拿大元', value: 'CAD' },
    { label: '瑞士法郎', value: 'CHF' },
    { label: '韩元', value: 'KRW' },
    { label: '泰铢', value: 'THB' },
    { label: '马来西亚林吉特', value: 'MYR' },
    { label: '越南盾', value: 'VND' },
    { label: '印尼盾', value: 'IDR' },
    { label: '菲律宾比索', value: 'PHP' },
    { label: '新西兰元', value: 'NZD' },
    { label: '阿联酋迪拉姆', value: 'AED' },
  ]
  return { currencyList: arr, currencyObj: fn(arr) }
}