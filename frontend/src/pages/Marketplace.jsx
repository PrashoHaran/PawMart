import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { formatPriceCents } from '../lib/format';
import { handleImageError, optimizedImage } from '../lib/image';

const CATEGORIES = ['All', 'Food', 'Toys', 'Accessories', 'Health', 'Grooming'];
const SEARCH_DEBOUNCE_MS = 300;

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ limit: '50' });
    if (activeCategory !== 'All') params.set('category', activeCategory);
    if (debouncedSearch) params.set('search', debouncedSearch);

    apiRequest(`/products?${params.toString()}`, { signal: controller.signal })
      .then(({ data }) => setProducts(data))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [activeCategory, debouncedSearch]);

  const handleAddToCart = (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    addItem(product._id, 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Pet Marketplace</h1>
            <p className="text-gray-600 mt-1">Find the best products for your furry friend.</p>
          </div>

          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-grow md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <label htmlFor="marketplace-search" className="sr-only">Search products</label>
              <input
                id="marketplace-search"
                type="text"
                className="input-field pl-10"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn-outline flex items-center gap-2 bg-white">
              <Filter className="h-5 w-5" aria-hidden="true" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-medium transition-colors ${activeCategory === cat ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert alert-warning mb-8" role="alert">
            <p className="text-sm text-orange-700">Couldn't load products: {error.message}</p>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500 py-12">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No products match your search.</p>
        ) : (
        /* Product Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 group flex flex-col h-full animate-fade-in-up">
              <Link to={`/product/${product._id}`} className="relative h-64 overflow-hidden block">
                <img
                  src={optimizedImage(product.image, 600)}
                  alt={product.name}
                  loading="lazy"
                  onError={handleImageError}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-semibold text-gray-700">
                  {product.category}
                </div>
              </Link>

              <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-secondary text-secondary" aria-hidden="true" />
                  <span className="text-sm font-medium text-gray-700">{product.rating}</span>
                </div>

                <Link to={`/product/${product._id}`}>
                  <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>

                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">${formatPriceCents(product.priceCents)}</span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

      </div>
    </div>
  );
}
