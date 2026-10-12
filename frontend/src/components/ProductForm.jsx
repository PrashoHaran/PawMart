import { useState } from 'react';
import { X } from 'lucide-react';
import ImageUploadField from './ImageUploadField';

// Add/edit product modal shared by the vendor dashboard and the admin
// catalogue (PawMart's own products).
export default function ProductForm({ initial, onCancel, onSubmit, saving }) {
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);

  const updateField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">{initial.editingId ? 'Edit Product' : 'Add Product'}</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-3"
        >
          <input required placeholder="Product name" className="input-field" value={form.name} onChange={updateField('name')} />
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" min="0" placeholder="Price (cents)" className="input-field" value={form.priceCents} onChange={updateField('priceCents')} />
            <input required type="number" min="0" placeholder="Stock" className="input-field" value={form.stock} onChange={updateField('stock')} />
          </div>
          <input required placeholder="Category" className="input-field" value={form.category} onChange={updateField('category')} />
          <ImageUploadField
            label="Product image"
            purpose="product"
            required
            value={form.image}
            onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
            onUploadingChange={setUploading}
          />
          <textarea placeholder="Description (optional)" className="input-field min-h-[80px]" value={form.description} onChange={updateField('description')} />
          <button type="submit" disabled={saving || uploading} className="btn-primary w-full disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </form>
      </div>
    </div>
  );
}
