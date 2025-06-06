// client/src/components/AuthWrapper.js
"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authService } from '@/services/api';




// A component to protect routes that require authentication
export default function AuthWrapper({ 
  children, // Children components to render if authenticated
  allowedRoles , // Array of roles that can access this route (empty means any authenticated user)
  redirectTo = '/login' // Where to redirect unauthenticated users
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
/*
  useEffect(() => {
    const user = authService.getProfile();
  }); // Check if the token is not expired (will go to login page if expired)
*/

  useEffect(() => {
    const checkAuth = () => {
      // Check if the user is authenticated
      if (!authService.isAuthenticated()) {
        setAuthorized(false);
        router.push(redirectTo);
        return;
      }

      // Check if we need to verify roles
      if (allowedRoles.length > 0) {
        const user = authService.getCurrentUser();
        if (!user || !allowedRoles.includes(user.role)) {
          setAuthorized(false);
          router.push('/unauthorized');
          return;
        }
      }

      setAuthorized(true);
    };

    checkAuth();
    setLoading(false);
  }, [router, redirectTo, allowedRoles]);

  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // Render children only if the user is authorized
  return authorized ? children : null;
}
