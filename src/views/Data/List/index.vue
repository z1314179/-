<template>
  <div class="file-compare-page page-content">
    <a-card title="文件对比工具" :bordered="false">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 16px"
        message="上传任意两个文件（PDF、Office、图片、表格、文本等），系统先本地提取文本再自动对比差异。图片将 OCR，旧版 .doc 请另存为 docx。"
      />

      <div class="compare-container">
        <div class="file-upload-area">
          <div class="file-item">
            <div class="file-label">文件1：</div>
            <a-upload
              action="#"
              v-model:file-list="file1List"
              :before-upload="(file) => handleFileSelect(file, 1)"
              :max-count="1"
              :show-upload-list="false"
            >
              <a-button :disabled="comparing || loadingFile">
                <upload-outlined />
                {{ file1Name || "选择文件1" }}
              </a-button>
            </a-upload>
            <span v-if="file1Name" class="file-name">{{ file1Name }}</span>
            <a-tag v-if="file1Content" color="green" style="margin-left: 8px"
              >已加载</a-tag
            >
          </div>

          <div class="file-item">
            <div class="file-label">文件2：</div>
            <a-upload
              action="#"
              v-model:file-list="file2List"
              :before-upload="(file) => handleFileSelect(file, 2)"
              :max-count="1"
              :show-upload-list="false"
            >
              <a-button :disabled="comparing || loadingFile">
                <upload-outlined />
                {{ file2Name || "选择文件2" }}
              </a-button>
            </a-upload>
            <span v-if="file2Name" class="file-name">{{ file2Name }}</span>
            <a-tag v-if="file2Content" color="green" style="margin-left: 8px"
              >已加载</a-tag
            >
          </div>
        </div>

        <div class="action-buttons">
          <a-space>
            <a-button
              type="primary"
              :loading="comparing"
              :disabled="!canCompare"
              @click="handleCompare"
            >
              <ThunderboltOutlined />
              开始对比
            </a-button>
            <a-button :disabled="comparing || loadingFile" @click="clearAll">
              <DeleteOutlined />
              清空
            </a-button>
          </a-space>
        </div>

        <div v-if="compareResult" class="result-area">
          <a-divider>对比结果</a-divider>
          <div class="result-content">
            <pre>{{ compareResultText }}</pre>
          </div>
        </div>

        <div v-if="comparing" class="loading-area">
          <a-spin tip="正在对比中，请稍候..." />
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { message } from "ant-design-vue";
import {
  UploadOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
} from "@ant-design/icons-vue";
import { extractFileText, flattenExtractData } from "@/utils/fileParse.js";
import { useFileCompare } from "@/hook/business/useFileCompare.js";

defineOptions({
  name: "DataList",
});

const EMPTY_EXTRACT_MSG = "未能从文件中提取到有效内容";

const { compareFiles } = useFileCompare();

const file1List = ref([]);
const file2List = ref([]);
const file1Content = ref("");
const file2Content = ref("");
const file1Name = ref("");
const file2Name = ref("");
const file1RawFile = ref(null);
const file2RawFile = ref(null);
const comparing = ref(false);
const loadingFile = ref(false);
const compareResult = ref(null);

const compareResultText = computed(() =>
  compareResult.value ? JSON.stringify(compareResult.value, null, 2) : "",
);

const canCompare = computed(() =>
  Boolean(
    file1RawFile.value &&
    file2RawFile.value &&
    !comparing.value &&
    !loadingFile.value,
  ),
);

const handleFileSelect = async (file, fileNum) => {
  loadingFile.value = true;
  try {
    const { fileType, content } = await extractFileText(file);
    const text = flattenExtractData({ fileType, content });
    if (!text.length) {
      message.error(EMPTY_EXTRACT_MSG);
      if (fileNum === 1) {
        file1List.value = [];
        file1Content.value = "";
        file1Name.value = "";
        file1RawFile.value = null;
      } else {
        file2List.value = [];
        file2Content.value = "";
        file2Name.value = "";
        file2RawFile.value = null;
      }
      return false;
    }

    if (fileNum === 1) {
      file1Content.value = text;
      file1Name.value = file.name;
      file1RawFile.value = file;
      message.success(`文件1 "${file.name}" 加载成功`);
    } else {
      file2Content.value = text;
      file2Name.value = file.name;
      file2RawFile.value = file;
      message.success(`文件2 "${file.name}" 加载成功`);
    }

    compareResult.value = null;
  } catch (error) {
    message.error(`文件加载失败：${error?.message || "未知错误"}`);
  } finally {
    loadingFile.value = false;
  }

  return false;
};

const handleCompare = async () => {
  if (!canCompare.value) {
    message.warning("请先选择两个文件");
    return;
  }

  comparing.value = true;
  compareResult.value = null;

  try {
    compareResult.value = await compareFiles({
      file1: file1RawFile.value,
      file2: file2RawFile.value,
    });
    message.success("对比完成");
  } catch (error) {
    message.error(error.message);
  } finally {
    comparing.value = false;
  }
};

const clearAll = () => {
  file1List.value = [];
  file2List.value = [];
  file1Content.value = "";
  file2Content.value = "";
  file1Name.value = "";
  file2Name.value = "";
  file1RawFile.value = null;
  file2RawFile.value = null;
  compareResult.value = null;
  message.info("已清空");
};
</script>

<style lang="scss" scoped>
.file-compare-page {
  padding: 20px;

  :deep(.ant-card) {
    border-radius: 8px;
  }

  .compare-container {
    min-height: 500px;
  }

  .file-upload-area {
    display: flex;
    gap: 40px;
    margin-bottom: 30px;
    flex-wrap: wrap;

    .file-item {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #f0f0f0;

      .file-label {
        font-weight: 500;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.85);
      }

      .file-name {
        color: #666;
        font-size: 13px;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .action-buttons {
    text-align: center;
    margin-bottom: 30px;
  }

  .result-area {
    margin-top: 20px;

    .result-content {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      max-height: 500px;
      overflow-y: auto;

      pre {
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
        font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #333;
      }
    }
  }

  .loading-area {
    text-align: center;
    padding: 50px;
  }
}
</style>
