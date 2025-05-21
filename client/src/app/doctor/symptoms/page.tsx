"use client";
import { useState, useEffect, useRef } from "react";
import { doctorService } from "@/services/api";
import PageTemplate from "@/components/PageTemplate";
import AuthWrapper from "@/components/AuthWrapper";
import { motion } from "framer-motion";
import {
  ClipboardList,
  PlusCircle,
  Edit,
  Trash2,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Search,
  Users
} from "lucide-react";
import PatientList, { Patient as PatientListPatient } from "@/components/PatientList";

// TypeScript interfaces
interface Symptom {
  symptom_id: string;
  symptom_name: string;
  description: string;
}

interface PatientSymptom {
  symptom_id: string;
  symptom_name: string;
  description: string;
  created_at: string;
}

interface NewPatientSymptom {
  patient_id: string;
  symptom_id: string;
}

// API response patient type
interface APIPatient {
  id: string;
  full_name: string;
  username: string;
  profile_picture?: string;
}

export default function DoctorSymptoms() {
  // Symptoms Types State
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [symptomError, setSymptomError] = useState<string | null>(null);
  const [showAddSymptomModal, setShowAddSymptomModal] = useState(false);
  const [showEditSymptomModal, setShowEditSymptomModal] = useState(false);
  const [showDeleteSymptomModal, setShowDeleteSymptomModal] = useState(false);
  const [selectedSymptom, setSelectedSymptom] = useState<Symptom | null>(null);
  const [newSymptom, setNewSymptom] = useState<Omit<Symptom, 'symptom_id'>>({ symptom_name: "", description: "" });
  const [isSubmittingSymptom, setIsSubmittingSymptom] = useState(false);
  const [symptomFormError, setSymptomFormError] = useState("");
  const [symptomFormSuccess, setSymptomFormSuccess] = useState("");

  // Patient Symptoms State
  const [patients, setPatients] = useState<APIPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientSymptoms, setPatientSymptoms] = useState<PatientSymptom[]>([]);
  const [loadingPatientSymptoms, setLoadingPatientSymptoms] = useState(false);
  const [searchPatient, setSearchPatient] = useState("");

  // Add new state for patient symptom management
  const [showAddPatientSymptomModal, setShowAddPatientSymptomModal] = useState(false);
  const [showDeletePatientSymptomModal, setShowDeletePatientSymptomModal] = useState(false);
  const [selectedPatientSymptom, setSelectedPatientSymptom] = useState<PatientSymptom | null>(null);
  const [newPatientSymptom, setNewPatientSymptom] = useState<NewPatientSymptom>({
    patient_id: "",
    symptom_id: "",
  });
  const [isSubmittingPatientSymptom, setIsSubmittingPatientSymptom] = useState(false);
  const [patientSymptomFormError, setPatientSymptomFormError] = useState("");
  const [patientSymptomFormSuccess, setPatientSymptomFormSuccess] = useState("");

  // Modal refs
  const addSymptomModalRef = useRef<HTMLDivElement>(null);
  const editSymptomModalRef = useRef<HTMLDivElement>(null);
  const deleteSymptomModalRef = useRef<HTMLDivElement>(null);
  const addPatientSymptomModalRef = useRef<HTMLDivElement>(null);
  const deletePatientSymptomModalRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    fetchSymptoms();
    fetchPatients();
  }, []);

  // Fetch patient symptoms when patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientSymptoms(selectedPatientId);
    }
  }, [selectedPatientId]);

  // Fetch all symptoms
  const fetchSymptoms = async () => {
    setLoadingSymptoms(true);
    setSymptomError(null);
    try {
      const res = await doctorService.getSymptoms();
      setSymptoms(res.data.symptomTypes || []);
    } catch (err: unknown) {
      console.error("Error fetching symptoms:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load symptoms";
      setSymptomError(errorMessage);
    } finally {
      setLoadingSymptoms(false);
    }
  };

  // Fetch all patients
  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await doctorService.getPatients();
      setPatients(res.data.patients || []);
    } catch (err: unknown) {
      console.error("Error fetching patients:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load patients";
      setSymptomError(errorMessage);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Fetch patient symptoms
  const fetchPatientSymptoms = async (patientId: string) => {
    setLoadingPatientSymptoms(true);
    try {
      const res = await doctorService.getPatientSymptoms(patientId);
      setPatientSymptoms(res.data.symptoms || []);
    } catch (err: unknown) {
      console.error("Error fetching patient symptoms:", err);
      if (err instanceof Error) {
        setSymptomError(err.message);
      } else {
        setSymptomError("An unknown error occurred");
      }
    } finally {
      setLoadingPatientSymptoms(false);
    }
  };

  // Map patients data to match PatientList component's expected format
  const mappedPatients: PatientListPatient[] = patients.map(patient => ({
    exercise_logs_id: patient.id,
    full_name: patient.full_name,
    username: patient.username,
    profile_picture: patient.profile_picture
  }));

  // Add new handlers for patient symptoms
  const handleAddPatientSymptom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingPatientSymptom(true);
    setPatientSymptomFormError("");
    setPatientSymptomFormSuccess("");
    try {
      await doctorService.addPatientSymptom({
        ...newPatientSymptom,
        patient_id: selectedPatientId as string
      });
      setPatientSymptomFormSuccess("Patient symptom added successfully!");
      setShowAddPatientSymptomModal(false);
      setNewPatientSymptom({
        patient_id: "",
        symptom_id: "",
      });
      if (selectedPatientId) {
        fetchPatientSymptoms(selectedPatientId);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add patient symptom";
      setPatientSymptomFormError(errorMessage);
    } finally {
      setIsSubmittingPatientSymptom(false);
    }
  };

  const handleDeletePatientSymptom = async () => {
    if (!selectedPatientSymptom) return;
    setIsSubmittingPatientSymptom(true);
    setPatientSymptomFormError("");
    setPatientSymptomFormSuccess("");
    try {
      await doctorService.deletePatientSymptom(selectedPatientSymptom.patient_symptoms_id);
      setPatientSymptomFormSuccess("Patient symptom deleted successfully!");
      setShowDeletePatientSymptomModal(false);
      if (selectedPatientId) {
        fetchPatientSymptoms(selectedPatientId);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete patient symptom";
      setPatientSymptomFormError(errorMessage);
    } finally {
      setIsSubmittingPatientSymptom(false);
    }
  };

  // Update the click outside handler to include new modals
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (showAddSymptomModal && addSymptomModalRef.current && !addSymptomModalRef.current.contains(target)) {
        setShowAddSymptomModal(false);
      }
      if (showEditSymptomModal && editSymptomModalRef.current && !editSymptomModalRef.current.contains(target)) {
        setShowEditSymptomModal(false);
      }
      if (showDeleteSymptomModal && deleteSymptomModalRef.current && !deleteSymptomModalRef.current.contains(target)) {
        setShowDeleteSymptomModal(false);
      }
      if (showAddPatientSymptomModal && addPatientSymptomModalRef.current && !addPatientSymptomModalRef.current.contains(target)) {
        setShowAddPatientSymptomModal(false);
      }
      if (showDeletePatientSymptomModal && deletePatientSymptomModalRef.current && !deletePatientSymptomModalRef.current.contains(target)) {
        setShowDeletePatientSymptomModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddSymptomModal, showEditSymptomModal, showDeleteSymptomModal, showAddPatientSymptomModal, showDeletePatientSymptomModal]);

  return (
    <PageTemplate>
      <AuthWrapper allowedRoles={["doctor"]}>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2">Symptoms Management</h1>
            <p className="text-gray-600">Manage symptoms and track patient symptoms</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8">
            {/* Symptoms Types Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-green-800">Symptoms Types</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage different types of symptoms</p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddSymptomModal(true)}
                    className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white flex items-center gap-1 hover:opacity-90 transition-opacity"
                  >
                    <PlusCircle size={16} /> Add Symptom Type
                  </motion.button>
                </div>
              </div>
              
              <div className="p-6">
                {loadingSymptoms ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {symptoms.map((symptom) => (
                      <motion.div 
                        key={symptom.symptom_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-green-800">{symptom.symptom_name}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedSymptom(symptom);
                                setShowEditSymptomModal(true);
                              }}
                              className="p-1 rounded-lg text-green-600 hover:bg-green-50"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedSymptom(symptom);
                                setShowDeleteSymptomModal(true);
                              }}
                              className="p-1 rounded-lg text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{symptom.description}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Patient Symptoms Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-green-800">Patient Symptoms</h2>
                    <p className="text-sm text-gray-500 mt-1">View and manage patient symptoms</p>
                  </div>
                  {selectedPatientId && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddPatientSymptomModal(true)}
                      className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white flex items-center gap-1 hover:opacity-90 transition-opacity"
                    >
                      <PlusCircle size={16} /> Add Symptom
                    </motion.button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                {/* Patient List */}
                <div className="bg-gray-50 rounded-lg p-4">
                  {loadingPatients ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <PatientList
                      patients={mappedPatients}
                      selectedPatientId={selectedPatientId}
                      onSelectPatient={setSelectedPatientId}
                    />
                  )}
                </div>

                {/* Patient Symptoms List */}
                <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Symptoms History</h3>
                  {selectedPatientId ? (
                    loadingPatientSymptoms ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {patientSymptoms.map(symptom => (
                          <div
                            key={symptom.symptom_id}
                            className="bg-white rounded-lg p-4 shadow-sm"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-green-800">{symptom.symptom_name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{symptom.description}</p>
                                <div className="text-xs text-gray-500 mt-2">
                                  Reported on: {new Date(symptom.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedPatientSymptom(symptom);
                                    setShowDeletePatientSymptomModal(true);
                                  }}
                                  className="p-1 rounded-lg text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-gray-400 text-center mt-20 text-xl">
                      Select a patient to view their symptoms
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Symptom Modal */}
        {showAddSymptomModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={addSymptomModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Add New Symptom</h2>
                <button onClick={() => setShowAddSymptomModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingSymptom(true);
                setSymptomFormError("");
                setSymptomFormSuccess("");
                try {
                  await doctorService.addSymptom(newSymptom);
                  setSymptomFormSuccess("Symptom added successfully!");
                  setShowAddSymptomModal(false);
                  setNewSymptom({ symptom_name: "", description: "" });
                  fetchSymptoms();
                } catch (err: unknown) {
                  const errorMessage = err instanceof Error ? err.message : "Failed to add symptom";
                  setSymptomFormError(errorMessage);
                } finally {
                  setIsSubmittingSymptom(false);
                }
              }} className="p-4 space-y-4">
                {symptomFormError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {symptomFormError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newSymptom.symptom_name}
                    onChange={(e) => setNewSymptom({ ...newSymptom, symptom_name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Description</label>
                  <textarea
                    required
                    value={newSymptom.description}
                    onChange={(e) => setNewSymptom({ ...newSymptom, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                  />
                </div>
                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddSymptomModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSymptom}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isSubmittingSymptom ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />} Add
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Symptom Modal */}
        {showEditSymptomModal && selectedSymptom && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={editSymptomModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Edit Symptom</h2>
                <button onClick={() => setShowEditSymptomModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmittingSymptom(true);
                setSymptomFormError("");
                setSymptomFormSuccess("");
                try {
                  await doctorService.updateSymptom(selectedSymptom);
                  setSymptomFormSuccess("Symptom updated successfully!");
                  setShowEditSymptomModal(false);
                  fetchSymptoms();
                } catch (err: unknown) {
                  const errorMessage = err instanceof Error ? err.message : "Failed to update symptom";
                  setSymptomFormError(errorMessage);
                } finally {
                  setIsSubmittingSymptom(false);
                }
              }} className="p-4 space-y-4">
                {symptomFormError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {symptomFormError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={selectedSymptom.symptom_name}
                    onChange={(e) => setSelectedSymptom({ ...selectedSymptom, symptom_name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Description</label>
                  <textarea
                    required
                    value={selectedSymptom.description}
                    onChange={(e) => setSelectedSymptom({ ...selectedSymptom, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                  />
                </div>
                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditSymptomModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSymptom}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isSubmittingSymptom ? <Loader2 size={16} className="animate-spin" /> : <Edit size={16} />} Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Symptom Modal */}
        {showDeleteSymptomModal && selectedSymptom && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={deleteSymptomModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Delete Symptom</h2>
                <button onClick={() => setShowDeleteSymptomModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <p className="mb-4 text-green-700">Are you sure you want to delete <span className="font-semibold text-red-600">{selectedSymptom.symptom_name}</span>?</p>
                {symptomFormError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {symptomFormError}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteSymptomModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setIsSubmittingSymptom(true);
                      setSymptomFormError("");
                      setSymptomFormSuccess("");
                      try {
                        await doctorService.deleteSymptom(selectedSymptom.symptom_id);
                        setSymptomFormSuccess("Symptom deleted successfully!");
                        setShowDeleteSymptomModal(false);
                        fetchSymptoms();
                      } catch (err: unknown) {
                        const errorMessage = err instanceof Error ? err.message : "Failed to delete symptom";
                        setSymptomFormError(errorMessage);
                      } finally {
                        setIsSubmittingSymptom(false);
                      }
                    }}
                    disabled={isSubmittingSymptom}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isSubmittingSymptom ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Add Patient Symptom Modal */}
        {showAddPatientSymptomModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={addPatientSymptomModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Add Patient Symptom</h2>
                <button onClick={() => setShowAddPatientSymptomModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddPatientSymptom} className="p-4 space-y-4">
                {patientSymptomFormError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {patientSymptomFormError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Symptom Type</label>
                  <select
                    required
                    value={newPatientSymptom.symptom_id}
                    onChange={(e) => setNewPatientSymptom({ ...newPatientSymptom, symptom_id: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                  >
                    <option value="">Select a symptom type</option>
                    {symptoms.map((symptom) => (
                      <option key={symptom.symptom_id} value={symptom.symptom_id}>
                        {symptom.symptom_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddPatientSymptomModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPatientSymptom}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isSubmittingPatientSymptom ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />} Add
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Patient Symptom Modal */}
        {showDeletePatientSymptomModal && selectedPatientSymptom && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={deletePatientSymptomModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Delete Patient Symptom</h2>
                <button onClick={() => setShowDeletePatientSymptomModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <p className="mb-4 text-green-700">Are you sure you want to delete this symptom record?</p>
                {patientSymptomFormError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {patientSymptomFormError}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeletePatientSymptomModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePatientSymptom}
                    disabled={isSubmittingPatientSymptom}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isSubmittingPatientSymptom ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AuthWrapper>
    </PageTemplate>
  );
}
