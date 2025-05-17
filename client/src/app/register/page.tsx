"use client"
import { useState, useEffect } from 'react';
import { User, Hospital, Activity, ArrowLeft, Check } from 'lucide-react';
import { authService } from '@/services/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    fullName: '',
    birthDate: '',
    gender: '',
    role: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);
    
    try {
      // Basic validation
      const requiredFields = ['username', 'email', 'fullName', 'role'];
      for (const field of requiredFields) {
        if (!formData[field]) {
          setError(`Please enter your ${field === 'fullName' ? 'full name' : field}`);
          setLoading(false);
          return;
        }
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Phone validation (if provided)
      if (formData.phoneNumber && !/^\+?[0-9\s-]{8,15}$/.test(formData.phoneNumber)) {
        setError('Please enter a valid phone number');
        setLoading(false);
        return;
      }
      
      const response = await authService.register(formData);
      
      // If registration is successful
      if (response) {
        setSuccessMessage('Registration successful! Please check your email for login credentials.');
        setIsRegistered(true);
        setLoading(false);
        setTimeout(() => {
        router.push('/login');
        }, 3000);
      }

     
      
    } catch (err) {
      // Handle specific error cases
      if (err.response?.status === 409) {
        setError('Username or email already exists');
      } else if (err.response?.status === 400) {
        setError('Invalid information provided');
      } else {
        setError(err.message || 'An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      {/* Left side - Decorative */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-green-400 to-teal-500 p-12 flex-col justify-between items-center">
        <div className={`transition-all duration-1000 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex items-center gap-3">
            <Hospital size={40} className="text-white" />
            <h1 className="text-4xl font-bold text-white">DiabetaCare</h1>
          </div>
        </div>
        
        <div className={`transition-all duration-1000 delay-300 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-white/20 backdrop-blur-lg rounded-xl p-8 max-w-md">
            <Activity className="text-white mb-4" size={32} />
            <h2 className="text-2xl font-semibold text-white mb-4">Join Our Healthcare Community</h2>
            <p className="text-white/90">
              Create an account to access personalized diabetes management tools, connect with healthcare professionals, and take control of your health journey.
            </p>
          </div>
        </div>
        
        <div className={`transition-all duration-1000 delay-500 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} w-full`}>
          <p className="text-white/80 text-sm">
            © 2025 DiabetaCare Healthcare Systems. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* Right side - Registration form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className={`bg-white rounded-xl shadow-xl p-8 w-full max-w-md transition-all duration-1000 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex justify-center mb-6">
            <Hospital className="text-green-500" size={32} />
            <span className="text-green-600 font-bold text-xl ml-2">DiabetaCare</span>
          </div>
          
          {isRegistered ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 p-4 rounded-full">
                  <Check size={48} className="text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-4">Registration Successful!</h2>
              <p className="text-green-600 mb-8">
                Please check your email for login credentials.
              </p>
              <p className="text-green-600 mb-8">
                You will be redirected to the login page shortly...
              </p>
              <Link
                href = '/login'
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 
                  hover:from-green-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg"
              >
                <ArrowLeft size={20} />
                Go to Login
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-green-800 text-center mb-2">Create Account</h2>
              <p className="text-green-600 text-center mb-8">Register to begin your healthcare journey</p>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-green-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-green-800"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-green-700 mb-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-green-800"
                    placeholder="Choose a username"
                  />
                </div>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-green-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-green-800"
                    placeholder="you@example.com"
                  />
                </div>
                

                
                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-green-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-green-800"
                    placeholder="Enter your phone number"
                  />
                </div>
                
                {/* Birth Date */}
                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium text-green-700 mb-1">
                    Birth Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="birthDate"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-green-800"
                    />
                  </div>
                </div>
                
                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-green-700 mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-green-800"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                
                {/* Role */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-green-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-green-800"
                  >
                    <option value="">Select role</option>
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 
                    hover:from-green-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg
                    ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <User size={20} />
                      Register
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link
                href = '/login'
                  className="w-full text-green-600 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:text-green-700 transition-colors"
                >
                  <ArrowLeft size={20} />
                  Back to Login
                </Link>
              </div>
              
              <div className="mt-4 text-center text-sm text-green-700">
                <p>
                  By registering, you'll receive your login credentials via email
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}