import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { formatPriceCents } from '../lib/format';
import QuantityStepper from '../components/QuantityStepper';

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    apiRequest(`/products/${id}`, { signal: controller.signal })
      .then(({ data }) => setProduct(data))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  const handleAddToCart = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    addItem(product._id, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 py-12">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="alert alert-warning mb-8">
            <p className="text-sm text-orange-700">
              {error?.status === 404 ? 'Product not found.' : `Couldn't load product: ${error?.message}`}
            </p>
          </div>
          <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Link to="/marketplace" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Marketplace
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
              <div className="mb-2 text-sm text-primary font-semibold">{product.vendorName}</div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 bg-secondary/10 px-3 py-1 rounded-full">
                  <Star className="h-4 w-4 fill-secondary text-secondary" aria-hidden="true" />
                  <span className="text-sm font-bold text-secondary-dark">{product.rating}</span>
                </div>
                <span className="text-gray-500 text-sm">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              <div className="text-4xl font-bold text-gray-900 mb-8">
                ${formatPriceCents(product.priceCents)}
              </div>

              <p className="text-gray-600 mb-8 leading-relaxed">
                {product.description}
              </p>

              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">Key Benefits</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600">
                      <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" aria-hidden="true" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 mt-auto border-t border-gray-100 pt-8">
                <QuantityStepper value={quantity} onChange={setQuantity} size="lg" />
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-grow btn-primary flex items-center justify-center gap-2 py-3 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {justAdded ? (
                    <>
                      <Check className="h-5 w-5" aria-hidden="true" /> Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" aria-hidden="true" /> Add to Cart
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Truck className="h-5 w-5 text-gray-400" aria-hidden="true" /> Free Shipping over $50
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <RotateCcw className="h-5 w-5 text-gray-400" aria-hidden="true" /> 30-Day Returns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
