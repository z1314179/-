// 意向/正式合同：字段配置、AI 解析 fieldMap、操作日志字段名映射

import {
  categoryOptionsWithAll,
  contractPropertyOptionsWithAll,
  brandOptionsWithAll,
  userOptionsWithAll,
  deptList,
} from "../hookMap.js";
import { currencyFn } from "@/utils/codeMap/basic.js";

const { currencyList } = currencyFn();

function flattenDeptOptions(arr, result = []) {
  for (const item of arr || []) {
    result.push({ label: item.name, value: item.id });
    if (item.children?.length) flattenDeptOptions(item.children, result);
  }
  return result;
}

// ---------------------------------------------------------------------------
// 选项常量
// ---------------------------------------------------------------------------

/** 财务区税率下拉选项 */
export const financeTaxRateOptions = [
  { label: "0%", value: "0.00" },
  { label: "1%", value: "0.01" },
  { label: "6%", value: "0.06" },
  // { label: "9%", value: "0.09" },
  { label: "13%", value: "0.13" },
];

/** 付款条件下拉选项 */
export const financePaymentConditionOptions = [
  { label: "先款后票", value: "1" },
  { label: "先票后款", value: "2" },
];

/** 发票类型下拉选项 */
export const financeInvoiceTypeOptions = [
  { label: "增值税普通发票", value: "1" },
  { label: "增值税专用发票", value: "2" },
];

/** 收付计划类型（付款/收款） */
export const intentionPlanTypeRadioOptions = [
  { label: "付款（支出）", value: "1" },
  { label: "收款（收入）", value: "2" },
];

/** 合同金额为 0 时不必填；函数 rules 随 formState 重算 */
function getFinanceRequiredRulesWhenAmountNonZero(formState, { message, trigger = "change" }) {
  const amount = Number(formState?.amountTaxIncluded) || 0
  if (amount === 0) return []
  return [{ required: true, message, trigger }]
}

export function getTaxRateRules(formState) {
  return getFinanceRequiredRulesWhenAmountNonZero(formState, { message: "请选择税率" })
}

export function getPaymentConditionRules(formState) {
  return getFinanceRequiredRulesWhenAmountNonZero(formState, { message: "请选择付款条件" })
}

export function getInvoiceTitleRules(formState) {
  return getFinanceRequiredRulesWhenAmountNonZero(formState, { message: "请输入发票抬头", trigger: "blur" })
}

export function getInvoiceTypeRules(formState) {
  return getFinanceRequiredRulesWhenAmountNonZero(formState, { message: "请选择发票类型" })
}

// ---------------------------------------------------------------------------
// 字段配置：基础信息
// ---------------------------------------------------------------------------

/** 基础信息区字段顺序与校验、解析配置（顺序即表单展示顺序） */
export const intentionBaseFormFieldSequence = [
  {
    rowType: "field",
    name: "contractName",
    label: "合同名称",
    fieldType: "input",
    rules: [{ required: true, message: "请输入合同名称", trigger: "blur" }],
    placeholder: "请输入合同名称",
    detail: false,
    parse: true,
    parsePrompt: "合同名称",
  },
  {
    rowType: "field",
    name: "contractCategory",
    label: "合同分类",
    fieldType: "select",
    options: categoryOptionsWithAll.arr,
    optionsFrom: "category",
    rules: [{ required: true, message: "请选择合同分类", trigger: "change" }],
    placeholder: "请选择合同分类",
    detail: true,
    parse: true,
    parsePrompt:
      '合同分类（值为"1"对应销售合同、"2"对应采购合同、"3"对应营销服务合同、"4"对应租赁合同、"5"对应委托服务合同）',
  },
  {
    rowType: "field",
    name: "contractAttribute",
    label: "合同属性",
    fieldType: "select",
    options: contractPropertyOptionsWithAll.arr,
    optionsFrom: "contractProperty",
    disabledKey: "合同属性",
    rules: [{ required: true, message: "请选择合同属性", trigger: "change" }],
    placeholder: "请选择合同属性",
    detail: true,
    parse: true,
    parsePrompt: "合同属性（必须是 普通合同、框架协议、补充协议）",
  },
  {
    rowType: "field",
    name: "brandName",
    label: "品牌",
    fieldType: "select",
    options: brandOptionsWithAll.arr,
    optionsFrom: "brand",
    disabledKey: "品牌",
    rules: [{ required: true, message: "请选择品牌", trigger: "change" }],
    placeholder: "请选择品牌",
    detail: true,
    parse: true,
    parsePrompt: "品牌（必须是 INTOYOU、轻预、乐理、欧芙芳）",
  },
  {
    rowType: "field",
    name: "contractDateRange",
    label: "合同起止日期",
    fieldType: "rangePicker",
    rules: [
      { required: true, message: "请选择合同起止日期", trigger: "change" },
    ],
    placeholder: "",
    detail: false,
    parse: true,
    parsePrompt: "合同起止日期（数组[yyyy-mm-dd,yyyy-mm-dd]）",
  },
  {
    rowType: "field",
    name: "contractMonths",
    label: "合同期限(月)",
    fieldType: "computed",
    computedKey: "computedContractMonths",
    rules: [],
    placeholder: "-",
    detail: false,
    parse: false,
  },
  {
    rowType: "field",
    name: "signUserName",
    label: "合同签署人",
    fieldType: "input",
    rules: [{ required: true, message: "请输入我方签署人", trigger: "blur" }],
    placeholder: "请输入我方签署人",
    detail: true,
    parse: true,
    parsePrompt: "合同签署人",
  },
  {
    rowType: "field",
    name: "signDate",
    label: "签约日期",
    fieldType: "datePicker",
    rules: [{ required: true, message: "请选择签约日期", trigger: "change" }],
    placeholder: "年/月/日",
    detail: false,
    parse: true,
    parsePrompt: "签约日期（yyyy-mm-dd）",
  },
  {
    rowType: "field",
    name: "handlerUserId",
    label: "经办人",
    fieldType: "select",
    optionsFrom: "user",
    selectFieldNames: { label: "userName", value: "id" },
    rules: [{ required: true, message: "请选择经办人", trigger: "change" }],
    placeholder: "请选择经办人",
    detail: false,
    parse: false,
  },
  {
    rowType: "field",
    name: "handlerDeptId",
    label: "经办部门",
    fieldType: "select",
    optionsFrom: "dept",
    selectFieldNames: { label: "name", value: "id" },
    rules: [{ required: true, message: "请选择经办部门", trigger: "change" }],
    placeholder: "请选择经办部门",
    detail: false,
    parse: false,
  },
  {
    rowType: "field",
    name: "changeEffectiveDate",
    label: "生效日期",
    fieldType: "datePicker",
    rules: [{ required: true, message: "请选择生效日期", trigger: "change" }],
    placeholder: "年/月/日",
    detail: false,
    parse: false,
  },
];

/** 详情 tab1 基础信息末尾只读字段 */
export const intentionDetailTab1TailFields = [
  { name: "handlerUserName", label: "经办人" },
  { name: "handlerDeptName", label: "经办部门" },
];

// ---------------------------------------------------------------------------
// 字段配置：财务信息
// ---------------------------------------------------------------------------

/** 财务信息区字段顺序与解析配置（顺序即表单展示顺序） */
export const financeFormFieldSequence = [
  {
    name: "amountTaxIncluded",
    label: "合同金额(含税)",
    _key: "合同金额",
    fieldType: "amountTaxIncluded",
    rules: [{ required: true, message: "请输入合同金额(含税)" }],
    detail: false,
    parse: true,
    parsePrompt: "合同金额(含税)",
  },
  {
    name: "taxRate",
    label: "税率",
    fieldType: "select",
    options: financeTaxRateOptions,
    optionsFrom: null,
    rules: getTaxRateRules,
    placeholder: "请选择税率",
    detail: false,
    parse: true,
    parsePrompt: '税率（值为"0%"对应0.00、"1%"对应0.01、"6%"对应0.06、"13%"对应0.13）',
  },
  {
    name: "taxAmount",
    label: "税额",
    fieldType: "computed",
    computedKey: "computedTaxAmount",
    detail: false,
    parse: false,
  },
  {
    name: "amountTaxExcluded",
    label: "合同金额(不含税)",
    fieldType: "computed",
    computedKey: "computedAmountTaxExcluded",
    detail: false,
    parse: false,
  },
  {
    name: "paymentCondition",
    label: "付款条件",
    fieldType: "select",
    options: financePaymentConditionOptions,
    optionsFrom: null,
    rules: getPaymentConditionRules,
    placeholder: "请选择付款条件",
    detail: false,
    parse: true,
    parsePrompt: '付款条件（值为"1"对应先款后票、"2"对应先票后款）',
  },
  {
    name: "invoiceTitle",
    label: "发票抬头",
    fieldType: "input",
    rules: getInvoiceTitleRules,
    placeholder: "请输入发票抬头",
    detail: false,
    parse: true,
    parsePrompt: "发票抬头",
  },
  {
    name: "invoiceType",
    label: "发票类型",
    fieldType: "select",
    options: financeInvoiceTypeOptions,
    optionsFrom: null,
    rules: getInvoiceTypeRules,
    placeholder: "请选择发票类型",
    detail: false,
    parse: true,
    parsePrompt: '发票类型（值为"1"对应增值税普通发票、"2"对应增值税专用发票）',
  },
  {
    name: "isBudgetOccupied",
    label: "是否占用预算",
    fieldType: "select",
    options: [{ label: "是", value: "1" }, { label: "否", value: "0" }],
    optionsFrom: null,
    defaultValue: "0",
    rules: [],
    placeholder: "请选择",
    detail: false,
    parse: true,
    parsePrompt: '是否占用预算（值为"1"对应是、"0"对应否）',
  },
];

// ---------------------------------------------------------------------------
// 字段配置：AI 解析扩展（不参与基础表单渲染）
// ---------------------------------------------------------------------------

/** 仅参与 AI 解析、不在基础表单渲染的字段 */
export const intentionParseExtraFields = [
  {
    rowType: "field",
    name: "planType",
    label: "收付计划",
    fieldType: "select",
    options: intentionPlanTypeRadioOptions,
    optionsFrom: null,
    rules: [],
    placeholder: "请选择",
    detail: false,
    parse: true,
    parsePrompt: '收付计划类型（值为"1"对应付款(支出)、"2"对应收款(收入)）',
  },
  {
    rowType: "field",
    name: "remark",
    label: "备注",
    fieldType: "textarea",
    rules: [],
    placeholder: "请输入",
    detail: false,
    parse: true,
    parsePrompt: "备注",
  },
  {
    rowType: "field",
    name: "supplementaryTerms",
    label: "补充条款",
    fieldType: "textarea",
    rules: [],
    placeholder: "请输入",
    detail: false,
    parse: true,
    parsePrompt: "补充条款",
  },
  {
    rowType: "field",
    name: "breachTerms",
    label: "违约条款",
    fieldType: "textarea",
    rules: [],
    placeholder: "请输入",
    detail: false,
    parse: true,
    parsePrompt: "违约条款",
  },
];

// ---------------------------------------------------------------------------
// 工具方法
// ---------------------------------------------------------------------------

/** 组装 AI 文件解析用的 fieldMap（固定字段 + 业务/财务钉钉组件） */
export function buildParseFieldMap(formComponents) {
  let obj = {
    YW: formComponents.YW,
    CW: formComponents.CW,
  };
  let fieldMapKeys = {
    YW: [],
    CW: [],
    arr: [],
  };
  let fieldMapNames = [];
  obj.YW = obj.YW.map((item) => {
    fieldMapKeys.YW.push(item.props.id);
    fieldMapNames.push(item.props._key);
    return {
      key: item.props.id,
      value: item.props._key,
      options:
        item.props?.options?.length &&
        item.props.options.map((e) => e.label),
      componentName: item.componentName,
    };
  });
  obj.CW = obj.CW.map((item) => {
    fieldMapKeys.CW.push(item.props.id);
    fieldMapNames.push(item.props._key);
    return {
      key: item.props.id,
      value: item.props._key,
      options:
        item.props?.options?.length &&
        item.props.options.map((e) => e.label),
      componentName: item.componentName,
    };
  });

  const map = [];
  const take = (rows) => {
    for (const row of rows) {
      if (!row || !row.parse) continue;
      if (!row.name) continue;
      fieldMapKeys.arr.push(row.name);
      map.push({
        key: row.name,
        value: row._key || row.label,
        fieldType: row.fieldType,
        options:
          row.options &&
          row.options.length &&
          row.options.reduce((acc, item) => {
            acc[item.label] = item.value;
            return acc;
          }, {}),
      });
      fieldMapNames.push(row._key || row.label);
    }
  };
  take(intentionBaseFormFieldSequence);
  take(financeFormFieldSequence);
  take(intentionParseExtraFields);
  return {
    arr: [...map, ...obj.YW, ...obj.CW],
    fieldMapKeys,
    fieldMapNames,
  };
}

/** 合同详情 tab1「基础信息」展示字段列表 */
export function getDetailTab1FieldRows() {
  const rows = [];
  for (const row of intentionBaseFormFieldSequence) {
    if (row.rowType !== "field" || !row.detail) continue;
    rows.push({
      name: row.name,
      label: row.label,
      optionsFrom: row.optionsFrom,
    });
  }
  for (const row of intentionDetailTab1TailFields) {
    rows.push({
      name: row.name,
      label: row.label,
      optionsFrom: row.optionsFrom,
    });
  }
  return rows;
}

/** 钉钉动态组件 → 操作日志字段名映射 */
export function filterNamesByFilds(filds) {
  let fildsObj = filds.reduce((acc, item) => {
    if (item.props.options && item.props.options.length) {
      acc[item.props.id] = {
        title: item.props.label,
        list: item.props.options,
        value: "value",
        label: "label",
      };
    } else {
      acc[item.props.id] = item.props.label;
    }
    return acc;
  }, {});
  return {
    ...fildsObj,
  };
}

/** 固定字段 + 钉钉组件 → 提交/修改操作日志 filterNames 配置 */
export function filterNames(filds) {
  let arr = [
    ...intentionBaseFormFieldSequence,
    ...financeFormFieldSequence,
    ...intentionParseExtraFields,
  ];
  let obj = arr.reduce((acc, item) => {
    if (item.options && item.options.length) {
      acc[item.name] = {
        title: item.label,
        list: item.options,
        value: "value",
        label: "label",
      };
    } else if (item.optionsFrom === "user") {
      const list = (userOptionsWithAll.value?.arr || []).map((u) => ({
        label: u.userName,
        value: u.id,
      }));
      acc[item.name] = list.length
        ? { title: item.label, list, value: "value", label: "label" }
        : item.label;
    } else if (item.optionsFrom === "dept") {
      const list = flattenDeptOptions(deptList.value || []);
      acc[item.name] = list.length
        ? { title: item.label, list, value: "value", label: "label" }
        : item.label;
    } else {
      acc[item.name] = item.label;
    }

    return acc;
  }, {});
  if (filds?.length) {
    obj = {
      ...obj,
      ...filterNamesByFilds(filds),
      currency: {
        title: "货币",
        list: currencyList,
        value: "value",
        label: "label",
      },
    };
  }
  return {
    t_attachments: "合同文本",
    t_otherAttachments: "其他附件",
    participantRows: "设置参与方",
    contracts: "关联合同",
    paymentPlans: "收付计划",
    budgetSplits: "预算分摊",
    ...obj,
  };
}
