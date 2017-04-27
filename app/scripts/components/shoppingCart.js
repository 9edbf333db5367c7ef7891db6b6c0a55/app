import { mapState } from 'vuex';
import { CREATE_NEW_ORDER } from '../store/types';


export default {
  template: '#shopping-cart',
  computed: mapState({
    user: state => state.user,
    cart: state => state.shoppingCart,
    order: 'order',
    loading: 'loading',
    rates: 'rates',
    temporaryOrder: 'temporaryOrder',
  }),
  mounted() {
    if (Object.keys(this.temporaryOrder).length) {
      this.$store.commit('triggerLoadingState');
      this.$store.dispatch(CREATE_NEW_ORDER);
    }
  },
  methods: {
    checkoutShoppingCart() {
      if (!this.user) {
        this.$router.push({ name: 'signIn' });
        return;
      }

      const options = $('#payment-options').modal();
      options.modal('open');
    },
    checkoutWithPaypal() {
    },
  },
};
