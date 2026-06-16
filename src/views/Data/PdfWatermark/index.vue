<template>
  <div class="pdf-watermark-page page-content">
    <a-card title="PDF 水印" :bordered="false">
      <template #extra>
        <a-button
          type="link"
          size="small"
          :disabled="!pdfFile || loading"
          @click="handleDownload"
        >
          <download-outlined />
          下载带水印 PDF
        </a-button>
      </template>

      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 16px"
        message="指定一行几列、一列几行；水印按整页物理区域（MediaBox）均分铺满，避免仅按裁剪区导致顶部或四周留白无水印。格内文字自动适配。"
      />

      <a-form layout="vertical" class="wm-form">
        <a-form-item label="水印文字">
          <a-input
            v-model:value="watermarkText"
            placeholder="例如 CONFIDENTIAL"
            :maxlength="80"
            show-count
          />
        </a-form-item>
        <a-form-item label="平铺行列">
          <a-space align="center" wrap size="middle">
            <span>一行</span>
            <a-input-number v-model:value="tileCols" :min="1" :max="48" />
            <span>个（列）</span>
            <span class="sep">×</span>
            <span>一列</span>
            <a-input-number v-model:value="tileRows" :min="1" :max="48" />
            <span>行</span>
          </a-space>
          <div class="form-extra">
            整页宽均分为列、高均分为行；例如 4×5 表示横 4 枚 × 纵 5 枚，共 20
            个水印。
          </div>
        </a-form-item>
        <a-form-item label="旋转角度（度）">
          <a-space wrap align="center">
            <a-input-number
              v-model:value="rotation"
              :min="-180"
              :max="180"
              :step="1"
              style="width: 120px"
            />
            <span class="form-extra-inline">负数为逆时针，常用约 -38°</span>
          </a-space>
        </a-form-item>
        <a-form-item label="透明度">
          <a-slider
            v-model:value="opacity"
            :min="0.05"
            :max="0.45"
            :step="0.01"
          />
        </a-form-item>
        <a-form-item label="上传 PDF">
          <a-upload
            action="#"
            v-model:file-list="fileList"
            :before-upload="beforeUpload"
            :max-count="1"
            accept=".pdf,application/pdf"
          >
            <a-button :disabled="loading">
              <upload-outlined />
              选择 PDF 文件
            </a-button>
          </a-upload>
        </a-form-item>
        <a-form-item v-if="pdfFile">
          <a-space>
            <a-tag color="blue">{{ pdfFile.name }}</a-tag>
            <a-button type="primary" :loading="loading" @click="handleDownload">
              <download-outlined />
              下载带水印 PDF
            </a-button>
            <a-button :disabled="loading" @click="clearFile">清空</a-button>
          </a-space>
        </a-form-item>
      </a-form>

      <a-alert
        v-if="lastError"
        type="error"
        show-icon
        :message="String(lastError.message)"
        style="margin-top: 12px"
      />
    </a-card>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { message } from "ant-design-vue";
import { UploadOutlined, DownloadOutlined } from "@ant-design/icons-vue";
import { usePdfWatermark } from "@/hook/business/usePdfWatermark.js";

defineOptions({
  name: "DataPdfWatermark",
});

const watermarkText = ref("CONFIDENTIAL");
const tileCols = ref(4);
const tileRows = ref(5);
const rotation = ref(-38);
const opacity = ref(0.14);
const pdfFile = ref(null);
const fileList = ref([]);

const { loading, lastError, downloadWatermarkedPdf } = usePdfWatermark();

function baseDownloadName(originalName) {
  const n = String(originalName || "document.pdf");
  const i = n.toLowerCase().lastIndexOf(".pdf");
  const base = i > 0 ? n.slice(0, i) : n.replace(/\.[^/.]+$/, "");
  return `${base || "document"}-watermarked.pdf`;
}

function beforeUpload(file) {
  const ok =
    file.type === "application/pdf" ||
    String(file.name || "")
      .toLowerCase()
      .endsWith(".pdf");
  if (!ok) {
    message.error("请上传 PDF 文件");
    return false;
  }
  pdfFile.value = file;
  lastError.value = null;
  return false;
}

async function handleDownload() {
  if (!pdfFile.value) {
    message.warning("请先上传 PDF");
    return;
  }
  try {
    await downloadWatermarkedPdf(pdfFile.value, {
      text: watermarkText.value.trim() || "CONFIDENTIAL",
      tileCols: tileCols.value,
      tileRows: tileRows.value,
      rotation: rotation.value,
      opacity: opacity.value,
      filename: baseDownloadName(pdfFile.value.name),
    });
    message.success("已开始下载");
  } catch (e) {
    message.error(e?.message || "处理失败");
  }
}

function clearFile() {
  pdfFile.value = null;
  fileList.value = [];
}
</script>

<style lang="scss" scoped>
.pdf-watermark-page {
  :deep(.ant-card) {
    border-radius: 8px;
  }

  .wm-form {
    max-width: 560px;
  }

  .form-extra {
    margin-top: 6px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    line-height: 1.5;
  }

  .form-extra-inline {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    line-height: 1.5;
  }

  .sep {
    color: rgba(0, 0, 0, 0.35);
    padding: 0 4px;
  }
}
</style>
