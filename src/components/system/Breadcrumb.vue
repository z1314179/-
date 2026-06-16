<template>
  <a-breadcrumb separator=">">
    <a-breadcrumb-item v-for="(item, index) in routeList" :key="index">
      <a-button type="link" @click="toRouter(item.path)" v-if="item.path"
        >{{ item.name }}
      </a-button>
      <span v-else>{{ item.name }} </span>
    </a-breadcrumb-item>
  </a-breadcrumb>
</template>

<script setup>
import { useRouter } from "vue-router";
const props = defineProps({
  routeList: {
    type: Array,
    default: [],
  },
});
defineOptions({
  name: "Breadcrumb",
});
const router = useRouter();
const toRouter = (path) => {
  router.push(path);
};
</script>

<style lang="scss" scoped>
</style>
