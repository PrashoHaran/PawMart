import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';

const STATUS_BADGE = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger' };
const TYPE_LABELS = { service_provider: 'Service Provider', retail_vendor: 'Retail Vendor' };

// Vendor applications with history. `compact` shows only pending ones (used
// on the overview).
export default function ApplicationsPanel({ compact = false, onChanged }) {
  const { token } = useAuth();
  const [status, setStatus] = useState(compact ? 'pending' : '');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(
    () =>
      apiRequest(`/admin/vendor-applications${status ? `?status=${status}` : ''}`, { token })
        .then(({ data }) => setApplications(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [status, token]
  );

  useEffect(() => {
    load();
  }, [load]);

  const review = async (app, action) => {
    setError(null);
    try {
      await apiRequest(`/vendor-applications/${app._id}/${action}`, { method: 'POST', token });
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3 justify-between items-center">
        <h2 className="font-heading font-semibold text-lg text-gray-900">{compact ? 'Pending Vendor Approvals' : 'Applications'}</h2>
        {compact ? (
          <span className="badge bg-secondary text-white">{applications.length} Pending</span>
        ) : (
          <div className="flex gap-2" role="group" aria-label="Filter applications">
            {[['', 'All'], ['pending', 'Pending'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([value, label]) => (
              <button key={label} type="button" onClick={() => setStatus(value)} aria-pressed={status === value} className={`btn-toggle !py-1.5 ${status === value ? 'btn-toggle-active' : ''}`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="px-6 pt-4 text-sm text-red-600" role="alert">{error}</p>}
      {loading ? (
        <p className="p-6 text-center text-gray-500">Loading...</p>
      ) : applications.length === 0 ? (
        <p className="p-6 text-center text-gray-500">No {status || ''} applications.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {applications.map((app) => (
            <li key={app._id} className="p-6 flex flex-wrap gap-4 items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900">{app.businessName}</h3>
                  {!compact && <span className={`badge ${STATUS_BADGE[app.status]} capitalize`}>{app.status}</span>}
                </div>
                <p className="text-sm text-gray-500">
                  {TYPE_LABELS[app.businessType]} • {app.userId?.name} ({app.userId?.email})
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Applied {new Date(app.createdAt).toLocaleDateString()}
                  {app.reviewedAt && ` • ${app.status} ${new Date(app.reviewedAt).toLocaleDateString()}${app.reviewedBy?.name ? ` by ${app.reviewedBy.name}` : ''}`}
                </p>
              </div>
              {app.status === 'pending' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => review(app, 'approve')} className="px-3 py-1 bg-green-100 text-green-700 rounded font-medium text-sm hover:bg-green-200 transition-colors">
                    Approve
                  </button>
                  <button type="button" onClick={() => review(app, 'reject')} className="px-3 py-1 bg-red-100 text-red-700 rounded font-medium text-sm hover:bg-red-200 transition-colors">
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
