// 权限注入 Hook：提供并下发 PERM 权限判断函数。
import { provide, ref } from "vue";
import useStore from "@/store/user.js";
export default function usePerms() {
  const user = useStore()
  const PERM = (VAL) => {
    return user.perms[VAL] ? true : false
  }
  provide('PERM', PERM)
  return {
    PERM
  }
}
