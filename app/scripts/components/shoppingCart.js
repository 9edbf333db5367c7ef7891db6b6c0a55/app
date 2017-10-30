import { mapState } from 'vuex';
import { GET_ORDER_CALCULATIONS, GET_PAYPAL_TOKEN } from '../store/types';

export default {
  template: '#shopping-cart',
  data: () => ({
    paymentOptionsModalId: '#payment-options',
    loadingExplanation: 'Chasing down some chickens that escaped your cart...',
  }),
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
    // before creating order, user must be signed in
    // if not redirect the user to sign in
    if (!this.user.email) {
      this.$router.push({ name: 'signIn' });
      return;
    }

    // if an order was exported but the server has not created the order
    if (Object.keys(this.order).length) {
      const persistUserOrderToDB = false;
      this.$store.commit('triggerLoadingState', true);
      this.$store.dispatch(GET_ORDER_CALCULATIONS, persistUserOrderToDB);
    }
  },
  methods: {
    checkoutShoppingCart() {
      $(this.paymentOptionsModalId).modal().modal('open');
    },
    linkUserToOrder() {
      if (this.user.email && !this.order.user) {
        const { id, email } = this.user;
        if (!id) this.$router.push({ name: 'signIn' });

        const user = JSON.stringify({ id, email });
        const addUserToOrderRequest = $.ajax({
          url: `https://vitumob-xyz.appspot.com/order/${this.order.order_hex}`,
          type: 'PUT',
          dataType: 'json',
          data: JSON.stringify({ user }),
          contentType: 'application/json',
        });

        addUserToOrderRequest.done(() => {
          this.$store.commit('linkUserToOrder');
          console.log('Order matched with its user');
        });

        addUserToOrderRequest.fail(error => {
          if (error.message === 'error/user-not-found') {
            this.$router.push({ name: 'signIn' });
          }
        });
      }
    },
    createUserOrder() {
      if (!this.order.hasOwnProperty('order_hex')) {
        const persistUserOrderToDB = true;
        return this.$store
          .dispatch(GET_ORDER_CALCULATIONS, persistUserOrderToDB)
          .done(this.linkUserToOrder);
      }

      // eslint-disable-next-line new-cap
      return $.Deferred().resolve('orderExists');
    },
    checkoutWithPaypal() {
      this.createUserOrder().done(() => {
        const { order_hex: orderId } = this.order;
        const { access_token: PayPalAccessToken } = this.PayPalToken;

        const paypalRequest = $.ajax({
          url: `https://vitumob-xyz.appspot.com/payments/paypal/create/${orderId}`,
          method: 'POST',
          headers: {
            Authorization: PayPalAccessToken,
          },
        });

        paypalRequest.done(({ links: paymentLinks }) => {
          const [orderPaymentApproval] = paymentLinks.filter(link => link.method === 'REDIRECT');
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

                if (!this.user.phoneNumber) {
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
        });

        paypalRequest.catch(error => {
          console.error(error);
        });
      });
    },
    checkoutWithMpesa() {
      this.createUserOrder().done(() => {
        const { order_id: orderId } = this.order;
        const mpesaInstructionsModal = $('#mpesa-instructions').modal();
        mpesaInstructionsModal.modal('open');

        const ref = firebase.database().ref(`payments/mpesa/${orderId}`);
        ref.on('value', (snapshot) => {
          if (snapshot.exists()) {
            console.log('A payment was recieved', snapshot.val());

            snapshot.forEach((childSnapshot) => {
              const payment = childSnapshot.val();
              if (payment.order_id === orderId) {
                mpesaInstructionsModal.modal('open');
                if (!this.user.phoneNumber) {
                  this.$router.push({ name: 'updateUserInfo' });
                  return;
                }

                this.$router.push({ name: 'userLocation' });
              }
            });
          }
        });
      });
    },
  },
};
