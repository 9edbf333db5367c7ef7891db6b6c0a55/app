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
    order: 'order',
    loading: 'loading',
    rates: 'rates',
    PayPalToken: 'PayPalToken',
    temporaryOrder: 'temporaryOrder',
  }),
  beforeCreate() {
    if (!this.PayPalToken) {
      this.$store.dispatch(GET_PAYPAL_TOKEN);
    }
  },
  mounted() {
    if (Object.keys(this.temporaryOrder).length) {
      this.$store.commit('triggerLoadingState');
      this.$store.dispatch(CREATE_NEW_ORDER);
    }
    $(this.paymentOptionsModalId).modal();
  },
  methods: {
    checkoutShoppingCart() {
      if (!this.user.email) {
        this.$router.push({ name: 'signIn' });
        return;
      }

      $(this.paymentOptionsModalId).modal('open');
    },
    checkoutWithPaypal() {
      const createPaymentEndpoint = `https://vitumob.xyz/payments/paypal/create/${this.order.order_hex}`;
      $.ajax({
        url: createPaymentEndpoint,
        method: 'POST',
        headers: {
          Authorization: this.PayPalToken.access_token,
        },
      }).done(createdPayment => {
        const checkoutApproval = createdPayment.links.filter(link => link.method === 'REDIRECT')[0];
        const options = [checkoutApproval.href, '_blank', this.inAppBrowserOptions];
        const browser = cordova.ThemeableBrowser.open(...options);
        browser.addEventListener('loadstop', event => {
          if (event.url.indexOf('approved') > -1) {
            const getPaymentDetails = {
              code: 'document.body.innerText',
            };
            browser.executeScript(getPaymentDetails, paymentDetailsJSONAsText => {
              const paymentDetails = $.parseJSON(paymentDetailsJSONAsText);
              this.$store.commit('setPaymentDetails', paymentDetails);
              $(this.paymentOptionsModalId).modal('close');
              browser.close();
              Materialize.toast('Payment completed successfully!', 2000, '', () => {
                this.$router.push({ name: 'userLocation' });
              });
            });
          }

          if (event.url.indexOf('cancelled') > -1) {
            browser.close();
          }
        });
      });
    },
    checkoutWithMpesa() {
      const options = $('#mpesa-instructions').modal();
      options.modal('open');
    },
  },
};
