import { connectDB, disconnectDB } from '../config/db.js';
import { Service } from '../models/Service.js';

// Mirrors the SERVICES array in frontend/src/pages/AppointmentBooking.jsx.
const SERVICES = [
  {
    name: 'Veterinary Checkup',
    description: 'A general wellness exam covering vitals, weight, and basic health screening.',
    type: 'vet',
    durationMinutes: 30,
    priceCents: 3500,
  },
  {
    name: 'Pet Grooming',
    description: 'Full grooming session including bath, brush-out, nail trim, and ear cleaning.',
    type: 'grooming',
    durationMinutes: 60,
    priceCents: 4500,
  },
];

async function seed() {
  await connectDB();
  await Service.deleteMany({});
  await Service.insertMany(SERVICES);
  console.info(`[seedServices] inserted ${SERVICES.length} services`);
  await disconnectDB();
}

seed().catch((err) => {
  console.error('[seedServices] failed:', err);
  process.exit(1);
});
