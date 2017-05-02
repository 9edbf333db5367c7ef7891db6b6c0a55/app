import { mapState } from 'vuex';
import validationMethod from '../mixins/validationMethod';


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
    loading: 'loading',
  }),
  methods: {
    updateUserInfo() {
      this.$store.commit('triggerLoadingState');

      const user = firebase.auth().currentUser;
      user.updateProfile({ displayName: this.auth.name })
        .then(() => {
          const { displayName, email, emailVerified, photoURL } = user;
          const userCredentials = {
            uuid: device.uuid,
            phoneNumber: this.auth.phoneNumber,
            displayName, email, emailVerified, photoURL,
          };

          const ref = firebase.database().ref('users/' + user.uid);
          ref.once('value').then((snapshot) => {
            const transaction = snapshot.exists() ?
              ref.update(userCredentials) : ref.set(userCredentials);

            transaction.then(() => {
              this.$store.commit('triggerLoadingState');
              if (!user.emailVerified) {
                user.sendEmailVerification();
              }

              if (this.order.id) {
                this.$router.push({ name: 'shoppingCart' });
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
