"use client"
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, Hospital, Activity } from 'lucide-react';
import { authService } from '@/services/api';
import { useRouter } from 'next/navigation';


export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!formData.username || !formData.password) {
        setError('Please enter both username and password');
        setLoading(false);
        return;
      }

      const response = await authService.login(formData.username, formData.password) ;

      
      // If login is successful, redirect to dashboard or home page
      if (response && response.user) {
        router.push(`${response.user.role}/dashboard`); // or wherever you want to redirect after login
      }
    } catch (err: any) {
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (err.response?.status === 404) {
        setError('User not found');
      } else {
        setError(err.message || 'An error occurred during login');
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
            <h2 className="text-2xl font-semibold text-white mb-4">Diabetes Management Made Easy</h2>
            <p className="text-white/90">
            Monitor glucose levels, track medication, schedule appointments, connect with healthcare professionals, follow your exercises, and easily review your health analyses all in one place.
            </p>
          </div>
        </div>
        
        <div className={`transition-all duration-1000 delay-500 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} w-full`}>
          <p className="text-white/80 text-sm">
            © 2025 DiabetaCare Healthcare Systems. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className={`bg-white rounded-xl shadow-xl p-8 w-full max-w-md transition-all duration-1000 transform ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex justify-center mb-6">
            <Hospital className="text-green-500" size={32} />
            <span className="text-green-600 font-bold text-xl ml-2">DiabetaCare</span>
          </div>
          
          <h2 className="text-2xl font-bold text-green-800 text-center mb-2">Welcome Back</h2>
          <p className="text-green-600 text-center mb-8">Sign in to your account</p>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          
          <div>
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-green-700 mb-1">
                Username
              </label>
              <input
                type="username"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-green-800"
                placeholder="Enter your username"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-green-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all outline-none text-green-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <a className="text-sm text-green-600 hover:text-green-700 transition-colors cursor-pointer">
                  Forgot password?
                </a>
              </div>
            </div>
            
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
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-green-800">
                Don't have an account?{' '}
                <Link href="/register" className="text-green-600 font-medium hover:text-green-700 transition-colors cursor-pointer">
                  Register now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}