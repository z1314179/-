
import { ref } from "vue";
function fn(arr, key = "value") {
  return arr.reduce((acc, item) => {
    acc[item[key]] = item;
    return acc;
  }, {});
}

// 合同类型
export function contractAll() {
  const arr = [
    { label: "全部", value: 0 },
    { label: "合同", value: 1 },
    { label: "意向合同", value: 2 },
    { label: "合同借阅", value: 3 },
    { label: "合同终止", value: 4 },
  ]
  return { arr, obj: fn(arr) };
}

export const contractList = contractAll();

export default function hookMap() {
  return {
    contractList,
  };
}