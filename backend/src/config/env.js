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
  // Email: when SMTP_HOST is unset, emails are logged to the console instead of sent.
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  emailFrom: process.env.EMAIL_FROM || 'PawMart <no-reply@pawmart.local>',
  reminders: {
    enabled: process.env.REMINDERS_ENABLED !== 'false',
    cron: process.env.REMINDER_CRON || '0 8 * * *',
    timezone: process.env.REMINDER_TZ || 'Asia/Colombo',
    daysBefore: Number(process.env.REMINDER_DAYS_BEFORE) || 7,
  },
};
