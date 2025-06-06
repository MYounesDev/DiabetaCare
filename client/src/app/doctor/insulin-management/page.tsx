"use client";
import { useState, useRef, useEffect } from "react";
import { doctorService } from "@/services/api";
import PageTemplate from "@/components/layout/PageTemplate";
import AuthWrapper from "@/components/auth/AuthWrapper";
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
  Users,
  Search,
  Droplet,
  Calendar,
} from "lucide-react";
import PatientList from '@/components/patients/PatientList';
import InsulinLogsCalendar from '@/components/calendar/InsulinLogsCalendar';


interface InsulinRecommendation {
  insulin_recommendations_id: string;
  min_blood_sugar: number;
  max_blood_sugar: number;
  level_description: string;
  insulin_dosage_ml: number;
  note: string;
}

interface InsulinLog {
  insulin_log_id: string;
  patient_id: string;
  log_date: string;
  insulin_dosage_ml: number;
  note: string;
}

interface Patient {
  id: string;
  full_name: string;
  username: string;
  profile_picture?: string;
}

export default function DoctorInsulinManagement() {
  // State for insulin recommendations
  const [recommendations, setRecommendations] = useState<InsulinRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [showAddRecommendationModal, setShowAddRecommendationModal] = useState(false);
  const [showEditRecommendationModal, setShowEditRecommendationModal] = useState(false);
  const [recommendationToEdit, setRecommendationToEdit] = useState<InsulinRecommendation | null>(null);
  const [searchRecommendation, setSearchRecommendation] = useState('');

  // State for patients
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // State for insulin logs
  const [insulinLogs, setInsulinLogs] = useState<InsulinLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Modal refs for click outside handling
  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);

  // Fetch all data on mount
  useEffect(() => {
    fetchInsulinRecommendations();
    fetchPatients();
  }, []);

  // Fetch logs when selected patient changes
  useEffect(() => {
    if (selectedPatientId) {
      fetchInsulinLogs(selectedPatientId);
    } else {
      setInsulinLogs([]);
    }
  }, [selectedPatientId]);


  // Handle click outside modals
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAddRecommendationModal && addModalRef.current && !addModalRef.current.contains(event.target as Node)) {
        setShowAddRecommendationModal(false);
      }
      if (showEditRecommendationModal && editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
        setShowEditRecommendationModal(false);
        setRecommendationToEdit(null);
      }
    };

    if (showAddRecommendationModal || showEditRecommendationModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddRecommendationModal, showEditRecommendationModal]);

  const fetchInsulinRecommendations = async () => {
    try {
      setLoadingRecommendations(true);
      const response = await doctorService.getInsulinRecommendation();
      setRecommendations(response.data.insulinRecommendations);
    } catch (error) {
      console.error('Error fetching insulin recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await doctorService.getPatients();
      setPatients(response.data.patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchInsulinLogs = async (patientId: string) => {
    try {
      setLoadingLogs(true);
      const response = await doctorService.getInsulinLogs(patientId);
      setInsulinLogs(response.data.patientInsulinLogs);
    } catch (error) {
      console.error('Error fetching insulin logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleAddRecommendation = async (data: Omit<InsulinRecommendation, 'insulin_recommendations_id'>) => {
    try {
      await doctorService.createInsulinRecommendation(data);
      fetchInsulinRecommendations();
      setShowAddRecommendationModal(false);
    } catch (error) {
      console.error('Error adding insulin recommendation:', error);
    }
  };

  const handleEditRecommendation = async (data: InsulinRecommendation) => {
    try {
      await doctorService.updateInsulinRecommendation(data);
      fetchInsulinRecommendations();
      setShowEditRecommendationModal(false);
      setRecommendationToEdit(null);
    } catch (error) {
      console.error('Error updating insulin recommendation:', error);
    }
  };

  const handleDeleteRecommendation = async (id: string) => {
    try {
      await doctorService.deleteInsulinRecommendation(id);
      fetchInsulinRecommendations();
    } catch (error) {
      console.error('Error deleting insulin recommendation:', error);
    }
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
  };

  const handleAddLog = async (logData: { 
    patient_id: number;
    log_date: string;
    log_time: string;
    insulin_dosage_ml: number;
    note: string;
  }) => {
    try {
      // Add the insulin log
      await doctorService.addInsulinLog({
        patient_id: selectedPatientId,
        log_date: logData.log_date,
        insulin_dosage_ml: logData.insulin_dosage_ml,
        note: logData.note
      });

      fetchInsulinLogs(selectedPatientId);
    } catch (error) {
      console.error('Error adding insulin log:', error);
    }
  };

  const handleEditLog = async (log: InsulinLog) => {
    try {
      await doctorService.updateInsulinLog(log);
      if (selectedPatientId) {
        fetchInsulinLogs(selectedPatientId);
      }
    } catch (error) {
      console.error('Error updating insulin log:', error);
    }
  };

  const handleDeleteLog = async (log: InsulinLog) => {
    try {
      await doctorService.deleteInsulinLog(log);
      if (selectedPatientId) {
        fetchInsulinLogs(selectedPatientId);
      }
    } catch (error) {
      console.error('Error deleting insulin log:', error);
    }
  };

  // Filter recommendations based on search
  const filteredRecommendations = recommendations.filter(recommendation =>
    recommendation.level_description.toLowerCase().includes(searchRecommendation.toLowerCase()) ||
    recommendation.note.toLowerCase().includes(searchRecommendation.toLowerCase())
  );

  // Map patients to the format expected by PatientList
  const mappedPatients = patients.map(patient => ({
    exercise_logs_id: patient.id, // Using id as exercise_logs_id for compatibility
    full_name: patient.full_name,
    username: patient.username,
    profile_picture: patient.profile_picture
  }));

  return (
    <PageTemplate>
      <AuthWrapper allowedRoles={["doctor"]}>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-orange-800 mb-2">Insulin Management</h1>
            <p className="text-gray-600">Manage insulin recommendations and track patient insulin logs</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8">
            {/* Insulin Recommendations Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Droplet className="h-6 w-6 text-orange-600" />
                    <h2 className="text-xl font-bold text-orange-800">Insulin Recommendations</h2>
                  </div>
                  <button
                    onClick={() => setShowAddRecommendationModal(true)}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <PlusCircle size={20} />
                    Add New
                  </button>
                </div>
                <div className="mt-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search recommendations..."
                      value={searchRecommendation}
                      onChange={(e) => setSearchRecommendation(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg  focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="p-4">
                {loadingRecommendations ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRecommendations.map((recommendation) => (
                      <motion.div
                        key={recommendation.insulin_recommendations_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg text-orange-800">{recommendation.level_description}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setRecommendationToEdit(recommendation);
                                setShowEditRecommendationModal(true);
                              }}
                              className="p-2 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteRecommendation(recommendation.insulin_recommendations_id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Blood Sugar Range:</span>{' '}
                            {recommendation.min_blood_sugar} - {recommendation.max_blood_sugar} mg/dL
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Insulin Dosage:</span>{' '}
                            {recommendation.insulin_dosage_ml} mL
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2">{recommendation.note}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Patient List and Calendar Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patient List */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-orange-600" />
                    <h2 className="text-xl font-bold text-orange-800">Patients</h2>
                  </div>
                </div>
                <div className="p-4">
                  {loadingPatients ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                    </div>
                  ) : (
                    <PatientList
                      patients={mappedPatients}
                      selectedPatientId={selectedPatientId}
                      onSelectPatient={handleSelectPatient}
                    />
                  )}
                </div>
              </div>

              {/* Insulin Logs Calendar */}
              <div className="lg:col-span-2">

                {selectedPatientId ? (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-orange-600" />
                        <div>
                          <h2 className="text-xl font-bold text-orange-800">Insulin Logs</h2>
                          <p className="text-sm text-gray-500 mt-1">
                            Track and manage insulin administration for {patients.find(p => p.id === selectedPatientId)?.full_name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      {loadingLogs ? (
                        <div className="flex justify-center items-center h-64">
                          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                        </div>
                      ) : (
                        <InsulinLogsCalendar
                          logs={insulinLogs}
                          patientId={selectedPatientId}
                          onAddLog={handleAddLog}
                          onEditLog={handleEditLog}
                          onDeleteLog={handleDeleteLog}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center bg-white rounded-xl shadow-sm p-8">
                    <div className="text-center">
                      <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No Patient Selected</h3>
                      <p className="mt-1 text-sm text-gray-500">Please select a patient to view their insulin logs.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Recommendation Modal */}
        {showAddRecommendationModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={addModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
                <div>
                  <h2 className="text-xl font-bold text-orange-800">Add Insulin Recommendation</h2>
                  <p className="text-sm text-gray-600 mt-1">Create a new insulin recommendation</p>
                </div>
                <button
                  onClick={() => setShowAddRecommendationModal(false)}
                  className="p-1 rounded-full hover:bg-orange-100 text-orange-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleAddRecommendation({
                    min_blood_sugar: Number(formData.get('min_blood_sugar')),
                    max_blood_sugar: Number(formData.get('max_blood_sugar')),
                    level_description: formData.get('level_description') as string,
                    insulin_dosage_ml: Number(formData.get('insulin_dosage_ml')),
                    note: formData.get('note') as string,
                  });
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Level Description</label>
                      <input
                        type="text"
                        name="level_description"
                        required
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                        placeholder="e.g., Normal, High, Very High"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Min Blood Sugar (mg/dL)</label>
                        <input
                          type="number"
                          name="min_blood_sugar"
                          required
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Blood Sugar (mg/dL)</label>
                        <input
                          type="number"
                          name="max_blood_sugar"
                          required
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Insulin Dosage (mL)</label>
                      <input
                        type="number"
                        name="insulin_dosage_ml"
                        step="0.1"
                        required
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Note</label>
                      <textarea
                        name="note"
                        required
                        rows={3}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                        placeholder="Additional information about this recommendation..."
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddRecommendationModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Add Recommendation
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Recommendation Modal */}
        {showEditRecommendationModal && recommendationToEdit && (
          <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={editModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
                <div>
                  <h2 className="text-xl font-bold text-orange-800">Edit Insulin Recommendation</h2>
                  <p className="text-sm text-gray-600 mt-1">Update recommendation details</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditRecommendationModal(false);
                    setRecommendationToEdit(null);
                  }}
                  className="p-1 rounded-full hover:bg-orange-100 text-orange-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleEditRecommendation({
                    insulin_recommendations_id: recommendationToEdit.insulin_recommendations_id,
                    min_blood_sugar: Number(formData.get('min_blood_sugar')),
                    max_blood_sugar: Number(formData.get('max_blood_sugar')),
                    level_description: formData.get('level_description') as string,
                    insulin_dosage_ml: Number(formData.get('insulin_dosage_ml')),
                    note: formData.get('note') as string,
                  });
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Level Description</label>
                      <input
                        type="text"
                        name="level_description"
                        defaultValue={recommendationToEdit.level_description}
                        required
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Min Blood Sugar (mg/dL)</label>
                        <input
                          type="number"
                          name="min_blood_sugar"
                          defaultValue={recommendationToEdit.min_blood_sugar}
                          required
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Blood Sugar (mg/dL)</label>
                        <input
                          type="number"
                          name="max_blood_sugar"
                          defaultValue={recommendationToEdit.max_blood_sugar}
                          required
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-orange-500 focus:outline-none text-orange-800"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Insulin Dosage (mL)</label>
                      <input
                        type="number"
                        name="insulin_dosage_ml"
                        step="0.1"
                        defaultValue={recommendationToEdit.insulin_dosage_ml}
                        required
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-orange-500 focus:outline-none text-orange-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Note</label>
                      <textarea
                        name="note"
                        defaultValue={recommendationToEdit.note}
                        required
                        rows={3}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-orange-500 focus:outline-none text-orange-800"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditRecommendationModal(false);
                        setRecommendationToEdit(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Update Recommendation
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AuthWrapper>
    </PageTemplate>
  );
}
