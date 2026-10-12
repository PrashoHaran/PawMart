import { useEffect, useState } from 'react';
import { Package, TrendingUp, DollarSign, Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { optimizedImage } from '../lib/image';
import ProductForm from '../components/ProductForm';
import { EMPTY_PRODUCT_FORM } from '../components/productFormDefaults';
import ManageOrdersPanel from '../components/orders/ManageOrdersPanel';
import ProviderDashboard from '../components/provider/ProviderDashboard';
import { formatPriceCents } from '../lib/format';

// `id` links switch the main view; links without one aren't built yet.
const SIDEBAR_LINKS = [
  { icon: TrendingUp, label: 'Dashboard & Products', id: 'dashboard' },
  { icon: DollarSign, label: 'Orders', id: 'orders' },
  { icon: Users, label: 'Customers' },
];

const BUSINESS_TYPES = [
  { value: 'retail_vendor', label: 'Retail Vendor' },
  { value: 'service_provider', label: 'Service Provider' },
];


function ApplicationGate({ token }) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('retail_vendor');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    apiRequest('/vendor-applications/me', { token })
      .then(({ data }) => setApplication(data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [token]);

  const submitApplication = async (e) => {
    e.preventDefault();
    setApplying(true);
    setError(null);
    try {
      const { data } = await apiRequest('/vendor-applications', {
        method: 'POST',
        token,
        body: { businessName, businessType },
      });
      setApplication(data);
    } catch (err) {
      setError(err);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500 py-12">Loading...</p>;
  }

  if (application?.status === 'pending') {
    return (
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <span className="badge badge-warning mb-4">Pending Review</span>
        <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Application Submitted</h1>
        <p className="text-gray-600">
          Your application for <strong>{application.businessName}</strong> is awaiting admin approval.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-100 p-8">
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">Become a Vendor</h1>
      <p className="text-gray-600 mb-6">Apply to sell products on PawMart. An admin will review your application.</p>

      {application?.status === 'rejected' && (
        <div className="alert alert-warning mb-6" role="alert">
          <p className="text-sm text-orange-700">
            Your previous application was rejected{application.rejectionReason ? `: ${application.rejectionReason}` : '.'} You can apply again below.
          </p>
        </div>
      )}

      {error && (
        <div className="alert alert-warning mb-6" role="alert">
          <p className="text-sm text-orange-700">{error.message}</p>
        </div>
      )}

      <form onSubmit={submitApplication} className="space-y-4">
        <div>
          <label htmlFor="business-name" className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input
            id="business-name"
            type="text"
            required
            className="input-field"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="business-type" className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
          <select
            id="business-type"
            className="input-field"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={applying} className="btn-primary w-full disabled:opacity-50">
          {applying ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}

export default function VendorDashboard() {
  const { user, token } = useAuth();
  const isVendor = user?.role === 'vendor';
  const isProvider = isVendor && user.businessType === 'service_provider';

  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('dashboard');

  const refreshVendorData = () => {
    setLoading(true);
    Promise.all([apiRequest('/vendor/products', { token }), apiRequest('/vendor/stats', { token })])
      .then(([p, s]) => {
        setProducts(p.data);
        setStats(s.data);
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isVendor || isProvider) return;
    refreshVendorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVendor, isProvider]);

  const submitProductForm = async (form) => {
    setSaving(true);
    setError(null);
    const body = {
      name: form.name,
      priceCents: Number(form.priceCents),
      stock: Number(form.stock),
      category: form.category,
      image: form.image,
      description: form.description,
    };
    try {
      if (editingProduct) {
        await apiRequest(`/vendor/products/${editingProduct._id}`, { method: 'PATCH', token, body });
      } else {
        await apiRequest('/vendor/products', { method: 'POST', token, body });
      }
      setShowForm(false);
      setEditingProduct(null);
      refreshVendorData();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    try {
      await apiRequest(`/vendor/products/${product._id}`, { method: 'DELETE', token });
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      setError(err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-6">
        <p className="text-gray-600">Please log in to access the Vendor Portal.</p>
      </div>
    );
  }

  if (!isVendor) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12 px-6">
        <ApplicationGate token={token} />
      </div>
    );
  }

  if (isProvider) {
    return <ProviderDashboard />;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row">

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-dark text-white hidden md:block">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="font-heading font-bold text-xl tracking-wide text-white">Vendor Portal</h2>
            <p className="text-sm text-gray-400">{user.businessName}</p>
          </div>

          <nav className="space-y-2">
            {SIDEBAR_LINKS.map(({ icon: Icon, label, id }) => (
              <button
                key={label}
                type="button"
                onClick={id ? () => setView(id) : undefined}
                aria-current={view === id ? 'page' : undefined}
                aria-disabled={!id}
                title={id ? undefined : 'Coming soon'}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  view === id
                    ? 'bg-white/10 text-white'
                    : id
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-400 hover:bg-white/5 cursor-not-allowed opacity-60'
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
          {/* Mobile view switcher (sidebar is hidden on small screens) */}
          <div className="md:hidden flex gap-2 mb-6">
            {SIDEBAR_LINKS.filter((l) => l.id).map(({ label, id }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-current={view === id ? 'page' : undefined}
                className={`btn-toggle ${view === id ? 'btn-toggle-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>

          {view === 'orders' ? (
            <>
              <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">Orders</h1>
              <ManageOrdersPanel mode="vendor" onChanged={refreshVendorData} />
            </>
          ) : (
          <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900">Overview</h1>
            <button
              type="button"
              onClick={() => { setEditingProduct(null); setShowForm(true); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add Product
            </button>
          </div>

          {error && (
            <div className="alert alert-warning mb-8" role="alert">
              <p className="text-sm text-orange-700">{error.message}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Total Sales</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    ${stats ? formatPriceCents(stats.totalSalesCents) : '0.00'}
                  </h3>
                </div>
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <DollarSign className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Orders</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stats?.orderCount ?? 0}</h3>
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
                  <h3 className="text-2xl font-bold text-gray-900">{stats?.activeProductCount ?? products.length}</h3>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Package className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>

          {/* Product Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-heading font-semibold text-lg text-gray-900">Product Inventory</h2>
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
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                  ) : products.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No products yet.</td></tr>
                  ) : products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={optimizedImage(product.image, 80)} alt={product.name} loading="lazy" className="w-10 h-10 rounded object-cover" />
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">${formatPriceCents(product.priceCents)}</td>
                      <td className="px-6 py-4 text-gray-600">{product.stock}</td>
                      <td className="px-6 py-4">
                        {product.hidden ? (
                          <span className="badge badge-danger" title={product.hiddenReason}>Hidden by admin</span>
                        ) : product.stock === 0 ? (
                          <span className="badge badge-warning">Out of stock</span>
                        ) : (
                          <span className="badge badge-success">Active</span>
                        )}
                        {product.hidden && product.hiddenReason && (
                          <p className="text-xs text-gray-500 mt-1">{product.hiddenReason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => { setEditingProduct(product); setShowForm(true); }}
                            className="p-1 text-gray-400 hover:text-primary transition-colors"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product)}
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
          </>
          )}

        </div>
      </main>

      {showForm && (
        <ProductForm
          initial={
            editingProduct
              ? {
                  editingId: editingProduct._id,
                  name: editingProduct.name,
                  priceCents: editingProduct.priceCents,
                  category: editingProduct.category,
                  image: editingProduct.image,
                  stock: editingProduct.stock,
                  description: editingProduct.description || '',
                }
              : { ...EMPTY_PRODUCT_FORM, editingId: null }
          }
          saving={saving}
          onCancel={() => { setShowForm(false); setEditingProduct(null); }}
          onSubmit={submitProductForm}
        />
      )}
    </div>
  );
}
