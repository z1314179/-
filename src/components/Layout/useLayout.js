import {
    ref,
    reactive,
    computed,
    h,
    watch
} from "vue";
import useStore from "@/store/user.js";
import interfaceStore from "@/store/interface.js";
import {
    useRouter,
    useRoute
} from "vue-router";
import {
    getUserInfo
} from "@/api/login.js";
export const useLayout = () => {
    const TIMEOUT_INTERVAL = 60000;
    const updatePasswordState = ref(false);
    const user = useStore();
    const router = useRouter();
    const route = useRoute();
    const interfaceStores = interfaceStore();
    // let portPath = router.getRoutes().find(e => e.meta.port)
    // router.replace({
    //     path: '/purchasingManagement/purchaseRequests',
    // })
    // console.log(portPath);

    // watch(() => router, () => {
    //     if (['/'].includes(router.currentRoute.value.path) || router.currentRoute.value.query.routerChange) {
    //         console.log(portPath.path);

    //         router.replace({
    //             path: portPath.path,
    //         })
    //     }

    // }, {
    //     immediate: true,
    //     deep: true
    // })
    const userData = computed(() => {
        return user.userinfo;
    });

    getUserInfo().then((res) => {
        user.setUser({
            ...res.data
        });
    });
    const onClick = (e) => {
        switch (e.key) {
            case 1:
                user.toLogin();
                break;
            default:
                break;
        }
    };
    const homeStatisticsData = computed(() => {
        return interfaceStores.homeStatisticsData;
    });
    let timer = null;
    const getHomeStatistics = () => {
        if (timer) clearTimeout(timer);        
        if (!user.token) return
        interfaceStores.getHomeStatistics();
        timer = setTimeout(() => {
            getHomeStatistics()
        }, TIMEOUT_INTERVAL);
    }
    watch(() => route.path, () => {
        if (route.path == '/home') {
            if (timer) clearTimeout(timer);
        } else {
            getHomeStatistics()
        }

    }, {
        immediate: true,
        deep: true
    });
    return {
        homeStatisticsData,
        userData,
        onClick,
        updatePasswordState,
    };
}