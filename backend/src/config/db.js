import mongoose from 'mongoose';
import { env } from './env.js';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

mongoose.connection.on('error', (err) => {
  console.error('[mongo] connection error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  console.warn('[mongo] disconnected');
});
mongoose.connection.on('reconnected', () => {
  console.info('[mongo] reconnected');
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDB() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(env.mongodbUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
      console.info('[mongo] connected');
      return;
    } catch (err) {
      console.error(`[mongo] connect attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
      if (attempt === MAX_RETRIES) {
        throw err;
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
