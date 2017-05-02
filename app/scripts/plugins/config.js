import { mapState } from 'vuex';
import objectValues from 'object.values';
import facebook from '../config/facebook';
import firebaseConfig from '../config/firebase';


export default {
  install(Vue) {
    $.support.cors = true;
    const inAppBrowserOptions = {
      statusbar: {
        color: '#1A7CF9',
      },
      toolbar: {
        height: 48,
        color: '#1A7CF9',
      },
      title: {
        showPageTitle: true,
        color: '#fefefe',
      },
    };

    if (!Object.values) {
      objectValues.shim();
    }

    Vue.mixin({
      data() {
        return {
          facebook,
          inAppBrowserOptions,
          redirectUrl: 'https://vitumob.xyz',
        };
      },
      created() {
        $('.button-collapse').sideNav();
      },
      computed: mapState({
        user: state => state.user,
      }),
    });

    firebase.initializeApp(firebaseConfig);
  },
};
