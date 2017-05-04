export default {
  name: 'Amazon',
  host: 'https://www.amazon.com',
  cartPath: '/gp/cart/view.html/ref=nav_cart',
  scrape(htmlDoc) {
    const html = $(htmlDoc.querySelector('html'));
    const cart = $(html).find('#sc-active-cart .sc-list-body .sc-list-item');
    const cartItems = cart.not('.sc-action-move-to-cart');

    if (cartItems.length) {
      return cartItems.map(function cartItemLoop() {
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

        const priceString = itemElement.find('.sc-product-price').text().replace(/\$|,|\s/g, '');
        if (priceString.indexOf('£') > -1) {
          item.priceInPounds = true;
        }

        item.price = parseFloat(priceString, 10);
        return item;
      });
    }

    return [];
  },
};
