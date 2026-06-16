import request from '@/http/index'

export function getBorrowingList(data) {
  return request({
    url: '/api/contractBorrow/list',
    method: 'get',
    params: data
  })
}
// 借阅详情
export function getBorrowingDetail(data) {
  return request({
    url: '/api/contractBorrow/detail',
    method: 'get',
    params: data
  })
}
// 借阅申请
export function addBorrowing(data) {
  return request({
    url: '/api/contractBorrow/save',
    method: 'post',
    data
  })
}
// 借阅删除
export function delBorrowing(data) {
  return request({
    url: '/api/contractBorrow/delete',
    method: 'post',
    data
  })
}
// 借阅审批
export function approveBorrowing(data) {
  return request({
    url: '/api/contractBorrow/approve',
    method: 'post',
    data
  })
}
