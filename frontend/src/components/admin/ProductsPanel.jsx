import { useState } from 'react';
import { Eye, EyeOff, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { formatPriceCents } from '../../lib/format';
import { handleImageError, optimizedImage } from '../../lib/image';
import ProductForm from '../ProductForm';
import { EMPTY_PRODUCT_FORM } from '../productFormDefaults';
import Pager from './Pager';
import { errorText, usePagedList } from './usePagedList';

// Moderation for every product, plus full editing of PawMart's own
// ("house") products, which have no vendor to manage them.
export default function ProductsPanel() {
  const { token } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ search: '', owner: '', visibility: '' });
  const { items: products, page, pages, setPage, loading, error, reload } = usePagedList('/admin/products', filters);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  const run = async (fn) => {
    setActionError(null);
    try {
      await fn();
      await reload();
    } catch (err) {
      setActionError(errorText(err));
    }
  };

  const toggleHidden = (product) => {
    if (product.hidden) {
      run(() => apiRequest(`/admin/products/${product._id}/visibility`, { method: 'PATCH', token, body: { hidden: false } }));
      return;
    }
    const reason = window.prompt(`Hide "${product.name}" from customers?\n\nReason (shown to the vendor):`);
    if (reason?.trim()) {
      run(() => apiRequest(`/admin/products/${product._id}/visibility`, { method: 'PATCH', token, body: { hidden: true, reason } }));
    }
  };

  const remove = (product) => {
    if (window.confirm(`Delete "${product.name}" permanently?`)) {
      run(() => apiRequest(`/admin/products/${product._id}`, { method: 'DELETE', token }));
    }
  };

  const save = async (form) => {
    setSaving(true);
    const body = {
      name: form.name,
      priceCents: Number(form.priceCents),
      stock: Number(form.stock),
      category: form.category,
      image: form.image,
      description: form.description,
    };
    await run(async () => {
      if (editing === 'new') await apiRequest('/admin/products', { method: 'POST', token, body });
      else await apiRequest(`/admin/products/${editing._id}`, { method: 'PATCH', token, body });
      setEditing(null);
    });
    setSaving(false);
  };

  const setFilter = (key) => (e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <form
          className="flex flex-1 min-w-[220px] gap-2"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            setFilters((prev) => ({ ...prev, search: searchInput.trim() }));
          }}
        >
          <div className="relative flex-1">
            <label htmlFor="product-search" className="sr-only">Search products</label>
            <input id="product-search" type="search" className="input-field pl-10" placeholder="Product, vendor or category" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>
          <button type="submit" className="btn-outline">Search</button>
        </form>
        <label className="sr-only" htmlFor="product-owner-filter">Seller</label>
        <select id="product-owner-filter" className="input-field !w-auto" value={filters.owner} onChange={setFilter('owner')}>
          <option value="">All sellers</option>
          <option value="house">PawMart (house)</option>
          <option value="vendor">Vendors</option>
        </select>
        <label className="sr-only" htmlFor="product-visibility-filter">Visibility</label>
        <select id="product-visibility-filter" className="input-field !w-auto" value={filters.visibility} onChange={setFilter('visibility')}>
          <option value="">Any visibility</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
          <option value="low_stock">Low stock (≤ 5)</option>
        </select>
        <button type="button" onClick={() => setEditing('new')} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" aria-hidden="true" /> Add PawMart Product
        </button>
      </div>

      {(error || actionError) && <p className="text-sm text-red-600 mb-4" role="alert">{error || actionError}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-500">No products match.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Seller</th>
                <th className="py-3 pr-4">Price</th>
                <th className="py-3 pr-4">Stock</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product._id} className={product.hidden ? 'opacity-70' : undefined}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <img src={optimizedImage(product.image, 80)} alt="" loading="lazy" onError={handleImageError} className="w-10 h-10 rounded object-cover shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    {product.isHouseProduct ? 'PawMart' : product.vendorName}
                    {product.vendorSuspended && <span className="badge badge-danger ml-2 !py-0">Suspended</span>}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">${formatPriceCents(product.priceCents)}</td>
                  <td className={`py-3 pr-4 font-medium ${product.stock === 0 ? 'text-red-600' : product.stock <= 5 ? 'text-amber-600' : 'text-gray-600'}`}>{product.stock}</td>
                  <td className="py-3 pr-4">
                    {product.hidden ? (
                      <>
                        <span className="badge badge-danger">Hidden</span>
                        {product.hiddenReason && <p className="text-xs text-gray-500 mt-1">{product.hiddenReason}</p>}
                      </>
                    ) : (
                      <span className="badge badge-success">Visible</span>
                    )}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => toggleHidden(product)} className="p-2 text-gray-400 hover:text-primary" aria-label={`${product.hidden ? 'Show' : 'Hide'} ${product.name}`} title={product.hidden ? 'Show to customers' : 'Hide from customers'}>
                        {product.hidden ? <Eye className="h-4 w-4" aria-hidden="true" /> : <EyeOff className="h-4 w-4" aria-hidden="true" />}
                      </button>
                      {product.isHouseProduct && (
                        <>
                          <button type="button" onClick={() => setEditing(product)} className="p-2 text-gray-400 hover:text-primary" aria-label={`Edit ${product.name}`}>
                            <Edit2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => remove(product)} className="p-2 text-gray-400 hover:text-red-600" aria-label={`Delete ${product.name}`}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} pages={pages} setPage={setPage} />

      {editing && (
        <ProductForm
          initial={
            editing === 'new'
              ? { ...EMPTY_PRODUCT_FORM, editingId: null }
              : {
                  editingId: editing._id,
                  name: editing.name,
                  priceCents: editing.priceCents,
                  category: editing.category,
                  image: editing.image,
                  stock: editing.stock,
                  description: editing.description || '',
                }
          }
          saving={saving}
          onCancel={() => setEditing(null)}
          onSubmit={save}
        />
      )}
    </div>
  );
}
