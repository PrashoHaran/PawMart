import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, PawPrint } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/assistant', label: 'Smart Assistant' },
  { to: '/book-appointment', label: 'Book Appointment' },
  { to: '/dashboard', label: 'Profile' },
  { to: '/vendor-dashboard', label: 'Vendor Portal', role: 'vendor' },
  { to: '/admin-dashboard', label: 'Admin', role: 'admin' },
];

export default function Navbar() {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <PawPrint className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="font-heading font-bold text-2xl text-gray-900">
                Paw<span className="text-primary">Mart</span>
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-6 lg:space-x-8 items-center">
            {NAV_LINKS.filter((link) => !link.role || link.role === user?.role).map((link) => (
              <Link key={link.to} to={link.to} className="text-gray-600 hover:text-primary font-medium transition-colors text-sm lg:text-base">
                {link.label}
              </Link>
            ))}

            <div className="flex items-center space-x-4 border-l pl-4 lg:pl-6 border-gray-200">
              <Link to="/cart" className="text-gray-500 hover:text-primary transition-colors relative" aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}>
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 text-gray-700 font-medium">
                    <User className="h-5 w-5" aria-hidden="true" />
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-gray-500 hover:text-primary transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors">
                  <User className="h-5 w-5" aria-hidden="true" />
                  <span className="font-medium">Sign In</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 md:hidden">
            <Link to="/cart" className="text-gray-500 hover:text-primary transition-colors relative" aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}>
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="text-gray-500 hover:text-gray-900"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            {NAV_LINKS.filter((link) => !link.role || link.role === user?.role).map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-2 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-2 px-2 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" /> Sign out ({user.name})
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-2 py-2 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                <User className="h-5 w-5" aria-hidden="true" /> Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
