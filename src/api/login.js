import request from '@/http/index'
export function toLogin(params) {
  return request({
    url: '/api/auth/login',
    method: 'POST',
    data: {
      ...params
    }
  })
}
export function confirmAuth(params) {
  return request({
    url: '/api/auth/confirmAuth',
    method: 'POST',
    data: {
      ...params
    }
  })
}
export function ddLogin(data) {
  return request({
    url: '/api/auth/dingLogin',
    method: 'POST',
    data: data
  })
}
export function getUserInfo(data) {
  return request({
    url: '/api/auth/info',
    method: 'get',
    params: data
  })
}

// 重置密码
export function resetPassword(data) {
  return request({
    url: '/api/auth/reset',
    method: 'get',
    params: data
  })
}

// 首次登陆重置密码
export function resetPasswordFirst(data) {
  return request({
    url: '/api/auth/changePassword',
    method: 'post',
    data: data
  })
}