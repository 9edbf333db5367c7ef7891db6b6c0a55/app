import { mapState } from 'vuex';
import { GET_EXCHANGE_RATES } from '../store/types';
import merchantScrapers from '../scrapers';

export default {
  template: '#homepage',
  data() {
    return {
      customInAppBrowserOptions: {
        closeButton: {
          image: 'cancel',
          imagePressed: 'cancel',
          event: 'closePressed',
        },
        customButtons: [{
          image: 'checkout',
          imagePressed: 'checkout_pressed',
          align: 'right',
          event: 'exportShoppingCartFromMerchant',
        }],
        backButtonCanClose: true,
      },
    };
  },
  created() {
    if (!Object.keys(this.rates).length) {
      this.$store.dispatch(GET_EXCHANGE_RATES);
    }
  },
  computed: mapState({
    rates: state => state.rates,
  }),
  methods: {
    openInAppBrowser(event) {
      const {
        href: {
          value: merchantUrl,
        },
        'data-merchant': {
          value: merchantName,
        },
        'data-cart-url': {
          value: merchantCartUrl,
        },
      } = event.target.attributes;

      const browser = cordova.ThemeableBrowser.open(...[
        merchantUrl,
        '_blank',
        Object.assign({}, this.inAppBrowserOptions, this.customInAppBrowserOptions),
      ]);

      browser.addEventListener('exportShoppingCartFromMerchant', () => {
        const redirectToCartScript = {
          code: `window.location='${merchantCartUrl}'`,
        };
        browser.addEventListener('loadstop', (e) => {
          if (e.url === merchantCartUrl) {
            $.get(e.url).done((theShoppingSiteHTML) => {
              const { [merchantName]: merchant } = merchantScrapers;
              const doc = document.implementation.createHTMLDocument('Amazon');
              doc.documentElement.innerHTML = theShoppingSiteHTML;

              $(doc).ready(() => {
                const items = merchant.scrape(doc);
                const someItemPricesAreInPounds = items.find(
                  item => item.priceInPounds !== undefined
                );

                if (someItemPricesAreInPounds.length) {
                  items.forEach(item => {
                    if (item.priceInPounds) {
                      item.price = item.price * this.rates.GBP;
                    }
                    return item;
                  });
                }

                if (items.length > 0) {
                  const order = {
                    merchant: merchantName,
                    date: new Date().toLocaleString(),
                    items,
                  };

                  browser.close();
                  this.$store.commit('setNewOrder', order);
                  this.$router.push({ name: 'shoppingCart' });
                }
              });
            });
          }
        });
        browser.executeScript(redirectToCartScript);
      });
    },
  },
};
