'use client';

import { useState, useEffect } from 'react';
import { doctorService } from '../../../services/api';
import PatientList, { BasePatient } from '@/components/patients/PatientList';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { Card, CardContent, Typography, Box, Paper, Tabs, Tab, CircularProgress } from '@mui/material';
import type { ChartData } from 'chart.js';
import PageTemplate from '@/components/layout/PageTemplate';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { motion } from 'framer-motion';
import { Activity, ClipboardList, Utensils, HeartPulse, Clock, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

interface GraphData {
    bloodSugar: {
        measurements: Array<{
            id: string;
            value: number;
            timestamp: string;
            level: string;
            timeOfDay: string;
        }>;
        averagesByTime: {
            [key: string]: number;
        };
    };
    diets: Array<{
        id: string;
        name: string;
        type: string;
        startDate: string;
        endDate: string;
        logDate: string;
        completed: boolean;
        notes: string;
    }>;
    exercises: Array<{
        id: string;
        name: string;
        intensity: string;
        startDate: string;
        endDate: string;
        logDate: string;
        durationMinutes: number;
        completed: boolean;
        notes: string;
    }>;
    insulin: {
        measurements: Array<{
            id: string;
            value: number;
            timestamp: string;
            note: string;
            timeOfDay: string;
        }>;
        averagesByTime: {
            [key: string]: number;
        };
    };
}

interface Statistics {
    bloodSugar: {
        average: number;
        max: number;
        min: number;
        averagesByTime: {
            [key: string]: number;
        };
        totalMeasurements: number;
        abnormalReadings: number;
    };
    diets: {
        total: number;
        completed: number;
        adherenceRate: number;
    };
    exercises: {
        total: number;
        completed: number;
        adherenceRate: number;
        averageDuration: number;
    };
    insulin: {
        average: number;
        totalDoses: number;
        averagesByTime: {
            [key: string]: number;
        };
    };
}

// Update the patient interface to match the shared component
interface Patient extends BasePatient {
    id: number;
}

export default function StaticsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingData, setLoadingData] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
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

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const prepareBloodSugarTrendsData = (): ChartData<'line'> => {
        if (!graphData) return { labels: [], datasets: [] };

        const timeLabels = ['Morning', 'Afternoon', 'Evening', 'Night'];
        const averages = [
            graphData.bloodSugar.averagesByTime.morning || 0,
            graphData.bloodSugar.averagesByTime.afternoon || 0,
            graphData.bloodSugar.averagesByTime.evening || 0,
            graphData.bloodSugar.averagesByTime.night || 0
        ];

        return {
            labels: timeLabels,
            datasets: [
                {
                    label: 'Average Blood Sugar (mg/dL)',
                    data: averages,
                    borderColor: 'rgba(16, 185, 129, 0.8)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        };
    };

    const prepareDetailedChartData = (): ChartData<'line'> => {
        if (!graphData) return { labels: [], datasets: [] };

        const bloodSugarData = graphData.bloodSugar.measurements.map(bs => ({
            x: new Date(bs.timestamp).getTime(),
            y: bs.value
        }));

        const insulinData = graphData.insulin.measurements.map(i => ({
            x: new Date(i.timestamp).getTime(),
            y: i.value
        }));

        return {
            labels: bloodSugarData.map(d => new Date(d.x)),
            datasets: [
                {
                    label: 'Blood Sugar (mg/dL)',
                    data: bloodSugarData,
                    borderColor: 'rgba(16, 185, 129, 0.8)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    yAxisID: 'y',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Insulin (mL)',
                    data: insulinData,
                    borderColor: 'rgba(244, 63, 94, 0.8)',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    yAxisID: 'y1',
                    tension: 0.3
                }
            ]
        };
    };

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
                },
                min: 0,
                max: 300
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
            tooltip: {
                mode: 'index' as const,
                intersect: false
            }
        }
    };

    const trendsChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Blood Sugar Level (mg/dL)'
                }
            }
        }
    };

    return (
        <PageTemplate>
            <AuthWrapper allowedRoles={["doctor"]}>
                <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-8">
                    {/* Header Section */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-green-800 mb-2">Patient Statistics</h1>
                        <p className="text-gray-600">Comprehensive analysis of patient health metrics and trends</p>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Patient List */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-green-800">Patients</h2>
                            </div>
                            <div className="p-4">
                                {loading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                                    </div>
                                ) : (
                                    <PatientList
                                        patients={patients}
                                        selectedPatientId={selectedPatientId}
                                        onSelectPatient={(id) => setSelectedPatientId(id as number)}
                                        idField="id"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Statistics Content */}
                        <div className="lg:col-span-2">
                            {selectedPatientId ? (
                                loadingData ? (
                                    <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                                  </div>
                                ) : graphData && statistics ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="space-y-6"
                                    >
                                        {/* Date Range Controls */}
                                        <div className="bg-white rounded-xl shadow-sm p-4">
                                            <div className="flex items-center gap-4">
                                                <Calendar className="h-5 w-5 text-green-600" />
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => {
                                                            const end = new Date();
                                                            const start = new Date();
                                                            start.setDate(end.getDate() - 7);
                                                            setDateRange({ startDate: start, endDate: end });
                                                        }}
                                                        className={`px-3 py-1 rounded-lg transition-colors text-gray-600 text-sm ${dateRange.endDate.getTime() - dateRange.startDate.getTime() === 7 * 24 * 60 * 60 * 1000
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'hover:bg-green-50'
                                                            }`}
                                                    >
                                                        Last Week
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const end = new Date();
                                                            const start = new Date();
                                                            start.setDate(end.getDate() - 30);
                                                            setDateRange({ startDate: start, endDate: end });
                                                        }}
                                                        className={`px-3 py-1 rounded-lg transition-colors text-gray-600 text-sm ${dateRange.endDate.getTime() - dateRange.startDate.getTime() === 30 * 24 * 60 * 60 * 1000
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'hover:bg-green-50'
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
                                                        className={`px-3 py-1 rounded-lg transition-colors text-gray-600 text-sm ${dateRange.endDate.getTime() - dateRange.startDate.getTime() === 90 * 24 * 60 * 60 * 1000
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'hover:bg-green-50'
                                                            }`}
                                                    >
                                                        Last 90 Days
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Key Statistics Cards */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="bg-white rounded-xl shadow-sm p-4"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <HeartPulse className="h-5 w-5 text-green-600" />
                                                    <p className="text-gray-600 text-sm">Average Blood Sugar</p>
                                                </div>
                                                <p className="text-2xl font-semibold text-green-800">
                                                    {statistics.bloodSugar.average.toFixed(1)} mg/dL
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Range: {statistics.bloodSugar.min.toFixed(1)} - {statistics.bloodSugar.max.toFixed(1)}
                                                </p>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                                className="bg-white rounded-xl shadow-sm p-4"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Activity className="h-5 w-5 text-green-600" />
                                                    <p className="text-gray-600 text-sm">Exercise Adherence</p>
                                                </div>
                                                <p className="text-2xl font-semibold text-green-800">
                                                    {statistics.exercises.adherenceRate.toFixed(1)}%
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {statistics.exercises.completed}/{statistics.exercises.total} completed
                                                </p>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.2 }}
                                                className="bg-white rounded-xl shadow-sm p-4"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Utensils className="h-5 w-5 text-green-600" />
                                                    <p className="text-gray-600 text-sm">Diet Adherence</p>
                                                </div>
                                                <p className="text-2xl font-semibold text-green-800">
                                                    {statistics.diets.adherenceRate.toFixed(1)}%
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {statistics.diets.completed}/{statistics.diets.total} completed
                                                </p>
                                            </motion.div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.3 }}
                                                className="bg-white rounded-xl shadow-sm p-4"
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    <AlertTriangle className="h-5 w-5 text-green-600" />
                                                    <p className="text-gray-600 text-sm">Abnormal Readings</p>
                                                </div>
                                                <p className="text-2xl font-semibold text-green-800">
                                                    {statistics.bloodSugar.abnormalReadings}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    of {statistics.bloodSugar.totalMeasurements} total readings
                                                </p>
                                            </motion.div>
                                        </div>

                                        {/* Tabs for Different Views */}
                                        <div className="bg-white rounded-xl shadow-sm p-6">
                                            <Tabs
                                                value={activeTab}
                                                onChange={handleTabChange}
                                                className="mb-4"
                                                textColor="inherit"
                                                indicatorColor="primary"
                                            >
                                                <Tab label="Daily Trends" />
                                                <Tab label="Detailed View" />
                                            </Tabs>

                                            {activeTab === 0 ? (
                                                <div className="h-[400px]">
                                                    <Line
                                                        options={trendsChartOptions}
                                                        data={prepareBloodSugarTrendsData()}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-[400px]">
                                                    <Line
                                                        options={chartOptions}
                                                        data={prepareDetailedChartData()}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm p-6">
                                        <p className="text-gray-400 text-center">No data available for this patient</p>
                                    </div>
                                )
                            ) : (
                                <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm">
                                    <p className="text-gray-400 text-xl">Select a patient to view their statistics</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </AuthWrapper>
        </PageTemplate>
    );
}
