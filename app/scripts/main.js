import VueRouter from 'vue-router';
import store from './store/store';
import config from './plugins/config';

import Home from './components/home';
import ShoppingCart from './components/shoppingCart';
import SignIn from './components/signIn';
import UpdateUserInfo from './components/updateUserInfo';
import UserLocation from './components/userLocation';
import checkedOut from './components/checkedOut';


const routes = [{
  path: '/',
  name: 'home',
  component: Home,
}, {
  path: '/cart',
  name: 'shoppingCart',
  component: ShoppingCart,
}, {
  path: '/user/signin',
  name: 'signIn',
  component: SignIn,
}, {
  path: '/user/update',
  name: 'updateUserInfo',
  component: UpdateUserInfo,
}, {
  path: '/user/location',
  name: 'userLocation',
  component: UserLocation,
}, {
  path: '/cart/checkedout',
  name: 'checkedOut',
  component: checkedOut,
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
