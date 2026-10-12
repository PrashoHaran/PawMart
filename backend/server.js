import { app } from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { verifyMailer } from './src/services/mailer.js';
import { scheduleVaccinationReminders } from './src/jobs/vaccinationReminders.js';

async function start() {
  await connectDB();
  await verifyMailer();
  const reminderTask = scheduleVaccinationReminders();

  const server = app.listen(env.port, () => {
    console.info(`[server] listening on port ${env.port}`);
  });

  const shutdown = async (signal) => {
    console.info(`[server] received ${signal}, shutting down`);
    await reminderTask?.stop();
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
