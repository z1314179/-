<template>
  <a-modal
    :open="open"
    :mask-closable="false"
    width="500px"
    title="归档"
    destroy-on-close
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      layout="vertical"
      :model="formState"
      class="pd-x-small"
    >
      <a-form-item
        label="上传附件"
        name="fileList"
        :rules="[
          { required: true, validator: validator, message: '请上传附件' },
        ]"
      >
        <a-upload
          action="#"
          :before-upload="beforeUpload"
          :max-count="1"
          :show-upload-list="false"
        >
          <a-button style="margin-top: 4px">
            <template #icon>
              <UploadOutlined />
            </template>
            上传附件
          </a-button>
        </a-upload>
        <div class="arc-hint">单个文件不超过20MB</div>
        <div v-if="formState.fileList.length" class="arc-file-rows">
          <div
            class="flex align-center"
            style="width: 260px; margin-top: 6px"
            v-for="(item, index) in formState.fileList"
            :key="item.uid"
          >
            <div
              class="flex-1 flex hover-text align-center"
              style="min-width: 0"
            >
              <PaperClipOutlined style="margin-right: 5px" />
              <div class="flex flex-1 align-center" style="min-width: 0">
                <div
                  v-for="(value, index) in fileNames(item)"
                  :key="index"
                  :class="index === 0 ? 'text-ellipsis' : ''"
                >
                  {{ value }}
                </div>
              </div>
            </div>
            <div class="mg-l-small">
              <CloseCircleFilled
                class="delete-icon-btn"
                @click="handleFileRemove(index)"
              />
            </div>
          </div>
        </div>
      </a-form-item>
      <a-form-item
        label="合同号"
        name="contractNo"
        :rules="[{ required: true, message: '请输入' }]"
      >
        <a-input
          style="width: 260px"
          v-model:value="formState.contractNo"
          allow-clear
          placeholder="请输入"
        />
      </a-form-item>
      <a-form-item label="备注" name="remark">
        <a-textarea
          style="width: 328px"
          v-model:value="formState.remark"
          placeholder="请输入"
          :auto-size="{ minRows: 3, maxRows: 8 }"
          allow-clear
        />
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="handleCancel">取 消</a-button>
      <a-button
        type="primary"
        class="mg-l-small"
        :loading="saving"
        @click="handleSave"
        >保 存</a-button
      >
    </template>
  </a-modal>
</template>

<script setup>
import { reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { UploadOutlined } from "@ant-design/icons-vue";
import useUpload from "@/hook/useUpload.js";
import { fileNames } from "@/utils/preview.js";
import { archiveContract } from "@/api/Contract/lifecycle.js";
import { PaperClipOutlined, CloseCircleFilled } from "@ant-design/icons-vue";
defineOptions({ name: "LifecycleArchiveModal" });
import { useFileCompare } from "@/hook/business/useFileCompare.js";
const { compareFiles } = useFileCompare();
/** 与 `useUpload` 中 `fileTypelist` 的 key 一致，逗号分隔 */
const UPLOAD_TYPE_KEYS = ".jpg,.pdf,.zip,.xlsx,.doc,.txt";
const UPLOAD_MAX_MB = 20;

const { uploadFile } = useUpload();

const props = defineProps({
  open: { type: Boolean, default: false },
  /** 合同列表行，用于预填合同号 */
  detail: { type: Object, default: null },
});

const emit = defineEmits(["update:open", "success"]);

const formRef = ref(null);
const saving = ref(false);
const formState = reactive({
  fileList: [],
  contractNo: "",
  remark: "",
});

const validator = async (_rule, value) => {
  if (!value?.length) {
    return Promise.reject("请上传附件");
  }
};

function resetForm() {
  formState.fileList = [];
  formState.contractNo = "";
  formState.remark = "";
}

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    resetForm();
    const no = props.detail?.contractNo;
    // if (no) formState.contractNo = no
  },
);

async function beforeUpload(file) {
  try {
    const res = await uploadFile(file, null, {
      types: UPLOAD_TYPE_KEYS,
      maxSize: UPLOAD_MAX_MB,
    });
    formState.fileList = [
      {
        data: res.data,
        name: res.name,
        size: res.size,
        type: res.type,
      },
    ];
    message.success("上传成功");
    formRef.value?.validateFields(["fileList"]).catch(() => {});
  } catch {
    // 格式/大小等已在 uploadFile 内提示
  }
  return false;
}

function handleFileRemove(index) {
  formState.fileList.splice(index, 1);
  formRef.value?.validateFields(["fileList"]).catch(() => {});
}

function handleCancel() {
  emit("update:open", false);
}

async function handleSave() {
  const detailfile =
    props.detail?.attachments?.find((e) => e.attachmentType === 1) ??
    props.detail?.attachments?.[0];

  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  if (!detailfile?.fileUrl) {
    message.warning("缺少合同文本附件");
    return;
  }

  const id = props.detail?.id;
  if (!id) {
    message.warning("缺少合同信息");
    return;
  }
  const file = formState.fileList[0];
  if (!file?.data) {
    message.warning("请先上传归档附件");
    return;
  }

  saving.value = true;
  try {
    const compareResult = await compareFiles({
      url1: detailfile.fileUrl,
      url2: file.data,
      name1: detailfile.fileName,
      name2: file.name,
    });
    if (compareResult.type !== "same") {
      message.warning("与审批版本存在差异，请复核");
      return;
    }
  } catch (error) {
    message.error(error?.message || "文件对比失败");
    return;
  } finally {
    saving.value = false;
  }
  saving.value = true;
  try {
    const res = await archiveContract({
      id,
      contractNo: formState.contractNo,
      fileName: file.name,
      fileUrl: file.data,
      remark: formState.remark || undefined,
    });
    if (res.errno === 0) {
      message.success("归档成功");
      emit("success");
      emit("update:open", false);
    }
  } finally {
    saving.value = false;
  }
}
</script>

<style lang="scss" scoped>
.arc-hint {
  margin-top: 8px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.arc-file-rows {
  margin-top: 4px;
}

.delete-icon-btn {
  font-size: 14px;
  color: #999999;
  cursor: pointer;
  cursor: pointer;
}
</style>
