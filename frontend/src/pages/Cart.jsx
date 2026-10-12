import { useState } from 'react';
import { paymentSummary, orderNumber } from '../components/orders/orderStatus';
import { Trash2, CreditCard, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPriceCents } from '../lib/format';
import { handleImageError, optimizedImage } from '../lib/image';
import QuantityStepper from '../components/QuantityStepper';

const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
const FLAT_SHIPPING_CENTS = 599;
const TAX_RATE = 0.08;

const EMPTY_ADDRESS = { firstName: '', lastName: '', address: '', city: '', postalCode: '' };
const EMPTY_CARD = { number: '', expiry: '', cvc: '' };

// Simulated gateway test cards (see backend/src/services/paymentGateway.js).
const TEST_CARDS = [
  ['4242 4242 4242 4242', 'Approved'],
  ['4000 0000 0000 0002', 'Declined'],
  ['4000 0000 0000 9995', 'Insufficient funds'],
];

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotalCents, checkout } = useCart();
  const [order, setOrder] = useState(null);
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [card, setCard] = useState(EMPTY_CARD);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  const shippingCents = subtotalCents > FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + shippingCents + taxCents;

  const updateAddressField = (field) => (e) =>
    setAddress((prev) => ({ ...prev, [field]: e.target.value }));

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const placedOrder = await checkout(address, paymentMethod, card);
      setOrder(placedOrder);
      setCard(EMPTY_CARD);
    } catch (err) {
      setError(err);
    } finally {
      setPlacing(false);
    }
  };

  // Per-field messages for card problems returned by the API.
  const cardErrors = Object.fromEntries(
    (error?.details ?? [])
      .filter((d) => d.field?.startsWith('card.') && d.message)
      .map((d) => [d.field.slice(5), d.message])
  );

  if (order) {
    const payment = paymentSummary(order);
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Order Placed!</h1>
          <p className="text-gray-500 mb-2">
            Thanks for shopping with PawMart. Order {orderNumber(order)} total: ${formatPriceCents(order.totalCents)}.
          </p>
          <p className={`text-sm font-medium mb-1 ${payment.className}`}>{payment.text}</p>
          {order.payment?.transactionRef && (
            <p className="text-xs text-gray-400 mb-6">Reference {order.payment.transactionRef} (simulated)</p>
          )}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Link to="/dashboard?tab=orders" className="btn-outline">Track Order</Link>
            <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2">
              Continue Shopping <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">Secure Checkout</h1>

        {error && (
          <div className="alert alert-warning mb-8" role="alert">
            <p className="text-sm text-orange-700">
              {error.code === 'PAYMENT_DECLINED'
                ? `Payment failed: ${error.message} Your cart is unchanged — check your card details or try another card.`
                : `Couldn't place order: ${error.message}`}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content - Cart & Shipping Form */}
          <div className="lg:col-span-8 space-y-8">

            {/* Cart Items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Order Summary</h2>

              {items.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Your cart is empty.</p>
                  <Link to="/marketplace" className="text-primary font-medium hover:underline">Continue Shopping</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.product._id} className="flex gap-4 items-center">
                      <img src={optimizedImage(item.product.image, 160)} alt={item.product.name} onError={handleImageError} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{item.product.name}</h3>
                        <p className="text-primary font-bold">${formatPriceCents(item.product.priceCents)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(next) => updateQuantity(item.product._id, next)}
                        />
                        <button
                          onClick={() => removeItem(item.product._id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove ${item.product.name} from cart`}
                        >
                          <Trash2 className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Shipping Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="shipping-first-name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input id="shipping-first-name" type="text" autoComplete="given-name" className="input-field" placeholder="John" value={address.firstName} onChange={updateAddressField('firstName')} />
                </div>
                <div>
                  <label htmlFor="shipping-last-name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input id="shipping-last-name" type="text" autoComplete="family-name" className="input-field" placeholder="Doe" value={address.lastName} onChange={updateAddressField('lastName')} />
                </div>
                <div className="col-span-2">
                  <label htmlFor="shipping-address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input id="shipping-address" type="text" autoComplete="street-address" className="input-field" placeholder="123 Pet Avenue" value={address.address} onChange={updateAddressField('address')} />
                </div>
                <div>
                  <label htmlFor="shipping-city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input id="shipping-city" type="text" autoComplete="address-level2" className="input-field" placeholder="Colombo" value={address.city} onChange={updateAddressField('city')} />
                </div>
                <div>
                  <label htmlFor="shipping-postal-code" className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input id="shipping-postal-code" type="text" autoComplete="postal-code" className="input-field" placeholder="00100" value={address.postalCode} onChange={updateAddressField('postalCode')} />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Payment Method (Simulated)</h2>

              <div className="flex gap-4 mb-6">
                <label className={`flex-1 border-2 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors ${paymentMethod === 'credit_card' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="payment" checked={paymentMethod === 'credit_card'} onChange={() => setPaymentMethod('credit_card')} className="text-primary focus:ring-primary h-4 w-4" />
                    <span className={`font-semibold ${paymentMethod === 'credit_card' ? 'text-primary-dark' : 'text-gray-700'}`}>Credit Card</span>
                  </div>
                  <CreditCard className="h-6 w-6 text-primary" aria-hidden="true" />
                </label>
                <label className={`flex-1 border-2 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors ${paymentMethod === 'cash_on_delivery' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="payment" checked={paymentMethod === 'cash_on_delivery'} onChange={() => setPaymentMethod('cash_on_delivery')} className="text-primary focus:ring-primary h-4 w-4" />
                    <span className={`font-semibold ${paymentMethod === 'cash_on_delivery' ? 'text-primary-dark' : 'text-gray-700'}`}>Cash on Delivery</span>
                  </div>
                </label>
              </div>

              {paymentMethod === 'credit_card' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="card-number" className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <div className="relative">
                      <input
                        id="card-number"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        className="input-field pl-10"
                        placeholder="0000 0000 0000 0000"
                        value={card.number}
                        onChange={(e) => setCard((prev) => ({ ...prev, number: formatCardNumber(e.target.value) }))}
                        aria-invalid={Boolean(cardErrors.number)}
                        aria-describedby={cardErrors.number ? 'card-number-error' : undefined}
                      />
                      <CreditCard className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" aria-hidden="true" />
                    </div>
                    {cardErrors.number && <p id="card-number-error" className="text-sm text-red-600 mt-1">{cardErrors.number}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="card-expiry" className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        id="card-expiry"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        className="input-field"
                        placeholder="MM/YY"
                        value={card.expiry}
                        onChange={(e) => setCard((prev) => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                        aria-invalid={Boolean(cardErrors.expiry)}
                        aria-describedby={cardErrors.expiry ? 'card-expiry-error' : undefined}
                      />
                      {cardErrors.expiry && <p id="card-expiry-error" className="text-sm text-red-600 mt-1">{cardErrors.expiry}</p>}
                    </div>
                    <div>
                      <label htmlFor="card-cvc" className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                      <input
                        id="card-cvc"
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        className="input-field"
                        placeholder="123"
                        value={card.cvc}
                        onChange={(e) => setCard((prev) => ({ ...prev, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        aria-invalid={Boolean(cardErrors.cvc)}
                        aria-describedby={cardErrors.cvc ? 'card-cvc-error' : undefined}
                      />
                      {cardErrors.cvc && <p id="card-cvc-error" className="text-sm text-red-600 mt-1">{cardErrors.cvc}</p>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="font-semibold text-gray-600 mb-1">Simulated payment — no real charge is made. Test cards:</p>
                    <ul className="space-y-0.5">
                      {TEST_CARDS.map(([number, result]) => (
                        <li key={number}>
                          <button
                            type="button"
                            className="font-mono text-primary hover:underline"
                            onClick={() => setCard({ number, expiry: '12/30', cvc: '123' })}
                          >
                            {number}
                          </button>{' '}
                          — {result}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar - Order Total */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Total</h2>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">${formatPriceCents(subtotalCents)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">{shippingCents === 0 ? 'Free' : `$${formatPriceCents(shippingCents)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Estimated Tax</span>
                  <span className="font-medium text-gray-900">${formatPriceCents(taxCents)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-2">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary">${formatPriceCents(totalCents)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={items.length === 0 || placing}
                className="w-full btn-primary py-4 text-lg flex justify-center items-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placing ? 'Placing Order...' : 'Place Order'} <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Lock className="h-4 w-4" aria-hidden="true" /> Secure Checkout (Simulated)
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
