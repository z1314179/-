// 模块公用钩子
import { ref, onActivated, } from "vue";
import { getCompanyList } from "@/api/Settings/company";
function fn(arr, key = "value") {
  return arr.reduce((acc, item) => {
    acc[item[key]] = item;
    return acc;
  }, {});
}
// 合同报表-合同状态
export function contractStatusAll() {
  const arr = [
    { label: "未开始", value: 10, },
    { label: "执行中", value: 11, },
    { label: "已终止", value: 5, },
    { label: "已到期", value: 4, },
    { label: "已拒绝", value: 3, },
    { label: "已变更", value: 6, },
    { label: "已续签", value: 7, },
  ];
  return { arr, obj: fn(arr) };
}


/** 模块加载时执行一次，与 hookMap() 返回中的静态字段为同一份引用 */
export const contractStatusList = contractStatusAll();

export default function hookMap(options = {}) {
  const { isCompany = false } = options;

  // 公司数据-我方主题
  const subjectOptionsWithAll = ref([]);
  const subjectOptionsWithAllfn = async () => {
    const { data } = await getCompanyList({
      isPage: 0,
    });
    subjectOptionsWithAll.value = data;
  };

  onActivated(() => {
    if (isCompany) {
      subjectOptionsWithAllfn()
    }
  });

  return {
    contractStatusList,
    subjectOptionsWithAll,
  };
}