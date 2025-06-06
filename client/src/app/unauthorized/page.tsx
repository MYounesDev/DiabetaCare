"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { authService } from '@/services/api';
import { AlertTriangle, Home, LogOut, Hospital, Lock, HelpCircle, MessageCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Unauthorized() {
  const [animate, setAnimate] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-950 to-red-300 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-full">
          {Array(20).fill(0).map((_, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: -100 }}
              animate={{ 
                opacity: [0, 0.5, 0],
                y: [0, window.innerHeight],
                x: Math.random() * window.innerWidth
              }}
              transition={{ 
                duration: Math.random() * 10 + 15, 
                delay: Math.random() * 5,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute h-2 w-2 rounded-full bg-orange-300"
            />
          ))}
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="backdrop-blur-md bg-white/80 p-8 rounded-2xl shadow-xl border border-orange-100">
          {/* App logo and name */}
          <div className={`flex items-center justify-center gap-3 mb-6 transition-all duration-1000 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Hospital size={32} className="text-orange-500" />
            <h1 className="text-2xl font-bold text-orange-600">DiabetaCare</h1>
          </div>
          
          {/* Icon and header */}
          <motion.div 
            className="flex flex-col items-center mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="p-4 rounded-full bg-red-500/10 mb-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Lock size={40} className="text-red-500" />
              </motion.div>
            </div>
            <h2 className="text-3xl font-bold text-orange-800 mb-2">
              Access Denied
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mt-1"></div>
          </motion.div>
          
          {/* Message */}
          <motion.p 
            className="text-orange-700 text-center mb-8 px-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
          </motion.p>
          
          {/* Action buttons */}
          <div className="space-y-4 pt-2">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="hover:scale-105 transition-transform duration-300"
            >
              <Link 
                href={`/${JSON.parse(localStorage.getItem('user') || '{}').role}/home`}
                className="group flex items-center justify-center w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-600/40"
              >
                <Home size={18} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                Return to Home
              </Link>
            </motion.div>
            
            <div className="flex gap-2">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="flex-1 hover:scale-105 transition-transform duration-300"
              >
                <button
                  onClick={handleLogout}
                  className="group flex items-center justify-center w-full py-3 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-orange-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <LogOut size={18} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                  Logout
                </button>
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="hover:scale-105 transition-transform duration-300"
              >
                <button
                  onClick={() => setShowHelpModal(true)}
                  className="group flex items-center justify-center h-full py-3 px-4 rounded-xl bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <HelpCircle size={18} className="group-hover:scale-110 transition-transform duration-300" />
                </button>
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="hover:scale-105 transition-transform duration-300"
              >
                <button
                  onClick={() => setShowSupportModal(true)}
                  className="group flex items-center justify-center h-full py-3 px-4 rounded-xl bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <MessageCircle size={18} className="group-hover:scale-110 transition-transform duration-300" />
                </button>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Help Modal */}
        {showHelpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowHelpModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-orange-800">Need Help?</h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-xl">
                  <h4 className="font-semibold text-orange-700 mb-2">Common Reasons for Access Denial:</h4>
                  <ul className="list-disc list-inside text-orange-600 space-y-2">
                    <li>Insufficient permissions for the requested resource</li>
                    <li>Session expired or invalid</li>
                    <li>Account restrictions</li>
                    <li>System maintenance</li>
                  </ul>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                  <h4 className="font-semibold text-red-700 mb-2">What You Can Do:</h4>
                  <ul className="list-disc list-inside text-red-600 space-y-2">
                    <li>Verify your account permissions</li>
                    <li>Try logging out and back in</li>
                    <li>Contact your system administrator</li>
                    <li>Submit a support ticket</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Support Modal */}
        {showSupportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowSupportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-orange-800">Contact Support</h3>
                <button
                  onClick={() => setShowSupportModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Access Issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors h-32"
                    placeholder="Please describe your issue..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-600/40"
                >
                  Send Message
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
        
        {/* Decorative elements */}
        <div className="absolute -z-10 -top-10 -right-10 w-40 h-40 bg-orange-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-red-400 rounded-full opacity-20 blur-3xl"></div>
      </motion.div>
    </div>
  );
}
