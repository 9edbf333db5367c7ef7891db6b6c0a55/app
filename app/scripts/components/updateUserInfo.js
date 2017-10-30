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
      this.$store.commit('triggerLoadingState');

      const user = firebase.auth().currentUser;
      user.updateProfile({ displayName: this.auth.name })
        .then(() => {
          const { uid: id, displayName: name, email_verified: emailVerified, email } = user;
          const userCredentials = {
            id,
            name,
            device_uuid: typeof device !== 'undefined' ? device.uuid : navigator.productSub,
            phone_number: this.auth.phoneNumber,
          };

          const ref = firebase.database().ref(`users/${user.uid}`);
          return ref.update(userCredentials).then(() => {
            const updatedUser = Object.assign({}, user, userCredentials);
            if (!user.emailVerified) {
              user.sendEmailVerification();
            }

            this.$store.commit('setUser', updatedUser);
            this.$store.commit('triggerLoadingState');

            return this.$store.dispatch(SYNC_USER_TO_DATASTORE, userCredentials).done(() => {
              // eslint-disable-next-line max-len
              const defaultUserCredentials = { email, emailVerified, phoneNumber: this.auth.phoneNumber };
              window.localStorage.setItem('vitumobUser', JSON.stringify(
                Object.assign(defaultUserCredentials, userCredentials)
              ));

              if (this.order.order_id && this.payment) {
                this.$router.push({ name: 'userLocation' });
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
