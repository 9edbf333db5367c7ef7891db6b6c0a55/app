import { GET_EXCHANGE_RATES } from '../store/types';


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
  beforeMount() {
    this.$store.dispatch(GET_EXCHANGE_RATES);
  },
  methods: {
    openInAppBrowser(event) {
      const {
        'data-cart-url': { value: merchantCartUrl },
        href: { value: merchantUrl },
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
            browser.executeScript(getDOMScript, (documentHtml) => {
              const doc = document.implementation.createHTMLDocument('Amazon');
              doc.documentElement.innerHTML = documentHtml[0];

              $(doc).ready(() => {
                const html = $(doc.querySelector('html'));
                const cart = $(html).find('#sc-active-cart .sc-list-body .sc-list-item');
                const cartItems = cart.not('.sc-action-move-to-cart');
                let items;

                if (cartItems.length) {
                  items = cartItems.map(function cartItemLoop() {
                    const item = {};
                    const itemElement = $(this);
                    item.id = itemElement.data('asin');
                    item.name = itemElement.find('.sc-product-title').text();
                    item.name = item.name.replace(/("|\n)/g, '').trim();

                    item.image = itemElement.find('img.sc-product-image').attr('src');
                    item.link = 'https://amazon.com' + itemElement.find('.sc-item-dp-link').data('url');
                    item.price = itemElement.data('price');

                    const dropdown = itemElement.find('.a-dropdown-prompt');
                    if (dropdown.length > 0 || (dropdown.text() && !dropdown.text().includes('10+'))) {
                      item.quantity = parseInt(dropdown.text(), 10);
                    } else {
                      item.quantity = parseInt(itemElement.find('input.sc-quantity-textfield').val(), 10);
                    }

                    const priceString = itemElement.find('.sc-product-price')
                      .text().replace(/\$|,|\s/g, '');
                    if (priceString.indexOf('£') > -1) {
                      item.priceInPounds = true;
                    }
                    item.price = parseFloat(priceString, 10);
                    return item;
                  });

                  if (items.length > 0) {
                    const order = {
                      merchant: 'amazon',
                      uuid: device.uuid,
                      date: new Date().toLocaleString(),
                      items,
                    };
                    this.$store.commit('setTemporaryOrder', order);
                    this.$router.push({ name: 'shoppingCart' });
                    browser.close();
                  }
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
