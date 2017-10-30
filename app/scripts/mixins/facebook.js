import querystring from 'querystring';
import { SYNC_USER_TO_DATASTORE, SYNC_USER_LOCALLY_AND_FIREBASE } from '../store/types';

export default {
  methods: {
    loginWithFacebook() {
      this.$store.commit('triggerLoadingState');
      const endpoint = 'https://www.facebook.com/v2.9/dialog/oauth';
      const url = [
        `client_id=${this.facebook.appId}`,
        `redirect_uri=${this.redirectUrl}`,
        'response_type=token',
        'state=SomeSuperSecretCodeIUseToCubCSRF',
        `scope=${this.facebook.scopes.join(',')}`,
      ];

      const authenticationURL = `${endpoint}?${url.join('&')}`;
      const options = [authenticationURL, '_blank', this.inAppBrowserOptions];
      const browser = cordova.ThemeableBrowser.open(...options);
      browser.addEventListener('loadstop', event => {
        if (event.url.indexOf('access_token') > -1) {
          const params = querystring.parse(event.url.replace('?#', '?').split('?')[1]);

          // Build Firebase credential with the Facebook access token.
          const { auth } = firebase;
          const credential = auth.FacebookAuthProvider.credential(params.access_token);
          auth().signInWithCredential(credential)
            .then(user => {
              const {
                uid: id,
                displayName: name,
                email,
                email_verified,
                photoURL: profile_photo,
                providerData: [{ providerId: method }],
              } = user;

              const userDataToSync = {
                id, name, email, email_verified, profile_photo, method,
                access_token: params.access_token,
              };

              if (device && device.uuid) {
                userDataToSync.device_uuid = device.uuid;
              }

              return this.$store.dispatch(SYNC_USER_TO_DATASTORE, userDataToSync).always(
                this.$store.dispatch(SYNC_USER_LOCALLY_AND_FIREBASE, {
                  user: userDataToSync,
                  redirect: this.redirectBackToShoppingCart,
                })
              );
            })
            .catch(error => {
              this.errorMessage = 'Something went wrong! Maybe it\'s us! Maybe it\'s you';
              this.$store.commit('triggerLoadingState');
              console.log(error);
            });
          browser.close();
        }
      });
    },
  },
};
