import { useState } from 'react';
import { Package, TrendingUp, DollarSign, Users, Plus, Edit2, Trash2 } from 'lucide-react';

const SIDEBAR_LINKS = [
  { icon: TrendingUp, label: 'Dashboard', current: true },
  { icon: Package, label: 'Products' },
  { icon: DollarSign, label: 'Orders' },
  { icon: Users, label: 'Customers' },
];

const INITIAL_PRODUCTS = [
  { id: 1, name: 'Premium Dog Food', category: 'Food', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80', price: 45.99, stock: 124 },
  { id: 2, name: 'Interactive Cat Toy', category: 'Toys', image: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80', price: 15.50, stock: 45 },
];

export default function VendorDashboard() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-dark text-white hidden md:block">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="font-heading font-bold text-xl tracking-wide text-white">Vendor Portal</h2>
            <p className="text-sm text-gray-400">HealthyPaws Co.</p>
          </div>
          
          <nav className="space-y-2">
            {SIDEBAR_LINKS.map(({ icon: Icon, label, current }) => (
              <button
                key={label}
                type="button"
                aria-current={current ? 'page' : undefined}
                aria-disabled={!current}
                title={current ? undefined : 'Coming soon'}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  current
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 cursor-not-allowed'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" /> {label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900">Overview</h1>
            <button type="button" disabled aria-disabled="true" title="Coming soon" className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="h-4 w-4" aria-hidden="true" /> Add Product
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Total Sales</p>
                  <h3 className="text-2xl font-bold text-gray-900">$12,450</h3>
                </div>
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <DollarSign className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
                <TrendingUp className="h-4 w-4 mr-1" aria-hidden="true" /> +14.5% this month
              </div>
            </div>

            <div className="stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Orders</p>
                  <h3 className="text-2xl font-bold text-gray-900">156</h3>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Package className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Active Products</p>
                  <h3 className="text-2xl font-bold text-gray-900">{products.length}</h3>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Package className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Total Views</p>
                  <h3 className="text-2xl font-bold text-gray-900">4,289</h3>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                  <Users className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Products Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-heading font-semibold text-lg text-gray-900">Product Inventory</h2>
              <button type="button" aria-disabled="true" title="Coming soon" className="text-gray-400 cursor-not-allowed text-sm font-medium">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold bg-gray-50">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No products yet.</td>
                    </tr>
                  ) : products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.name} className="w-10 h-10 rounded object-cover" />
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">${product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-600">{product.stock}</td>
                      <td className="px-6 py-4">
                        <span className="badge badge-success">Active</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            aria-disabled="true"
                            title="Coming soon"
                            className="p-1 text-gray-300 cursor-not-allowed"
                          >
                            <Edit2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => setProducts((prev) => prev.filter((p) => p.id !== product.id))}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
