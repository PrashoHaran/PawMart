import { Calendar, ShoppingBag, Heart, Settings, Activity } from 'lucide-react';

const SIDEBAR_LINKS = [
  { icon: Activity, label: 'Overview', current: true },
  { icon: Heart, label: 'My Pets' },
  { icon: Calendar, label: 'Appointments' },
  { icon: ShoppingBag, label: 'Order History' },
  { icon: Settings, label: 'Settings', spaced: true },
];

export default function UserDashboard() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-full bg-primary-light/20 flex items-center justify-center text-primary font-bold text-xl">
              JD
            </div>
            <div>
              <h2 className="font-heading font-semibold text-gray-900">John Doe</h2>
              <p className="text-sm text-gray-500">Pet Owner</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            {SIDEBAR_LINKS.map(({ icon: Icon, label, current, spaced }) => (
              <button
                key={label}
                type="button"
                aria-current={current ? 'page' : undefined}
                aria-disabled={!current}
                title={current ? undefined : 'Coming soon'}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${spaced ? 'mt-8' : ''} ${
                  current
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 cursor-not-allowed opacity-60'
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
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-8">Dashboard Overview</h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="glass-panel p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Total Pets</p>
                  <h3 className="text-3xl font-bold text-gray-900">2</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Heart className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="glass-panel p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Upcoming Appointments</p>
                  <h3 className="text-3xl font-bold text-gray-900">1</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                  <Calendar className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </div>
            <div className="glass-panel p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Recent Orders</p>
                  <h3 className="text-3xl font-bold text-gray-900">3</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <ShoppingBag className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* My Pets Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-semibold text-gray-900">My Pets</h2>
                <button type="button" aria-disabled="true" title="Coming soon" className="text-gray-400 cursor-not-allowed text-sm font-medium">Add New</button>
              </div>

              <div className="space-y-4">
                {/* Pet Card */}
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                  <img
                    src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                    alt="Bella"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900">Bella</h3>
                    <p className="text-sm text-gray-500">Golden Retriever • 3 yrs</p>
                  </div>
                  <div className="ml-auto">
                    <span className="badge badge-success">Healthy</span>
                  </div>
                </div>
                {/* Pet Card */}
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                  <img
                    src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                    alt="Luna"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900">Luna</h3>
                    <p className="text-sm text-gray-500">Siamese Cat • 2 yrs</p>
                  </div>
                  <div className="ml-auto">
                    <span className="badge badge-warning">Vaccine Due</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-heading font-semibold text-gray-900">Upcoming Schedule</h2>
                <button type="button" aria-disabled="true" title="Coming soon" className="text-gray-400 cursor-not-allowed text-sm font-medium">Book New</button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                  <div className="flex flex-col items-center justify-center min-w-[60px] bg-white rounded-lg shadow-sm p-2 text-primary font-bold">
                    <span className="text-xs uppercase text-gray-500 mb-1">Oct</span>
                    <span className="text-xl">15</span>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-gray-900">Annual Checkup - Luna</h4>
                    <p className="text-sm text-gray-500 mb-2">City Vet Clinic • 10:00 AM</p>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-info">Medical</span>
                      <span className="badge badge-neutral">Confirmed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
