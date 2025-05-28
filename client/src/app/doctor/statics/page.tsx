'use client';

import { useState, useEffect } from 'react';
import { doctorService } from '../../../services/api';
import PatientList, { Patient } from './PatientList';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Card, CardContent, Typography, Box, Paper } from '@mui/material';
import type { ChartData } from 'chart.js';
import PageTemplate from '@/components/PageTemplate';
import AuthWrapper from '@/components/AuthWrapper';
import { motion } from 'framer-motion';
import { Activity, ClipboardList, Utensils, HeartPulse, Calendar } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

interface GraphData {
    bloodSugar: Array<{
        id: string;
        value: number;
        timestamp: string;
        level: string;
    }>;
    diets: Array<{
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        logDate: string;
        completed: boolean;
    }>;
    exercises: Array<{
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        logDate: string;
        completed: boolean;
    }>;
    insulin: Array<{
        id: string;
        value: number;
        timestamp: string;
        note: string;
    }>;
}

interface Statistics {
    averageBloodSugar: number;
    minBloodSugar: number;
    maxBloodSugar: number;
    completedExercises: number;
    totalExercises: number;
    completedDiets: number;
    totalDiets: number;
    averageInsulin: number;
}

export default function StaticsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: new Date()
    });

    // Fetch patients on component mount
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await doctorService.getPatients();
                setPatients(response.data.patients || []);
            } catch (error) {
                console.error('Error fetching patients:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPatients();
    }, []);

    // Fetch graph data when a patient is selected or date range changes
    useEffect(() => {
        const fetchGraphData = async () => {
            if (!selectedPatientId) return;

            try {
                setLoadingData(true);
                // Convert dates to ISO strings and handle null/undefined
                const startDateStr = dateRange.startDate ? dateRange.startDate.toISOString() : undefined;
                const endDateStr = dateRange.endDate ? dateRange.endDate.toISOString() : undefined;
                
                const response = await doctorService.getPatientGraphData(
                    selectedPatientId,
                    startDateStr,
                    endDateStr
                );
                setGraphData(response.data);
                setStatistics(response.statistics);
            } catch (error) {
                console.error('Error fetching graph data:', error);
            } finally {
                setLoadingData(false);
            }
        };

        fetchGraphData();
    }, [selectedPatientId, dateRange]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        },
        scales: {
            x: {
                type: 'time' as const,
                time: {
                    unit: 'day' as const,
                    displayFormats: {
                        day: 'MMM d'
                    }
                },
                title: {
                    display: true,
                    text: 'Date'
                }
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                    display: true,
                    text: 'Blood Sugar Level (mg/dL)'
                }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                    display: true,
                    text: 'Insulin (mL)'
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        },
        plugins: {
            legend: {
                position: 'top' as const
            },
            title: {
                display: true,
                text: 'Patient Health Metrics Over Time'
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            if (label.includes('Blood Sugar')) {
                                label += context.parsed.y.toFixed(1) + ' mg/dL';
                            } else if (label.includes('Insulin')) {
                                label += context.parsed.y.toFixed(2) + ' mL';
                            } else {
                                label += context.parsed.y;
                            }
                        }
                        return label;
                    }
                }
            }
        }
    };

    const prepareChartData = (): ChartData<'line'> => {
        if (!graphData) return {
            labels: [],
            datasets: []
        };

        // Get all dates for x-axis
        const allDates = [
            ...graphData.bloodSugar.map(bs => new Date(bs.timestamp).getTime()),
            ...graphData.insulin.map(i => new Date(i.timestamp).getTime())
        ].sort((a, b) => a - b);

        // Create datasets
        return {
            labels: allDates.map(timestamp => new Date(timestamp)),
            datasets: [
                {
                    label: 'Blood Sugar',
                    data: graphData.bloodSugar.map(bs => ({
                        x: new Date(bs.timestamp).getTime(),
                        y: bs.value
                    })),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    yAxisID: 'y',
                    tension: 0.2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgb(75, 192, 192)'
                },
                {
                    label: 'Insulin Dosage',
                    data: graphData.insulin.map(i => ({
                        x: new Date(i.timestamp).getTime(),
                        y: i.value
                    })),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    yAxisID: 'y1',
                    tension: 0.2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgb(255, 99, 132)'
                },
                // Add exercise completion markers
                {
                    label: 'Exercise Completed',
                    data: graphData.exercises
                        .filter(e => e.completed && e.logDate)
                        .map(e => ({
                            x: new Date(e.logDate).getTime(),
                            y: Math.max(...graphData.bloodSugar.map(bs => bs.value)) + 10
                        })),
                    backgroundColor: 'rgb(54, 162, 235)',
                    borderColor: 'rgb(54, 162, 235)',
                    pointStyle: 'triangle',
                    pointRadius: 8,
                    showLine: false,
                    yAxisID: 'y'
                },
                // Add diet completion markers
                {
                    label: 'Diet Completed',
                    data: graphData.diets
                        .filter(d => d.completed && d.logDate)
                        .map(d => ({
                            x: new Date(d.logDate).getTime(),
                            y: Math.max(...graphData.bloodSugar.map(bs => bs.value)) + 10
                        })),
                    backgroundColor: 'rgb(255, 206, 86)',
                    borderColor: 'rgb(255, 206, 86)',
                    pointStyle: 'star',
                    pointRadius: 8,
                    showLine: false,
                    yAxisID: 'y'
                }
            ]
        };
    };

    return (
        <PageTemplate>
            <AuthWrapper allowedRoles={["doctor"]}>
                <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-orange-800 mb-2">Patient Statics</h1>
                        <p className="text-gray-600">View comprehensive patient health statics and analytics</p>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Patient List */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-orange-800">Patients</h2>
                            </div>
                            <div className="p-4">
                                {loading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                                    </div>
                                ) : (
                                    <PatientList
                                        patients={patients}
                                        selectedPatientId={selectedPatientId}
                                        onSelectPatient={setSelectedPatientId}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Statics Content - takes 2/3 of the space */}
                        <div className="lg:col-span-2">
                            {selectedPatientId ? (
                                loadingData ? (
                                    <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm">
                                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                                    </div>
                                ) : graphData && statistics ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        {/* Date Range Controls */}
                                        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                                            <div className="flex items-center gap-4">
                                                <Calendar className="h-5 w-5 text-orange-600" />
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => {
                                                            const end = new Date();
                                                            const start = new Date();
                                                            start.setDate(end.getDate() - 30);
                                                            setDateRange({ startDate: start, endDate: end });
                                                        }}
                                                        className={`px-3 py-1 rounded-lg transition-colors ${
                                                            dateRange.endDate.getTime() - dateRange.startDate.getTime() === 30 * 24 * 60 * 60 * 1000
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : 'hover:bg-orange-50'
                                                        }`}
                                                    >
                                                        Last 30 Days
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const end = new Date();
                                                            const start = new Date();
                                                            start.setDate(end.getDate() - 30);
                                                            setDateRange({ startDate: start, endDate: end });
                                                        }}
                                                        className={`px-3 py-1 rounded-lg transition-colors ${
                                                            dateRange.endDate.getTime() - dateRange.startDate.getTime() === 30 * 24 * 60 * 60 * 1000
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : 'hover:bg-orange-50'
                                                        }`}
                                                    >
                                                        Last 30 Days
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const end = new Date();
                                                            const start = new Date();
                                                            start.setDate(end.getDate() - 90);
                                                            setDateRange({ startDate: start, endDate: end });
                                                        }}
                                                        className={`px-3 py-1 rounded-lg transition-colors ${
                                                            dateRange.endDate.getTime() - dateRange.startDate.getTime() === 90 * 24 * 60 * 60 * 1000
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : 'hover:bg-orange-50'
                                                        }`}
                                                    >
                                                        Last 90 Days
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Statistics Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="bg-white rounded-xl shadow-sm p-4"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <HeartPulse className="h-5 w-5 text-orange-600" />
                                                    <p className="text-gray-600 text-sm">Average Blood Sugar</p>
                                                </div>
                                                <p className="text-2xl font-semibold text-orange-800">
                                                    {statistics.averageBloodSugar.toFixed(1)}
                                                </p>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                                className="bg-white rounded-xl shadow-sm p-4"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Activity className="h-5 w-5 text-orange-600" />
                                                    <p className="text-gray-600 text-sm">Exercise Completion</p>
                                                </div>
                                                <p className="text-2xl font-semibold text-orange-800">
                                                    {statistics.completedExercises}/{statistics.totalExercises}
                                                </p>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.2 }}
                                                className="bg-white rounded-xl shadow-sm p-4"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Utensils className="h-5 w-5 text-orange-600" />
                                                    <p className="text-gray-600 text-sm">Diet Completion</p>
                                                </div>
                                                <p className="text-2xl font-semibold text-orange-800">
                                                    {statistics.completedDiets}/{statistics.totalDiets}
                                                </p>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.3 }}
                                                className="bg-white rounded-xl shadow-sm p-4"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <ClipboardList className="h-5 w-5 text-orange-600" />
                                                    <p className="text-gray-600 text-sm">Blood Sugar Range</p>
                                                </div>
                                                <p className="text-2xl font-semibold text-orange-800">
                                                    {statistics.minBloodSugar.toFixed(1)} - {statistics.maxBloodSugar.toFixed(1)}
                                                </p>
                                            </motion.div>
                                        </div>

                                        {/* Blood Sugar Graph */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: 0.4 }}
                                            className="bg-white rounded-xl shadow-sm p-6"
                                        >
                                            <h3 className="text-lg font-semibold text-orange-800 mb-4">Blood Sugar Trends</h3>
                                            <div className="h-[400px]">
                                                <Line options={chartOptions} data={prepareChartData()} />
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm p-6">
                                        <p className="text-gray-400 text-center">No data available for this patient</p>
                                    </div>
                                )
                            ) : (
                                <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm">
                                    <p className="text-gray-400 text-xl">Select a patient to view their statics</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AuthWrapper>
        </PageTemplate>
    );
}
