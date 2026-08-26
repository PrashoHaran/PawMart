import { useState } from 'react';
import { Trash2, CreditCard, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Cart() {
  const [items, setItems] = useState([
    { id: 1, name: 'Premium Dog Food - Salmon Recipe', price: 45.99, quantity: 2, image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80' },
    { id: 2, name: 'Interactive Cat Toy', price: 15.50, quantity: 1, image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&q=80' }
  ]);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + shipping;

  const updateQuantity = (id, delta) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">Secure Checkout</h1>

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
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                      <div className="flex-grow">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{item.name}</h3>
                        <p className="text-primary font-bold">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 hover:bg-gray-50 text-gray-600">-</button>
                          <span className="px-3 py-1 font-medium text-sm w-8 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 hover:bg-gray-50 text-gray-600">+</button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shipping Info Mockup */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Shipping Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" className="input-field" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" className="input-field" placeholder="Doe" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" className="input-field" placeholder="123 Pet Avenue" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" className="input-field" placeholder="Colombo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input type="text" className="input-field" placeholder="00100" />
                </div>
              </div>
            </div>

            {/* Payment Info Mockup */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Payment Method (Simulated)</h2>
              
              <div className="flex gap-4 mb-6">
                <label className="flex-1 border-2 border-primary bg-primary/5 rounded-xl p-4 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input type="radio" name="payment" defaultChecked className="text-primary focus:ring-primary h-4 w-4" />
                    <span className="font-semibold text-primary-dark">Credit Card</span>
                  </div>
                  <CreditCard className="h-6 w-6 text-primary" />
                </label>
                <label className="flex-1 border-2 border-gray-200 hover:border-gray-300 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-colors">
                  <div className="flex items-center gap-2">
                    <input type="radio" name="payment" className="text-primary focus:ring-primary h-4 w-4" />
                    <span className="font-semibold text-gray-700">Cash on Delivery</span>
                  </div>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <div className="relative">
                    <input type="text" className="input-field pl-10" placeholder="0000 0000 0000 0000" />
                    <CreditCard className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input type="text" className="input-field" placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                    <input type="text" className="input-field" placeholder="123" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar - Order Total */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Total</h2>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Estimated Tax</span>
                  <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-2">
                  <span className="text-base font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <button className="w-full btn-primary py-4 text-lg flex justify-center items-center gap-2 mb-4">
                Place Order <ArrowRight className="h-5 w-5" />
              </button>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Lock className="h-4 w-4" /> Secure Checkout (Simulated)
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
