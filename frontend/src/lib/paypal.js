import { apiRequest } from './api';

let configPromise = null;
let sdkPromise = null;

// Which payment providers the server offers (fetched once).
export function getPaymentConfig() {
  if (!configPromise) {
    configPromise = apiRequest('/payments/config')
      .then(({ data }) => data)
      .catch((err) => {
        configPromise = null;
        throw err;
      });
  }
  return configPromise;
}

// Loads PayPal's JavaScript SDK once and resolves with window.paypal.
// https://developer.paypal.com/sdk/js/configuration/
export function loadPayPalSdk({ clientId, currency }) {
  if (window.paypal) return Promise.resolve(window.paypal);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const params = new URLSearchParams({
        'client-id': clientId,
        currency,
        intent: 'capture',
        components: 'buttons',
        'enable-funding': 'card',
        'disable-funding': 'paylater,venmo',
      });
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?${params}`;
      script.async = true;
      script.onload = () => resolve(window.paypal);
      script.onerror = () => {
        sdkPromise = null;
        script.remove();
        reject(new Error('Could not load PayPal. Check your internet connection.'));
      };
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}
