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
      
      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
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

  getpatientExercises: async () => {
    try {
      const response = await api.get('/patient-exercises/pending');
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

  getRecentSymptoms: async () => {
    try {
      const response = await api.get('/symptoms-recent');
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
  },


  // --- SYMPTOMS ---
  getSymptoms: async () => {
    try {
      const response = await api.get('/symptom_types');
      return response;
    } catch (error) {
      throw error;
    }
  },
  addSymptom: async (data) => {
    try {
      const response = await api.post('/symptom_types/create', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  updateSymptom: async (data) => {
    try {
      const response = await api.put('/symptom_types/update', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  deleteSymptom: async (symptom_id) => {
    try {
      const response = await api.delete(`/symptom_types/${symptom_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },




  getPatientSymptoms: async (patient_id) => {
    try {
      const response = await api.get(`/symptoms/patient/${patient_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  addPatientSymptom: async (data) => {
    try {
      const response = await api.post('/symptoms/patient/add', data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  deletePatientSymptom: async (patient_symptoms_id) => {
    try {
      const response = await api.delete(`/symptoms/patient/delete/${patient_symptoms_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },


  // --- BLOOD SUGAR MEASUREMENTS ---
  getBloodSugarMeasurements: async (patientId) => {
    try {
      const response = await api.get(`/blood-sugar-measurements/patient/${patientId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  addBloodSugarMeasurement: async (data) => {
    try {
      const response = await api.post('/blood-sugar-measurements/patient/add', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  updateBloodSugarMeasurement: async (data) => {
    try {
      const response = await api.put('/blood-sugar-measurements/patient/update', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  deleteBloodSugarMeasurement: async (blood_sugar_measurement_id) => {
    try {
      const response = await api.delete(`/blood-sugar-measurements/patient/delete/${blood_sugar_measurement_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },



  
  // --- EXERCISE MANAGEMENT ---
  getExerciseTypes: async () => {
    try {
      const response = await api.get('/exercise-types');
      return response;
    } catch (error) {
      throw error;
    }
  },
  createExerciseType: async (name, description) => {
    try {
      const response = await api.post('/exercise-types/create', { name, description });
      return response;
    } catch (error) {
      throw error;
    }
  },
  updateExerciseType: async (exercise_id, exercise_name, description) => {
    try {
      console.log(exercise_id, exercise_name, description);
      const response = await api.post('/exercise-types/update', { exercise_id, exercise_name, description });
      return response;
    } catch (error) {
      throw error;
    }
  },
  deleteExerciseType: async (exercise_id) => {
    try {
      const response = await api.delete(`/exercise-types/${exercise_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getSumPatientExerciseAssignments: async (exercise_id) => {
    try {
      const response = await api.get(`/exercise-types/${exercise_id}/sum-patient-assignments`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  



  // --- PATIENT EXERCISE PLANS ---
  getPatientExercises: async () => {
    try {
      const response = await api.get('/patient-exercises');
      return response;
    } catch (error) {
      throw error;
    }
  },
  getPatientExercisesByPatient: async (patient_id) => {
    try {
      const response = await api.get(`/patient-exercises/patient/${patient_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  addPatientExercise: async (data) => {
    try {
      const response = await api.post('/patient-exercises/patient/add', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  updatePatientExercise: async (data) => {
    try {
      const response = await api.put('/patient-exercises/patient/update', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  deletePatientExercise: async (patientExerciseId) => {
    try {
      const response = await api.delete(`/patient-exercises/patient/delete/${patientExerciseId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getCompletedExercises: async (patient_id) => {
    try {
      const response = await api.get('/patient-exercises/patient/completed', { data: { patient_id } });
      return response;
    } catch (error) {
      throw error;
    }
  },


  // --- EXERCISE LOGS ---
  getAllExerciseLogs: async () => {
    try {
      const response = await api.get('/exercise-logs/');
      return response;
    } catch (error) {
      throw error;
    }
  },
  getPatientExerciseLogs: async (patient_exercise_id) => {
    try {
      // Using query params instead of data object which doesn't work with GET requests
      const response = await api.get(`/exercise-logs/patient/${patient_exercise_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  addExerciseLog: async (data) => {
    try {
      const response = await api.post('/exercise-logs/patient/add', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  updateExerciseLog: async (data) => {
    try {
      if (!data.exercise_logs_id || data.is_completed === undefined || !data.note) {
        throw new Error('Missing required fields: exercise_logs_id, is_completed, and note are required');
      }
      const response = await api.put('/exercise-logs/patient/update', data);
      return response;
    } catch (error) {
      console.error('Error updating exercise log:', error);
      throw error;
    }
  },
  deleteExerciseLog: async (logId) => {
    try {
      const response = await api.delete(`/exercise-logs/patient/delete/${logId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  // --- EXERCISE RECOMMENDATION ---
  getExerciseRecommendation: async (patient_id) => { // Returning the recommended exercise ID.
    try {
      console.log(patient_id);
      const response = await api.get(`/exercise-recommendation/${patient_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },













  
  // --- DIET MANAGEMENT ---
  getDietTypes: async () => {
    try {
      const response = await api.get('/diet-types');
      return response;
    } catch (error) {
      throw error;
    }
  },
  createDietType: async (name, description) => {
    try {
      const response = await api.post('/diet-types/create', { name, description });
      return response;
    } catch (error) {
      throw error;
    }
  },
  updateDietType: async (diet_id, diet_name, description) => {
    try {
      const response = await api.post('/diet-types/update', { diet_id, diet_name, description });
      return response;
    } catch (error) {
      throw error;
    }
  },
  deleteDietType: async (diet_id) => {
    try {
      const response = await api.delete(`/diet-types/${diet_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getSumPatientDietAssignments: async (diet_id) => {
    try {
      const response = await api.get(`/diet-types/${diet_id}/sum-patient-assignments`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  



  // --- PATIENT DIET PLANS ---
  getPatientDiets: async () => {
    try {
      const response = await api.get('/patient-diets');
      return response;
    } catch (error) {
      throw error;
    }
  },
  getPatientDietsByPatient: async (patient_id) => {
    try {
      const response = await api.get(`/patient-diets/patient/${patient_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  addPatientDiet: async (data) => {
    try {
      const response = await api.post('/patient-diets/patient/add', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  updatePatientDiet: async (data) => {
    try {
      const response = await api.put('/patient-diets/patient/update', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  deletePatientDiet: async (patientDietId) => {
    try {
      const response = await api.delete(`/patient-diets/patient/delete/${patientDietId}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  getCompletedDiets: async (patient_id) => {
    try {
      const response = await api.get('/patient-diets/patient/completed', { data: { patient_id } });
      return response;
    } catch (error) {
      throw error;
    }
  },


  // --- DIET LOGS ---
  getAllDietLogs: async () => {
    try {
      const response = await api.get('/diet-logs/');
      return response;
    } catch (error) {
      throw error;
    }
  },
  getPatientDietLogs: async (patient_diet_id) => {
    try {
      // Using query params instead of data object which doesn't work with GET requests
      const response = await api.get(`/diet-logs/patient/${patient_diet_id}`);
      return response;
    } catch (error) {
      throw error;
    }
  },
  addDietLog: async (data) => {
    try {
      const response = await api.post('/diet-logs/patient/add', data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  updateDietLog: async (data) => {
    try {
      if (!data.diet_logs_id || data.is_completed === undefined || !data.note) {
        throw new Error('Missing required fields: diet_logs_id, is_completed, and note are required');
      }
      const response = await api.put('/diet-logs/patient/update', data);
      return response;
    } catch (error) {
      console.error('Error updating diet log:', error);
      throw error;
    }
  },
  deleteDietLog: async (logId) => {
    try {
      const response = await api.delete(`/diet-logs/patient/delete/${logId}`);
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