import { extractFileText, flattenExtractData } from "@/utils/fileParse.js";
import { callDeepSeekChat } from "@/utils/AI/deepseek.js";
import { getFileBlob } from "@/utils/preview.js";
import { isJSON } from "@/utils/com.js";

const EMPTY_PARSE_MSG = "未能从文件中提取到有效内容";

const PARSE_FIELD_TYPE_LABEL = {
  TextField: "文本",
  TextareaField: "文本",
  DDDateField: "日期",
  DDDateRangeField: "日期范围",
  NumberField: "数字",
  PhoneField: "电话",
  IdCardField: "身份证",
  MoneyField: "金额",
};

function buildParseFieldDefs(arr = []) {
  return arr
    .filter((f) => f.componentName !== "TableField")
    .map((f) => {
      const def = { 字段名: f.value };
      const typeLabel = PARSE_FIELD_TYPE_LABEL[f.componentName];
      if (typeLabel) def.类型 = typeLabel;
      if (f.componentName === "DDDateRangeField" || f.fieldType === "rangePicker") {
        def.格式 = "YYYY-MM-DD 至 YYYY-MM-DD";
      } else if (f.componentName === "DDDateField" || f.fieldType === "datePicker") {
        def.格式 = "YYYY-MM-DD";
      }
      if (Array.isArray(f.options) && f.options.length) {
        def.可选值 = f.options;
      } else if (f.options && typeof f.options === "object") {
        def.可选值 = Object.keys(f.options);
      }
      return def;
    });
}

function parseParseResult(raw) {
  const text = String(raw ?? "").trim();
  let data = null;
  if (isJSON(text)) {
    data = JSON.parse(text);
  } else {
    const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeBlock && isJSON(codeBlock[1].trim())) {
      data = JSON.parse(codeBlock[1].trim());
    } else {
      const brace = text.match(/\{[\s\S]*\}/);
      if (brace && isJSON(brace[0])) data = JSON.parse(brace[0]);
    }
  }
  if (!data || typeof data !== "object") {
    throw new Error("无法解析解析结果");
  }
  return data;
}

/** options 为数组：值在列表中则原样返回；为对象：按 label 取 value；无 options 原样返回 */
function resolveParseFieldValue(raw, options) {
  if (raw === null || raw === undefined || raw === "") return raw;
  if (!options) return raw;

  const text = typeof raw === "string" ? raw.trim() : String(raw);

  if (Array.isArray(options)) {
    if (!options.length) return raw;
    const hit = options.some((o) => String(o).trim() === text);
    return hit ? raw : undefined;
  }

  if (typeof options === "object") {
    if (Object.prototype.hasOwnProperty.call(options, text)) {
      return options[text];
    }
    return raw;
  }

  return raw;
}

function isValidParseDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s ?? "").trim());
}

/** 「YYYY-MM-DD 至 YYYY-MM-DD」等起止日期转成 [start, end]；不完整返回 undefined */
function parseDateRangeToArray(raw) {
  let start;
  let end;

  if (Array.isArray(raw)) {
    if (raw.length < 2) return undefined;
    start = String(raw[0]).trim();
    end = String(raw[1]).trim();
  } else if (typeof raw === "string") {
    const s = raw.trim();
    if (!s || /^[～~至\s]+$/.test(s)) return undefined;
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr) && arr.length >= 2) {
        start = String(arr[0]).trim();
        end = String(arr[1]).trim();
      }
    } catch {
      /* empty */
    }
    if (start === undefined && /[～~至]/.test(s)) {
      const parts = s
        .split(/[～~至]+/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (parts.length < 2) return undefined;
      start = parts[0];
      end = parts[1];
    }
  } else {
    return undefined;
  }

  if (!start || !end || !isValidParseDate(start) || !isValidParseDate(end)) {
    return undefined;
  }
  return [start, end];
}

/** 单日期转成 YYYY-MM-DD 字符串；无效返回 undefined */
function parseDateToString(raw) {
  const s = String(raw ?? "").trim();
  if (!s || !isValidParseDate(s)) return undefined;
  return s;
}

export function useFileParse(hookOptions = {}) {
  /**
   * @param {{ file?: File, url?: string }} params
   * @returns {Promise<Object>}
   */
  async function parseFile({ file, url }, { fieldMap } = {}) {
    const fileBlob = url ? await getFileBlob(url) : file;
    if (!fileBlob) {
      throw new Error("请先选择文件");
    }

    const extracted = await extractFileText(fileBlob);
    const { fileType, content } = extracted;
    const plain = flattenExtractData({ fileType, content });
    if (!plain.length) {
      throw new Error(EMPTY_PARSE_MSG);
    }

    const fieldDefs = buildParseFieldDefs(fieldMap?.arr ?? []);

    const contentText = [
      "从【正文】抽取【字段定义】中的字段，输出 JSON 对象（中文键 → 字符串值）。",
      `【正文】\n${plain}`,
      `【字段定义】\n${JSON.stringify(fieldDefs, null, 2)}`,
      [
        "【规则】",
        "1. 正文有依据且能对上【字段定义】的，键名使用其中的「字段名」；同义表述归并到标准名",
        "2. 【字段定义】外、正文有依据的字段也可输出，键名用正文中的说法",
        "3. 正文无明确文字依据的字段不要输出",
        "4. 字段是日期/时间类型时并且是有效的日期值，格式必须为YYYY-MM-DD；日期范围用「开始 至 结束」",
        "5. 【字段定义】中有可选值的字段，值必须等于可选值之一，否则不输出该字段",
        "6. 禁止猜测、补全、改写",
        "7. 文档标题仅在明确为合同时，可作为「合同名称」",
      ].join("\n"),
    ].join("\n\n");

    const aiOut = await callDeepSeekChat({
      messages: [{ role: "user", content: contentText }],
      systemPrompt:
        "你是合同字段抽取器。只输出合法 JSON 对象，禁止 markdown 和解释文字。",
      temperature: 0,
      thinking: false,
      response_format: { type: "json_object" },
    });
    const extractedKv = parseParseResult(aiOut);
    return { data: extractedKv };
  }

  async function parseFieldMap(extractedKv, { fieldMap }) {
    const { arr = [], fieldMapKeys = {} } = fieldMap;
    let objKeyMap = arr.reduce((acc, item) => {
      if (item.componentName === "TableField") return acc;
      acc[item.value] = item;
      return acc;
    }, {});
    let result = [];
    for (const key in extractedKv) {
      const raw = extractedKv[key];
      const field = objKeyMap[key];
      if (!field || field.componentName === "TableField") continue;
      if (raw === null || raw === undefined || raw === "") continue;
      let value = resolveParseFieldValue(raw, field.options);
      if (field.componentName === "DDDateField" || field.fieldType === "datePicker") {
        value = parseDateToString(value);
      } else if (field.componentName === "DDDateRangeField" || field.fieldType === "rangePicker") {
        value = parseDateRangeToArray(value);
      }
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && !value.length)
      )
        continue;
      result.push({
        name: field.value,
        key: field.key,
        value,
      });
    }

    // const contentTextSection = [
    //   '你要用js的方式去执行判断取出来匹配的字段'
    //   `规则：${JSON.stringify(arr, null, 2)}这是个数组,每项包含 key 和 value（key 是字段名，value 是规则描述）`,
    //   `内容：${JSON.stringify(extractedKv, null, 2)}内容对象 每个字段对应一个值，需要过滤掉值为空的字段，不把对象的键作为返回值`,
    //   '如果value为空，则不返回!',
    //   '如果value不为空，则返回!',
    // ]
    // const aiOutJson = await callDeepSeekChat({
    //   messages: [{
    //     role: 'system',
    //     content: contentTextSection.join('\n\n')
    //   }],
    //   systemPrompt:
    //     '输出格式为数组，value有值的返回',
    // })
    // let result = parseParseResult(aiOutJson) || []
    // console.log(result);

    let list = {
      arr: [],
      obj: {
        YW: [],
        CW: [],
      },
    };
    result.forEach((item) => {
      if (fieldMapKeys.arr.includes(item.key)) {
        list.arr.push(item);
      } else if (fieldMapKeys.YW.includes(item.key)) {
        list.obj.YW.push(item);
      } else if (fieldMapKeys.CW.includes(item.key)) {
        list.obj.CW.push(item);
      }
    });
    return list;
  }

  return { parseFile, parseFieldMap };
}
