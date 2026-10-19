import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import reveal from './directives/reveal';

import 'element-plus/theme-chalk/dark/css-vars.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const app = createApp(App);

app.use(router);
app.directive('reveal', reveal);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount('#app');
