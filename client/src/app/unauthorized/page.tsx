"use client";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { authService } from '@/services/api';
import { AlertTriangle, Home, LogOut, Hospital, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Unauthorized() {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-950 to-teal-300 p-4">
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
              className="absolute h-2 w-2 rounded-full bg-green-300"
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
        <div className="backdrop-blur-md bg-white/80 p-8 rounded-2xl shadow-xl border border-green-100">
          {/* App logo and name */}
          <div className={`flex items-center justify-center gap-3 mb-6 transition-all duration-1000 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Hospital size={32} className="text-green-500" />
            <h1 className="text-2xl font-bold text-green-600">DiabetaCare</h1>
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
            <h2 className="text-3xl font-bold text-green-800 mb-2">
              Access Denied
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mt-1"></div>
          </motion.div>
          
          {/* Message */}
          <motion.p 
            className="text-green-700 text-center mb-8 px-6"
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
                className="group flex items-center justify-center w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-green-600/40"
              >
                <Home size={18} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                Return to Home
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="hover:scale-105 transition-transform duration-300"
            >
              <button
                onClick={handleLogout}
                className="group flex items-center justify-center w-full py-3 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-green-700 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <LogOut size={18} className="mr-2 group-hover:scale-110 transition-transform duration-300" />
                Logout
              </button>
            </motion.div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -z-10 -top-10 -right-10 w-40 h-40 bg-green-400 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-teal-400 rounded-full opacity-20 blur-3xl"></div>
      </motion.div>
    </div>
  );
}