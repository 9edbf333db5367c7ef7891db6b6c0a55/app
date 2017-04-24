import facebook from '../config/facebook';
import firebaseConfig from '../config/firebase';


export default {
  install(Vue) {
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

    Vue.mixin({
      data() {
        return {
          facebook,
          inAppBrowserOptions,
          redirectUrl: 'https://vitumob.xyz',
        };
      },
    });

    firebase.initializeApp(firebaseConfig);
  },
};
