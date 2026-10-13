import mongoose from 'mongoose';

// One document per payment attempt (Payments collection in the ERD). Failed
// card attempts are kept for auditing and have no order. Full card numbers
// and CVCs are never stored.
const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    method: { type: String, enum: ['credit_card', 'cash_on_delivery', 'paypal'], required: true },
    amountCents: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded', 'cancelled'],
      required: true,
    },
    card: {
      brand: String,
      last4: String,
      expMonth: Number,
      expYear: Number,
    },
    transactionRef: { type: String, default: null }, // simulated ref, or PayPal capture ID
    // PayPal order ID while the buyer approves the payment in PayPal.
    providerOrderId: { type: String, default: null },
    payerEmail: { type: String, default: null },
    refundRef: { type: String, default: null },
    failureCode: { type: String, default: null },
    failureMessage: { type: String, default: null },
    paidAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ providerOrderId: 1 }, { sparse: true });

export const Payment = mongoose.model('Payment', paymentSchema);
