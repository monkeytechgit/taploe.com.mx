(() => {
  const dataset = document.documentElement.dataset || {};
  const market = dataset.market || 'mx';
  const locale = dataset.locale || 'es-MX';

  const productsByMarket = {
    mx: {
      nfc: {
        productId: 'prod_V7vPPmcxDtdwpm',
        priceId: 'price_1U7fYjE9Iq6fzuQI8c9m6T75',
        unitPrice: 800,
        quantityMode: 'manual'
      },
      nfc_metalica: {
        productId: 'prod_V7vOh1Cf5NKlkk',
        priceId: 'price_1U7fXIE9Iq6fzuQIWgd9UP52',
        unitPrice: 1150,
        quantityMode: 'manual'
      },
      google_reviews: {
        productId: 'prod_V7vTSs02zTQ82G',
        quantityMode: 'package',
        packages: {
          sencilla: { priceId: 'price_1U7oXJE9Iq6fzuQIhYOg86xl', totalPrice: 10, unitPrice: 10, quantity: 1 },
          doble: { priceId: 'price_1U7fc7E9Iq6fzuQI7xiu5UdH', totalPrice: 900, unitPrice: 450, quantity: 2 },
          paquete: { priceId: 'price_1U7fc7E9Iq6fzuQIPTVWWjsk', totalPrice: 1400, unitPrice: 280, quantity: 5 },
          'mega-pack': { priceId: 'price_1U7fc7E9Iq6fzuQIlatja3Ta', totalPrice: 2300, unitPrice: 230, quantity: 10 }
        }
      },
      instagram: {
        productId: 'prod_V7vkmovwDPpaDh',
        quantityMode: 'package',
        packages: {
          sencilla: { priceId: 'price_1U7fssE9Iq6fzuQI044xCmvJ', totalPrice: 600, unitPrice: 600, quantity: 1 },
          doble: { priceId: 'price_1U7ftxE9Iq6fzuQI1PNkZbq3', totalPrice: 900, unitPrice: 450, quantity: 2 },
          paquete: { priceId: 'price_1U7ftxE9Iq6fzuQIRipyfrYr', totalPrice: 1400, unitPrice: 280, quantity: 5 },
          'mega-pack': { priceId: 'price_1U7ftxE9Iq6fzuQI0ut7zIBH', totalPrice: 2300, unitPrice: 230, quantity: 10 }
        }
      },
      facebook: {
        productId: 'prod_V7vVAC0r5qnuiR',
        quantityMode: 'package',
        packages: {
          sencilla: { priceId: 'price_1U7fenE9Iq6fzuQILQFwMifL', totalPrice: 600, unitPrice: 600, quantity: 1 },
          doble: { priceId: 'price_1U7ffeE9Iq6fzuQIr0zh6LZ6', totalPrice: 900, unitPrice: 450, quantity: 2 },
          paquete: { priceId: 'price_1U7ffeE9Iq6fzuQI3FNKgorA', totalPrice: 1400, unitPrice: 280, quantity: 5 },
          'mega-pack': { priceId: 'price_1U7ffeE9Iq6fzuQIIawQg4f6', totalPrice: 2300, unitPrice: 230, quantity: 10 }
        }
      },
      tripadvisor: {
        productId: 'prod_V7vnuSaXRvYV7c',
        quantityMode: 'package',
        packages: {
          sencilla: { priceId: 'price_1U7fvhE9Iq6fzuQIxrtLZ39Q', totalPrice: 600, unitPrice: 600, quantity: 1 },
          doble: { priceId: 'price_1U7fwiE9Iq6fzuQIltCEiydc', totalPrice: 900, unitPrice: 450, quantity: 2 },
          paquete: { priceId: 'price_1U7fwiE9Iq6fzuQIO04kwHqp', totalPrice: 1400, unitPrice: 280, quantity: 5 },
          'mega-pack': { priceId: 'price_1U7fwiE9Iq6fzuQIy9a2uaPc', totalPrice: 2300, unitPrice: 230, quantity: 10 }
        }
      }
    }
  };

  window.TaploeEcommerce = {
    stripePublishableKey: 'pk_live_51TtqDIE9Iq6fzuQICgG0SyFWRhjnpUtT77TxlNhLgYhdo4X36yrsnwennQj5Ghj6aLF5zmDxQxgfFyikD2HBWTk000JvfqlMtF',
    supabaseUrl: 'https://gmpiygcnzlxllnablxmk.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcGl5Z2Nuemx4bGxuYWJseG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTE1NjUsImV4cCI6MjA5OTE4NzU2NX0.3xYOvjvjuoNJW5DXemn0VaNUnC1IifluBjHVSa_uKBs',
    market,
    locale,
    currency: 'MXN',
    cartStorageKey: `taploeCart:${market}`,
    orderStorageKey: `taploeCheckoutOrderId:${market}`,
    pendingCheckoutStorageKey: `taploePendingCheckout:${market}`,
    webCartCheckoutFunction: 'taploe-mx-create-web-cart-checkout',
    webCartCompleteFunction: 'taploe-mx-complete-checkout-order',
    checkoutMode: 'payment',
    appLoginUrl: 'https://app.taploe.com/login?locale=es-MX',
    productsByMarket,
    products: productsByMarket[market] || productsByMarket.mx
  };
})();
