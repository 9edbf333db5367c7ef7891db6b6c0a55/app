import { mapState } from 'vuex';
import {
  GET_ORDER_CALCULATIONS,
  GET_PAYPAL_TOKEN,
  GET_MPESA_PUSH_API_TOKEN,
} from '../store/types';

export default {
  template: '#shopping-cart',
  filters: {
    spaceTextWithSlashes(textString) {
      return textString.replace('/', ' / ');
    },
    formatAmount(amount) {
      return /^[0-9]+$/.test(amount) ? Number(amount).toLocaleString('en') : amount;
    },
  },
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
    MpesaAPIToken: 'MpesaAPIToken',
    loading: 'loading',
  }),
  created() {
    if (!this.PayPalToken) {
      this.$store.dispatch(GET_PAYPAL_TOKEN);
    }

    if (!this.MpesaAPIToken) {
      this.$store.dispatch(GET_MPESA_PUSH_API_TOKEN);
    }

    // before creating order, user must be signed in
    // if not redirect the user to sign in
    if (!this.user.email) {
      this.$router.push({ name: 'signIn' });
      return;
    }

    // if an order was exported but the server has not created the order
    if (!this.order.order_hex) {
      const persistUserOrderToDB = false;
      this.$store.commit('triggerLoadingState', true);
      this.$store
        .dispatch(GET_ORDER_CALCULATIONS, persistUserOrderToDB)
        .done(() => {
          this.$store.commit('triggerLoadingState', false);
        });
    }
  },
  methods: {
    checkoutShoppingCart() {
      $(this.paymentOptionsModalId).modal().modal('open');
    },
    linkUserToOrder() {
      // if the order has not been linked to the user who created it
      if (this.user.email && !this.order.user) {
        const { id, email } = this.user;
        if (!id) {
          this.$router.push({ name: 'signIn' });
        }

        const user = JSON.stringify({ id, email });
        const addUserToOrderRequest = $.ajax({
          url: `https://vitumob-prod.appspot.com/order/${this.order.order_hex}`,
          type: 'PUT',
          dataType: 'json',
          data: JSON.stringify({ user }),
          contentType: 'application/json',
        });

        return addUserToOrderRequest
          .done(() => {
            this.$store.commit('linkUserToOrder');
            console.log('Order matched with its user');
          })
          .fail(error => {
            if (error.message === 'error/user-not-found') {
              this.$router.push({ name: 'signIn' });
            }
          });
      }

      // eslint-disable-next-line new-cap
      return $.Deferred().resolve('userLinkedToOrder');
    },
    createUserOrder() {
      if (!this.order.order_hex) {
        const persistUserOrderToDB = true;
        // eslint-disable-next-line max-len
        const getOrderCalculations = this.$store.dispatch(GET_ORDER_CALCULATIONS, persistUserOrderToDB);
        return getOrderCalculations.then(this.linkUserToOrder);
      }

      // eslint-disable-next-line new-cap
      return $.Deferred().resolve('orderExists');
    },
    checkoutWithPaypal() {
      this.createUserOrder().done(() => {
        const { order_hex: orderId } = this.order;
        const { access_token: PayPalAccessToken } = this.PayPalToken;

        const paypalRequest = $.ajax({
          url: `https://vitumob-prod.appspot.com/payments/paypal/create/${orderId}`,
          method: 'POST',
          headers: {
            Authorization: PayPalAccessToken,
          },
        });

        paypalRequest
          .done(({ links: paymentLinks }) => {
            // eslint-disable-next-line max-len
            const [orderPaymentApprovalLink] = paymentLinks.filter(link => link.method === 'REDIRECT');
            const options = [orderPaymentApprovalLink.href, '_blank', this.inAppBrowserOptions];
            const browser = cordova.ThemeableBrowser.open(...options);

            browser.addEventListener('loadstop', event => {
              if (event.url.indexOf('approved') > -1) {
                const getPaymentDetailsJSON = {
                  code: 'document.body.innerText',
                };

                browser.executeScript(getPaymentDetailsJSON, paymentDetailsJSONAsText => {
                  $(this.paymentOptionsModalId).modal('close');

                  this.$store.commit('setPaymentDetails', JSON.parse(paymentDetailsJSONAsText));
                  // eslint-disable-next-line no-console
                  console.log(JSON.parse(paymentDetailsJSONAsText));

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
          })
          .catch(error => {
            console.error(error);
          });
      });
    },
    checkoutWithMpesa() {
      this.createUserOrder().done(() => {
        const { order_id: orderId, order_hex: orderHexId } = this.order;
        const mpesaSTKPushInfoModal = $('#mpesa-stk-push-info').modal();
        // const mpesaInstructionsModal = $('#mpesa-instructions').modal();

        this.$store.dispatch(GET_MPESA_PUSH_API_TOKEN).then((mpesaRequestToken) => {
          // 1st check if the user has provided their phone number
          if (!this.user.phone_number) {
            this.$router.push({ name: 'updateUserInfo' });
            return;
          }

          const { access_token: MpesaAPIAccessToken } = mpesaRequestToken;
          mpesaSTKPushInfoModal.modal('open');

          const mpesaPushPaymentRequest = $.ajax({
            url: `https://vitumob-prod.appspot.com/payments/mpesa/payment/push/${orderHexId}`,
            method: 'POST',
            headers: {
              Authorization: MpesaAPIAccessToken,
            },
          });

          mpesaPushPaymentRequest
            .done(({ daraja_response: { CheckoutRequestID, MerchantRequestID } }) => {
              firebase.database().ref(`payments/mpesa/${orderId}`)
                .on('value', (snapshot) => {
                  if (snapshot.exists()) {
                    console.log('Payement details', snapshot.val());

                    const mpesaPaymentDetails = {
                      orderId,
                      orderHexId,
                      userPhoneNumber: this.user.phone_number,
                      CheckoutRequestID,
                      MerchantRequestID,
                    };

                    snapshot.forEach((childSnapshot) => {
                      const completedMpesaPayment = childSnapshot.val();
                      if (completedMpesaPayment.id === mpesaPaymentDetails.CheckoutRequestID) {
                        Object.assign(mpesaPaymentDetails, completedMpesaPayment);
                        // update the payment details
                        this.$store.commit('setPaymentDetails', mpesaPaymentDetails);

                        mpesaSTKPushInfoModal.modal('close');
                        this.$router.push({ name: 'userLocation' });
                        return;
                      }
                    });
                  }
                });
            })
            .fail(() => {
              // Let the user make the payment manually, provide them with instructions
              mpesaSTKPushInfoModal.modal('close');
            });
        });
      });
    },
  },
};
