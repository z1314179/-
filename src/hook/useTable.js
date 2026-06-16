// 表格管理 Hook：统一处理查询、分页、加载与导出能力。
import { ref, reactive, toRaw } from "vue";
import { useRouter } from "vue-router";
import { nFormat, numberFormatter } from "@/utils/com.js";
import { message } from "ant-design-vue";
/**
 * 表格数据管理 Hook
 * @param {Function} getApi - 获取列表数据的 API 函数
 * @param {Object} page - 分页配置选项
 * @returns {Object} 返回表格相关的状态和方法
 */
export default function useTable(getApi, page = {}, handlerFn = {}) {
  const { getSearchQuery } = handlerFn
  // 表单查询条件
  const formState = ref({});
  // 表格数据源
  const dataSource = ref([]);
  // 路由实例
  const router = useRouter();
  // 表格 loading（与页面解构名 loadTable 一致）
  const loadTable = ref(false);
  const exportLoad = ref(false)
  // 点击查询后缓存的参数
  const searchParams = { data: {} };
  // 分页配置
  const searchQuery = reactive({
    position: ["bottomLeft"],
    showSizeChanger: true,
    current: 1,
    pageSize: 10,
    pageSizeOptions: ["10", "20", "50"],
    total: 0,
    showTotal: (item) =>
      `第 ${searchQuery.current}-${dataSource.value.length} 条/总共 ${item} 条`,
    isNoPull: false, // 是否禁止自动拉取数据
    ...page
  });

  /**
   * 获取列表数据
   */
  const getList = async (type = '') => {
    if (type === 'del') {
      let current = dataSource.value.length === 1
      searchQuery.current = current ? searchQuery.current - 1 : searchQuery.current
    }
    if (searchQuery.current < 1) {
      searchQuery.current = 1
    }
    let query = {
      page: searchQuery.current,
      limit: searchQuery.pageSize,
      order: searchQuery.order,
      sort: searchQuery.sort,
      ...formState.value,
    };
    if (getSearchQuery && typeof getSearchQuery === "function") {
      query = await getSearchQuery(query);
    }
    loadTable.value = true;
    try {
      const { data, total } = await getApi(query);
      searchParams.data = toRaw(query);
      searchQuery.total = total;
      dataSource.value = data ?? [];
    } catch (e) {
      console.log(e);
    } finally {
      loadTable.value = false;
    }
  };

  /**
   * 处理表格变化（分页、排序、筛选）
   */
  const handleTableChange = (pag, filters, sorter) => {
    console.log(pag, filters, sorter);

    if (sorter.order) {
      searchQuery.sort = sorter.columnKey;
      searchQuery.order = sorter.order === 'ascend' ? 'asc' : 'desc';
    } else {
      searchQuery.sort = undefined
      searchQuery.order = undefined
    }
    searchQuery.current = pag.current;
    searchQuery.pageSize = pag.pageSize;
    if (!searchQuery.isNoPull) {
      getList();
    }
  };

  /**
   * 重置表单并搜索
   */
  const reset = () => {
    formState.value = {};
    search();
  };

  /**
   * 执行搜索（重置到第一页）
   */
  const search = () => {
    searchQuery.current = 1;
    getList();
  };
  /**
   * 导出数据处理的异步函数
   * @param {Function} exportApi - 导出数据的API函数
   * @param {Object} obj - 额外的查询参数对象，默认为空对象
   */
  const handleExportApi = async (exportApi, obj = {}) => {
    if (exportLoad.value) return message.warning("正在导出中，请勿重复点击");
    try {
      let query = {
        ...formState.value,
        ...obj
      };
      if (getSearchQuery && typeof getSearchQuery === "function") {
        query = await getSearchQuery(query);
      }
      exportLoad.value = true;
      const res = await exportApi(query);
      exportLoad.value = false;
      if (res.errno === 0 && res.data) {

        exportUrl(res.data)
      } else {
        // message.warning("暂无数据");
      }
    } catch (error) {
      // 发生错误时重置导出状态并打印错误信息
      exportLoad.value = false;
      console.log(error);
    }
  }
  const exportUrl = (url) => {
    if (!url) return
    if (typeof url !== "string") {
      message.warning("导出URL格式错误");
      return
    }
    message.success("导出成功");
    window.open(process.env.URL + url);
  }
  const toRouterQuery = (path, record = {}) => {
    return router.push({
      path: path,
      query: {
        ...record,
      },
    })
  }
  return {
    toRouterQuery,
    exportUrl,
    handleExportApi,
    searchParams,
    formState,
    dataSource,
    searchQuery,
    handleTableChange,
    reset,
    search,
    getList,
    nFormat,
    numberFormatter,
    loadTable,
  };
}
