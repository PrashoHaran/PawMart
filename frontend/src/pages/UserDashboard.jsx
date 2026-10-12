import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Calendar, ShoppingBag, Heart, Settings, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import PetsTab, { PetCard } from '../components/dashboard/PetsTab';
import AppointmentsTab, { AppointmentItem } from '../components/dashboard/AppointmentsTab';
import OrdersTab from '../components/dashboard/OrdersTab';
import { isUpcoming } from '../components/dashboard/status';

const TABS = [
  { id: 'overview', icon: Activity, label: 'Overview' },
  { id: 'pets', icon: Heart, label: 'My Pets' },
  { id: 'appointments', icon: Calendar, label: 'Appointments' },
  { id: 'orders', icon: ShoppingBag, label: 'Order History' },
];

const ROLE_LABELS = { customer: 'Pet Owner', vendor: 'Vendor', admin: 'Administrator' };

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function StatCard({ label, value, icon: Icon, iconClass, onClick }) {
  return (
    <button type="button" onClick={onClick} className="glass-panel p-6 text-left hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${iconClass}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
    </button>
  );
}

function OverviewTab({ pets, appointments, orders, goTo, onSelectPet }) {
  const upcoming = appointments
    .filter(isUpcoming)
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  const needsAttention = pets.filter((p) => ['overdue', 'due_soon'].includes(p.vaccineSummary.status));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard label="Total Pets" value={pets.length} icon={Heart} iconClass="bg-primary/10 text-primary" onClick={() => goTo('pets')} />
        <StatCard label="Upcoming Appointments" value={upcoming.length} icon={Calendar} iconClass="bg-secondary/10 text-secondary" onClick={() => goTo('appointments')} />
        <StatCard label="Orders" value={orders.length} icon={ShoppingBag} iconClass="bg-blue-100 text-blue-600" onClick={() => goTo('orders')} />
      </div>

      {needsAttention.length > 0 && (
        <div className="alert alert-warning mb-8" role="status">
          <p className="text-sm text-orange-700">
            {needsAttention.map((p) => p.name).join(', ')}{' '}
            {needsAttention.length === 1 ? 'has' : 'have'} vaccinations overdue or due within 30 days.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-semibold text-gray-900">My Pets</h2>
            <button type="button" onClick={() => goTo('pets')} className="text-primary hover:text-primary-dark text-sm font-semibold">
              {pets.length ? 'View All' : 'Add New'}
            </button>
          </div>
          {pets.length === 0 ? (
            <p className="text-gray-500 text-sm">No pets added yet.</p>
          ) : (
            <div className="space-y-4">
              {pets.slice(0, 3).map((pet) => (
                <PetCard key={pet._id} pet={pet} onSelect={onSelectPet} />
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-semibold text-gray-900">Upcoming Schedule</h2>
            <Link to="/book-appointment" className="text-primary hover:text-primary-dark text-sm font-semibold">Book New</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-gray-500 text-sm">No upcoming appointments.</p>
          ) : (
            <ul className="space-y-4">
              {upcoming.slice(0, 3).map((a) => (
                <AppointmentItem key={a._id} appointment={a} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export default function UserDashboard() {
  const { user, token, restoring } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'overview';
  const selectedPetId = searchParams.get('pet');

  const [pets, setPets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPets = useCallback(() => apiRequest('/pets', { token }).then(({ data }) => setPets(data)), [token]);
  const loadAppointments = useCallback(
    () => apiRequest('/appointments', { token }).then(({ data }) => setAppointments(data)),
    [token]
  );

  useEffect(() => {
    if (!token) return;
    Promise.all([loadPets(), loadAppointments(), apiRequest('/orders', { token }).then(({ data }) => setOrders(data))])
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [token, loadPets, loadAppointments]);

  const goTo = (tab, params = {}) => setSearchParams(tab === 'overview' ? {} : { tab, ...params });
  const selectPet = (petId) => goTo('pets', petId ? { pet: petId } : {});

  if (restoring) {
    return <p className="text-center text-gray-500 py-24">Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const activeLabel = TABS.find((t) => t.id === activeTab).label;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-full bg-primary-light/20 flex items-center justify-center text-primary font-bold text-xl">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <h2 className="font-heading font-semibold text-gray-900 truncate">{user.name}</h2>
              <p className="text-sm text-gray-500">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>

          <nav className="space-y-2" aria-label="Dashboard">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === id ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" /> {label}
              </button>
            ))}
            <button
              type="button"
              aria-disabled="true"
              title="Coming soon"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium mt-8 text-gray-600 cursor-not-allowed opacity-60"
            >
              <Settings className="h-5 w-5" aria-hidden="true" /> Settings
            </button>
          </nav>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <nav className="md:hidden flex overflow-x-auto gap-2 px-4 py-3 bg-white border-b border-gray-200" aria-label="Dashboard">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => goTo(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`btn-toggle whitespace-nowrap ${activeTab === id ? 'btn-toggle-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">
            {activeTab === 'overview' ? 'Dashboard Overview' : activeLabel}
          </h1>

          {error ? (
            <div className="alert alert-warning" role="alert">
              <p className="text-sm text-orange-700">Couldn&apos;t load your dashboard: {error.message}</p>
            </div>
          ) : loading ? (
            <p className="text-gray-500">Loading your dashboard...</p>
          ) : activeTab === 'pets' ? (
            <PetsTab pets={pets} selectedPetId={selectedPetId} onSelectPet={selectPet} onPetsChanged={loadPets} />
          ) : activeTab === 'appointments' ? (
            <AppointmentsTab appointments={appointments} onAppointmentsChanged={loadAppointments} />
          ) : activeTab === 'orders' ? (
            <OrdersTab orders={orders} />
          ) : (
            <OverviewTab pets={pets} appointments={appointments} orders={orders} goTo={goTo} onSelectPet={selectPet} />
          )}
        </div>
      </main>
    </div>
  );
}
