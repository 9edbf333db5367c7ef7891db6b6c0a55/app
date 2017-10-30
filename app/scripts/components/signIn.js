import { mapState } from 'vuex';
import facebook from '../mixins/facebook';
import validationMethod from '../mixins/validationMethod';
import { SYNC_USER_TO_DATASTORE, SYNC_USER_LOCALLY_AND_FIREBASE } from '../store/types';

export default {
  template: '#sign-in',
  mixins: [facebook, validationMethod],
  data() {
    return {
      valuesToValidate: ['email', 'password'],
      validation: {
        email: {
          regexp: /[A-Z0-9._%+-]+@[A-Z0-9-]+.+.[A-Z]{2,4}/im,
          invalid: false,
        },
        password: {
          regexp: /^[\w\W\s\S]{6,}$/,
          invalid: false,
          weak: false,
        },
      },
      loadingExplanation: 'Finding the right door key to let you in...',
    };
  },
  computed: mapState({
    shoppingCart: 'shoppingCart',
    loading: 'loading',
  }),
  mounted() {
    $('.button-collapse').sideNav('hide');
    this.$store.commit('triggerLoadingState', false);
  },
  methods: {
    loginOrSignUpUser() {
      this.$store.commit('triggerLoadingState');
      const credentials = [this.auth.email, this.auth.password];
      const firebaseAuth = firebase.auth();

      firebaseAuth.signInWithEmailAndPassword(...credentials)
        .then(user => {
          this.$store.commit('setUser', user);
          window.localStorage.setItem('vitumobUser', JSON.stringify(user));
          this.redirectBackToShoppingCart();
        })
        .catch(signInError => {
          if (signInError.code === 'auth/wrong-password') {
            this.errorMessage = 'Invalid password or email address.';
            this.$store.commit('triggerLoadingState');
            return;
          }

          if (signInError.code === 'auth/user-not-found') {
            firebaseAuth.createUserWithEmailAndPassword(...credentials)
              .then(user => {
                const { uid: id, emailVerified: email_verified, email } = user;
                const userDataToSync = { id, email, email_verified };
                this.errorMessage = undefined;

                user.sendEmailVerification();
                this.$store.dispatch(SYNC_USER_TO_DATASTORE, userDataToSync).done(
                  this.$store.dispatch(SYNC_USER_LOCALLY_AND_FIREBASE, {
                    user: userDataToSync,
                    redirect: this.redirectBackToShoppingCart,
                  })
                );
              })
              .catch(signUpError => {
                console.error(signUpError.message);
                if (signUpError.code === 'auth/weak-password') {
                  this.auth.password = '';
                  this.validation.password.weak = true;
                  this.errorMessage = 'Detected weak password. Please enter a new strong one.';
                  this.$store.commit('triggerLoadingState');
                  return;
                }

                this.errorMessage = 'Something went wrong. Please try again one more time!';
                this.$store.commit('triggerLoadingState');
              });
          }
        });
    },
    redirectBackToShoppingCart() {
      this.$store.commit('triggerLoadingState');
      if (Object.keys(this.shoppingCart).length) {
        this.$router.push({ name: 'shoppingCart' });
        return;
      }

      this.$router.push({ name: 'home' });
    },
  },
};
