import VueRouter from 'vue-router';
import * as Sentry from '@sentry/browser';

import store from './store/store';
import config from './plugins/config';
import routes from './routes';

const vueIntegration = new Sentry.Integrations.Vue({ Vue });
Sentry.init({
  dsn: 'https://b4b091f8ee474fcea46dc0afa73455d1@sentry.io/1353589',
  integrations: [vueIntegration],
});

Vue.config.debug = true;
Vue.use(config);
Vue.use(VueRouter);

const router = new VueRouter({ routes });
const app = new Vue({ router, store });
app.$mount('#application');
