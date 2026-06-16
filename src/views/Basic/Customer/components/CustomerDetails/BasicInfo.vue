<template>
  <div class="flex flex-wrap" style="max-width: 900px">
    <a-form-item :label="item.label" v-for="(item, key) in fields" :key="key">
      {{ item.value }}
    </a-form-item>
  </div>
</template>

<script setup>
const props = defineProps({
  fields: Object,
});
</script>
