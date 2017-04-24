import { mapState } from 'vuex';
import { CREATE_NEW_ORDER } from '../store/types';
import facebook from '../mixins/facebook';


export default {
  template: '#shopping-cart',
  computed: mapState({
    cart: state => state.shoppingCart,
    order: 'order',
    loading: 'loading',
    rates: 'rates',
    temporaryOrder: 'temporaryOrder',
  }),
  mixins: [facebook],
  mounted() {
    if (Object.keys(this.temporaryOrder).length) {
      this.$store.commit('setLoadingState');
      this.$store.dispatch(CREATE_NEW_ORDER);
    }
  },
  methods: {
    checkoutShoppingCart() {
      this.loginWithFacebook().then(user => {
        console.log(user);
      });
    },
  },
};
