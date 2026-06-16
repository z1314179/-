<template>
  <div v-for="item in childData.children" :key="item.id">
    <div v-for="citem in item.children" :key="citem.id">
      <a-checkbox>{{ citem.name }}</a-checkbox>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "",
});
const props = defineProps({
  childData: {
    type: Object,
    default: {},
  },
});
</script>

<style lang="scss" scoped>
</style>
