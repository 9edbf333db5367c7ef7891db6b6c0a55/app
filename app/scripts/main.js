import VueRouter from 'vue-router';
import store from './store';
import config from './plugins/config';

import Home from './components/home';
import ShoppingCart from './components/shoppingCart';
import SignIn from './components/signIn';


const routes = [{
  path: '/',
  name: 'home',
  component: Home,
}, {
  path: '/cart',
  name: 'shoppingCart',
  component: ShoppingCart,
}, {
  path: '/sign-in',
  name: 'signIn',
  component: SignIn,
}, {
  path: '/*',
  redirect: '/',
}];

Vue.config.debug = true;
Vue.use(config);
Vue.use(VueRouter);

const router = new VueRouter({ routes });
const app = new Vue({ router, store });
app.$mount('#application');
