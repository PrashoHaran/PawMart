import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    priceCents: { type: Number, required: true, min: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    category: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    description: { type: String, default: '' },
    features: { type: [String], default: [] },
    vendorName: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, priceCents: 1 });
productSchema.index({ name: 'text' });

export const Product = mongoose.model('Product', productSchema);
