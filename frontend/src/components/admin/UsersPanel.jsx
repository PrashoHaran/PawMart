import { useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import Pager from './Pager';
import { errorText, usePagedList } from './usePagedList';

const ROLE_LABELS = { customer: 'Customer', vendor: 'Vendor', admin: 'Admin' };
const BUSINESS_LABELS = { retail_vendor: 'Retail', service_provider: 'Service provider' };

export default function UsersPanel() {
  const { user: me, token } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });
  const { items: users, page, pages, setPage, loading, error, reload } = usePagedList('/admin/users', filters);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const act = async (user, path, body) => {
    setBusyId(user._id);
    setActionError(null);
    try {
      await apiRequest(`/admin/users/${user._id}/${path}`, { method: 'PATCH', token, body });
      await reload();
    } catch (err) {
      setActionError(errorText(err));
    } finally {
      setBusyId(null);
    }
  };

  const suspend = (user) => {
    const reason = window.prompt(`Suspend ${user.name}? They will be signed out and their listings hidden.\n\nReason:`);
    if (reason?.trim()) act(user, 'status', { status: 'suspended', reason });
  };

  const setFilter = (key) => (e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <form
        className="flex flex-wrap gap-3 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters((prev) => ({ ...prev, search: searchInput.trim() }));
        }}
        role="search"
      >
        <div className="relative flex-1 min-w-[200px]">
          <label htmlFor="user-search" className="sr-only">Search users</label>
          <input
            id="user-search"
            type="search"
            className="input-field pl-10"
            placeholder="Name, email or business"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
        </div>
        <label className="sr-only" htmlFor="user-role-filter">Role</label>
        <select id="user-role-filter" className="input-field !w-auto" value={filters.role} onChange={setFilter('role')}>
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <label className="sr-only" htmlFor="user-status-filter">Status</label>
        <select id="user-status-filter" className="input-field !w-auto" value={filters.status} onChange={setFilter('status')}>
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {(error || actionError) && <p className="text-sm text-red-600 mb-4" role="alert">{error || actionError}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-gray-500">No users match.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase text-gray-500">
                <th className="py-3 pr-4">User</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Joined</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const isMe = user._id === me._id;
                const suspended = user.status === 'suspended';
                return (
                  <tr key={user._id} className={suspended ? 'bg-red-50/40' : undefined}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{user.name}{isMe && <span className="text-gray-400"> (you)</span>}</p>
                      <p className="text-gray-500">{user.email}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="badge badge-neutral">{ROLE_LABELS[user.role]}</span>
                      {user.businessName && (
                        <p className="text-xs text-gray-500 mt-1">{user.businessName}{user.businessType && ` • ${BUSINESS_LABELS[user.businessType]}`}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 pr-4">
                      {suspended ? (
                        <>
                          <span className="badge badge-danger">Suspended</span>
                          {user.suspendReason && <p className="text-xs text-gray-500 mt-1">{user.suspendReason}</p>}
                        </>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      {!isMe && (
                        <div className="flex justify-end gap-2">
                          {user.role === 'customer' && (
                            <button type="button" disabled={busyId === user._id} onClick={() => window.confirm(`Make ${user.name} an admin?`) && act(user, 'role', { role: 'admin' })} className="btn-outline text-xs !px-3 !py-1.5">
                              Make admin
                            </button>
                          )}
                          {user.role === 'admin' && (
                            <button type="button" disabled={busyId === user._id} onClick={() => window.confirm(`Remove admin access from ${user.name}?`) && act(user, 'role', { role: 'customer' })} className="btn-outline text-xs !px-3 !py-1.5">
                              Remove admin
                            </button>
                          )}
                          {suspended ? (
                            <button type="button" disabled={busyId === user._id} onClick={() => act(user, 'status', { status: 'active' })} className="text-xs font-medium text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg">
                              Reactivate
                            </button>
                          ) : (
                            <button type="button" disabled={busyId === user._id} onClick={() => suspend(user)} className="text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg">
                              Suspend
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} pages={pages} setPage={setPage} />
    </div>
  );
}
