import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
// 🔥 引入 Element Plus 暗黑模式 CSS
import "element-plus/theme-chalk/dark/css-vars.css";
// 🔥 引入全局自定义样式
import "./assets/global.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import { createPinia } from 'pinia'

const app = createApp(App);
const pinia = createPinia();

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(ElementPlus, { locale: zhCn });
app.use(router);
app.use(pinia);

app.mount("#app");