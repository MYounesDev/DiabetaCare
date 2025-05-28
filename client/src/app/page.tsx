"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';
import { Hospital, Heart, Activity, Pill } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    const initializeAuth = async () => {
    /*  // TODO: remove this 2 lines after testing
      localStorage.removeItem('token');
      localStorage.removeItem('user');*/

      // Check if user is already logged in
      // Wait for animations to complete (3 seconds total)
      await new Promise(resolve => setTimeout(resolve, 900));
      if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser();


        // Redirect based on user role
        if (user) {
          if (user.role === 'admin') {
            router.push('/admin/home');
          } else if (user.role === 'doctor') {
            router.push('/doctor/home');
          } else {
            router.push('/patient/home');
          }
        } else {
          router.push('/home');
        }
      } else {
        router.push('/login');
      }
    };

    initializeAuth();
  }, [router]);

  const features = [
    { icon: Hospital, text: "Healthcare Management" },
    { icon: Heart, text: "Patient Care" },
    { icon: Activity, text: "Health Monitoring" },
    { icon: Pill, text: "Medication Tracking" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center justify-center space-y-12"
        >
          {/* Logo and App Name */}
          <motion.div 
            className="flex items-center gap-4"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Hospital size={48} className="text-orange-600" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              DiabetaCare
            </h1>
          </motion.div>

          {/* Loading Animation */}
          <div className="relative w-24 h-24">
            <motion.div 
              className="absolute inset-0 border-4 border-orange-200 rounded-full"
              style={{ borderTopColor: '#059669' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex flex-col items-center p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <feature.icon size={32} className="text-orange-500 mb-2" />
                <p className="text-sm font-medium text-gray-600 text-center">{feature.text}</p>
              </motion.div>
            ))}
          </div>

          {/* Loading Text */}
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-gray-600 font-medium"
          >
            Loading your healthcare dashboard...
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}