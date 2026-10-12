import mongoose from 'mongoose';

// Fulfilment flow for each item; an order can hold items from several
// vendors, and each vendor advances only their own items.
export const FULFILMENT_FLOW = ['confirmed', 'processing', 'shipped', 'delivered'];
export const ORDER_STATUSES = ['pending', ...FULFILMENT_FLOW, 'cancelled'];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Snapshot of the product's vendor at purchase time; null for items
    // sold by PawMart itself (fulfilled by admins).
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    priceCents: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: [...FULFILMENT_FLOW, 'cancelled'], default: 'confirmed' },
  },
  { _id: false }
);

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    byRole: { type: String, enum: ['customer', 'vendor', 'admin', 'system'], default: 'system' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },
    subtotalCents: { type: Number, required: true },
    taxCents: { type: Number, required: true },
    shippingCents: { type: Number, required: true },
    totalCents: { type: Number, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'confirmed' },
    statusHistory: { type: [statusEventSchema], default: [] },
    shippingAddress: {
      firstName: String,
      lastName: String,
      address: String,
      city: String,
      postalCode: String,
    },
    paymentMethod: { type: String, enum: ['credit_card', 'cash_on_delivery'], required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ 'items.vendorId': 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
