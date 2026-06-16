<template>
  <div class="template-custom-builder">
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
                <span v-if="element.props.fieldName" class="field-name-code">{{ element.props.fieldName }}</span>
                <a-tag size="small">{{ element.componentType }}</a-tag>
              </div>
              <div class="field-preview">
                <component :is="previewComponent(element.componentType)" v-bind="previewProps(element)" />
              </div>
              <a-button type="text" danger class="field-remove" @click="removeFromCanvas(element.id)">
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
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import { DragOutlined, DeleteOutlined } from '@ant-design/icons-vue'

defineOptions({
  name: 'TemplateCustomBuilder'
})

const props = defineProps({
  fixedFields: {
    type: Array,
    default: () => []
  },
  formComponents: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:formComponents'])

const palette = ref([])
const canvasFields = ref([])

function cloneRow(row) {
  return { ...row, props: JSON.parse(JSON.stringify(row.props || {})) }
}

function sortPaletteByContractOrder(items) {
  const fixedFieldOrder = (props.fixedFields || []).map((f) => f.id)
  const rank = (id) => {
    const i = fixedFieldOrder.indexOf(id)
    return i === -1 ? 999 : i
  }
  return [...items].sort((a, b) => rank(a.id) - rank(b.id))
}

function rebuildFromExternal(external) {
  const ext = Array.isArray(external) ? external.map((row) => cloneRow(row)) : []
  canvasFields.value = ext
  const pickedIds = new Set(ext.map((f) => f.id))
  palette.value = sortPaletteByContractOrder(
    (props.fixedFields || []).filter((f) => !pickedIds.has(f.id)).map((f) => cloneRow(f))
  )
}

function removeFromCanvas(id) {
  const removed = canvasFields.value.find((f) => f.id === id)
  if (!removed) return
  canvasFields.value = canvasFields.value.filter((f) => f.id !== id)
  palette.value = sortPaletteByContractOrder([...palette.value, cloneRow(removed)])
}

function previewComponent(componentType) {
  if (componentType === 'TextareaField') return 'a-textarea'
  if (componentType === 'DateField') return 'a-date-picker'
  if (componentType === 'RadioField') return 'a-radio-group'
  if (componentType === 'SelectField' || componentType === 'MultiSelectField') return 'a-select'
  return 'a-input'
}

function datePickerFormat(fmt) {
  if (!fmt || typeof fmt !== 'string') return 'YYYY-MM-DD'
  return fmt.replace(/y/g, 'Y')
}

function previewProps(element) {
  const { componentType, props: p } = element
  const style = { maxWidth: '280px', width: '100%' }
  if (componentType === 'TextField') return { disabled: true, placeholder: p.placeholder, style }
  if (componentType === 'TextareaField') return { disabled: true, placeholder: p.placeholder, rows: 2, style }
  if (componentType === 'DateField') return { disabled: true, format: datePickerFormat(p.format), placeholder: p.label, style }
  if (componentType === 'RadioField') return { disabled: true, options: (p.options || []).map((o) => ({ label: o.label, value: o.value })), style: { width: '100%', maxWidth: '100%' } }
  if (componentType === 'SelectField') return { disabled: true, allowClear: true, placeholder: p.placeholder || p.label, options: (p.options || []).map((o) => ({ label: o.label, value: o.value })), style }
  if (componentType === 'MultiSelectField') return { disabled: true, mode: 'multiple', allowClear: true, placeholder: p.placeholder || p.label, options: (p.options || []).map((o) => ({ label: o.label, value: o.value })), style }
  return { disabled: true, style }
}

watch(
  () => props.formComponents,
  (list) => {
    rebuildFromExternal(list)
  },
  { immediate: true, deep: true }
)


watch(
  canvasFields,
  (list) => {
    emit('update:formComponents', list.map((row) => cloneRow(row)))
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.template-custom-builder {
  .builder-layout { display: flex; gap: 16px; align-items: stretch; min-height: 420px; }
  .palette-panel { flex: 0 0 260px; padding: 12px; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; }
  .canvas-panel { flex: 1; min-width: 0; padding: 12px; background: #fff; border: 1px solid #d9d9d9; border-radius: 8px; }
  .panel-title { font-weight: 600; color: rgba(0, 0, 0, 0.85); margin-bottom: 4px; }
  .panel-hint { margin: 0 0 10px; font-size: 12px; color: rgba(0, 0, 0, 0.45); }
  .palette-list { display: flex; flex-direction: column; gap: 8px; }
  .palette-item { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; cursor: grab; transition: border-color 0.2s, box-shadow 0.2s; }
  .palette-item:hover { border-color: #91d5ff; box-shadow: 0 2px 6px rgba(24, 144, 255, 0.12); }
  .palette-item:active { cursor: grabbing; }
  .palette-drag-icon { color: rgba(0, 0, 0, 0.35); font-size: 14px; }
  .palette-label { flex: 1; font-size: 14px; color: rgba(0, 0, 0, 0.85); }
  .palette-ghost { opacity: 0.6; background: #e6f7ff; }
  .canvas-list { display: flex; flex-direction: column; gap: 10px; min-height: 360px; }
  .canvas-empty { display: flex; align-items: center; justify-content: center; min-height: 200px; margin-top: 8px; font-size: 14px; color: rgba(0, 0, 0, 0.35); border: 2px dashed #d9d9d9; border-radius: 8px; background: #fafafa; }
  .field-row { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 8px; transition: box-shadow 0.2s; }
  .field-preview { flex: 1; min-width: 0; }
  .field-ghost { opacity: 0.55; background: #e6f7ff; border-style: dashed; }
  .field-chosen { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
  .drag-handle { flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; margin-top: 2px; color: rgba(0, 0, 0, 0.45); cursor: grab; border-radius: 6px; transition: color 0.2s, background 0.2s; }
  .drag-handle:hover { color: #1890ff; background: rgba(24, 144, 255, 0.08); }
  .drag-handle:active { cursor: grabbing; }
  .field-meta { flex-shrink: 0; display: flex; flex-direction: column; gap: 6px; min-width: 100px; max-width: 140px; padding-top: 4px; }
  .field-label { font-weight: 500; color: rgba(0, 0, 0, 0.85); }
  .field-name-code { font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: rgba(0, 0, 0, 0.45); }
  .field-remove { flex-shrink: 0; margin-top: 2px; }
}
</style>
