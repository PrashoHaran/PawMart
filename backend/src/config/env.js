import 'dotenv/config';

const required = ['MONGODB_URI', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // UTC offset appointment slots are interpreted in (Sri Lanka by default),
  // so "09:00 AM" means the same moment whatever timezone the server runs in.
  appUtcOffset: process.env.APP_UTC_OFFSET || '+05:30',
  // Email: when SMTP_HOST is unset, emails are logged to the console instead of sent.
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Image uploads: when unset, forms fall back to pasting an image URL.
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  // Sign in with Google. Only the (public) OAuth client ID is needed: the
  // browser gets an ID token from Google and the server verifies it.
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  // PayPal Checkout. PAYPAL_ENV=sandbox uses test accounts (no real money).
  // When the client ID/secret are unset, PayPal is simply not offered.
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    environment: process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox',
    // Optional override (used to point tests at a local mock).
    apiBase: process.env.PAYPAL_API_BASE,
    currency: 'USD',
    // Country of PawMart's shipping addresses (checkout has no country field).
    shippingCountry: process.env.PAYPAL_SHIPPING_COUNTRY || 'LK',
  },
  emailFrom: process.env.EMAIL_FROM || 'PawMart <no-reply@pawmart.local>',
  reminders: {
    enabled: process.env.REMINDERS_ENABLED !== 'false',
    cron: process.env.REMINDER_CRON || '0 8 * * *',
    timezone: process.env.REMINDER_TZ || 'Asia/Colombo',
    daysBefore: Number(process.env.REMINDER_DAYS_BEFORE) || 7,
  },
};
