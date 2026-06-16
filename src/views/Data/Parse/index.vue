<template>
  <div class="data-parse-page page-content">
    <a-card title="文件解析" :bordered="false">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 16px"
        message="上传 PDF、图片、Excel、Word(docx) 或文本：PDF 仅提取内置文字层（纯扫描图、无文字层或疑似仅水印文字时会提示无法解析）。图片仍走 OCR。解析结果仅供参考，重要数据请核对。"
      />

      <div class="parse-upload-row">
        <a-upload
          action="#"
          v-model:file-list="fileList"
          :before-upload="handleFileSelect"
          :max-count="1"
          :show-upload-list="true"
        >
          <a-button :disabled="parsing || loadingFile">
            <upload-outlined />
            选择文件
          </a-button>
        </a-upload>

        <a-space>
          <a-button
            type="primary"
            :loading="parsing"
            :disabled="!canParse"
            @click="handleParse"
          >
            开始解析
          </a-button>
          <a-button :disabled="parsing" @click="clearAll">清空</a-button>
        </a-space>
      </div>

      <div v-if="formatResult.fileName" class="file-meta">
        <a-tag color="blue">{{ formatResult.fileName }}</a-tag>
        <a-tag v-if="formatResult.fileType" color="cyan">{{
          formatResult.fileType
        }}</a-tag>
        <a-tag color="green">已加载</a-tag>
      </div>

      <a-divider />

      <div v-if="parseResult" class="parse-result">
        <pre>{{ parseResultText }}</pre>
      </div>
      <a-empty v-else description="暂无解析结果" />
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { message } from "ant-design-vue";
import { UploadOutlined } from "@ant-design/icons-vue";
import { extractFileText, flattenExtractData } from "@/utils/fileParse.js";
import { useFileParse } from "@/hook/business/useFileParse.js";

defineOptions({
  name: "DataParse",
});

const KIND_LABEL = {
  text: "文本",
  pdf: "PDF",
  excel: "Excel",
  word: "Word",
  image: "图片(OCR)",
};

const EMPTY_PARSE_MSG = "未能从文件中提取到有效内容";

/** AI 输出 JSON 的字段名与业务含义映射（键 → 说明） */
const PARSE_FIELD_MAP = {
  contract_no: "合同编号",
  contract_name: "合同名称",
  contract_type: "合同类型",
  contract_date: "合同开始结束日期",
  contract_amount: "合同金额",
  contract_status: "合同状态",
};

const { parseFile } = useFileParse({ fieldMap: PARSE_FIELD_MAP });

const fileList = ref([]);
const rawFile = ref(null);
const parsing = ref(false);
const loadingFile = ref(false);
const parseResult = ref(null);
const formatResult = ref({
  fileName: "",
  fileType: "",
});

const parseResultText = computed(() =>
  parseResult.value ? JSON.stringify(parseResult.value, null, 2) : "",
);

const canParse = computed(
  () => Boolean(rawFile.value) && !parsing.value && !loadingFile.value,
);

const handleFileSelect = async (file) => {
  loadingFile.value = true;
  try {
    const { fileType, content } = await extractFileText(file);
    const text = flattenExtractData({ fileType, content });
    if (!text.length) {
      message.error(EMPTY_PARSE_MSG);
      fileList.value = [];
      rawFile.value = null;
      formatResult.value = { fileName: "", fileType: "" };
      return false;
    }

    rawFile.value = file;
    formatResult.value = {
      fileName: file.name,
      fileType: KIND_LABEL[fileType] || fileType || "未知",
    };
    parseResult.value = null;
    message.success(`文件 "${file.name}" 加载成功`);
  } catch (error) {
    message.error(`文件加载失败：${error?.message || "未知错误"}`);
  } finally {
    loadingFile.value = false;
  }

  return false;
};

const handleParse = async () => {
  if (!canParse.value) {
    message.warning("请先选择文件");
    return;
  }

  parsing.value = true;
  parseResult.value = null;

  try {
    parseResult.value = await parseFile({ file: rawFile.value });
    message.success("解析完成");
  } catch (error) {
    message.error(error?.message || "解析失败");
  } finally {
    parsing.value = false;
  }
};

const clearAll = () => {
  fileList.value = [];
  rawFile.value = null;
  parseResult.value = null;
  formatResult.value = { fileName: "", fileType: "" };
  message.info("已清空");
};
</script>

<style lang="scss" scoped>
.data-parse-page {
  :deep(.ant-card) {
    border-radius: 8px;
  }

  .parse-upload-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .file-meta {
    margin-bottom: 8px;
  }

  .parse-result {
    background: #f7f7f7;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 12px;
    max-height: 560px;
    overflow: auto;

    pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.6;
      font-size: 13px;
      color: #333;
    }
  }
}
</style>
