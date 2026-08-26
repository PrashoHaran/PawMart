import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, PawPrint } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <PawPrint className="h-8 w-8 text-primary" />
              <span className="font-heading font-bold text-2xl text-gray-900">
                Paw<span className="text-primary">Mart</span>
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-6 lg:space-x-8 items-center">
            <Link to="/marketplace" className="text-gray-600 hover:text-primary font-medium transition-colors text-sm lg:text-base">Marketplace</Link>
            <Link to="/assistant" className="text-gray-600 hover:text-primary font-medium transition-colors text-sm lg:text-base">Smart Assistant</Link>
            <Link to="/book-appointment" className="text-gray-600 hover:text-primary font-medium transition-colors text-sm lg:text-base">Book Appointment</Link>
            <Link to="/dashboard" className="text-gray-600 hover:text-primary font-medium transition-colors text-sm lg:text-base">Profile</Link>
            <Link to="/admin-dashboard" className="text-gray-600 hover:text-primary font-medium transition-colors text-sm lg:text-base">Admin</Link>
            
            <div className="flex items-center space-x-4 border-l pl-4 lg:pl-6 border-gray-200">
              <Link to="/cart" className="text-gray-500 hover:text-primary transition-colors relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">2</span>
              </Link>
              <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
                <User className="h-5 w-5" />
                <span className="font-medium">Sign In</span>
              </Link>
            </div>
          </div>
          
          <div className="flex items-center md:hidden">
            <button className="text-gray-500 hover:text-gray-900">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
