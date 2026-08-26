import { PawPrint, Heart, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-dark text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <PawPrint className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="font-heading font-bold text-2xl text-white">
                Paw<span className="text-primary">Mart</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              A one-stop web marketplace for pet products & pet care services. Making pet parenting easier and more enjoyable.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary">
              Made with <Heart className="h-4 w-4 fill-current" aria-hidden="true" /> for pets
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-heading font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
              <li><Link to="/book-appointment" className="hover:text-primary transition-colors">Book Appointment</Link></li>
              <li><Link to="/assistant" className="hover:text-primary transition-colors">Smart Care Assistant</Link></li>
              <li><Link to="/vendor-dashboard" className="hover:text-primary transition-colors">Vendor Dashboard</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-heading font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="cursor-not-allowed opacity-60" title="Coming soon">FAQ</span></li>
              <li><span className="cursor-not-allowed opacity-60" title="Coming soon">Shipping Policy</span></li>
              <li><span className="cursor-not-allowed opacity-60" title="Coming soon">Return Policy</span></li>
              <li><span className="cursor-not-allowed opacity-60" title="Coming soon">Contact Us</span></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-heading font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <span>123 Pet Avenue, Colombo, Sri Lanka</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <span>+94 77 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
                <span>hello@pawmart.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} PawMart Project Team. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-gray-500 cursor-not-allowed" title="Coming soon">Terms</span>
            <span className="text-gray-500 cursor-not-allowed" title="Coming soon">Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
