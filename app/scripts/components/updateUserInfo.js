import { mapState } from 'vuex';
import validationMethod from '../mixins/validationMethod';
import { SYNC_USER_TO_DATASTORE } from '../store/types';

export default {
  template: '#update-user-info',
  mixins: [validationMethod],
  data() {
    return {
      valuesToValidate: ['name', 'phoneNumber'],
      validation: {
        name: {
          regexp: /^([a-zA-Z'-]+\s)+/,
          invalid: false,
        },
        phoneNumber: {
          regexp: /^(\+254|0)[\d]{9}$/,
          invalid: false,
        },
      },
      loadingExplanation: 'Making sure we don\'t forget your phone no. :)',
    };
  },
  computed: mapState({
    order: 'order',
    payment: 'payment',
    loading: 'loading',
  }),
  methods: {
    updateUserInfo() {
      this.$store.commit('triggerLoadingState', true);

      const user = firebase.auth().currentUser;
      user.updateProfile({ displayName: this.auth.name })
        .then(() => {
          const { uid: id, displayName: name, email_verified: emailVerified, email } = user;

          // Check if the phone number starts with 0 eg. 0711012345
          if (/^0[0-9]{9,10}$/g.test(this.auth.phoneNumber)) {
            // remove the 0, and append 254 => 254711012345
            this.auth.phoneNumber = `254${String(this.auth.phoneNumber).substr(1)}`;
          }

          const deviceUUID = typeof device !== 'undefined' ? device.uuid : navigator.productSub;
          const userCredentials = {
            id,
            name,
            device_uuid: deviceUUID,
            phone_number: this.auth.phoneNumber,
          };

          const ref = firebase.database().ref(`users/${user.uid}`);
          ref.update(userCredentials).then(() => {
            const updatedUser = Object.assign({}, user, userCredentials);
            if (!user.emailVerified) user.sendEmailVerification();

            this.$store.commit('setUser', updatedUser);
            this.$store.dispatch(SYNC_USER_TO_DATASTORE, userCredentials).done(() => {
              // eslint-disable-next-line max-len
              const defaultUserCredentials = {
                email,
                emailVerified,
                phoneNumber: this.auth.phoneNumber,
              };
              window.localStorage.setItem('vitumobUser', JSON.stringify(
                Object.assign(defaultUserCredentials, userCredentials)
              ));

              if (this.order && this.order.order_id) {
                this.$store.commit('triggerLoadingState', false);

                // If the user had already made the payment,
                // go get his/her delivery location
                if (Object.keys(this.payment).length > 0) {
                  this.$router.push({ name: 'userLocation' });
                  return;
                }

                // If not return the user to the shopping cart
                this.$router.push({ name: 'shoppingCart' });
                return;
              }

              this.$router.push({ name: 'home' });
            });
          });
        })
        .catch(error => {
          this.errorMessage = 'Something went wrong while trying to update your details';
          this.$store.commit('triggerLoadingState');
          console.log(error);
        });
    },
  },
};
