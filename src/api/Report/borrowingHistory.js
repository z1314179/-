import request from '@/http/index'

export function getReportBorrowingHistoryList(data) {
  return request({
    url: '/api/contractReport/borrowHistory/list',
    method: 'get',
    params: data
  })
}
// 导出
export function exportReportBorrowingHistoryList(data) {
  return request({
    url: '/api/contractReport/borrowHistory/export',
    method: 'get',
    params: data
  })
}
