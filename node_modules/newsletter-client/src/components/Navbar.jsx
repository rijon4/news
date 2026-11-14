import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-brand-600 font-bold">✉</span>
            <span className="font-bold text-xl tracking-tight">Newsletter</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-600 hover:text-brand-600 transition"
            >
              Dashboard
            </Link>
            <Link
              to="/newsletters"
              className="text-sm font-medium text-gray-600 hover:text-brand-600 transition"
            >
              Newsletters
            </Link>
            <Link
              to="/subscribers"
              className="text-sm font-medium text-gray-600 hover:text-brand-600 transition"
            >
              Subscribers
            </Link>
            <Link
              to="/campaigns"
              className="text-sm font-medium text-gray-600 hover:text-brand-600 transition"
            >
              Campaigns
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.name || user.email}</span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-brand-600">
                  Sign in
                </Link>
                <Link to="/register" className="px-4 py-1.5 text-sm font-medium text-white bg-brand-600 rounded hover:bg-brand-700 transition">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
