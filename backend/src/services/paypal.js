import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Thin client for the PayPal REST API (Orders v2 + Payments v2), using
// Node's built-in fetch. Docs: https://developer.paypal.com/docs/api/orders/v2/

const API_BASE =
  env.paypal.apiBase ||
  (env.paypal.environment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

export function isPayPalConfigured() {
  return Boolean(env.paypal.clientId && env.paypal.clientSecret);
}

export function paypalPublicConfig() {
  return {
    enabled: isPayPalConfigured(),
    clientId: isPayPalConfigured() ? env.paypal.clientId : null,
    currency: env.paypal.currency,
    environment: env.paypal.environment,
  };
}

let cachedToken = null; // { value, expiresAt }

async function accessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const credentials = Buffer.from(`${env.paypal.clientId}:${env.paypal.clientSecret}`).toString('base64');
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    throw new ApiError(502, 'PAYPAL_UNAVAILABLE', 'Could not connect to PayPal. Check the PayPal credentials.');
  }
  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function paypalRequest(path, { method = 'GET', body, requestId } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
      // Makes retries of the same operation safe (PayPal ignores duplicates).
      ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

const toValue = (cents) => (cents / 100).toFixed(2);
const toCents = (value) => Math.round(Number(value) * 100);

// Creates a PayPal order for an amount calculated by our server. The
// checkout's shipping address is passed so PayPal shows (and ships to) the
// address entered at PawMart rather than the buyer's PayPal profile address.
export async function createPayPalOrder({ referenceId, amountCents, description, shippingAddress }) {
  const purchaseUnit = {
    reference_id: referenceId,
    custom_id: referenceId,
    description: description.slice(0, 127),
    amount: { currency_code: env.paypal.currency, value: toValue(amountCents) },
  };
  if (shippingAddress) {
    purchaseUnit.shipping = {
      name: { full_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.slice(0, 300) },
      address: {
        address_line_1: shippingAddress.address.slice(0, 300),
        admin_area_2: shippingAddress.city.slice(0, 120),
        postal_code: shippingAddress.postalCode.slice(0, 60),
        country_code: env.paypal.shippingCountry,
      },
    };
  }

  const { ok, data } = await paypalRequest('/v2/checkout/orders', {
    method: 'POST',
    requestId: `create-${referenceId}`,
    body: {
      intent: 'CAPTURE',
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'PawMart',
            shipping_preference: shippingAddress ? 'SET_PROVIDED_ADDRESS' : 'NO_SHIPPING',
            user_action: 'PAY_NOW',
          },
        },
      },
      purchase_units: [purchaseUnit],
    },
  });
  if (!ok || !data.id) {
    throw new ApiError(502, 'PAYPAL_ERROR', data.message || 'PayPal could not create the payment');
  }
  return data.id;
}

// Captures an approved order. Returns { status, captureId, amountCents } or
// { declined: true } when the buyer's funding source was refused.
export async function capturePayPalOrder(paypalOrderId, referenceId) {
  const { ok, status, data } = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: 'POST',
    requestId: `capture-${referenceId}`,
    body: {},
  });

  const issue = data.details?.[0]?.issue;
  if (!ok) {
    if (issue === 'INSTRUMENT_DECLINED') return { declined: true, message: 'PayPal declined that payment method. Please try another one.' };
    if (issue === 'ORDER_ALREADY_CAPTURED') return getCapturedOrder(paypalOrderId);
    throw new ApiError(status === 422 ? 409 : 502, 'PAYPAL_ERROR', data.details?.[0]?.description || data.message || 'PayPal could not capture the payment');
  }
  return readCapture(data);
}

async function getCapturedOrder(paypalOrderId) {
  const { ok, data } = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`);
  if (!ok) throw new ApiError(502, 'PAYPAL_ERROR', 'Could not look up the PayPal order');
  return readCapture(data);
}

export async function getPayPalOrderStatus(paypalOrderId) {
  const { ok, data } = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`);
  return ok ? readCapture(data) : null;
}

function readCapture(order) {
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: order.status, // CREATED | APPROVED | COMPLETED | ...
    captureId: capture?.id ?? null,
    captureStatus: capture?.status ?? null,
    amountCents: capture ? toCents(capture.amount.value) : null,
    currency: capture?.amount.currency_code ?? null,
    payerEmail: order.payer?.email_address ?? null,
  };
}

// Full refund of a capture (sandbox refunds move test money back).
export async function refundPayPalCapture(captureId, referenceId) {
  const { ok, data } = await paypalRequest(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: 'POST',
    requestId: `refund-${referenceId}`,
    body: {},
  });
  if (!ok) {
    throw new ApiError(502, 'PAYPAL_REFUND_FAILED', data.details?.[0]?.description || data.message || 'PayPal could not refund the payment');
  }
  return { refundId: data.id, status: data.status };
}
