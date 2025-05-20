"use client"
import { Activity, ClipboardList, Utensils, HeartPulse, Droplet, Users, AlertCircle } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { motion } from 'framer-motion';
import PageTemplate from '@/components/PageTemplate';
import AuthWrapper from '@/components/AuthWrapper';
import { useState, useEffect } from 'react';
import { doctorService } from '@/services/api';
export default function DoctorHome() {
    // Register ChartJS components
    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

    const [totalPatients, setTotalPatients] = useState(0);
    const [patientExercises, setpatientExercises] = useState(0);
    const [dietPlans, setDietPlans] = useState(0);
    const [totalSymptoms, setTotalSymptoms] = useState(0);
    const [bloodSugarAlerts, setBloodSugarAlerts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    // paging wait to reponse of the server before showing the data
    useEffect(() => {
        const fetchStats = async () => {

            try {
                setLoading(true);
                setError(null);

                const fetchPatients = await doctorService.getPatients();
                setTotalPatients(fetchPatients.data.patients.length);


                const fetchpatientExercises = await doctorService.getpatientExercises();
                setpatientExercises(fetchpatientExercises.data.patientExercises.length);

                const fetchDietPlans = await doctorService.getDietPlans();
                setDietPlans(fetchDietPlans.data.dietPlans.length);


                const fetchSymptoms = await doctorService.getSymptoms();
                setTotalSymptoms(fetchSymptoms.data.symptoms.length);


                const fetchBloodSugarAlerts = await doctorService.getBloodSugarAlerts();
                setBloodSugarAlerts(fetchBloodSugarAlerts.data.bloodSugarAlerts.length);

            // fetch other datas .......


                setLoading(false);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
                setError(errorMessage);
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Chart data
    const patientActivityData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'New Patients',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 4,
            },
            {
                label: 'Follow-ups',
                data: [8, 15, 10, 12, 9, 11],
                backgroundColor: 'rgba(20, 184, 166, 0.8)',
                borderRadius: 4,
            },
        ],
    };

    const bloodSugarTrendsData = {
        labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
        datasets: [
            {
                label: 'Average Blood Sugar (mg/dL)',
                data: [110, 135, 150, 125, 140, 115],
                borderColor: 'rgba(16, 185, 129, 0.8)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.3,
                fill: true,
            },
        ],
    };

    return (
        <PageTemplate>
            <AuthWrapper allowedRoles={['doctor', 'admin']} >
                <div className="flex min-h-screen">
                    <div className="flex-1 p-8 bg-gradient-to-br from-green-50 to-teal-100">
                        <h1 className="text-3xl font-bold text-green-800 mb-8">Doctor Dashboard</h1>
        
                        {loading ? (
                          <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                          </div>
                        ) : error ? (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-md"
                          >
                            <div className="flex items-center gap-3">
                              <AlertCircle className="text-red-500" size={24} />
                              <h2 className="text-xl font-semibold text-red-700">Error</h2>
                            </div>
                            <p className="mt-2 text-red-600">{error}</p>
                            <button 
                              onClick={() => window.location.reload()} 
                              className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                            >
                              Try Again
                            </button>
                          </motion.div>
                        ) : (
                          <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0 }}
                                className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow"
                            >
                                <div className="p-3 rounded-full text-green-500 bg-opacity-20">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Patients</p>
                                    <p className="text-2xl font-bold text-green-700">{totalPatients}</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow"
                            >
                                <div className="p-3 rounded-full text-teal-500 bg-opacity-20">
                                    <ClipboardList size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Pending Exercises</p>
                                    <p className="text-2xl font-bold text-green-700">{patientExercises}</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow"
                            >
                                <div className="p-3 rounded-full text-green-500 bg-opacity-20">
                                    <Utensils size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Diet Plans</p>
                                    <p className="text-2xl font-bold text-green-700">{dietPlans}</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow"
                            >
                                <div className="p-3 rounded-full text-teal-500 bg-opacity-20">
                                    <HeartPulse size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Symptoms</p>
                                    <p className="text-2xl font-bold text-green-700">{totalSymptoms}</p>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow"
                            >
                                <div className="p-3 rounded-full text-green-500 bg-opacity-20">
                                    <Droplet size={24} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Blood Sugar Alerts</p>
                                    <p className="text-2xl font-bold text-green-700">{bloodSugarAlerts}</p>
                                </div>
                            </motion.div>
                            
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                className="bg-white rounded-xl shadow-md p-6"
                            >
                                <h2 className="text-xl font-semibold text-green-700 mb-4">Patient Activity</h2>
                                <Bar
                                    data={patientActivityData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { position: 'top' },
                                        },
                                        animation: {
                                            duration: 2000,
                                        },
                                    }}
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                className="bg-white rounded-xl shadow-md p-6"
                            >
                                <h2 className="text-xl font-semibold text-green-700 mb-4">Blood Sugar Trends</h2>
                                <Line
                                    data={bloodSugarTrendsData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: { position: 'top' },
                                        },
                                        animation: {
                                            duration: 2000,
                                        },
                                    }}
                                />
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="bg-white rounded-xl shadow-md p-6"
                        >
                            <h2 className="text-xl font-semibold text-green-700 mb-4">Recent Activity</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 border-b border-gray-100">
                                    <Activity className="text-green-500" size={20} />
                                    <p className="text-green-800">Patient <span className="font-medium">John Doe</span> completed their exercise plan</p>
                                </div>
                                <div className="flex items-center gap-3 p-3 border-b border-gray-100">
                                    <Activity className="text-green-500" size={20} />
                                    <p className="text-green-800">Patient <span className="font-medium">Jane Smith</span> reported total symptoms</p>
                                </div>
                                <div className="flex items-center gap-3 p-3">
                                    <Activity className="text-green-500" size={20} />
                                    <p className="text-green-800">Patient <span className="font-medium">Mike Johnson</span> has high blood sugar levels</p>
                                </div>
                            </div>
                        </motion.div>
                        </>
                        )}
                    </div>
                </div>
            </AuthWrapper >
        </PageTemplate>
    );
}
