import { useState, useEffect } from 'react';
import { Store, CheckCircle, Clock, ShieldCheck, ArrowRight, UploadCloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Link, Navigate } from 'react-router-dom';

const BUSINESS_TYPES = [
  { value: 'retail_vendor', label: 'Retail Vendor (Sell Products)' },
  { value: 'service_provider', label: 'Service Provider (Vets, Grooming)' },
];

export default function VendorApplication() {
  const { user, token } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('retail_vendor');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (token) {
      apiRequest('/vendor-applications/me', { token })
        .then(({ data }) => setApplication(data))
        .catch(() => {}) // Ignore 404s
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If already an approved vendor, redirect to dashboard
  if (user.role === 'vendor') {
    return <Navigate to="/vendor-dashboard" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left Column: Benefits & Info */}
          <div className="lg:w-5/12 bg-gray-900 text-white p-10 lg:p-12 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent opacity-50 z-0"></div>
            
            <div className="relative z-10">
              <Store className="h-12 w-12 text-primary mb-6" />
              <h1 className="text-4xl font-heading font-bold mb-4">Partner with PawMart</h1>
              <p className="text-gray-400 text-lg mb-10">
                Join our growing marketplace and reach thousands of pet owners looking for premium products and trusted services.
              </p>
              
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="bg-white/10 p-3 rounded-xl h-fit">
                    <TrendingUpIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Grow Your Sales</h3>
                    <p className="text-gray-400 text-sm">Access a dedicated audience of pet lovers instantly.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="bg-white/10 p-3 rounded-xl h-fit">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Secure Platform</h3>
                    <p className="text-gray-400 text-sm">We handle the transactions securely so you can focus on your business.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="bg-white/10 p-3 rounded-xl h-fit">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Easy Management</h3>
                    <p className="text-gray-400 text-sm">Intuitive dashboard to manage inventory and track orders.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Application Form or Status */}
          <div className="lg:w-7/12 p-10 lg:p-12 flex flex-col justify-center bg-white">
            
            {application?.status === 'pending' ? (
              <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="h-10 w-10 text-orange-500" />
                </div>
                <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Application Under Review</h2>
                <p className="text-gray-600 mb-8 text-lg">
                  Thank you for applying to sell on PawMart! Your application for <strong>{application.businessName}</strong> is currently being reviewed by our administrative team. We will notify you once a decision is made.
                </p>
                <Link to="/dashboard" className="btn-primary py-3 px-8 text-lg inline-flex items-center gap-2">
                  Return to Profile
                </Link>
              </div>
            ) : (
              <div className="max-w-md mx-auto w-full">
                <h2 className="text-3xl font-heading font-bold text-gray-900 mb-2">Submit Application</h2>
                <p className="text-gray-500 mb-8">Fill out the details below to start selling on PawMart.</p>
                
                {application?.status === 'rejected' && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-8">
                    <p className="text-sm text-red-700 font-medium">
                      Your previous application was rejected{application.rejectionReason ? `: ${application.rejectionReason}` : '.'} You are welcome to re-apply.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                    {error.message}
                  </div>
                )}

                <form onSubmit={submitApplication} className="space-y-6">
                  <div>
                    <label htmlFor="business-name" className="block text-sm font-bold text-gray-700 mb-2">Registered Business Name</label>
                    <input
                      id="business-name"
                      type="text"
                      required
                      placeholder="e.g. City Groomers LLC"
                      className="input-field py-3"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="business-type" className="block text-sm font-bold text-gray-700 mb-2">Business Category</label>
                    <select
                      id="business-type"
                      className="input-field py-3"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                    >
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Business Documentation</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                      <UploadCloud className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-700 mb-1">Upload business registration</p>
                      <p className="text-xs text-gray-500">PDF, JPG, or PNG (Max 5MB)</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">* This is a simulated upload for the MVP.</p>
                  </div>

                  <button type="submit" disabled={applying} className="btn-primary w-full py-4 text-lg mt-4 flex items-center justify-center gap-2">
                    {applying ? 'Submitting...' : 'Submit Application'} <ArrowRight className="h-5 w-5" />
                  </button>
                </form>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendingUpIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
