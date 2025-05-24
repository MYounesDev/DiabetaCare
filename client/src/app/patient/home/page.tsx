"use client"
import { Activity, ClipboardList, Utensils, HeartPulse, Droplet, AlertCircle, Trophy } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { motion } from 'framer-motion';
import PageTemplate from '@/components/PageTemplate';
import AuthWrapper from '@/components/AuthWrapper';
import { useState, useEffect } from 'react';
import { patientService } from '@/services/api';

export default function PatientHome() {
    // Register ChartJS components
    ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

    const [totalExercises, setTotalExercises] = useState(0);
    const [completedExercises, setCompletedExercises] = useState(0);
    const [exerciseCompletionRate, setExerciseCompletionRate] = useState(0);
    const [totalDiets, setTotalDiets] = useState(0);
    const [recentBloodSugarMeasurements, setRecentBloodSugarMeasurements] = useState(0);
    const [recentSymptoms, setRecentSymptoms] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);

                const stats = await patientService.getDashboardStats();
                setTotalExercises(stats.totalExercises);
                setCompletedExercises(stats.completedExercises);
                setExerciseCompletionRate(stats.exerciseCompletionRate);
                setTotalDiets(stats.totalDiets);
                setRecentBloodSugarMeasurements(stats.recentBloodSugarMeasurements);
                setRecentSymptoms(stats.recentSymptoms);

                setLoading(false);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
                setError(errorMessage);
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Sample chart data - you can replace this with real data from your backend
    const exerciseProgressData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Exercises Completed',
                data: [3, 2, 1, 2, 5, 3, 4],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 4,
            }
        ],
    };

    const bloodSugarTrendsData = {
        labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
        datasets: [
            {
                label: 'Blood Sugar (mg/dL)',
                data: [0, 30, 80, 30, 120, 150],
                borderColor: 'rgba(16, 185, 129, 0.8)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.3,
                fill: true,
            },
        ],
    };

    return (
        <PageTemplate>
            <AuthWrapper allowedRoles={['patient']}>
                <div className="flex min-h-screen">
                    <div className="flex-1 p-8 bg-gradient-to-br from-green-50 to-teal-100">
                        <h1 className="text-3xl font-bold text-green-800 mb-8">My Health Dashboard</h1>

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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0 }}
                                        className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="p-3 rounded-full text-green-500 bg-opacity-20">
                                            <Trophy size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Exercise Completion</p>
                                            <p className="text-2xl font-bold text-green-700">{exerciseCompletionRate}%</p>
                                            <p className="text-sm text-gray-500">{completedExercises} of {totalExercises}</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.1 }}
                                        className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="p-3 rounded-full text-teal-500 bg-opacity-20">
                                            <Utensils size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Active Diet Plans</p>
                                            <p className="text-2xl font-bold text-green-700">{totalDiets}</p>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                        className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="p-3 rounded-full text-green-500 bg-opacity-20">
                                            <Droplet size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Recent Blood Sugar Tests</p>
                                            <p className="text-2xl font-bold text-green-700">{recentBloodSugarMeasurements}</p>
                                            <p className="text-sm text-gray-500">Last 7 days</p>
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
                                        <h2 className="text-xl font-semibold text-green-700 mb-4">Weekly Exercise Progress</h2>
                                        <Bar
                                            data={exerciseProgressData}
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
                                        {recentSymptoms > 0 && (
                                            <div className="flex items-center gap-3 p-3 border-b border-gray-100">
                                                <HeartPulse className="text-green-500" size={20} />
                                                <p className="text-green-800">You've logged {recentSymptoms} symptoms in the last 7 days</p>
                                            </div>
                                        )}
                                        {recentBloodSugarMeasurements > 0 && (
                                            <div className="flex items-center gap-3 p-3 border-b border-gray-100">
                                                <Droplet className="text-green-500" size={20} />
                                                <p className="text-green-800">You've recorded {recentBloodSugarMeasurements} blood sugar measurements recently</p>
                                            </div>
                                        )}
                                        {exerciseCompletionRate > 0 && (
                                            <div className="flex items-center gap-3 p-3">
                                                <Activity className="text-green-500" size={20} />
                                                <p className="text-green-800">Your exercise completion rate is {exerciseCompletionRate}%</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </div>
                </div>
            </AuthWrapper>
        </PageTemplate>
    );
}
