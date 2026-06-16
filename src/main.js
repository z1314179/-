import {
  createApp
} from 'vue'
import './style/style.css'
import './style/spacing.scss'
import App from './App.vue'
import store from './store/index.js' // 引入store
const app = createApp(App)
app.use(store);
window.pinia = store; //添加该行，其中store是pinia实例
import router from './router/index.js'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import {
  perm
} from '@/utils/directives.js'
perm(app)
app.use(Antd)
app.use(router)

app.mount('#app')
