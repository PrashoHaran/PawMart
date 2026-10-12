import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUploadConfig, uploadImage } from '../lib/upload';
import { handleImageError, optimizedImage } from '../lib/image';

// Image picker that uploads to Cloudinary when the server supports it, and
// falls back to a plain image-URL input otherwise.
export default function ImageUploadField({ label, value, onChange, purpose, required = false, onUploadingChange }) {
  const { token } = useAuth();
  const id = useId();
  const fileInput = useRef(null);
  const [config, setConfig] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getUploadConfig(token)
      .then((data) => active && setConfig(data))
      .catch(() => active && setConfig({ enabled: false }));
    return () => {
      active = false;
    };
  }, [token]);

  const setBusy = (busy) => {
    setUploading(busy);
    onUploadingChange?.(busy);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!config.allowedFormats.includes(extension)) {
      setError(`Please choose a ${config.allowedFormats.join(', ').toUpperCase()} image.`);
      return;
    }
    if (file.size > config.maxBytes) {
      setError(`Image must be ${Math.round(config.maxBytes / 1024 / 1024)} MB or smaller.`);
      return;
    }

    setBusy(true);
    try {
      onChange(await uploadImage(file, purpose, token));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!config) {
    return <p className="text-sm text-gray-400">Loading image options...</p>;
  }

  if (!config.enabled) {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input id={id} type="url" required={required} placeholder="https://..." className="input-field" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-1" id={`${id}-label`}>{label}</span>
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative shrink-0">
            <img src={optimizedImage(value, 160)} alt="" onError={handleImageError} className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
            {!required && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute -top-2 -right-2 bg-white border border-gray-200 rounded-full p-1 text-gray-500 hover:text-red-600 shadow-sm"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 shrink-0" aria-hidden="true">
            <ImagePlus className="h-6 w-6" />
          </div>
        )}
        <div>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            aria-describedby={`${id}-label`}
            className="btn-outline text-sm disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : value ? 'Change image' : 'Upload image'}
          </button>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP, up to {Math.round(config.maxBytes / 1024 / 1024)} MB</p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={config.allowedFormats.map((f) => `.${f}`).join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleFile}
        />
      </div>
      {/* Keeps native "required" validation working for the hidden file flow. */}
      {required && (
        <input tabIndex={-1} aria-hidden="true" className="sr-only" required value={value} onChange={() => {}} />
      )}
      {error && <p className="text-sm text-red-600 mt-2" role="alert">{error}</p>}
    </div>
  );
}
