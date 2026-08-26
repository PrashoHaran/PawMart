import { Users, AlertTriangle, ShieldCheck, Database, Settings, Store, Activity, PieChart } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-white hidden md:block">
        <div className="p-6">
          <div className="mb-8 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <h2 className="font-heading font-bold text-xl text-white">Admin Hub</h2>
              <p className="text-xs text-gray-400">System Overview</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 bg-white/10 text-white rounded-xl font-medium transition-colors">
              <Activity className="h-5 w-5" /> Platform Health
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors">
              <Users className="h-5 w-5" /> Manage Users
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors">
              <Store className="h-5 w-5" /> Vendor Verification
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors">
              <PieChart className="h-5 w-5" /> Analytics Reports
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl font-medium transition-colors mt-8">
              <Settings className="h-5 w-5" /> Global Settings
            </a>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-gray-900">Platform Overview</h1>
            <div className="flex gap-4">
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" /> Systems Operational
              </span>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-primary">
              <p className="text-gray-500 font-medium mb-1">Total Active Users</p>
              <h3 className="text-3xl font-bold text-gray-900">12,450</h3>
              <p className="text-sm text-green-600 mt-2 font-medium">+12% from last month</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-secondary">
              <p className="text-gray-500 font-medium mb-1">Registered Vendors</p>
              <h3 className="text-3xl font-bold text-gray-900">84</h3>
              <p className="text-sm text-green-600 mt-2 font-medium">+3 new applications</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
              <p className="text-gray-500 font-medium mb-1">Appointments Booked</p>
              <h3 className="text-3xl font-bold text-gray-900">342</h3>
              <p className="text-sm text-gray-500 mt-2 font-medium">This month</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
              <p className="text-gray-500 font-medium mb-1">Reported Issues</p>
              <h3 className="text-3xl font-bold text-gray-900">2</h3>
              <p className="text-sm text-red-500 mt-2 font-medium">Needs attention</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vendor Applications */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="font-heading font-semibold text-lg text-gray-900">Pending Vendor Approvals</h2>
                <span className="bg-secondary text-white text-xs font-bold px-2 py-1 rounded-full">3 Pending</span>
              </div>
              <div className="p-0">
                <ul className="divide-y divide-gray-100">
                  <li className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">City Groomers LLC</h4>
                      <p className="text-sm text-gray-500">Service Provider • Submitted 2 hours ago</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-100 text-green-700 rounded font-medium text-sm hover:bg-green-200 transition-colors">Approve</button>
                      <button className="px-3 py-1 bg-red-100 text-red-700 rounded font-medium text-sm hover:bg-red-200 transition-colors">Reject</button>
                    </div>
                  </li>
                  <li className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">Premium Pet Supplies</h4>
                      <p className="text-sm text-gray-500">Retail Vendor • Submitted 1 day ago</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-green-100 text-green-700 rounded font-medium text-sm hover:bg-green-200 transition-colors">Approve</button>
                      <button className="px-3 py-1 bg-red-100 text-red-700 rounded font-medium text-sm hover:bg-red-200 transition-colors">Reject</button>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
                <h2 className="font-heading font-semibold text-lg text-gray-900">System Alerts</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-4 p-4 rounded-xl border border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-6 w-6 text-orange-500 shrink-0" />
                  <div>
                    <h4 className="font-bold text-orange-800">High API Latency</h4>
                    <p className="text-sm text-orange-700 mt-1">Payment Simulation module is experiencing higher than normal response times (Avg: 800ms).</p>
                    <button className="mt-2 text-xs font-bold text-orange-800 underline">View Logs</button>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-xl border border-gray-200 bg-white">
                  <Activity className="h-6 w-6 text-gray-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-gray-900">Database Backup Completed</h4>
                    <p className="text-sm text-gray-500 mt-1">Automated MongoDB Atlas snapshot was created successfully at 03:00 AM UTC.</p>
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
