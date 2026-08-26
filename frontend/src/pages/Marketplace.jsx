import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Star, ShoppingCart } from 'lucide-react';

const DUMMY_PRODUCTS = [
  { id: 1, name: 'Premium Dog Food - Salmon & Sweet Potato', price: 45.99, rating: 4.8, category: 'Food', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 2, name: 'Interactive Cat Toy - Laser Pointer', price: 15.50, rating: 4.5, category: 'Toys', image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 3, name: 'Orthopedic Dog Bed - Large', price: 89.99, rating: 4.9, category: 'Accessories', image: 'https://images.unsplash.com/photo-1615266895738-11f1371cd7e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 4, name: 'Automatic Pet Water Fountain', price: 34.00, rating: 4.6, category: 'Accessories', image: 'https://images.unsplash.com/photo-1537151608804-ea6f254e4c29?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 5, name: 'Grain-Free Cat Food - Chicken Recipe', price: 28.50, rating: 4.7, category: 'Food', image: 'https://images.unsplash.com/photo-1574542385312-385038c823f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 6, name: 'Heavy Duty Dog Leash', price: 18.99, rating: 4.4, category: 'Accessories', image: 'https://images.unsplash.com/photo-1605335158652-3df798eec866?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
];

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');

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
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn-outline flex items-center gap-2 bg-white">
              <Filter className="h-5 w-5" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>
        </div>
        
        {/* Categories Bar */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {['All', 'Food', 'Toys', 'Accessories', 'Health', 'Grooming'].map((cat, idx) => (
            <button 
              key={idx}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-medium transition-colors ${idx === 0 ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {DUMMY_PRODUCTS.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full animate-fade-in-up">
              <Link to={`/product/${product.id}`} className="relative h-64 overflow-hidden block">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-md text-xs font-semibold text-gray-700">
                  {product.category}
                </div>
              </Link>
              
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center gap-1 mb-2">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="text-sm font-medium text-gray-700">{product.rating}</span>
                </div>
                
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                  <button className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
