import VueRouter from 'vue-router';
import Home from './components/home';
import ShoppingCart from './components/shoppingCart';

const routes = [{
  path: '/',
  name: 'home',
  component: Home,
}, {
  path: '/cart',
  name: 'shoppingCart',
  component: ShoppingCart,
}, {
  path: '/*',
  redirect: '/',
}];

Vue.config.debug = true;
Vue.use(VueRouter);

const router = new VueRouter({ routes });
const app = new Vue({ router });
app.$mount('#application');
