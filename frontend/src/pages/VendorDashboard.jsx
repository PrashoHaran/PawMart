import { Package, TrendingUp, DollarSign, Users, Plus, Edit2, Trash2 } from 'lucide-react';

export default function VendorDashboard() {
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
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-white/10 text-white rounded-xl font-medium transition-colors">
              <TrendingUp className="h-5 w-5" /> Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors">
              <Package className="h-5 w-5" /> Products
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors">
              <DollarSign className="h-5 w-5" /> Orders
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors">
              <Users className="h-5 w-5" /> Customers
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900">Overview</h1>
            <button className="btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </button>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Total Sales</p>
                  <h3 className="text-2xl font-bold text-gray-900">$12,450</h3>
                </div>
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
                <TrendingUp className="h-4 w-4 mr-1" /> +14.5% this month
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Orders</p>
                  <h3 className="text-2xl font-bold text-gray-900">156</h3>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Active Products</p>
                  <h3 className="text-2xl font-bold text-gray-900">24</h3>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Total Views</p>
                  <h3 className="text-2xl font-bold text-gray-900">4,289</h3>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Products Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-heading font-semibold text-lg text-gray-900">Product Inventory</h2>
              <a href="#" className="text-primary hover:text-primary-dark text-sm font-medium">View All</a>
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
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src="https://images.unsplash.com/photo-1589924691995-400dc9ecc119?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Dog Food" className="w-10 h-10 rounded object-cover" />
                        <div>
                          <p className="font-medium text-gray-900">Premium Dog Food</p>
                          <p className="text-xs text-gray-500">Food</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">$45.99</td>
                    <td className="px-6 py-4 text-gray-600">124</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Active</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="h-4 w-4" /></button>
                        <button className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src="https://images.unsplash.com/photo-1545249390-6bdfa286032f?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Cat Toy" className="w-10 h-10 rounded object-cover" />
                        <div>
                          <p className="font-medium text-gray-900">Interactive Cat Toy</p>
                          <p className="text-xs text-gray-500">Toys</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">$15.50</td>
                    <td className="px-6 py-4 text-gray-600">45</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Active</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="h-4 w-4" /></button>
                        <button className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
