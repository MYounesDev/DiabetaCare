"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';
import { Hospital } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  useEffect(() => {

    // TODO: remove this 2 lines after testing
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Check if user is already logged in
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
      // Not logged in, redirect to login page
      router.push('/login');
    }
  }, [router]);
 return (
    <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="flex items-center gap-3">
            <Hospital size={40} className="text-green-500" />
            <h1 className="text-4xl font-bold text-green-500">DiabetaCare .....</h1>
          </div>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
      </div>
    </div>
  );
}