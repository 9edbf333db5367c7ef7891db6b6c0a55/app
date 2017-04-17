export default {
  template: '#shopping-cart',
  data() {
    return {
      cart: [],
    };
  },
  created() {
    this.cart = window.cart.items.map((i,v) => v);
  },
};
