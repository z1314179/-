import {
    reactive,
    computed,
    h,
} from "vue";
import useStore from "@/store/user.js";
import tabsStore from "@/store/tabs.js";
import { DownOutlined } from '@ant-design/icons-vue'
import {
    useRoute,
    useRouter
} from "vue-router";

export function useMenu() {

    const user = useStore();
    const tabs = tabsStore();
    const router = useRouter();
    const route = useRoute();

    const selectedKeys = computed(() => {
        tabs.setTargetRoute(route.fullPath.substring(1));
        return [!route.meta.port && route.meta.parentPath ? route.meta.parentPath : route.path];
    });

    const items = computed(() => {
        return user.routes.map((e) => {
            let obj = {
                label: e.name,
                key: e.title,
                popupOffset: [-24, 2],
                popupClassName: 'popupClassName_menu',
                icon: null
            }
            if (e.children && e.children.length && e.children.some(z => z.type === 1)) {
                obj.label = h('span', { class: 'layout-menu__parent-title flex' }, [
                    e.name,
                    h('div', {
                    }, [h(DownOutlined, { class: 'layout-menu__down-icon' })])

                ])
                obj.children = e.children.filter(z => z.type === 1).map((z) => {
                    return {
                        label: z.name,
                        key: z.title,
                        icon: null
                    };
                });
            }
            return obj;
        });
    });

    const handleMenuItem = (e) => {
        router.push(e.key);
    };
    return {
        selectedKeys,
        items,
        handleMenuItem,
    };
}