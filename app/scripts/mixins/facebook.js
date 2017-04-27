import querystring from 'querystring';


export default {
  methods: {
    loginWithFacebook() {
      this.$store.commit('triggerLoadingState');
      return new Promise((resolve) => {
        const url = [
          'https://www.facebook.com/v2.9/dialog/oauth?',
          `client_id=${this.facebook.appId}`,
          `redirect_uri=${this.redirectUrl}`,
          'response_type=token',
          'state=SomeSuperSecretCodeIUseToCubCSRF',
          `scope=${this.facebook.scopes.join(',')}`,
        ];

        const options = [url.join('&').replace('?&', '?'), '_blank', this.inAppBrowserOptions];
        const browser = cordova.ThemeableBrowser.open(...options);
        browser.addEventListener('loadstop', event => {
          if (event.url.indexOf('access_token') > -1) {
            const params = querystring.parse(event.url.replace('?#', '?').split('?')[1]);
            console.log('ACCESS_TOKEN', params.access_token);

            // Build Firebase credential with the Facebook access token.
            const credential = firebase.auth.FacebookAuthProvider.credential(params.access_token);
            firebase.auth()
              .signInWithCredential(credential)
              .then(user => {
                this.$store.commit('setUser', user);
                this.$store.commit('triggerLoadingState');
                if (this.redirectBackToShoppingCart) this.redirectBackToShoppingCart();
                resolve(user);
              })
              .catch(error => {
                this.errorMessage = 'Something went wrong! Maybe it\'s us! Maybe it\'s you';
                this.$store.commit('triggerLoadingState');
                console.log(error);
              });
            browser.close();
          }
        });
      });
    },
  },
};
