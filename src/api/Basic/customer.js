import request from '@/http/index'

export function getCustomerList(data) {
  return request({
    url: '/api/supplier/index',
    method: 'post',
    data,
  })
}
// 获取客户详情
export function getCustomerDetail(data) {
  return request({
    url: '/api/supplier/info',
    method: 'post',
    data,
  })
}
// 新增客户
export function addCustomer(data) {
  return request({
    url: '/api/supplier/create',
    method: 'post',
    data,
  })
}
// 编辑客户
export function updateCustomer(data) {
  return request({
    url: '/api/supplier/update',
    method: 'post',
    data,
  })
}
// 删除客户
export function delCustomer(data) {
  return request({
    url: '/api/supplier/delete',
    method: 'post',
    data,
  })
}
