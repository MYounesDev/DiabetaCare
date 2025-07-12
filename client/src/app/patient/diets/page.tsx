"use client";
import { useState, useEffect, useRef } from "react";
import { patientService } from "@/services/api";
import PageTemplate from "@/components/layout/PageTemplate";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Edit,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  Utensils,
  Trash2,
} from "lucide-react";
import DietLogsCalendar from '@/components/calendar/DietLogsCalendar';
import StyledCheckbox from '@/components/ui/StyledCheckbox';
import CustomDatePicker from '@/components/ui/DatePicker';

interface Diet {
  id: string;
  diet_name: string;
  description: string;
  status: string;
  start_date: string;
  end_date?: string;
}

interface DietLog {
  diet_logs_id: number;
  log_date: string;
  is_completed: boolean;
  note: string;
  patient_diet_id?: string;
}

export default function PatientDiets() {
  // State for diets
  const [diets, setDiets] = useState<Diet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiet, setSelectedDiet] = useState<Diet | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logData, setLogData] = useState({
    log_date: new Date().toISOString().split('T')[0],
    is_completed: false,
    note: "",
  });
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [logError, setLogError] = useState("");
  const [logSuccess, setLogSuccess] = useState("");

  // State for logs
  const [dietLogs, setDietLogs] = useState<DietLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const logModalRef = useRef<HTMLDivElement>(null);

  // State for edit log modal
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [logToEdit, setLogToEdit] = useState<DietLog | null>(null);
  const [isSubmittingEditLog, setIsSubmittingEditLog] = useState(false);
  const [editLogFormError, setEditLogFormError] = useState("");
  const [editLogFormSuccess, setEditLogFormSuccess] = useState("");
  const editLogModalRef = useRef<HTMLDivElement>(null);

  // Handle click outside for edit log modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if ((showLogModal && logModalRef.current && !logModalRef.current.contains(event.target as Node)) ||
          (showEditLogModal && editLogModalRef.current && !editLogModalRef.current.contains(event.target as Node))) {
        setShowLogModal(false);
        setShowEditLogModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLogModal, showEditLogModal]);

  // Fetch patient diets
  const fetchDiets = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      if (!userData?.id) {
        throw new Error('User ID not found');
      }
      const res = await patientService.getPatientDietsByPatient(userData.id);
      setDiets(res.data.patientDiets || []);
    } catch (err: unknown) {
      console.error("Error fetching diets:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load diets"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch diet logs
  const fetchDietLogs = async (dietId: string) => {
    if (!dietId) return;
    setLoadingLogs(true);
    try {
      const res = await patientService.getPatientDietLogs(dietId);
      setDietLogs(res.data.dietLogs || []);
    } catch (err) {
      console.error("Error fetching diet logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchDiets();
  }, []);

  useEffect(() => {
    if (selectedDiet) {
      fetchDietLogs(selectedDiet.id);
    }
  }, [selectedDiet]);

  // Handle log submission
  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiet) return;

    setIsSubmittingLog(true);
    setLogError("");
    setLogSuccess("");

    try {
      await patientService.addDietLog({
        patient_diet_id: selectedDiet.id,
        ...logData,
      });
      setLogSuccess("Diet log added successfully!");
      fetchDietLogs(selectedDiet.id);
      setShowLogModal(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add diet log";
      setLogError(errorMessage);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  // Handle edit log submission
  const handleEditLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logToEdit) return;

    setIsSubmittingEditLog(true);
    setEditLogFormError("");
    setEditLogFormSuccess("");

    try {
      await patientService.updateDietLog({
        diet_logs_id: logToEdit.diet_logs_id,
        is_completed: logToEdit.is_completed,
        note: logToEdit.note,
      });
      setEditLogFormSuccess("Log updated successfully!");
      setShowEditLogModal(false);
      if (selectedDiet) {
        fetchDietLogs(selectedDiet.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update log";
      setEditLogFormError(errorMessage);
    } finally {
      setIsSubmittingEditLog(false);
    }
  };

  // Handle delete log
  const handleDeleteLog = async (log: DietLog) => {
    if (!log.diet_logs_id) return;

    setIsSubmittingEditLog(true);
    setEditLogFormError("");
    setEditLogFormSuccess("");

    try {
      await patientService.deleteDietLog(log.diet_logs_id);
      setEditLogFormSuccess("Log deleted successfully!");
      setShowEditLogModal(false);
      setLogToEdit(null);
      if (selectedDiet) {
        fetchDietLogs(selectedDiet.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete log";
      setEditLogFormError(errorMessage);
    } finally {
      setIsSubmittingEditLog(false);
    }
  };

  return (
    <PageTemplate>
      <AuthWrapper allowedRoles={["patient"]}>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2">My Diet Plans</h1>
            <p className="text-gray-600">Track and manage your assigned diet plans</p>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Diet Plans Grid */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : error ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-teal-500" size={24} />
                      <p className="text-teal-700">{error}</p>
                    </div>
                  </motion.div>
                ) : diets.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No diets assigned</h3>
                    <p className="mt-1 text-sm text-gray-500">Wait for your doctor to assign diets to you.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {diets.map((diet) => (
                      <motion.div
                        key={diet.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 ${
                          selectedDiet?.id === diet.id ? 'ring-2 ring-green-500' : ''
                        }`}
                        onClick={() => setSelectedDiet(diet)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-semibold text-green-800">{diet.diet_name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            diet.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {diet.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{diet.description}</p>
                        <div className="space-y-2 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>Start: {new Date(diet.start_date).toLocaleDateString()}</span>
                          </div>
                          {diet.end_date && (
                            <div className="flex items-center gap-2">
                              <Clock size={16} />
                              <span>End: {new Date(diet.end_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            setLogData({
                              log_date: new Date().toISOString().split('T')[0],
                              is_completed: false,
                              note: "",
                            });
                            e.stopPropagation();
                            setSelectedDiet(diet);
                            setShowLogModal(true);
                          }}
                          className="mt-4 w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <Utensils size={16} />
                          Enter Log
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Diet Logs Calendar */}
            {selectedDiet && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-green-800">Diet Logs</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Track your progress for {selectedDiet.diet_name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {loadingLogs ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <DietLogsCalendar
                      logs={dietLogs}
                      onAddLog={(date) => {
                        setLogData({
                          log_date: date,
                          is_completed: false,
                          note: "",
                        });
                        setShowLogModal(true);
                      }}
                      onEditLog={(log) => {
                        setLogToEdit(log);
                        setShowEditLogModal(true);
                      }}
                      onDeleteLog={handleDeleteLog}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Add Log Modal */}
            {showLogModal && (
              <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
                <motion.div
                  ref={logModalRef}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                    <h2 className="text-xl font-bold text-green-800">Log Diet Progress</h2>
                    <button 
                      onClick={() => setShowLogModal(false)} 
                      className="p-1 rounded-full hover:bg-green-100 text-green-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleLogSubmit} className="p-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <CustomDatePicker
                          selectedDate={logData.log_date ? new Date(logData.log_date) : null}
                          onChange={(date) => setLogData({ ...logData, log_date: date ? date.toISOString().split('T')[0] : '' })}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:outline-none text-green-800"
                        />
                      </div>

                      <div className="flex items-center">
                        <StyledCheckbox
                          id="add-log-completed"
                          checked={logData.is_completed}
                          onChange={(e) =>
                            setLogData({ ...logData, is_completed: e.target.checked })
                          }
                          label="Mark as completed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                          value={logData.note}
                          onChange={(e) => setLogData({ ...logData, note: e.target.value })}
                          rows={3}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:outline-none text-green-800"
                          placeholder="How did your diet go today? Any challenges?"
                        />
                      </div>

                      {logError && (
                        <div className="text-teal-600 text-sm bg-teal-50 p-2 rounded-lg border border-teal-200">
                          {logError}
                        </div>
                      )}
                      {logSuccess && (
                        <div className="text-green-600 text-sm bg-green-50 p-2 rounded-lg border border-green-200">
                          {logSuccess}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={() => setShowLogModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingLog}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                      >
                        {isSubmittingLog ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Save Progress
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}

            {/* Edit Log Modal */}
            {showEditLogModal && logToEdit && (
              <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
                <motion.div
                  ref={editLogModalRef}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                    <h2 className="text-xl font-bold text-green-800">Edit Diet Log</h2>
                    <button onClick={() => setShowEditLogModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleEditLogSubmit} className="p-4 space-y-4">
                    {editLogFormError && (
                      <div className="bg-teal-50 text-teal-600 p-3 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle size={16} /> {editLogFormError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">Note</label>
                      <textarea
                        required
                        value={logToEdit.note}
                        onChange={e => setLogToEdit({ ...logToEdit, note: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                      />
                    </div>
                    <div className="flex items-center">
                      <StyledCheckbox
                        id="edit-log-completed"
                        checked={logToEdit.is_completed}
                        onChange={(e) =>
                          setLogToEdit({ ...logToEdit, is_completed: e.target.checked })
                        }
                        label="Mark as completed"
                      />
                    </div>
                    <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowEditLogModal(false)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLog(logToEdit)}
                        disabled={isSubmittingEditLog}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-rose-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                      >
                        {isSubmittingEditLog ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingEditLog}
                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                      >
                        {isSubmittingEditLog ? <Loader2 size={16} className="animate-spin" /> : <Edit size={16} />} Save
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </AuthWrapper>
    </PageTemplate>
  );
} 
