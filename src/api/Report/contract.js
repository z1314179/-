import request from '@/http/index'

export function getReportContractList(data) {
  return request({
    url: '/api/contractReport/contract/list',
    method: 'get',
    params: data
  })
}
// 导出
export function exportReportContractList(data) {
  return request({
    url: '/api/contractReport/contract/export',
    method: 'get',
    params: data
  })
}