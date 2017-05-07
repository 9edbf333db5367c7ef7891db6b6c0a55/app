import { mapState } from 'vuex';
import facebook from '../mixins/facebook';
import validationMethod from '../mixins/validationMethod';


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
          regexp: /^\w{6,}$/,
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
  },
  methods: {
    loginOrSignUpUser() {
      this.$store.commit('triggerLoadingState');
      const credentials = [this.auth.email, this.auth.password];
      firebase.auth()
        .signInWithEmailAndPassword(...credentials)
        .then(user => {
          this.$store.commit('triggerLoadingState');
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
            firebase.auth()
              .createUserWithEmailAndPassword(...credentials)
              .then(user => { // {email, emailVerified, uid}
                user.sendEmailVerification();

                this.errorMessage = undefined;
                this.$store.commit('setUser', user);
                this.$store.commit('triggerLoadingState');

                window.localStorage.setItem('vitumobUser', JSON.stringify(user));
                this.redirectBackToShoppingCart();
              })
              .catch(signUpError => {
                if (signUpError.code === 'auth/weak-password') {
                  this.auth.password = '';
                  this.validation.password.weak = true;
                  this.errorMessage = 'Detected weak password. Please enter a new strong one.';
                  this.$store.commit('triggerLoadingState');
                }
              });
          }
        });
    },
    redirectBackToShoppingCart() {
      if (Object.keys(this.shoppingCart).length) {
        this.$router.push({ name: 'shoppingCart' });
        return;
      }

      this.$router.push({ name: 'home' });
    },
  },
};
