import request from '@/http/index'
import interfaceStore from '@/store/interface.js'

export function getHomeApprovalList(params) {
  return request({
    url: '/api/home/approval/list',
    method: 'get',
    params,
  })
}

// 统计
export function getHomeStatisticsList(params) {
  return request({
    url: '/api/home/dashboard',
    method: 'get',
    params,
  }).then((res) => {
    const interfaceStores = interfaceStore()
    if (res?.data) {
      interfaceStores.setHomeStatisticsData(res.data)
    }
    return res
  })
}

// 预警列表
export function getHomeWarningList(params) {
  return request({
    url: '/api/warning/records',
    method: 'get',
    params,
  })
}

// 预警-已读更新
export function updateWarning(id, data) {
  return request({
    url: `/api/warning/records/${id}`,
    method: 'put',
    data,
  })
}

// 通知列表
export function getHomeNoticeList(params) {
  return request({
    url: '/api/system/notice',
    method: 'get',
    params,
  })
}

// 通知-已读更新
export function updateNotice(id, data) {
  return request({
    url: `/api/system/notice/${id}`,
    method: 'put',
    data,
  })
}
