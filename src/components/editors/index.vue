<template>
  <div class="editor-root">
    <Toolbar
      style="border-bottom: 1px solid #d9d9d9"
      :editor="editorRef"
      :defaultConfig="toolbarConfig"
      :mode="mode"
    />
    <Editor
      class="editor-instance"
      style="height: 380px; min-height: 380px; overflow-y: auto"
      v-model="valueHtml"
      :defaultConfig="editorConfig"
      :mode="mode"
      @onChange="handleChange"
      @onCreated="handleCreated"
    />
  </div>
</template>

<script setup>
import "@wangeditor/editor/dist/css/style.css"; // 引入 css
import "./index.scss"; // 引入 css
import { getToken } from "@/api/qiNiu.js";
import * as qiniu from "qiniu-js";
import {
  onBeforeUnmount,
  ref,
  shallowRef,
  onMounted,
  watch,
  defineExpose,
} from "vue";
import { formatDateTime, getSidUuid } from "@/utils/com.js";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";

const editorRef = shallowRef(null);
const props = defineProps({
  data: {
    type: String,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});
const valueHtml = ref("");
const mode = "default";
// 模拟 ajax 异步获取内容
onMounted(() => {});
watch(
  () => props.data,
  (newValue, oldValue) => {
    if (newValue) {
      valueHtml.value = newValue;
    } else {
    }
  }
);
const $emit = defineEmits(["change"]);
const handleChange = (editor) => {
  $emit("change", valueHtml.value);
};
const toolbarConfig = {
  disabled: true,
  excludeKeys: [
    "group-indent",
    "todo",

    "fontSize",
    "fullScreen",
    "codeBlock",
    "blockquote",
    "|",
    "group-image",
    "group-video",
    "insertImage",
    "insertVideo",
  ],
};
const editorConfig = {
  placeholder: "请输入内容...",
  MENU_CONF: {
    uploadImage: {
      async customUpload(file, insertFn) {
        const result = await getToken();
        // 上传文件
        const pos = file.name.lastIndexOf(".");
        const lastName = file.name.substring(0, pos);
        const name = {
          name: "media/image/",
          time: formatDateTime(new Date().getTime(), "yyyy-MM-dd/"),
          random: getSidUuid(),
          text: "_name:" + lastName,
          type: file.name.substr(file.name.lastIndexOf(".")),
        };
        const observable = qiniu.upload(
          file,
          Object.values(name).join(""),
          result.data.token
        );

        observable.subscribe({
          next: (res) => {
            // 进度展示
            console.log(res, "进度");
          },
          error: (err) => {
            console.log(err, "错误");
          },
          complete: (res) => {
            const url = process.env.IMG + "/" + res.key;
            insertFn(url, file.name, res.key);
          },
        });
      },
    },
  },
};

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

const handleCreated = (editor) => {
  editorRef.value = editor; // 记录 editor 实例，重要！
  if (props.disabled) {
    editorRef.value.disable();
  }
};
defineExpose({});
</script>

<style scoped lang="scss">
.editor-root {
  border: 1px solid #d9d9d9;
}

.editor-container {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.editor-toolbar {
  border-bottom: 1px solid #ddd;
}

.editor-content {
  min-height: 300px;
  padding: 10px;
}
img[src^="data:image"] {
  display: none;
}
:deep(.editor-instance) {
  min-height: 380px;
  .w-e-text-container {
    min-height: 320px;
    padding: 16px;
  }
}
</style>