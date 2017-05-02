import Vuex from 'vuex';
import { CREATE_NEW_ORDER, GET_EXCHANGE_RATES, GET_PAYPAL_TOKEN } from './types';


// Vue.use(Vuex);
export default new Vuex.Store({
  state: {
    user: {},
    shoppingCart: [],
    order: {},
    temporaryOrder: {},
    rates: {},
    PayPalToken: undefined,
    payment: {},
    selectedDeliveryLocation: undefined,
    loading: false,
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setTemporaryOrder(state, temporaryOrder) {
      state.temporaryOrder = temporaryOrder;
    },
    updateShoppingCart(state, payload) {
      state.shoppingCart = payload.items;
    },
    updateOrderDetails(state, order) {
      state.order = order;
    },
    updateExchangeRates(state, rates) {
      state.rates = rates;
    },
    setPayPalToken(state, tokenObject) {
      state.PayPalToken = tokenObject;
    },
    setPaymentDetails(state, paymentDetails) {
      state.payment = paymentDetails;
    },
    setDeliveryLocation(state, deliveryLocation) {
      state.selectedDeliveryLocation = deliveryLocation;
      state.user.deliveryLocation = deliveryLocation;
    },
    triggerLoadingState(state, bool) {
      state.loading = bool !== undefined ? bool : !state.loading;
    },
  },
  actions: {
    [CREATE_NEW_ORDER]({ commit, state }) {
      const items = [];
      const order = state.temporaryOrder;
      const roundOf = (num, decimalPlaces) =>
        +(Math.round(num + `e+${decimalPlaces}`) + `e-${decimalPlaces}`);


      for (const prop in order.items) {
        if (order.items.hasOwnProperty(prop) && typeof order.items[prop] === 'object') {
          if ('price' in order.items[prop]) {
            const localPrice = order.items[prop].price * state.rates.KES;
            order.items[prop].localPrice = roundOf(localPrice, 2);
            items.push(order.items[prop]);
          }
        }
      }

      commit('updateShoppingCart', { items });
      order.items = items;
      order.exchange_rate = state.rates.KES;

      $.ajax({
        url: 'https://vitumob.xyz/order',
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify({ order: JSON.stringify(order) }),
        contentType: 'application/json',
      }).done((response) => {
        const informationKeys = ['markup', 'order_hex', 'order_id'];
        const orderInLocalCurrency = Object.keys(response).reduce((obj, key) => {
          if (informationKeys.indexOf(key) === -1) {
            obj[key] = response[key];
            obj[`${key}_local`] = roundOf(response[key] * state.rates.KES, 2);
            if (key === 'shipping_cost' && response[key] === 0) {
              obj[key] = 'FREE';
              obj[`${key}_local`] = 'SHIPPING';
            }
            return obj;
          }

          obj[key] = response[key];
          return obj;
        }, {});

        console.log(orderInLocalCurrency);
        commit('updateOrderDetails', orderInLocalCurrency);
        commit('setTemporaryOrder', {});
        commit('triggerLoadingState');
      });
    },
    [GET_EXCHANGE_RATES]({ commit }) {
      $.get('https://vitumob.xyz/exchange/rates')
        .done((response) => {
          const rates = response.rates.reduce((obj, curr) => {
            obj[curr.code] = curr.rate;
            return obj;
          }, {});
          console.log(rates);
          commit('updateExchangeRates', rates);
        });
    },
    [GET_PAYPAL_TOKEN]({ commit }) {
      $.get('https://vitumob.xyz/payments/paypal/token').done(tokenResponse => {
        commit('setPayPalToken', tokenResponse);
      });
    },
  },
});
