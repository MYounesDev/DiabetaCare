"use client";

import { useState, useEffect } from "react";
import { patientService } from "@/services/api";
import PageTemplate from "@/components/PageTemplate";
import AuthWrapper from "@/components/AuthWrapper";
import { motion } from "framer-motion";
import {
    ClipboardList,
    AlertCircle,
} from "lucide-react";

// TypeScript interfaces
interface PatientSymptom {
    symptom_id: string;
    symptom_name: string;
    description: string;
    created_at: string;
}

export default function PatientSymptoms() {
    // State
    const [symptoms, setSymptoms] = useState<PatientSymptom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch patient symptoms on component mount
    useEffect(() => {
        fetchPatientSymptoms();
    }, []);

    // Fetch patient symptoms
    const fetchPatientSymptoms = async () => {
        setLoading(true);
        setError(null);
        try {
            const user = localStorage.getItem('user');
            const userData = user ? JSON.parse(user) : null;
            if (!userData?.id) {
                throw new Error('User ID not found');
            }
            const res = await patientService.getPatientSymptoms(userData.id);
            setSymptoms(res.data.symptoms || []);
        } catch (err: unknown) {
            console.error("Error fetching symptoms:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to load symptoms";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthWrapper allowedRoles={["patient"]}>
            <PageTemplate>
                <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-8">
                    <div className="container mx-auto">
                        {/* Header Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold text-orange-800">My Symptoms History</h2>
                                        <p className="text-sm text-gray-500 mt-1">View your recorded symptoms and their details</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ClipboardList className="h-5 w-5 text-orange-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Symptoms List Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6">
                                {loading ? (
                                    <div className="flex justify-center items-center h-64">
                                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                                    </div>
                                ) : error ? (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                        <AlertCircle size={16} /> {error}
                                    </div>
                                ) : symptoms.length === 0 ? (
                                    <div className="text-center text-gray-500 p-8">
                                        <p>No symptoms recorded yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {symptoms.map((symptom) => (
                                            <motion.div
                                                key={`${symptom.symptom_id}-${symptom.created_at}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                                            >
                                                <div>
                                                    <h3 className="font-semibold text-orange-800">{symptom.symptom_name}</h3>
                                                    <p className="text-sm text-gray-600 mb-3">{symptom.description}</p>
                                                    <div className="text-xs text-gray-500">
                                                        Reported on: {new Date(symptom.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </PageTemplate>
        </AuthWrapper>
    );
} 