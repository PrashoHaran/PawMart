import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  
  // Dummy data
  const product = {
    id,
    name: 'Premium Dog Food - Salmon & Sweet Potato Recipe',
    price: 45.99,
    rating: 4.8,
    reviews: 124,
    description: 'Grain-free dry dog food formulated with real salmon as the first ingredient. Includes sweet potatoes for healthy complex carbohydrates and essential vitamins. No artificial colors, flavors, or preservatives.',
    features: [
      'Real salmon is the #1 ingredient',
      'Grain-free recipe for sensitive stomachs',
      'Omega-3 & Omega-6 fatty acids for skin and coat health',
      'Antioxidant-rich for immune support'
    ],
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    vendor: 'HealthyPaws Co.'
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Product Image */}
            <div className="p-8 md:p-12 bg-gray-50/50 flex items-center justify-center relative">
              <img 
                src={product.image} 
                alt={product.name} 
                className="max-w-full h-auto rounded-2xl shadow-lg object-cover w-full max-h-[500px]"
              />
            </div>
            
            {/* Product Info */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="mb-2 text-sm text-primary font-semibold">{product.vendor}</div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 bg-secondary/10 px-3 py-1 rounded-full">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="text-sm font-bold text-secondary-dark">{product.rating}</span>
                </div>
                <span className="text-gray-500 text-sm hover:underline cursor-pointer">
                  {product.reviews} Reviews
                </span>
              </div>
              
              <div className="text-4xl font-bold text-gray-900 mb-8">
                ${product.price.toFixed(2)}
              </div>
              
              <p className="text-gray-600 mb-8 leading-relaxed">
                {product.description}
              </p>
              
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">Key Benefits</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600">
                      <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-4 mt-auto border-t border-gray-100 pt-8">
                <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors"
                  >-</button>
                  <span className="px-4 py-3 font-semibold text-gray-900 w-12 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-100 transition-colors"
                  >+</button>
                </div>
                <button className="flex-grow btn-primary flex items-center justify-center gap-2 py-3 rounded-xl text-lg">
                  <ShoppingCart className="h-5 w-5" /> Add to Cart
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Truck className="h-5 w-5 text-gray-400" /> Free Shipping over $50
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <RotateCcw className="h-5 w-5 text-gray-400" /> 30-Day Returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
