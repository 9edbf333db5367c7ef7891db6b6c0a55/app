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
          image: 'vmlogo',
          imagePressed: 'vmlogo',
          align: 'right',
          event: 'exportShoppingCartButtonPressed',
        }],
        backButtonCanClose: true,
      },
    };
  },
  computed: mapState({
    rates: state => state.rates,
  }),
  beforeMount() {
    if (!Object.keys(this.rates).length) {
      this.$store.dispatch(GET_EXCHANGE_RATES);
    }
  },
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
        Object.assign(this.inAppBrowserOptions, this.customInAppBrowserOptions),
      ]);

      browser.addEventListener('exportShoppingCartButtonPressed', () => {
        const redirectToCartScript = {
          code: `window.location='${merchantCartUrl}'`,
        };
        browser.addEventListener('loadstop', (e) => {
          if (e.url === merchantCartUrl) {
            const getDOMScript = {
              code: 'document.documentElement.innerHTML',
            };
            browser.executeScript(getDOMScript, ([documentHtml]) => {
              const { [merchantName]: merchant } = merchantScrapers;
              const doc = document.implementation.createHTMLDocument('Amazon');
              doc.documentElement.innerHTML = documentHtml;

              $(doc).ready(() => {
                const items = merchant.scrape(doc);
                if (items.length > 0) {
                  const order = {
                    merchant: merchantName,
                    uuid: device.uuid,
                    date: new Date().toLocaleString(),
                    items,
                  };
                  this.$store.commit('setNewOrder', order);
                  this.$router.push({ name: 'shoppingCart' });
                  browser.close();
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
