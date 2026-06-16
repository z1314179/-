function fn(arr) {
  return arr.reduce((acc, item) => {
    acc[item.value] = item.label
    return acc
  }, {})
}
export const roleTypes = () => {
  let arr = [
    {
      label: '合同类型',
      value: 0,
    }
  ]
  let obj = fn(arr)
  return {
    arr: arr,
    obj: obj,
  }
}