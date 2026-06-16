import request from '@/http/index'

export function getLedgerList(data) {
  return request({
    url: '/api/asset/index',
    method: 'post',
    data,
  })
}
// 获取资产详情
export function getLedgerDetail(data) {
  return request({
    url: '/api/asset/info',
    method: 'post',
    data,
  })
}
// 新增资产
export function addLedger(data) {
  return request({
    url: '/api/asset/create',
    method: 'post',
    data,
  })
}
// 编辑资产
export function updateLedger(data) {
  return request({
    url: '/api/asset/update',
    method: 'post',
    data,
  })
}
// 删除资产
export function delLedger(data) {
  return request({
    url: '/api/asset/delete',
    method: 'post',
    data,
  })
}
// 更新状态
export function updateLedgerStatus(data) {
  return request({
    url: 'api/asset/operation',
    method: 'post',
    data,
  })
}
// 获取品牌
export function getBrandList(data) {
  return request({
    url: 'api/brand/index',
    method: 'post',
    data,
  })
}