import { app } from './src/app.js';
import { env } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';

async function start() {
  await connectDB();

  const server = app.listen(env.port, () => {
    console.info(`[server] listening on port ${env.port}`);
  });

  const shutdown = async (signal) => {
    console.info(`[server] received ${signal}, shutting down`);
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
