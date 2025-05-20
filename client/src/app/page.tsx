"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/api';

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
    <div className="flex min-h-screen items-center justify-center">
      <p>Redirecting...</p>
    </div>
  );
}