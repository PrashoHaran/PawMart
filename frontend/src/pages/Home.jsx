import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Calendar, ShieldCheck, Stethoscope } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-light/10 via-white to-secondary-light/10 pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
                Welcome to PawMart
              </span>
              <h1 className="text-5xl md:text-6xl font-heading font-extrabold text-gray-900 leading-tight mb-6">
                Everything your pet needs, <span className="text-primary">in one place.</span>
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-xl">
                Shop premium products, book veterinary appointments, and get personalized care recommendations for your furry friends.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/marketplace" className="btn-primary flex items-center gap-2 text-lg px-8 py-3 rounded-xl">
                  Shop Now <ArrowRight className="h-5 w-5" />
                </Link>
                <Link to="/dashboard" className="btn-outline text-lg px-8 py-3 rounded-xl">
                  Book Services
                </Link>
              </div>
            </div>
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="absolute inset-0 bg-gradient-to-tr from-primary to-secondary rounded-full blur-3xl opacity-20 transform scale-110"></div>
              <img 
                src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Happy dogs" 
                className="relative z-10 rounded-3xl shadow-2xl object-cover h-[500px] w-full"
              />
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 glass-panel p-4 flex items-center gap-4 z-20 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="bg-green-100 p-3 rounded-full">
                  <ShieldCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Vet Approved</p>
                  <p className="text-xs text-gray-500">Premium Quality</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">Why Choose PawMart?</h2>
            <p className="text-gray-600">We bridge fragmented pet retail and professional service domains under an integrated responsive portal.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-300 text-primary">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">E-Commerce Marketplace</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse our dynamic product inventory for premium food, toys, and accessories. Fast checkout and order tracking.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-white transition-colors duration-300 text-secondary">
                <Calendar className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Appointment Booking</h3>
              <p className="text-gray-600 leading-relaxed">
                Schedule clinical visits and grooming services directly. Integrated health records and automated vaccine reminders.
              </p>
            </div>
            
            <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-shadow duration-300 group">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 text-blue-600">
                <Stethoscope className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Care Assistant</h3>
              <p className="text-gray-600 leading-relaxed">
                Rule-based guidance utility offering structured feeding strategies, breed-specific care, and product recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">Ready to give your pet the best?</h2>
          <p className="text-primary-light text-lg mb-8">Join thousands of happy pet parents on PawMart today.</p>
          <Link to="/login" className="bg-white text-primary hover:bg-gray-50 font-bold text-lg py-4 px-10 rounded-full shadow-lg transition-transform hover:scale-105 inline-block">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
