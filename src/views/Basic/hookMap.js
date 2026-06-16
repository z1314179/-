function fn(arr, key = 'value') {
  return arr.reduce((acc, item) => {
    acc[item[key]] = item
    return acc
  }, {})
}

// 供应商管理-合作进度
export function cooperationProgressAll() {
  const arr = [
    { label: "未合作", value: 1, class: 'tag_whz' },
    { label: "洽谈中", value: 2, class: 'tag_qtz' },
    { label: "签约中", value: 3, class: 'tag_spz' },
    { label: "已签约", value: 4, class: 'tag_zxz' },
    { label: "已终止", value: 5, class: 'tag_ydq' }
  ]
  return { arr: arr, obj: fn(arr) }
}
// 供应商管理-客商类型
export function guestTypeAll() {
  const arr = [
    { label: "企业", value: 1 },
    { label: "达人", value: 3 },
    { label: "个人", value: 2 },
  ]
  return { arr: arr, obj: fn(arr) }
}
// 供应商管理-客商分类
export function guestClassifyAll() {
  const arr = [
    // { label: "渠道客户", value: 1 },
    // { label: "供应商", value: 2 },
    // { label: "内部组织", value: 3 }
    { label: "内部客商", value: 'AA' },
    { label: "内料供应商", value: 'BB' },
    { label: "内包供应商", value: 'CC' },
    { label: "外包供应商", value: 'DD' },
    { label: "辅料供应商", value: 'EE' },
    { label: "丽知商城客户", value: 'FF' },
    { label: "渠道采购供应商", value: 'GG' },
    { label: "TOC客户", value: 'HH' },
    { label: "TOB客户", value: 'II' },
    { label: "服务类供应商", value: 'JJ' },
    { label: "其它供应商", value: 'KK' },
    { label: "其它客户", value: 'LL' },
    { label: "个人", value: 'MM' },
    { label: "周边品供应商", value: 'NN' }
  ]
  return { arr: arr, obj: fn(arr) }
}
// 供应商管理-引入渠道
export function importChannelAll() {
  const arr = [
    { label: "公开招标", value: 1 },
    { label: "友商介绍", value: 2 },
    { label: "社交媒体", value: 3 },
    { label: "搜索引擎", value: 4 }
  ]
  return { arr: arr, obj: fn(arr) }
}
// 供应商管理-经营状态
export function businessStatusAll() {
  const arr = [
    { label: "注册", value: 1 },
    { label: "装修", value: 2 },
    { label: "开业", value: 3 },
    { label: "在营", value: 4 },
    { label: "停止经营", value: 5 }
  ]
  return { arr: arr, obj: fn(arr) }
}
// 供应商管理-结算方式
export function settlementMethodAll() {
  const arr = [
    { label: "固定佣金", value: 1 },
    { label: "佣金+抽成", value: 2 },
    { label: "抽成", value: 3 }
  ]
  return { arr: arr, obj: fn(arr) }
}

// 客商管理-证件类型
export function idCardTypeAll() {
  const arr = [
    { label: "身份证", value: 1 },
    { label: "护照", value: 2 },
    { label: "驾驶证", value: 3 },
  ]
  return { arr: arr, obj: fn(arr) }
}
// 客商管理-交易状态
export function tradeStatusAll() {
  const arr = [
    { label: "未付款", value: 0 },
    { label: "已付款", value: 1 },
    { label: "已作废", value: 2 },
  ]
  return { arr: arr, obj: fn(arr) }
}

/** 模块加载时执行一次，与 hookMap() 返回字段一致，可按需 import { cooperationProgressList } … */
export const cooperationProgressList = cooperationProgressAll()
export const guestTypeList = guestTypeAll()
export const guestClassifyList = guestClassifyAll()
export const importChannelList = importChannelAll()
export const businessStatusList = businessStatusAll()
export const settlementMethodList = settlementMethodAll()
export const idCardTypeList = idCardTypeAll()
export const tradeStatusList = tradeStatusAll()

export default function hookMap() {
  return {
    cooperationProgressList,
    guestTypeList,
    guestClassifyList,
    importChannelList,
    businessStatusList,
    settlementMethodList,
    idCardTypeList,
    tradeStatusList,
  };
}
