import querystring from 'querystring';


export default {
  methods: {
    loginWithFacebook() {
      return new Promise((resolve) => {
        const url = [
          'https://www.facebook.com/v2.9/dialog/oauth?',
          `client_id=${this.facebook.appId}&`,
          `redirect_uri=${this.redirectUrl}&`,
          'response_type=token&',
          // 'state=SomeSuperSecretCodeIUseToCubCSRF',
          `scope=${this.facebook.scopes.join(',')}`,
        ].join('');

        const options = [url, '_blank', this.inAppBrowserOptions];
        const browser = cordova.ThemeableBrowser.open(...options);
        browser.addEventListener('loadstop', event => {
          if (event.url.indexOf('#access_token') > -1) {
            const params = querystring.parse(event.url.replace('?#', '?').split('?')[1]);
            console.log('ACCESS_TOKEN', params.access_token);
            browser.close();

            // Build Firebase credential with the Facebook access token.
            const credential = firebase.auth.FacebookAuthProvider.credential(params.access_token);
            resolve(firebase.auth().signInWithCredential(credential));
          }
        });
      });
    },
  },
};
