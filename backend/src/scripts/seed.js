import { connectDB, disconnectDB } from '../config/db.js';
import { Product } from '../models/Product.js';

// Mirrors DUMMY_PRODUCTS in frontend/src/pages/Marketplace.jsx so the API
// serves the same catalog the frontend currently fakes.
const PRODUCTS = [
  {
    name: 'Premium Dog Food - Salmon & Sweet Potato',
    priceCents: 4599,
    rating: 4.8,
    category: 'Food',
    image:
      'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    description:
      'Grain-free dry dog food formulated with real salmon as the first ingredient.',
    features: ['Real salmon is the #1 ingredient', 'Grain-free recipe for sensitive stomachs'],
    vendorName: 'HealthyPaws Co.',
    stock: 50,
  },
  {
    name: 'Interactive Cat Toy - Laser Pointer',
    priceCents: 1550,
    rating: 4.5,
    category: 'Toys',
    image:
      'https://images.unsplash.com/photo-1545249390-6bdfa286032f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    description: 'Interactive laser toy to keep cats active and entertained.',
    features: ['Automatic random patterns', 'USB rechargeable'],
    vendorName: 'PlayfulPaws',
    stock: 80,
  },
  {
    name: 'Orthopedic Dog Bed - Large',
    priceCents: 8999,
    rating: 4.9,
    category: 'Accessories',
    image:
      'https://images.unsplash.com/photo-1623250930927-64845511b9e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    description: 'Memory foam orthopedic bed for joint support.',
    features: ['Memory foam core', 'Removable washable cover'],
    vendorName: 'ComfyPets',
    stock: 30,
  },
  {
    name: 'Automatic Pet Water Fountain',
    priceCents: 3400,
    rating: 4.6,
    category: 'Accessories',
    image:
      'https://images.unsplash.com/photo-1571131116858-2295ade82a72?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    description: 'Filtered circulating water fountain for pets.',
    features: ['3L capacity', 'Ultra-quiet pump'],
    vendorName: 'AquaPet',
    stock: 40,
  },
  {
    name: 'Grain-Free Cat Food - Chicken Recipe',
    priceCents: 2850,
    rating: 4.7,
    category: 'Food',
    image:
      'https://images.unsplash.com/photo-1596854331442-3cf47265cefb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    description: 'Grain-free chicken recipe cat food.',
    features: ['High protein', 'No artificial preservatives'],
    vendorName: 'HealthyPaws Co.',
    stock: 60,
  },
  {
    name: 'Heavy Duty Dog Leash',
    priceCents: 1899,
    rating: 4.4,
    category: 'Accessories',
    image:
      'https://images.unsplash.com/photo-1644416225353-adc117940526?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
    description: 'Durable nylon leash for daily walks.',
    features: ['Reflective stitching', 'Padded handle'],
    vendorName: 'TrailGear',
    stock: 100,
  },
];

async function seed() {
  await connectDB();
  await Product.deleteMany({});
  await Product.insertMany(PRODUCTS);
  console.info(`[seed] inserted ${PRODUCTS.length} products`);
  await disconnectDB();
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
