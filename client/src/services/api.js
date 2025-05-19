// client/src/services/api.js
import axios from 'axios';



if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn("Environment variable NEXT_PUBLIC_API_URL is not set, using default localhost.");
}
const API_URL = (process.env.NEXT_PUBLIC_API_URL || `http://localhost:5000`) 

//.replace("localhost", "192.168.1.108")  // uncomment this line to use a specific IP address

;


// Create an axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => ({
    data:response.data,
    status: response.status,
    user: response.data.user
  }),
  (error) => {
    const { response } = error;
    
    // Handle expired tokens or authentication errors
    if (response && response.status === 401) {
      // Clear local storage and redirect to login if token is invalid or expired
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(
      response?.data?.message || 'Something went wrong. Please try again.'
    );
  }
);

// Auth Services
export const authService = {
  // Log in the user and store the token
  login: async (username, password) => {
    try {
      const response = await api.post('/login', { username, password });
      
      console.log("response.status::", response.status);
      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log(response.data.token);
      }
      
      console.log("response : ", response);
      return response;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
  
  // Register a new user
  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Log out the user by removing the token
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
  
  // Get the currently logged-in user
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  // Get the current auth token
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },
  
  // Check if the user is authenticated
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },
  
  // Change user password
  changePassword: async (currentPassword, newPassword) => {

    try {
      const response = await api.post('/change-password', { // FIND OUT HOT THE TOKEN DOSEN't GO TO THIS REQUSTE 
        currentPassword,
        newPassword
      });

      if (response.status === 400) {
        // current password is incorrect
        response.error = "Current password is incorrect";
        return response;
      }

      // Update token if provided in the response
      if (response.token) {
        localStorage.setItem('user', JSON.stringify(response.user)); 
        localStorage.setItem('token', response.token);
      }
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/profile');
      return response;
    } catch (error) {
      throw error;
    }
  }
};


// Admin Services
export const adminService = {
  // Get all users (admin)
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      return response;
    } catch (error) {
      throw error;
    }
  },

  getUser: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response;
    } catch (error) {
      throw error;
    }
  },


  getDoctors: async () => {
    try {
      const response = await api.get('/doctors');
      return response;
    } catch (error) {
      throw error;
    }
  },

  getPatients: async () => {
    try {
      const response = await api.get('/patients');
      console.log("IN API response.data.patients:");
      console.log(response.data.patients);
      return response;
    } catch (error) {
      throw error;
    }
  },

  deletePatient: async (patientId) => {
    try {
      const response = await api.delete(`/patients/${patientId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },



};

// Doctor Services
export const doctorService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get('/doctor/dashboard/stats');
      return response.data.stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  getUser: adminService.getUser,
  updateUser: adminService.updateUser,
  getPatients: adminService.getPatients,
  addPatient: authService.register,
  deletePatient: adminService.deletePatient,

  getPendingExercises: async () => {
    try {
      const response = await api.get('/pending-exercises');
      return response;
    } catch (error) {
      throw error;
    }
  },

  getDietPlans: async () => {
    try {
      const response = await api.get('/diet-plans');
      return response;
    } catch (error) {
      throw error;
    }
  },

  getSymptoms: async () => {
    try {
      const response = await api.get('/symptoms');
      return response;
    } catch (error) {
      throw error;  
    }
  },


  getBloodSugarAlerts: async () => {
    try {
      const response = await api.get('/blood-sugar-alerts');
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export const usersControl = {

}



// Utility function to determine if current user has admin role
export const isAdmin = () => {
  const user = authService.getCurrentUser();
  return user && user.role === 'admin';
};


export const isDoctor = () => {
  const user = authService.getCurrentUser();
  return user && user.role === 'doctor';
};


export const isPatient = () => {
  const user = authService.getCurrentUser();
  return user && user.role === 'patient';
};

export default {
  authService,
 // patientService,
  doctorService,
  adminService,
 // userService,
 // notificationService,
  isAdmin,
  isDoctor,
  isPatient
};