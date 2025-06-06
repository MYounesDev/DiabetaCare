"use client"
import { Activity, ClipboardList, Utensils, HeartPulse, Droplet, AlertCircle } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { motion } from 'framer-motion';
import PageTemplate from '@/components/layout/PageTemplate';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { useState, useEffect } from 'react';
import { patientService } from '@/services/api';

export default function PatientStatistics() {
    // Register ChartJS components
    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

    const [patientExercises, setPatientExercises] = useState(0);
    const [dietPlans, setDietPlans] = useState(0);
    const [totalSymptoms, setTotalSymptoms] = useState(0);
    const [bloodSugarAlerts, setBloodSugarAlerts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    if (!userData?.id) {
      throw new Error('User ID not found');
    }

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const fetchPatientExercises = await patientService.getPatientExercisesByPatient(userData.id);
                setPatientExercises(fetchPatientExercises.data.patientExercises.length);

                const fetchDietPlans = await patientService.getPatientDietsByPatient(userData.id);
                setDietPlans(fetchDietPlans.data.patientDiets.length);

                const fetchSymptoms = await patientService.getPatientSymptoms(userData.id);
                setTotalSymptoms(fetchSymptoms.data.symptoms.length);

                const fetchBloodSugarAlerts = await patientService.getBloodSugarMeasurements(userData.id);
                const alerts = fetchBloodSugarAlerts.data.bloodSugarMeasurements.filter(
                    (m: any) => m.value > 180 || m.value < 70
                );
                setBloodSugarAlerts(alerts.length);

                setLoading(false);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
                setError(errorMessage);
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Chart data for blood sugar measurements
    const bloodSugarData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
            {
                label: 'Blood Sugar Levels',
                data: [120, 140, 110, 130, 125, 135],
                borderColor: 'rgba(220, 38, 38, 0.8)',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Blood Sugar Trends',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        <AuthWrapper allowedRoles={['patient']}>
            <PageTemplate>
                <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-orange-800 mb-2">Patient Statistics Dashboard</h1>
                        <p className="text-gray-600">Track your health metrics and progress</p>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white p-6 rounded-xl shadow-sm"
                                >
                                    <div className="flex items-center">
                                        <Activity className="h-8 w-8 text-orange-600 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Exercises</p>
                                            <p className="text-2xl font-semibold text-orange-800">{patientExercises}</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white p-6 rounded-xl shadow-sm"
                                >
                                    <div className="flex items-center">
                                        <Utensils className="h-8 w-8 text-orange-600 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Diet Plans</p>
                                            <p className="text-2xl font-semibold text-orange-800">{dietPlans}</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white p-6 rounded-xl shadow-sm"
                                >
                                    <div className="flex items-center">
                                        <HeartPulse className="h-8 w-8 text-orange-600 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Symptoms Reported</p>
                                            <p className="text-2xl font-semibold text-orange-800">{totalSymptoms}</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-white p-6 rounded-xl shadow-sm"
                                >
                                    <div className="flex items-center">
                                        <AlertCircle className="h-8 w-8 text-orange-600 mr-3" />
                                        <div>
                                            <p className="text-sm text-gray-600">Blood Sugar Alerts</p>
                                            <p className="text-2xl font-semibold text-orange-800">{bloodSugarAlerts}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
                                <h2 className="text-xl font-bold text-orange-800 mb-4">Blood Sugar Trends</h2>
                                <div className="h-[300px]">
                                    <Line data={bloodSugarData} options={chartOptions} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </PageTemplate>
        </AuthWrapper>
    );
}
