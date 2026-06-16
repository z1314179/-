import request from '@/http/index'
export function getToken(params) {
  return request({
    url: '/api/oss/getToken',
    method: 'get',
    params: {
      ...params
    }
  })
}