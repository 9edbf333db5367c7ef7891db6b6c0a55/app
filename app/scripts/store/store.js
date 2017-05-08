import Vuex from 'vuex';
import { CREATE_NEW_ORDER, GET_EXCHANGE_RATES, GET_PAYPAL_TOKEN } from './types';


export default new Vuex.Store({
  state: {
    user: {},
    shoppingCart: [],
    order: {},
    rates: {},
    PayPalToken: undefined,
    payment: {},
    deliveryLocation: undefined,
    loading: false,
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setNewOrder(state, order) {
      state.order = order;
    },
    updateShoppingCart(state, cart) {
      state.shoppingCart = cart.items;
    },
    updateOrderDetails(state, orderDetailsWithLocalCosts) {
      state.order = Object.assign(state.order, orderDetailsWithLocalCosts);
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
      state.deliveryLocation = deliveryLocation;
      state.user.deliveryLocation = deliveryLocation;
    },
    triggerLoadingState(state, bool) {
      state.loading = bool !== undefined ? bool : !state.loading;
    },
  },
  actions: {
    [CREATE_NEW_ORDER]({ commit, state }) {
      const items = [];
      const order = state.order;
      const roundOf = (num, decimalPlaces) => (
        +(Math.round(num + `e+${decimalPlaces}`) + `e-${decimalPlaces}`)
      );


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

      const orderData = JSON.stringify({ order: JSON.stringify(order) });
      const createOrderRequest = $.ajax({
        url: 'https://vitumob-xyz.appspot.com/order',
        type: 'POST',
        dataType: 'json',
        data: orderData,
        contentType: 'application/json',
      });

      createOrderRequest.done((orderCreated) => {
        const informationKeys = ['markup', 'order_hex', 'order_id'];
        const orderCreatedWithLocalCosts = Object.keys(orderCreated).reduce((obj, key) => {
          if (informationKeys.indexOf(key) < 0) {
            if (key === 'shipping_cost' && orderCreated[key] === 0) {
              obj[key] = 'FREE';
              obj[`${key}_local`] = 'SHIPPING';
              return obj;
            }

            obj[key] = orderCreated[key];
            obj[`${key}_local`] = roundOf(orderCreated[key] * state.rates.KES, 2);
            return obj;
          }

          obj[key] = orderCreated[key];
          return obj;
        }, {});

        console.log(orderCreatedWithLocalCosts);
        commit('updateOrderDetails', orderCreatedWithLocalCosts);
        commit('triggerLoadingState');
      });
    },
    [GET_EXCHANGE_RATES]({ commit }) {
      $.get('https://vitumob-xyz.appspot.com/exchange/rates')
        .done((response) => {
          const rates = response.rates.reduce((obj, curr) => {
            obj[curr.code] = curr.rate;
            return obj;
          }, {});
          commit('updateExchangeRates', rates);
        });
    },
    [GET_PAYPAL_TOKEN]({ commit }) {
      $.get('https://vitumob-xyz.appspot.com/payments/paypal/token').done(tokenResponse => {
        commit('setPayPalToken', tokenResponse);
      });
    },
  },
});
