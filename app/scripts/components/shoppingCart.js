import { mapState } from 'vuex';
import { CREATE_NEW_ORDER, GET_PAYPAL_TOKEN } from '../store/types';


export default {
  template: '#shopping-cart',
  data() {
    return {
      paymentOptionsModalId: '#payment-options',
      loadingExplanation: 'Chasing down some chickens that escaped your cart...',
    };
  },
  computed: mapState({
    cart: state => state.shoppingCart,
    rates: 'rates',
    order: 'order',
    PayPalToken: 'PayPalToken',
    loading: 'loading',
  }),
  created() {
    if (!this.PayPalToken) {
      this.$store.dispatch(GET_PAYPAL_TOKEN);
    }
  },
  beforeMount() {
    // if an order was exported but the server has not created the order
    if (Object.keys(this.order).length && !this.order.hasOwnProperty('order_hex')) {
      this.$store.commit('triggerLoadingState');
      this.$store.dispatch(CREATE_NEW_ORDER);
    }
  },
  methods: {
    checkoutShoppingCart() {
      if (!this.user.email) {
        this.$router.push({ name: 'signIn' });
        return;
      }

      $(this.paymentOptionsModalId).modal().modal('open');
    },
    checkoutWithPaypal() {
      const orderId = this.order.order_hex;
      const createPaymentEndpoint = `https://vitumob.xyz/payments/paypal/create/${orderId}`;

      $.ajax({
        url: createPaymentEndpoint,
        method: 'POST',
        headers: {
          Authorization: this.PayPalToken.access_token,
        },
      }).done(({ links }) => {
        const [orderPaymentApproval] = links.filter(link => link.method === 'REDIRECT');
        const options = [orderPaymentApproval.href, '_blank', this.inAppBrowserOptions];
        const browser = cordova.ThemeableBrowser.open(...options);
        browser.addEventListener('loadstop', event => {
          if (event.url.indexOf('approved') > -1) {
            const getPaymentDetails = {
              code: 'document.body.innerText',
            };
            browser.executeScript(getPaymentDetails, paymentDetailsJSONAsText => {
              $(this.paymentOptionsModalId).modal('close');
              this.$store.commit('setPaymentDetails', JSON.parse(paymentDetailsJSONAsText));
              browser.close();

              if (!this.user.displayName) {
                this.$router.push({ name: 'updateUserInfo' });
                return;
              }

              this.$router.push({ name: 'userLocation' });
            });
          }

          if (event.url.indexOf('cancelled') > -1) {
            browser.close();
          }
        });
      }).catch(error => {
        console.error(error);
      });
    },
    checkoutWithMpesa() {
      $('#mpesa-instructions').modal().modal('open');
    },
  },
};
