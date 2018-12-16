import Vuex from 'vuex';
import {
  GET_ORDER_CALCULATIONS,
  GET_EXCHANGE_RATES,
  GET_PAYPAL_TOKEN,
  SYNC_USER_TO_DATASTORE,
  SYNC_USER_LOCALLY_AND_FIREBASE,
  GET_MPESA_PUSH_API_TOKEN,
} from './types';

export default new Vuex.Store({
  state: {
    user: {},
    shoppingCart: [],
    order: {},
    scrapedOrder: {},
    rates: {},
    PayPalToken: null,
    MpesaAPIToken: null,
    payment: {},
    deliveryLocation: null,
    loading: false,
  },
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setNewOrder(state, order) {
      state.scrapedOrder = Object.assign(state.scrapedOrder, order);
      state.order = Object.assign(state.order, order);
    },
    linkUserToOrder(state) {
      state.order.user = state.user;
    },
    updateShoppingCart(state, cart) {
      state.shoppingCart = cart.items;
    },
    updateOrderDetails(state, orderDetailsWithLocalCosts) {
      state.order = Object.assign(state.order, orderDetailsWithLocalCosts);
    },
    updateExchangeRates(state, rates) {
      state.rates = Object.assign(state.rates, rates);
    },
    setPayPalToken(state, tokenObject) {
      state.PayPalToken = tokenObject;
    },
    setMpesaAPIToken(state, tokenObject) {
      state.MpesaAPIToken = tokenObject;
    },
    setPaymentDetails(state, paymentDetails) {
      if (state.PayPalToken) delete state.PayPalToken;
      if (paymentDetails.mpesa_code || state.PayPalToken) state.shoppingCart = [];
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
    [SYNC_USER_LOCALLY_AND_FIREBASE]({ commit }, { user, redirect }) {
      commit('setUser', user);
      window.localStorage.setItem('vitumobUser', JSON.stringify(user));

      const ref = firebase.database().ref(`users/${user.id}`);
      return ref.once('value').then(snapshot => {
        const transaction = snapshot.exists() ? ref.update(user) : ref.set(user);
        return typeof redirect === 'function' ? transaction.then(redirect) : transaction;
      });
    },
    [SYNC_USER_TO_DATASTORE]({ commit }, user) {
      const endpoint = 'https://vitumob-prod.appspot.com/user';
      const isUpdate = 'phone_number' in user;
      const resourceUrl = isUpdate ? `${endpoint}/${user.id}` : endpoint;
      const HTTPMethod = isUpdate ? 'PUT' : 'POST';

      // delete empty/null/undefined properties from the object
      Object.keys(user).forEach(prop => { if (!user[prop]) delete user[prop]; });

      const userData = JSON.stringify({ user: JSON.stringify(user) });
      const createOrUpdateUserRequest = $.ajax({
        url: resourceUrl,
        type: HTTPMethod,
        dataType: 'json',
        data: userData,
        contentType: 'application/json',
      });
      return createOrUpdateUserRequest;
    },
    [GET_ORDER_CALCULATIONS]({ commit, state }, persistUserOrderToDB = false) {
      const items = [];
      const order = state.scrapedOrder;
      const roundOf = (num, decimalPlaces) => (
        +(Math.round(num + `e+${decimalPlaces}`) + `e-${decimalPlaces}`)
      );

      for (const prop in order.items) {
        if (order.items.hasOwnProperty(prop) && typeof order.items[prop] === 'object') {
          if ('price' in order.items[prop]) {
            const localPrice = order.items[prop].price * state.rates.KES;
            order.items[prop].localPrice = roundOf(localPrice, 0);
            items.push(order.items[prop]);
          }
        }
      }

      order.items = items;
      order.exchange_rate = state.rates.KES;

      if (!state.shoppingCart.length) commit('updateShoppingCart', { items });
      if (persistUserOrderToDB) order.create_order = persistUserOrderToDB;

      const orderData = JSON.stringify({ order: JSON.stringify(order) });
      const createOrderRequest = $.ajax({
        url: 'https://vitumob-prod.appspot.com/order',
        type: 'POST',
        dataType: 'json',
        data: orderData,
        contentType: 'application/json',
      });

      return createOrderRequest.done((orderCreated) => {
        commit('updateExchangeRates', { KES: orderCreated.exchange_rate });
        const informationKeys = ['markup', 'order_hex', 'order_id', 'exchange_rate'];
        const orderCreatedWithLocalCosts = Object.keys(orderCreated).reduce((orderDetails, key) => {
          if (informationKeys.indexOf(key) === -1) {
            if (key === 'shipping_cost' && orderCreated[key] === 0) {
              orderDetails[key] = 'FREE';
              orderDetails[`${key}_local`] = 'SHIPPING';
              return orderDetails;
            }

            orderDetails[key] = orderCreated[key];
            orderDetails[`${key}_local`] = roundOf(orderCreated[key] * state.rates.KES, 0);
            return orderDetails;
          }

          orderDetails[key] = orderCreated[key];
          return orderDetails;
        }, {});

        console.log(orderCreatedWithLocalCosts);
        commit('updateOrderDetails', orderCreatedWithLocalCosts);
      });
    },
    [GET_EXCHANGE_RATES]({ commit }) {
      $.get('https://vitumob-prod.appspot.com/exchange/rates')
        .done((response) => {
          const rates = response.rates.reduce((rate, curr) => {
            rate[curr.code] = curr.rate;
            return rate;
          }, {});
          commit('updateExchangeRates', rates);
        });
    },
    [GET_PAYPAL_TOKEN]({ commit, state }) {
      if (!state.PayPalToken) {
        return $.get('https://vitumob-prod.appspot.com/payments/paypal/token')
          .done(tokenResponse => {
            commit('setPayPalToken', tokenResponse);
            return tokenResponse;
          });
      }

      // eslint-disable-next-line new-cap
      return $.Deferred().resolve(state.PayPalToken);
    },
    [GET_MPESA_PUSH_API_TOKEN]({ commit, state }) {
      if (!state.MpesaAPIToken) {
        return $.get('https://vitumob-prod.appspot.com/payments/mpesa/token')
          .done(tokenResponse => {
            commit('setMpesaAPIToken', tokenResponse);
            return tokenResponse;
          });
      }

      // eslint-disable-next-line new-cap
      return $.Deferred().resolve(state.MpesaAPIToken);
    },
  },
});
