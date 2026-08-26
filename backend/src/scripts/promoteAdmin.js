import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';

const email = process.argv[2];

async function promoteAdmin() {
  if (!email) {
    console.error('Usage: node src/scripts/promoteAdmin.js <email>');
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.error(`[promoteAdmin] no user found with email ${email}`);
    await disconnectDB();
    process.exit(1);
  }

  user.role = 'admin';
  user.tokenVersion += 1;
  await user.save();

  console.info(`[promoteAdmin] ${user.email} is now an admin (re-login required)`);
  await disconnectDB();
}

promoteAdmin().catch((err) => {
  console.error('[promoteAdmin] failed:', err);
  process.exit(1);
});
