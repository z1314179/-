export const validatorNumber = (rule, value) => {
    if (!rule.required) {
        return Promise.resolve();
    } else if (value === undefined || value === '' || value === null) {
        return Promise.reject(rule.messages === undefined ? '此为必填项' : rule.messages);
    } else if (Number(value) <= 0) {
        return Promise.reject('必须大于0');
    }
    return Promise.resolve();
}
export const validatorPhone = (rule, value) => {
    if (!rule.required) {
        return Promise.resolve();
    } else if (value === undefined || value === '' || value === null) {
        return Promise.reject(rule.messages === undefined ? '此为必填项' : rule.messages);
    } else if (!(/^1[3|4|5|6|7|8|9][0-9]\d{8}$/.test(value))) {
        return Promise.reject('请输入正确的手机号');
    }
    return Promise.resolve();
}
export const validatorNone = (rule, value) => {
    if (!rule.required) {
        return Promise.resolve();
    }
    if (value === undefined || value === '' || value === null) {
        return Promise.reject(rule.messages === undefined ? '此为必填项' : rule.messages);
    }
    return Promise.resolve();
}
// 验证数组长度
export const validatorArrayLength = (rule, value) => {
    if (!rule.required) {
        return Promise.resolve();
    }
    if (value.length === 0) {
        return Promise.reject(rule.messages === undefined ? '此为必填项' : rule.messages);
    }
    return Promise.resolve();
}