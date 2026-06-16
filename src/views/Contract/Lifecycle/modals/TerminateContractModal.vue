<template>
  <a-modal
    :open="open"
    :mask-closable="false"
    width="780px"
    :title="modalTitle"
    destroy-on-close
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      layout="vertical"
      :model="formState"
      class="pd-x-small"
    >
      <div class="term-contract-no mg-b-medium">
        <span>合同号：</span>
        <span class="p-color">{{ contractNoDisplay }}</span>
      </div>
      <div class="flex">
        <a-form-item
          style="margin-right: 26px"
          label="终止协议号"
          name="finalCode"
          :rules="[{ required: true, message: '请输入终止协议号' }]"
        >
          <a-input
            style="width: 260px"
            v-model:value="formState.finalCode"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
        <a-form-item
          label="终止协议名称"
          name="finalName"
          :rules="[{ required: false, message: '请输入终止协议名称' }]"
        >
          <a-input
            style="width: 400px"
            v-model:value="formState.finalName"
            allow-clear
            placeholder="请输入"
          />
        </a-form-item>
      </div>

      <a-form-item
        label="合同终止日期"
        name="finalDate"
        :rules="[{ required: true, message: '请选择合同终止日期' }]"
      >
        <a-date-picker
          v-model:value="formState.finalDate"
          value-format="YYYY-MM-DD"
          placeholder="请选择"
          :disabled-date="disabledFinalDate"
          style="width: 260px"
        />
      </a-form-item>
      <a-form-item label="终止原因" :rules="[{ required: true, message: '请输入终止原因' }]" name="finalReason">
        <a-textarea
          v-model:value="formState.finalReason"
          placeholder="请输入"
          :auto-size="{ minRows: 3, maxRows: 8 }"
          allow-clear
          style="width: 688px"
        />
      </a-form-item>
      <a-form-item
        label="上传附件"
        name="fileList"
        :rules="[
          {
            required: true,
            validator: fileListValidator,
            message: '请上传附件',
          },
        ]"
      >
        <a-upload
          action="#"
          :before-upload="beforeUpload"
          :max-count="10"
          :show-upload-list="false"
        >
          <a-button style="margin-top: 4px">
            <template #icon>
              <UploadOutlined />
            </template>
            上传附件
          </a-button>
        </a-upload>

        <div v-if="formState.fileList.length" class="mg-t-small">
          <div
            v-for="(item, index) in formState.fileList"
            :key="item.uid"
            class="flex align-center"
            style="max-width: 260px; margin-top: 6px"
          >
            <FileRowItem isDownload :item="item.fileUrl">
              <template #right>
                <CloseCircleFilled
                  class="term-del-icon mg-l-small"
                  @click="handleFileRemove(index)"
                />
              </template>
            </FileRowItem>
          </div>
        </div>
        <div class="term-hint" v-if="!formState.fileList.length">
          单个文件不超过20MB
        </div>
      </a-form-item>
    </a-form>
    <template #footer>
      <div class="text-right">
        <a-button :disabled="submitting" @click="handleCancel">{{
          isEdit ? "关 闭" : "取 消"
        }}</a-button>
        <a-button
          type="primary"
          ghost
          class="mg-l-small"
          :loading="submitting"
          :disabled="submitting"
          @click="handleSave"
          >保 存</a-button
        >
        <a-button
          type="primary"
          class="mg-l-small"
          :loading="submitting"
          :disabled="submitting"
          @click="handleSubmit"
          >提 交</a-button
        >
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { UploadOutlined, CloseCircleFilled } from "@ant-design/icons-vue";
import dayjs from "dayjs";
import useUpload from "@/hook/useUpload.js";
import FileRowItem from "@/components/upload/FileRowItem.vue";
import {
  contractFinalCreate,
  contractFinalUpdate,
} from "@/api/Contract/lifecycle";

defineOptions({ name: "LifecycleTerminateContractModal" });

const UPLOAD_TYPE_KEYS = ".jpg,.pdf,.zip,.xlsx,.doc,.txt";
const UPLOAD_MAX_MB = 20;

const { uploadFile } = useUpload();

const props = defineProps({
  open: { type: Boolean, default: false },
  /** create：合同列表终止；edit：终止合同列表编辑 */
  mode: { type: String, default: "create" },
  detail: { type: Object, default: null },
});

const emit = defineEmits(["update:open", "refresh"]);

const formRef = ref(null);
const uploadedFiles = ref([]);
const submitting = ref(false);
const formState = reactive({
  finalName: "",
  finalCode: "",
  finalDate: "",
  finalReason: "",
  fileList: [],
});

const isEdit = computed(() => props.mode === "edit");
const modalTitle = computed(() => (isEdit.value ? "编辑终止合同" : "终止合同"));
const contractNoDisplay = computed(
  () => props.detail?.contractNo || props.detail?.contract?.contractNo || "-",
);

const fileListValidator = () => {
  if (formState.fileList.length) {
    return Promise.resolve();
  }
  return Promise.reject("请上传附件");
};

function getContractEndDate() {
  return props.detail?.endDate || props.detail?.contract?.endDate || null;
}

function parseFinalFiles(files) {
  if (files == null || files === "") return [];
  if (typeof files === "string") {
    try {
      const parsed = JSON.parse(files);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(files) ? files : [];
}

function disabledFinalDate(current) {
  if (!current) return false;
  if (current.isBefore(dayjs(), "day")) return true;
  const endStr = getContractEndDate();
  const end = endStr ? dayjs(endStr).startOf("day") : null;
  if (end && current.isAfter(end, "day")) return true;
  return false;
}

function fillFormFromDetail(record) {
  if (!record) return;
  formState.finalName = record.finalName ?? "";
  formState.finalCode = record.finalCode ?? "";
  formState.finalDate = record.finalDate ?? "";
  formState.finalReason = record.finalReason ?? "";
  formState.fileList = parseFinalFiles(record.finalFiles);
}

function resetForm() {
  formState.finalName = "";
  formState.finalCode = "";
  formState.finalDate = "";
  formState.finalReason = "";
  formState.fileList = [];
  uploadedFiles.value = [];
}

watch(
  () => [props.open, props.detail],
  ([open]) => {
    if (!open) {
      submitting.value = false;
      return;
    }
    if (isEdit.value) {
      fillFormFromDetail(props.detail);
    } else {
      resetForm();
    }
  },
);

function getContractId() {
  const d = props.detail;
  return d.id;
}

function buildPayload(finalStatus) {
  const payload = {
    id: getContractId(),
    finalDate: formState.finalDate,
    finalReason: formState.finalReason,
    finalFiles: formState.fileList,
    finalStatus,
    finalName: formState.finalName,
    finalCode: formState.finalCode,
  };
  if (isEdit.value && props.detail?.id) {
    payload.id = props.detail.id;
  }
  return payload;
}

async function beforeUpload(file) {
  try {
    const res = await uploadFile(file, null, {
      types: UPLOAD_TYPE_KEYS,
      maxSize: UPLOAD_MAX_MB,
    });
    formState.fileList.push({
      fileName: res.name,
      fileUrl: res.data,
    });
    message.success("上传成功");
    formRef.value?.validateFields(["fileList"]).catch(() => {});
  } catch {}
  return false;
}

function handleFileRemove(index) {
  formState.fileList.splice(index, 1);
  formRef.value?.validateFields(["fileList"]).catch(() => {});
}

function handleCancel() {
  emit("update:open", false);
}

async function submitForm(finalStatus) {
  if (submitting.value) return;
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  submitting.value = true;
  try {
    const payload = buildPayload(finalStatus);
    const res = isEdit.value
      ? await contractFinalUpdate(payload)
      : await contractFinalCreate(payload);
    if (res.errno === 0) {
      message.success(finalStatus === 1 ? "提交成功" : "保存成功");
      emit("refresh");
      emit("update:open", false);
    }
  } finally {
    submitting.value = false;
  }
}

function handleSave() {
  submitForm(0);
}

function handleSubmit() {
  submitForm(1);
}
</script>

<style lang="scss" scoped>
.term-hint {
  margin-top: 8px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
}

.term-del-icon {
  font-size: 14px;
  color: #999999;
  cursor: pointer;
}
</style>
