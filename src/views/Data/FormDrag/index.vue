<template>
  <div class="form-drag-page page-content">
    <a-card title="表单拖拽搭建" :bordered="false">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 16px"
        message="左侧为固定合同字段，每项仅能拖入右侧一次，拖走后左侧不再显示；在右侧删除该项后，字段会回到左侧原顺序。导出 JSON 含 name、description、formComponents。"
      />

      <div class="form-meta">
        <a-form layout="vertical" class="form-meta-form">
          <a-row :gutter="16">
            <a-col :xs="24" :md="12">
              <a-form-item label="表单名称（name）">
                <a-input
                  v-model:value="formName"
                  placeholder="例如 项目审批申请单"
                  allow-clear
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="表单说明（description）">
                <a-input
                  v-model:value="formDescription"
                  placeholder="例如 项目立项审批流程"
                  allow-clear
                />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <div class="builder-layout">
        <aside class="palette-panel">
          <div class="panel-title">固定合同字段</div>
          <p class="panel-hint">每项仅可拖入右侧一次</p>
          <draggable
            v-model="palette"
            class="palette-list"
            item-key="id"
            :group="{ name: 'form-builder', pull: true, put: false }"
            :sort="false"
            :animation="200"
            ghost-class="palette-ghost"
          >
            <template #item="{ element }">
              <div class="palette-item">
                <DragOutlined class="palette-drag-icon" />
                <span class="palette-label">{{ element.paletteLabel }}</span>
                <a-tag size="small">{{ element.componentType }}</a-tag>
              </div>
            </template>
          </draggable>
        </aside>

        <section class="canvas-panel">
          <div class="panel-title">摆放区域（formComponents 顺序）</div>
          <draggable
            v-model="canvasFields"
            class="canvas-list"
            item-key="id"
            :group="{ name: 'form-builder', pull: true, put: true }"
            handle=".drag-handle"
            :animation="200"
            :empty-insert-threshold="80"
            ghost-class="field-ghost"
            chosen-class="field-chosen"
          >
            <template #item="{ element }">
              <div class="field-row">
                <span class="drag-handle" title="拖动排序">
                  <DragOutlined />
                </span>
                <div class="field-meta">
                  <span class="field-label">{{ element.props.label }}</span>
                  <span
                    v-if="element.props.fieldName"
                    class="field-name-code"
                    >{{ element.props.fieldName }}</span
                  >
                  <a-tag size="small">{{ element.componentType }}</a-tag>
                </div>
                <div class="field-preview">
                  <component
                    :is="previewComponent(element.componentType)"
                    v-bind="previewProps(element)"
                  />
                </div>
                <a-button
                  type="text"
                  danger
                  class="field-remove"
                  @click="removeFromCanvas(element.id)"
                >
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </div>
            </template>
            <template #footer>
              <div v-if="canvasFields.length === 0" class="canvas-empty">
                从左侧拖入合同字段到此处
              </div>
            </template>
          </draggable>
        </section>
      </div>

      <a-divider />
      <div class="order-block">
        <div class="export-toolbar">
          <span class="order-title"
            >完整导出（name / description / formComponents）</span
          >
          <a-space>
            <a-button size="small" @click="copyFullJson">复制 JSON</a-button>
            <a-button size="small" type="primary" @click="downloadFullJson"
              >下载 .json</a-button
            >
          </a-space>
        </div>
        <pre class="order-json">{{ fullExportJson }}</pre>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import draggable from "vuedraggable";
import { message } from "ant-design-vue";
import { DragOutlined, DeleteOutlined } from "@ant-design/icons-vue";

defineOptions({
  name: "DataFormDrag",
});

/** 合同固定字段定义（顺序即左侧默认排序）；拖入右侧后从左侧移除，删除画布项后按此顺序插回 */
const CONTRACT_FIELDS = [
  {
    id: "field-contract-no",
    paletteLabel: "合同编号",
    componentType: "TextField",
    props: {
      fieldName: "contractNo",
      label: "合同编号",
      required: true,
      placeholder: "请输入合同编号",
    },
  },
  {
    id: "field-contract-owner",
    paletteLabel: "合同负责人",
    componentType: "TextField",
    props: {
      fieldName: "contractOwner",
      label: "合同负责人",
      required: true,
      placeholder: "请输入负责人",
    },
  },
  {
    id: "field-contract-type",
    paletteLabel: "合同类型",
    componentType: "SelectField",
    props: {
      fieldName: "contractType",
      label: "合同类型",
      required: true,
      placeholder: "请选择合同类型",
      options: [
        { value: "purchase", label: "采购合同" },
        { value: "sales", label: "销售合同" },
        { value: "service", label: "服务合同" },
        { value: "other", label: "其他" },
      ],
    },
  },
  {
    id: "field-contacts",
    paletteLabel: "联系人",
    componentType: "MultiSelectField",
    props: {
      fieldName: "contactUserIds",
      label: "联系人",
      required: false,
      placeholder: "请选择联系人（可多选）",
      options: [
        { value: "user_001", label: "张三" },
        { value: "user_002", label: "李四" },
        { value: "user_003", label: "王五" },
        { value: "user_004", label: "赵六" },
      ],
    },
  },
  {
    id: "field-sign-date",
    paletteLabel: "签署日期",
    componentType: "DateField",
    props: {
      fieldName: "signDate",
      label: "签署日期",
      required: true,
      format: "yyyy-MM-dd",
    },
  },
  {
    id: "field-sign-place",
    paletteLabel: "合同签署地",
    componentType: "TextField",
    props: {
      fieldName: "signPlace",
      label: "合同签署地",
      required: true,
      placeholder: "请输入合同签署地",
    },
  },
  {
    id: "field-delivery-place",
    paletteLabel: "交货地点",
    componentType: "TextField",
    props: {
      fieldName: "deliveryPlace",
      label: "交货地点",
      required: false,
      placeholder: "请输入交货地点",
    },
  },
];

const CONTRACT_FIELD_ORDER = CONTRACT_FIELDS.map((f) => f.id);

function cloneContractPalette() {
  return CONTRACT_FIELDS.map((f) => ({
    id: f.id,
    paletteLabel: f.paletteLabel,
    componentType: f.componentType,
    props: JSON.parse(JSON.stringify(f.props)),
  }));
}

function sortPaletteByContractOrder(items) {
  const rank = (id) => {
    const i = CONTRACT_FIELD_ORDER.indexOf(id);
    return i === -1 ? 999 : i;
  };
  return [...items].sort((a, b) => rank(a.id) - rank(b.id));
}

/** 左侧：仍可选中的合同字段（与画布互斥，同一 id 只会在一侧） */
const palette = ref(cloneContractPalette());

const formName = ref("项目审批申请单");
const formDescription = ref("项目立项审批流程");

const canvasFields = ref([]);

function removeFromCanvas(id) {
  const removed = canvasFields.value.find((f) => f.id === id);
  if (!removed) return;
  canvasFields.value = canvasFields.value.filter((f) => f.id !== id);
  palette.value = sortPaletteByContractOrder([...palette.value, removed]);
}

function previewComponent(componentType) {
  switch (componentType) {
    case "TextareaField":
      return "a-textarea";
    case "DateField":
      return "a-date-picker";
    case "RadioField":
      return "a-radio-group";
    case "SelectField":
    case "MultiSelectField":
      return "a-select";
    default:
      return "a-input";
  }
}

/** dayjs / ant-design-vue 常用大写 Y */
function datePickerFormat(fmt) {
  if (!fmt || typeof fmt !== "string") return "YYYY-MM-DD";
  return fmt.replace(/y/g, "Y");
}

function previewProps(element) {
  const { componentType, props: p } = element;
  const style = { maxWidth: "280px", width: "100%" };
  if (componentType === "TextField") {
    return {
      disabled: true,
      placeholder: p.placeholder,
      style,
    };
  }
  if (componentType === "TextareaField") {
    return {
      disabled: true,
      placeholder: p.placeholder,
      rows: 2,
      style,
    };
  }
  if (componentType === "DateField") {
    return {
      disabled: true,
      format: datePickerFormat(p.format),
      placeholder: p.label,
      style,
    };
  }
  if (componentType === "RadioField") {
    return {
      disabled: true,
      options: (p.options || []).map((o) => ({
        label: o.label,
        value: o.value,
      })),
      style: { width: "100%", maxWidth: "100%" },
    };
  }
  if (componentType === "SelectField") {
    return {
      disabled: true,
      allowClear: true,
      placeholder: p.placeholder || p.label,
      options: (p.options || []).map((o) => ({
        label: o.label,
        value: o.value,
      })),
      style,
    };
  }
  if (componentType === "MultiSelectField") {
    return {
      disabled: true,
      mode: "multiple",
      allowClear: true,
      placeholder: p.placeholder || p.label,
      options: (p.options || []).map((o) => ({
        label: o.label,
        value: o.value,
      })),
      style,
    };
  }
  return { disabled: true, style };
}

const exportPayload = computed(() => ({
  name: formName.value,
  description: formDescription.value,
  formComponents: canvasFields.value.map((f) => ({
    componentType: f.componentType,
    props: f.props,
  })),
}));

const fullExportJson = computed(() =>
  JSON.stringify(exportPayload.value, null, 2),
);

async function copyFullJson() {
  try {
    await navigator.clipboard.writeText(fullExportJson.value);
    message.success("已复制到剪贴板");
  } catch {
    message.error("复制失败，请手动选择复制");
  }
}

function downloadFullJson() {
  const blob = new Blob([fullExportJson.value], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(formName.value || "form").replace(/[/\\?%*:|"<>]/g, "-") || "form"}-schema.json`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  message.success("已开始下载");
}
</script>

<style lang="scss" scoped>
.form-drag-page {
  :deep(.ant-card) {
    border-radius: 8px;
  }

  .form-meta {
    margin-bottom: 16px;
  }

  .form-meta-form {
    max-width: 100%;
  }

  .builder-layout {
    display: flex;
    gap: 16px;
    align-items: stretch;
    min-height: 420px;
  }

  .palette-panel {
    flex: 0 0 260px;
    padding: 12px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
  }

  .canvas-panel {
    flex: 1;
    min-width: 0;
    padding: 12px;
    background: #fff;
    border: 1px solid #d9d9d9;
    border-radius: 8px;
  }

  .panel-title {
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 4px;
  }

  .panel-hint {
    margin: 0 0 10px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
  }

  .palette-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .palette-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    cursor: grab;
    transition:
      border-color 0.2s,
      box-shadow 0.2s;

    &:hover {
      border-color: #91d5ff;
      box-shadow: 0 2px 6px rgba(24, 144, 255, 0.12);
    }

    &:active {
      cursor: grabbing;
    }
  }

  .palette-drag-icon {
    color: rgba(0, 0, 0, 0.35);
    font-size: 14px;
  }

  .palette-label {
    flex: 1;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.85);
  }

  .palette-ghost {
    opacity: 0.6;
    background: #e6f7ff;
  }

  .canvas-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 360px;
  }

  .canvas-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    margin-top: 8px;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.35);
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    background: #fafafa;
  }

  .field-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    transition: box-shadow 0.2s;
  }

  .field-preview {
    flex: 1;
    min-width: 0;
  }

  .field-ghost {
    opacity: 0.55;
    background: #e6f7ff;
    border-style: dashed;
  }

  .field-chosen {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .drag-handle {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-top: 2px;
    color: rgba(0, 0, 0, 0.45);
    cursor: grab;
    border-radius: 6px;
    transition:
      color 0.2s,
      background 0.2s;

    &:hover {
      color: #1890ff;
      background: rgba(24, 144, 255, 0.08);
    }

    &:active {
      cursor: grabbing;
    }
  }

  .field-meta {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 100px;
    max-width: 140px;
    padding-top: 4px;
  }

  .field-label {
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
  }

  .field-name-code {
    font-size: 12px;
    font-family:
      ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: rgba(0, 0, 0, 0.45);
  }

  .field-remove {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .order-block {
    margin-top: 12px;
  }

  .export-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }

  .order-title {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.65);
  }

  .order-json {
    margin: 0;
    padding: 12px 14px;
    font-size: 12px;
    line-height: 1.5;
    background: #fafafa;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    max-width: 100%;
    overflow: auto;
    max-height: 480px;
  }
}
</style>
