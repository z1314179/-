// 合同：详情映射、钉钉表单、模板变量
import variableMap from "@/views/Basic/Template/variableMap.json";
import { getDingModel } from "@/api/Basic/template.js";
import { postDingFile } from "@/api/Contract/intention.js";
import { parseDingSelectOptions } from "@/components/DingTemplateRenderer/dingFieldItemNormalize.js";

const businessVariableKeys = variableMap["业务变量"] ?? {};
const financeVariableKeys = variableMap["财务变量"] ?? {};
const SECTION_KEY_MAP = { YW: businessVariableKeys, CW: financeVariableKeys };

/** 按标签匹配业务/财务变量，并回填 item 类型与选项 */
function matchVariableKey(label, keys, item) {
  if (!label || !keys) return false;
  const key = label.replace(/（.*?）$/, "");
  item.props._key = key;
  const cfg = keys[key];
  if (!cfg) return false;
  if (cfg.type) {
    item.type = cfg.type;
    if (cfg.type === "DDcompleteField" && cfg.componentName === "TextField") {
      item.props.options = cfg.props.options;
    }
  }
  return true;
}

/** 变量配置对象 → 模板选项数组（勾选、必填、下拉选项格式化） */
function mapVariableConfigToOptions(obj, sectionKeys = []) {
  for (const item of sectionKeys) {
    const row = obj[item.props._key];
    if (!row) continue;
    row.checked = true;
    row.props.required = item.props.required;
  }
  return Object.values(obj).map((cfg) => {
    cfg.props.required = cfg.props.required ? 1 : 0;
    if (cfg.props.options?.length) {
      cfg.props.options = parseDingSelectOptions(cfg.props.options);
    }
    return cfg;
  });
}

/** 按钉钉组件结构从 formValues 取单字段或表格行 */
function getRow(row, valuesObj) {
  if (row.componentName === "TableField" && row.children?.length) {
    const lines = valuesObj[row.props.id];
    if (!Array.isArray(lines)) return [];
    return lines.map((line) => row.children.map((col) => getRow(col, line || {})));
  }
  const raw = valuesObj[row.props.id];
  return {
    name: row.props.label,
    value: Array.isArray(raw) ? JSON.stringify(raw) : raw,
  };
}

/** 钉钉组件列表 + 表单值 → formDataJson 用的 { name, value } 数组 */
export function buildDingFormComponentValues(components, valuesObj) {
  const arr = [];
  for (const item of components) {
    const row = getRow(item, valuesObj);
    if (Array.isArray(row)) {
      if (!row.length) continue;
      arr.push({ name: item.props?.label, value: row });
    } else {
      arr.push(row);
    }
  }
  return arr.filter((item) => item.value || item.children?.length);
}

/** 资产合同：按区块同步变量必填项到配置 */
export function getAssetContractData(arr, type = "YW") {
  const keys = SECTION_KEY_MAP[type];
  for (const item of arr || []) {
    const cfg = keys[item.props._key];
    if (cfg) cfg.props.required = item.props.required;
  }
  return [...(arr || [])];
}

/** 从变量表筛出 contractType 为 zc 的项 */
function mapZcContractData(data) {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, v]) => v.contractType === "zc")
      .map(([key, v]) => {
        v.props._key = key;
        return [key, v];
      }),
  );
}

/** 按合同类型拉取业务/财务变量及关联合同、附件配置 */
export async function getTemplateCategoryList(params, sectionKeys = {}) {
  const { type, dingProcessCode } = params || {};
  const otherVariableOptionsObj = { 关联合同: {}, 合同附件: {} };
  let businessVariableOptions = [];
  let financeVariableOptions = [];

  if (type === 1) {
    if (!dingProcessCode) {
      return { otherVariableOptionsObj, businessVariableOptions, financeVariableOptions };
    }
    const { data } = await getDingModel({ code: dingProcessCode });
    const businessObj = {};
    const financeObj = {};
    for (const item of data || []) {
      const label = item.props.label;
      if (otherVariableOptionsObj[label]) {
        otherVariableOptionsObj[label] = item;
      } else if (matchVariableKey(label, businessVariableKeys, item)) {
        businessObj[label] = item;
      } else if (matchVariableKey(label, financeVariableKeys, item)) {
        financeObj[label] = item;
      }
    }
    businessVariableOptions = mapVariableConfigToOptions(businessObj);
    financeVariableOptions = mapVariableConfigToOptions(financeObj);
  } else if (type === 2) {
    businessVariableOptions = mapVariableConfigToOptions(
      mapZcContractData(businessVariableKeys),
      sectionKeys[1],
    );
    financeVariableOptions = mapVariableConfigToOptions(
      mapZcContractData(financeVariableKeys),
      sectionKeys[2],
    );
  }

  return { otherVariableOptionsObj, businessVariableOptions, financeVariableOptions };
}

/** 安全转为有限数字，无效则 undefined */
const toFiniteNumber = (v) => {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** 数字转固定小数位字符串 */
const toFixedNumberString = (v, digits = 2) => {
  const n = toFiniteNumber(v);
  return n === undefined ? undefined : Number(n)
};

/** 空值保持 undefined，否则转字符串 */
const toStringNumber = (v) =>
  v === null || v === undefined || v === "" ? undefined : String(v);

/** 小数选项值：先转数字再去尾零，如 "0.0600" → "0.06" */
const toDecimalOptionValue = (v) => {
  const n = toFiniteNumber(v);
  return n === undefined ? undefined : n.toFixed(2);
};

/** 解析 bodyJson 为 { YW, CW } 对象 */
function parseBodyJson(bodyJson) {
  try {
    return bodyJson ? JSON.parse(bodyJson) : {};
  } catch {
    return {};
  }
}

/** 详情参与方 → 表单 participantRows（我方/对方及账户） */
function mapParticipantRows(data) {
  const rows = [];
  const accountByPartner = (data.counterpartyAccounts || []).reduce((acc, e) => {
    acc[e.counterpartyId] = {
      accountName: e.accountName,
      accountOpen: e.bankName,
      accountOpenBranch: e.bankBranchName,
      accountNumber: e.bankAccount,
      _id: e.id,
      id: e.counterpartyAccountId,
    };
    return acc;
  }, {});
  data.ourCompanyRelations?.forEach((e) => {
    rows[e.sort] = { role: "our", id: e.companyId, _id: e.id, companyName: e.companyName };
  });
  data.counterpartyRelations?.forEach((e) => {
    rows[e.sort] = {
      role: "partner",
      id: e.counterpartyId,
      _id: e.id,
      counterpartyName: e.counterpartyName,
      bankInfo: accountByPartner[e.counterpartyId] || {},
    };
  });
  return rows.filter(Boolean);
}

/** 意向合同详情 data → formValues 片段 */
export function mapIntentionContractDetailToFormValues(data) {
  const { CW, YW } = parseBodyJson(data.bodyJson);
  const attachments = data.attachments || [];
  return {
    status: data.status,
    rootContractId: data.rootContractId,
    changeEffectiveDate: data.changeEffectiveDate,
    contractType: data.contractType,
    attachments,
    t_attachments: attachments.filter((item) => item.attachmentType === 1),
    t_otherAttachments: attachments.filter((item) => item.attachmentType !== 1),
    contractName: data.contractName,
    contractCategory: toStringNumber(data.contractCategory),
    contractAttribute: data.contractAttribute,
    brandName: data.brandName,
    contractDateRange: [data.startDate, data.endDate],
    contractMonths: data.contractMonths,
    signUserName: data.signUserName,
    signDate: data.signDate,
    handlerUserId: data.handlerUserId,
    handlerUserName: data.handlerUserName,
    handlerDeptId: data.handlerDeptId,
    handlerDeptName: data.handlerDeptName,
    participantRows: mapParticipantRows(data),
    remark: data.remark,
    YW: YW?.formValues || {},
    CW: CW?.formValues || {},
    amountTaxIncluded: toFixedNumberString(data.amountTaxIncluded),
    taxAmount: toFixedNumberString(data.taxAmount),
    amountTaxExcluded: toFixedNumberString(data.amountTaxExcluded),
    currency: data.currency,
    taxRate: toDecimalOptionValue(data.taxRate),
    paymentCondition: toStringNumber(data.paymentCondition),
    invoiceTitle: data.invoiceTitle,
    invoiceType: toStringNumber(data.invoiceType),
    isBudgetOccupied: toStringNumber(data.isBudgetOccupied) ?? "0",
    planType: toStringNumber(data.planType),
    contracts: (data.contractRelations || []).map((e) => ({
      ...e.relatedContract,
      _id: e.id,
      relationType: e.relationType,
      isAuto: e.isAuto,
    })),
    paymentPlans: (data.paymentPlans || []).map((item) => ({
      amount: toFixedNumberString(item.amount),
      ratio: toFixedNumberString(item.ratio),
      _id: item.id,
      companyId: toFiniteNumber(item.companyId),
      counterpartyId: toFiniteNumber(item.counterpartyId),
      companyName: item.companyName,
      counterpartyName: item.counterpartyName,
      expectedDate: item.expectedDate,
      payReceiveNode: item.payReceiveNode ?? "",
      remark: item.remark || "",
    })),
    budgetSplits: (data.budgetApportions || []).map((item) => ({
      amount: toFixedNumberString(item.amount),
      ratio: toFixedNumberString(item.ratio),
      _id: item.id,
      deptId: toFiniteNumber(item.deptId),
      expenseTypeCode: toStringNumber(item.expenseTypeCode),
      budgetDate: item.budgetDate,
      deptName: item.deptName,
      expenseTypeName: item.expenseTypeName,
      remark: item.remark || "",
    })),
    supplementaryTerms: data.supplementaryTerms,
    breachTerms: data.breachTerms,
  };
}

/** 组装关联合同、合同附件等钉钉扩展表单项 */
async function buildOtherFormRows(otherObj, attachments, relationIds) {
  const rows = [];
  for (const key in otherObj) {
    const item = otherObj[key];
    if (!item?.componentName) continue;
    if (key === "关联合同" && relationIds.length) {
      rows.push({ name: key, value: relationIds });
    } else if (key === "合同附件") {
      const res = await postDingFile({ files: attachments.map((f) => f.fileUrl) });
      rows.push({ name: key, value: res.data });
    }
  }
  return rows;
}

/** 意向合同表单 → 接口提交 query（含 formDataJson、bodyJson 等） */
export async function buildIntentionContractSubmitQuery({
  rawForm,
  requestQuery,
  formComponents,
  relationType,
}) {
  const query = { ...rawForm, ...requestQuery };
  query.attachments = [...(rawForm.t_attachments || []), ...(rawForm.t_otherAttachments || [])];

  query.formDataJson = [
    ...buildDingFormComponentValues(formComponents.YW || [], rawForm.YW || {}),
    ...buildDingFormComponentValues(formComponents.CW || [], rawForm.CW || {}),
  ];
  query.bodyJson = JSON.stringify({
    YW: { formComponents: formComponents.YW, formValues: rawForm.YW },
    CW: { formComponents: formComponents.CW, formValues: rawForm.CW },
  });
  delete query.YW;
  delete query.CW;

  if (query.contractDateRange) {
    query.startDate = query.contractDateRange[0];
    query.endDate = query.contractDateRange[1];
  }
  delete query.contractDateRange;

  const relationIds = [];
  query.contractRelationList = (query.contracts || []).map((item) => {
    relationIds.push(item.dingProcessInstanceId);
    return { relatedContractId: item.id, relationType };
  });
  delete query.contracts;

  query.paymentPlanList = (query.paymentPlans || []).map((item, index) => ({
    periodNo: index + 1,
    ...item,
    id: item._id,
  }));
  delete query.paymentPlans;

  query.budgetApportionList = (query.budgetSplits || []).map((item, index) => ({
    periodNo: index + 1,
    ...item,
    id: item._id,
  }));
  delete query.budgetSplits;

  query.ourCompanyList = [];
  query.counterpartyList = [];
  query.counterpartyAccountList = [];
  (query.participantRows || []).forEach((e, index) => {
    if (e.role === "our") {
      query.ourCompanyList.push({ sort: index, companyId: e.id });
    } else if (e.role === "partner") {
      query.counterpartyList.push({ sort: index, counterpartyId: e.id });
      if (e.bankInfo) {
        query.counterpartyAccountList.push({
          counterpartyId: e.id,
          accountName: e.bankInfo.accountName,
          bankName: e.bankInfo.accountOpen,
          bankBranchName: e.bankInfo.accountOpenBranch,
          bankAccount: e.bankInfo.accountNumber,
          counterpartyAccountId: e.bankInfo.id,
        });
      }
    }
  });
  delete query.participantRows;

  query.formDataJson.push(
    ...(await buildOtherFormRows(
      formComponents.otherVariableOptionsObj || {},
      query.attachments,
      relationIds,
    )),
  );
  if (!query.formDataJson.length) {
    return -1
  }
  query.formDataJson.forEach((item) => {
    if (item.value != null && typeof item.value !== "string") {
      item.value = JSON.stringify(item.value);
    }
  });
  return query;
}
