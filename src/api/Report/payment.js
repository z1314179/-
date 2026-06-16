import request from '@/http/index'

export function getReportPaymentList(data) {
  return request({
    url: '/api/contractReport/payment/list',
    method: 'get',
    params: data
  })
}
// 导出
export function exportReportPaymentList(data) {
  return request({
    url: '/api/contractReport/payment/export',
    method: 'get',
    params: data
  })
}