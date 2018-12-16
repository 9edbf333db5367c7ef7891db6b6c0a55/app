import Home from '../components/home';
import ShoppingCart from '../components/shoppingCart';
import SignIn from '../components/signIn';
import UpdateUserInfo from '../components/updateUserInfo';
import UserLocation from '../components/userLocation';
import checkedOut from '../components/checkedOut';

export default [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/cart',
    name: 'shoppingCart',
    component: ShoppingCart,
  },
  {
    path: '/user/signin',
    name: 'signIn',
    component: SignIn,
  },
  {
    path: '/user/update',
    name: 'updateUserInfo',
    component: UpdateUserInfo,
  },
  {
    path: '/user/location',
    name: 'userLocation',
    component: UserLocation,
  },
  {
    path: '/cart/checkedout',
    name: 'checkedOut',
    component: checkedOut,
  },
  {
    path: '/*',
    redirect: '/',
  },
];
