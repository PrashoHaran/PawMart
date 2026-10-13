import { app } from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { verifyMailer } from './src/services/mailer.js';
import { scheduleVaccinationReminders } from './src/jobs/vaccinationReminders.js';
import { schedulePayPalCleanup } from './src/jobs/paypalCleanup.js';
import { isPayPalConfigured } from './src/services/paypal.js';

async function start() {
  await connectDB();
  await verifyMailer();
  const reminderTask = scheduleVaccinationReminders();
  const paypalTask = schedulePayPalCleanup();
  console.info(isPayPalConfigured() ? `[paypal] enabled (${env.paypal.environment})` : '[paypal] not configured — PayPal checkout hidden');

  const server = app.listen(env.port, () => {
    console.info(`[server] listening on port ${env.port}`);
  });

  const shutdown = async (signal) => {
    console.info(`[server] received ${signal}, shutting down`);
    await reminderTask?.stop();
    await paypalTask?.stop();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
