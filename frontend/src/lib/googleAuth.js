import { apiRequest } from './api';

let configPromise = null;
let scriptPromise = null;

// Whether the server has Google sign-in configured (fetched once).
export function getAuthConfig() {
  if (!configPromise) {
    configPromise = apiRequest('/auth/config')
      .then(({ data }) => data)
      .catch((err) => {
        configPromise = null;
        throw err;
      });
  }
  return configPromise;
}

// Loads Google Identity Services once and resolves with window.google.accounts.id.
// https://developers.google.com/identity/gsi/web/guides/display-button
export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // hl=en: show Google's button in English whatever the visitor's location.
      script.src = 'https://accounts.google.com/gsi/client?hl=en';
      script.async = true;
      script.onload = () => resolve(window.google.accounts.id);
      script.onerror = () => {
        scriptPromise = null;
        script.remove();
        reject(new Error('Could not load Google sign-in. Check your internet connection.'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}
