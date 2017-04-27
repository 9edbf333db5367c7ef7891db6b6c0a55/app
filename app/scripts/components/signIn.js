import { mapState } from 'vuex';
// import debounce from 'throttle-debounce/debounce';
import facebook from '../mixins/facebook';

export default {
  template: '#sign-in',
  mixins: [facebook],
  data() {
    return {
      auth: {
        email: '',
        password: '',
      },
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
      formInputsAreInvalid: true,
      errorMessage: undefined,
    };
  },
  computed: mapState({
    user: state => state.user,
    shoppingCart: 'shoppingCart',
  }),
  methods: {
    validateAuthenticationForm() {
      for (const key of Object.keys(this.validation)) {
        this.validation[key].invalid = false;
        if (!this.validation[key].regexp.test(this.auth[key])) {
          this.validation[key].invalid = true;
        }
      }

      this.formInputsAreInvalid = !(Object.values(this.auth)
        .every(prop => prop !== '' && prop.length !== 0) &&
        Object.values(this.validation).every(prop => !prop.invalid));

      if (!this.formInputsAreInvalid) {
        if (!this.validation.email.regexp.test(this.auth.email)) {
          this.validation.email.invalid = true;
          return;
        }
      }
    },
    loginOrSignUpUser() {
      const credentials = Object.values(this.auth);
      firebase.auth()
        .signInWithEmailAndPassword(...credentials)
        .then(user => {
          this.$store.commit('setUser', user);
          this.redirectBackToShoppingCart();
        })
        .catch(signInError => {
          if (signInError.code === 'auth/wrong-password') {
            this.errorMessage = 'Invalid password or email address.';
            return;
          }

          if (signInError.code === 'auth/user-not-found') {
            firebase.auth()
              .createUserWithEmailAndPassword(...credentials)
              .then(user => { // {email, emailVerified, uid}
                this.errorMessage = undefined;
                this.$store.commit('setUser', user);
                this.redirectBackToShoppingCart();
              })
              .catch(signUpError => {
                if (signUpError.code === 'auth/weak-password') {
                  this.auth.password = '';
                  this.validation.password.weak = true;
                  this.errorMessage = 'Detected weak password. Please enter a new strong one.';
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
