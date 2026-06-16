// 模块公用钩子
import { ref, onActivated, computed } from "vue";
import { getCompanyList } from "@/api/Settings/company";
import { getCustomerList } from "@/api/Basic/customer";
import { getMaycurTypeSearch } from "@/api/Contract/intention";
import { getTableList } from "@/api/users.js";
import useStore from "@/store/user.js";
import useTabs from "@/hook/useTabs.js";
import interfaceStore from "@/store/interface.js";

function getDeptListMap(arr) {
  return arr.reduce((acc, item) => {
    acc[item.id] = item;
    if (item.children) {
      acc = { ...acc, ...getDeptListMap(item.children) };
    }
    return acc;
  }, {});
}

const interfaceStores = interfaceStore();

function fn(arr, key = "value") {
  return arr.reduce((acc, item) => {
    acc[item[key]] = item;
    return acc;
  }, {});
}
// 意向合同状态
export function contractStatusAll() {
  const arr = [
    { label: "草稿", value: 0, class: "tag_cg" },
    { label: "审批中", value: 1, class: "tag_spz" },
    { label: "已通过", value: 2, class: "tag_wks" },
    { label: "已拒绝", value: 3, class: "tag_yjj" },
  ];
  return { arr, obj: fn(arr) };
}

export function categoryOptionsAll() {
  const arr = [
    { label: "销售合同", value: '1' },
    { label: "采购合同", value: '2' },
    { label: "营销服务合同", value: '3' },
    { label: "租赁合同", value: '4' },
    { label: "委托服务合同", value: '5' },
  ];
  return { arr, obj: fn(arr) };
}

export function contractPropertyOptionsAll() {
  const arr = [
    { label: "普通合同", value: "普通合同" },
    { label: "框架协议", value: "框架协议" },
    { label: "补充协议", value: "补充协议" },
  ];
  return { arr, obj: fn(arr) };
}

export function brandOptionsAll() {
  const arr = [
    { label: "INTOYOU", value: "INTOYOU" },
    { label: "轻预", value: "轻预" },
    { label: "乐理", value: "乐理" },
    { label: "欧芙芳", value: "欧芙芳" },
  ];
  return { arr, obj: fn(arr) };
}

/** 正式合同类型：1 新签 2 变更 3 续租 4 终止 */
export function contractTypeOptionsAll() {
  const arr = [
    { label: "新签", value: 1 },
    { label: "变更", value: 2 },
    { label: "续签", value: 3 },
    // { label: "终止", value: 4 },
  ];
  return { arr, obj: fn(arr) };
}

export function borrowStatusAll() {
  const arr = [
    { label: "草稿", value: 1, class: "tag_cg" },
    { label: "审批中", value: 2, class: "tag_spz" },
    { label: "未开始", value: 3, class: "tag_zxz" },
    { label: "借阅中", value: 4, class: "tag_zxz" },
    { label: "已到期", value: 5, class: "tag_ydq" },
    { label: "已拒绝", value: 6, class: "tag_yjj" },
  ];
  return { arr, obj: fn(arr) };
}

/** 模块加载时执行一次，与 hookMap() 返回中的静态字段为同一份引用 */
export const contractStatusList = contractStatusAll();
export const categoryOptionsWithAll = categoryOptionsAll();
export const contractPropertyOptionsWithAll = contractPropertyOptionsAll();
export const brandOptionsWithAll = brandOptionsAll();
export const contractTypeList = contractTypeOptionsAll();
export const borrowStatusList = borrowStatusAll();

/** 与 hookMap() 返回为同一份引用，供 schema 等模块静态引入 */
export const userOptionsWithAll = ref({ arr: [], obj: {} });
export const deptList = computed(() => interfaceStores.deptList);
export const deptListMap = computed(() => getDeptListMap(deptList.value || []));
export const userInfo = computed(() => interfaceStores.userInfo);
export const deptListOptions = computed(() => interfaceStores.userInfo.organizations || []);
export default function hookMap(types = []) {
  const { toBack, route } = useTabs({ dept: true, userType: true });
  const expenseTypeOptionsWithAll = ref({ arr: [], obj: {} });
  const expenseTypeOptionsWithAllfn = async () => {
    const { data } = await getMaycurTypeSearch();
    const arr = data.filter((e) => e.key);
    expenseTypeOptionsWithAll.value = {
      arr,
      obj: fn(arr, "key"),
    };
  };

  const supplierOptionsWithAll = ref({ arr: [], obj: {} });
  const supplierOptionsWithAllfn = async () => {
    const { data } = await getCustomerList({
      isPage: 0,
    });
    supplierOptionsWithAll.value = {
      arr: data,
      obj: fn(data, "id"),
    };
  };

  const subjectOptionsWithAll = ref({ arr: [], obj: {}, all: [] });
  const subjectOptionsWithAllfn = async () => {
    const { data } = await getCompanyList({
      isPage: 0,
    });
    const arr = data.filter((item) => item.status === 1);
    subjectOptionsWithAll.value = {
      arr,
      all: data,
      obj: fn(data, "id"),
    };
  };
  const userOptionsWithAllfn = async () => {
    const { data } = await getTableList({ isAll: 1 });
    userOptionsWithAll.value = {
      arr: data ?? [],
      obj: fn(data ?? [], "id"),
    };
  };

  onActivated(() => {
    types.forEach(async (type) => {
      if (type === 1) {
        subjectOptionsWithAllfn();
      } else if (type === 2) {
        supplierOptionsWithAllfn();
      } else if (type === 3) {
        expenseTypeOptionsWithAllfn();
      } else if (type === 4) {
        userOptionsWithAllfn();
      }
    });
  });

  return {
    toBack,
    route,
    deptListOptions,
    deptList,
    deptListMap,
    userInfo,
    contractStatusList,
    categoryOptionsWithAll,
    subjectOptionsWithAll,
    contractPropertyOptionsWithAll,
    brandOptionsWithAll,
    contractTypeList,
    supplierOptionsWithAll,
    borrowStatusList,
    expenseTypeOptionsWithAll,
    userOptionsWithAll,
  };
}

export {
  getTemplateCategoryList,
  mapIntentionContractDetailToFormValues,
  buildIntentionContractSubmitQuery,
} from "./contractProcessMap.js";
