import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, UserCircle, ChevronDown, ChevronUp, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { authService } from '@/services/api';

const getUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const NavBar = () => {
  const [user, setUser] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    setShowLogoutModal(false);
    authService.logout();
  };
  
  return (
    <nav className="w-full h-20 bg-gradient-to-r from-orange-100 to-red-200 shadow flex items-center px-8 z-10 relative">
      {/* Logo */}
      <div className="flex items-center gap-3 mr-8 select-none">
        <UserCircle className="text-orange-500" size={32} />
        <span className="text-orange-700 font-bold text-xl tracking-wide">DiabetaCare</span>
      </div>
      {/* Spacer */}
      <div className="flex-1" />
      {/* User Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          className="flex items-center gap-3 bg-white/60 hover:bg-white/80 rounded-full px-4 py-2 shadow transition-all border border-orange-100 focus:outline-none"
          onClick={() => setDropdownOpen((v) => !v)}
        >
          <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center overflow-hidden">
            {user?.profile_picture ? (
             <img src={`data:image/jpeg;base64,${Buffer.from(user.profile_picture.data).toString("base64")}`} alt={user?.full_name || user?.username} className="w-full h-full object-cover rounded-full" />
              ) : (
              <User className="text-orange-600" size={24} />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-orange-800 font-semibold text-base leading-tight">
              {user?.full_name || user?.username || 'User'}
            </span>
            <span className="text-orange-500 text-xs">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}</span>
          </div>
          {dropdownOpen ? <ChevronUp className="text-orange-500 ml-2" size={18} /> : <ChevronDown className="text-orange-500 ml-2" size={18} />}
        </button>
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-orange-100 z-50 overflow-hidden"
            >
              <Link href="/Account">
                <button
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-orange-50 text-orange-800 transition-colors"
                  onClick={() => { setDropdownOpen(false); }}
                >
                  <UserCircle size={20} className="text-orange-500" />
                  My Account
                </button>
              </Link>
              <Link href="/Settings">
                <button
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-orange-50 text-orange-800 transition-colors"
                  onClick={() => { setDropdownOpen(false); }}
                >
                  <Settings size={20} className="text-orange-500" />
                  Settings
                </button>
              </Link>
              <button
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 text-red-600 transition-colors border-t border-orange-100"
                onClick={() => { setDropdownOpen(false); setShowLogoutModal(true); }}
              >
                <LogOut size={20} className="text-red-500" />
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-orange-900/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
            >
              <button
                className="absolute top-4 right-4 text-orange-400 hover:text-orange-700"
                onClick={() => setShowLogoutModal(false)}
              >
                ✕
              </button>
              <div className="flex flex-col items-center gap-4">
                <AlertCircle size={40} className="text-red-500 mb-2" />
                <h2 className="text-2xl font-bold text-red-700 mb-2">Confirm Logout</h2>
                <p className="text-orange-700 text-center mb-4">Are you sure you want to logout?</p>
                <div className="flex gap-4 w-full">
                  <button
                    className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
                    onClick={() => setShowLogoutModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold hover:from-red-600 hover:to-rose-600 transition-all"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavBar;
