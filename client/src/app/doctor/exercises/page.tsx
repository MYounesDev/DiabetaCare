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
  Users,
  Search,
} from "lucide-react";
import PatientList from '@/app/doctor/exercises/PatientList';
import PatientPlans from './PatientPlans';
import ExerciseLogsCalendar from '@/components/ExerciseLogsCalendar';
import StyledCheckbox from '@/components/StyledCheckbox';
import CustomDatePicker from '@/components/DatePicker';

interface Patient {
  id: string;
  full_name: string;
}

interface Exercise {
  exercise_id: string;
  exercise_name: string;
}

interface PatientExercise {
  id: string;
  patient_id: string;
  patient_exercise_id: string;
}

interface ExerciseType {
  exercise_id: string;
  exercise_name: string;
}

interface ExerciseLog {
  exercise_logs_id: number;
  patient_exercise_id: string;
  note: string;
  is_completed: boolean;
}

export default function DoctorExercises() {
  // Exercise Types
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typeError, setTypeError] = useState<string | null>(null);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showEditTypeModal, setShowEditTypeModal] = useState(false);
  const [showDeleteTypeModal, setShowDeleteTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ExerciseType | null>(null);
  const [newType, setNewType] = useState({ name: "", description: "" });
  const [isSubmittingType, setIsSubmittingType] = useState(false);
  const [typeFormError, setTypeFormError] = useState("");
  const [typeFormSuccess, setTypeFormSuccess] = useState("");
  const [typeAssignments, setTypeAssignments] = useState({});
  const addTypeModalRef = useRef<HTMLDivElement>(null);
  const editTypeModalRef = useRef<HTMLDivElement>(null);
  const deleteTypeModalRef = useRef<HTMLDivElement>(null);

  // Patient Exercises
  const [patientExercises, setPatientExercises] = useState<PatientExercise[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({
    patient_id: "",
    exercise_id: "",
    doctor_id: "",
    status: "pending",
    start_date: "",
    end_date: "",
  });
  const [searchPatient, setSearchPatient] = useState("");
  const [searchExercise, setSearchExercise] = useState("");
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planFormError, setPlanFormError] = useState("");
  const [planFormSuccess, setPlanFormSuccess] = useState("");
  const assignModalRef = useRef<HTMLDivElement>(null);

  // New state for recommended exercises
  const [recommendedExercises, setRecommendedExercises] = useState([]);

  // Completed Exercise Logs
  const [completedLogs, setCompletedLogs] = useState<ExerciseLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState(null);

  // Patients for assignment
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  // New state for selection
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const selectedPatientPlans = patientExercises.filter(
    pe => pe.patient_id === selectedPatientId
  );

  const selectedPlan = selectedPatientPlans.find(
    pe => pe.id === selectedPlanId
  );

  // For calendar, filter logs for selected plan
  const selectedPlanLogs = completedLogs.filter(
    log => log.patient_exercise_id === selectedPlanId
  );

  // Edit/delete plan modals
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showDeletePlanModal, setShowDeletePlanModal] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<ExerciseLog | null>(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [isSubmittingEditPlan, setIsSubmittingEditPlan] = useState(false);
  const [editPlanFormError, setEditPlanFormError] = useState("");
  const [patientIsSelected, setPatientIsSelected] = useState(false);
  const [isSubmittingDeletePlan, setIsSubmittingDeletePlan] = useState(false);
  const [deletePlanFormError, setDeletePlanFormError] = useState("");

  // Edit log modal
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [logToEdit, setLogToEdit] = useState<ExerciseLog | null>(null);
  const [isSubmittingEditLog, setIsSubmittingEditLog] = useState(false);
  const [editLogFormError, setEditLogFormError] = useState("");
  const [editLogFormSuccess, setEditLogFormSuccess] = useState("");

  const editLogModalRef = useRef<HTMLDivElement>(null);
  const editPlanModalRef = useRef<HTMLDivElement>(null);
  const deletePlanModalRef = useRef<HTMLDivElement>(null);

  // Filter patients and exercises based on search
  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchPatient.toLowerCase())
  );

  const filteredExercises = exerciseTypes.filter(exercise =>
    exercise.exercise_name.toLowerCase().includes(searchExercise.toLowerCase())
  );

  // Fetch all data on mount
  useEffect(() => {
    fetchExerciseTypes();
    fetchPatients();
  }, []);

  // Fetch exercises when selected patient changes
  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientExercises(selectedPatientId);
      setSelectedPlanId(null); // Reset selected plan when patient changes
      setCompletedLogs([]); // Clear logs when patient changes
    } else {
      setPatientExercises([]);
      setCompletedLogs([]);
    }
  }, [selectedPatientId]);

  // Fetch logs when selected plan changes
  useEffect(() => {
    if (selectedPatientId && selectedPlanId) {
      fetchCompletedLogs(selectedPlanId);
    } else {
      setCompletedLogs([]);
    }
  }, [selectedPatientId, selectedPlanId]);

  // Format a date as YYYY-MM-DD string without timezone issues
  const formatDateToYYYYMMDD = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch exercise types with assignments
  const fetchExerciseTypes = async () => {
    setLoadingTypes(true);
    setTypeError(null);
    try {
      const res = await doctorService.getExerciseTypes();
      const types = res.data.exercisePlans || [];
      setExerciseTypes(types);

      // Fetch assignments for each type
      const assignments: Record<string, number> = {};
      for (const type of types) {
        const assignRes = await doctorService.getSumPatientExerciseAssignments(type.exercise_id);
        assignments[type.exercise_id] = assignRes.data.totalAssignments;
      }
      setTypeAssignments(assignments);
    } catch (err) {
      console.error("Error fetching exercise types:", err);
      setTypeError("Failed to load exercise types");
    } finally {
      setLoadingTypes(false);
    }
  };

  // Fetch patient exercises
  const fetchPatientExercises = async (patientId: string) => {
    if (!patientId) return;

    setLoadingPlans(true);
    setPlanError(null);
    try {
      const res = await doctorService.getPatientExercisesByPatient(patientId);
      setPatientExercises(res.data.patientExercises || []);
    } catch (err: unknown) {
      console.error("Error fetching patient exercises:", err);
      setPlanError(err instanceof Error ? err.message : "Failed to load patient exercise plans");
    } finally {
      setLoadingPlans(false);
    }
  };

  // Fetch completed logs
  const fetchCompletedLogs = async (patient_exercise_id: string) => {
    if (!patient_exercise_id) return;

    setLoadingLogs(true);
    try {
      const res = await doctorService.getPatientExerciseLogs(patient_exercise_id);
      setCompletedLogs(res.data.exerciseLogs || []);
    } catch (err: unknown) {
      console.error("Error fetching completed logs:", err);
      setLogsError(err instanceof Error ? err.message : "Failed to load exercise logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch patients
  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await doctorService.getPatients();
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Handle click outside for all modals
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showAddTypeModal && addTypeModalRef.current && !addTypeModalRef.current.contains(event.target as Node)) {
        setShowAddTypeModal(false);
      }
      if (showEditTypeModal && editTypeModalRef.current && !editTypeModalRef.current.contains(event.target as Node)) {
        setShowEditTypeModal(false);
      }
      if (showDeleteTypeModal && deleteTypeModalRef.current && !deleteTypeModalRef.current.contains(event.target as Node)) {
        setShowDeleteTypeModal(false);
      }
      if (showAssignModal && assignModalRef.current && !assignModalRef.current.contains(event.target as Node)) {
        setShowAssignModal(false);
      }
      if (showEditLogModal && editLogModalRef.current && !editLogModalRef.current.contains(event.target as Node)) {
        setShowEditLogModal(false);
      }
      if (showEditPlanModal && editPlanModalRef.current && !editPlanModalRef.current.contains(event.target as Node)) {
        setShowEditPlanModal(false);
      }
      if (showDeletePlanModal && deletePlanModalRef.current && !deletePlanModalRef.current.contains(event.target as Node)) {
        setShowDeletePlanModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddTypeModal, showEditTypeModal, showDeleteTypeModal, showAssignModal, showEditLogModal, showEditPlanModal, showDeletePlanModal]);

  // Add Exercise Type
  const handleAddType = async (e) => {
    e.preventDefault();
    setIsSubmittingType(true);
    setTypeFormError("");
    setTypeFormSuccess("");
    try {
      await doctorService.createExerciseType(newType.name, newType.description);
      setTypeFormSuccess("Exercise type added successfully!");
      setShowAddTypeModal(false);
      setNewType({ name: "", description: "" });
      fetchExerciseTypes();
    } catch (err) {
      setTypeFormError(err.message || "Failed to add exercise type");
    } finally {
      setIsSubmittingType(false);
    }
  };
  
  // Fetch exercise recommendations
  const fetchExerciseRecommendations = async (id) => {
    try {
      const res = await doctorService.getExerciseRecommendation(id);
      setRecommendedExercises(res.data.result_reco || []);
    } catch (err) {
      console.error("Error fetching exercise recommendations:", err);
      setRecommendedExercises([]);
    }
  }

  // Edit Exercise Type
  const handleEditType = async (e) => {
    e.preventDefault();
    setIsSubmittingType(true);
    setTypeFormError("");
    setTypeFormSuccess("");
    try {
      if (!selectedType) return;
      await doctorService.updateExerciseType(selectedType.exercise_id, selectedType.exercise_name, selectedType.description);
      setTypeFormSuccess("Exercise type updated successfully!");
      setShowEditTypeModal(false);
      fetchExerciseTypes();
    } catch (err) {
      setTypeFormError(err.message || "Failed to update exercise type");
    } finally {
      setIsSubmittingType(false);
    }
  };

  // Delete Exercise Type
  const handleDeleteType = async () => {
    setIsSubmittingType(true);
    setTypeFormError("");
    setTypeFormSuccess("");
    try {
      if (!selectedType) return;
      await doctorService.deleteExerciseType(selectedType.exercise_id);
      setTypeFormSuccess("Exercise type deleted successfully!");
      setShowDeleteTypeModal(false);
      fetchExerciseTypes();
    } catch (err) {
      setTypeFormError(err.message || "Failed to delete exercise type");
    } finally {
      setIsSubmittingType(false);
    }
  };

  // Assign Exercise Plan to Patient
  const handleAssignPlan = async (e) => {
    e.preventDefault();
    setIsSubmittingPlan(true);
    setPlanFormError("");
    setPlanFormSuccess("");
    try {
      // Only include end_date if it's not empty
      const dataToSubmit = {
        ...assignData,
        end_date: assignData.end_date || null
      };
      await doctorService.addPatientExercise(dataToSubmit);
      setPlanFormSuccess("Exercise plan assigned successfully!");
      setShowAssignModal(false);
      setAssignData({
        patient_id: "",
        exercise_id: "",
        doctor_id: "",
        status: "pending",
        start_date: "",
        end_date: "",
      });
      fetchPatientExercises(selectedPatientId);
    } catch (err) {
      setPlanFormError(err.message || "Failed to assign exercise plan");
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // UI helpers - fixed to work with actual data structures
  const getPatientName = (id) => {
    const p = patients.find(pt => pt.id === id);
    return p ? p.full_name : id;
  };

  const getExerciseName = (id) => {
    const ex = exerciseTypes.find(et => et.exercise_id === id);
    return ex ? ex.exercise_name : id;
  };

  // Selection handlers
  const handleSelectPatient = async (id) => {
    setSelectedPatientId(id);
    setSelectedPlanId(null);

  };

  const handleSelectPlan = (id) => {
    setSelectedPlanId(id);
  };

  const handleEditPlan = (plan) => {
    // Format dates to YYYY-MM-DD for the date inputs without timezone issues
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formattedPlan = {
      ...plan,
      start_date: formatDate(plan.start_date),
      end_date: formatDate(plan.end_date)
    };
    setPlanToEdit(formattedPlan);
    setShowEditPlanModal(true);
    setEditPlanFormError("");
    setEditPlanFormSuccess("");
  };

  const handleEditPlanSubmit = async (e) => {
    e.preventDefault();
    if (!planToEdit) return;
    setIsSubmittingEditPlan(true);
    setEditPlanFormError("");
    setEditPlanFormSuccess("");
    try {
      // Get the original plan data to ensure we have all required fields
      const originalPlan = patientExercises.find(p => p.id === planToEdit.exercise_logs_id);
      if (!originalPlan) {
        throw new Error("Original plan data not found");
      }

      // Prepare the update data with all required fields
      const updateData = {
        patient_exercise_id: planToEdit.exercise_logs_id,
        patient_id: originalPlan.patient_id,
        exercise_id: originalPlan.exercise_id,
        doctor_id: originalPlan.doctor_id,
        status: planToEdit.status,
        start_date: planToEdit.start_date,
        end_date: planToEdit.end_date || null
      };

      await doctorService.updatePatientExercise(updateData);
      setEditPlanFormSuccess("Plan updated successfully!");
      setShowEditPlanModal(false);
      setPlanToEdit(null);
      fetchPatientExercises(selectedPatientId);
    } catch (err) {
      setEditPlanFormError(err.message || "Failed to update plan");
    } finally {
      setIsSubmittingEditPlan(false);
    }
  };

  const handleDeletePlan = (plan) => {
    if (!plan || !plan.exercise_logs_id) {
      setDeletePlanFormError("Invalid plan selected");
      return;
    }
    setPlanToDelete(plan);
    setShowDeletePlanModal(true);
    setDeletePlanFormError("");
  };

  const handleDeletePlanConfirm = async () => {
    if (!planToDelete || !planToDelete.exercise_logs_id) {
      setDeletePlanFormError("Invalid plan selected");
      return;
    }
    setIsSubmittingDeletePlan(true);
    setDeletePlanFormError(""); 
    try {
      await doctorService.deletePatientExercise(planToDelete.exercise_logs_id);
      setShowDeletePlanModal(false);
      setPlanToDelete(null);
      setSelectedPlanId(null); // hide the calendar after delete the plan
      fetchPatientExercises(selectedPatientId);
    } catch (err) {
      setDeletePlanFormError(err.message || "Failed to delete plan");
    } finally {
      setIsSubmittingDeletePlan(false);
    }
  };

  const handleAddLog = (date) => {
    if (!selectedPatientId || !selectedPlanId) return;

    // Create a new log with all required fields
    const newLog = {
      patient_id: selectedPatientId,
      exercise_id: selectedPlanId,
      patient_exercise_id: selectedPlanId,
      log_date: date, // Already in YYYY-MM-DD format from the calendar
      is_completed: false,
      note: ""
    };

    setLogToEdit(newLog);
    setShowEditLogModal(true);
    setEditLogFormError("");
    setEditLogFormSuccess("");
  };

  const handleEditLog = (log) => {
    setLogToEdit({ id: log.id, ...log });
    setShowEditLogModal(true);
    setEditLogFormError("");
    setEditLogFormSuccess("");
  };

  const handleEditLogSubmit = async (e) => {
    e.preventDefault();
    if (!logToEdit) return;
    setIsSubmittingEditLog(true);
    setEditLogFormError("");
    setEditLogFormSuccess("");
    try {
      if (logToEdit.exercise_logs_id) {
        // Update existing log
        await doctorService.updateExerciseLog(logToEdit);
      } else {
        // Create new log
        await doctorService.addExerciseLog(logToEdit);
      }
      setEditLogFormSuccess("Log saved successfully!");
      setShowEditLogModal(false);
      setLogToEdit(null);
      fetchCompletedLogs(selectedPlanId);
    } catch (err) {
      setEditLogFormError(err.message || "Failed to save log");
    } finally {
      setIsSubmittingEditLog(false);
    }
  };

  const handleDeleteLog = async (log) => {
    if (!log || !log.exercise_logs_id) {
      setEditLogFormError("Invalid log selected");
      return;
    }
    setIsSubmittingEditLog(true);
    setEditLogFormError("");
    setEditLogFormSuccess("");
    try {
      await doctorService.deleteExerciseLog(log.exercise_logs_id);
      setEditLogFormSuccess("Log deleted successfully!");
      setShowEditLogModal(false);
      setLogToEdit(null);
      fetchCompletedLogs(selectedPlanId);
    } catch (err) {
      setEditLogFormError(err.message || "Failed to delete log");
    } finally {
      setIsSubmittingEditLog(false);
    }
  };

  // Fix mapping for patient list
  const mappedPatients = patients.map(patient => ({
    exercise_logs_id: patient.exercise_logs_id || patient.id,
    full_name: patient.full_name,
    username: patient.username,
    profile_picture: patient.profile_picture
  }));

  // Fix mapping for patient plans
  const mappedPatientPlans = selectedPatientPlans.map(plan => ({
    exercise_logs_id: plan.exercise_logs_id || plan.id || plan.exercise_id,
    exercise_name: plan.exercise_name || getExerciseName(plan.exercise_id),
    status: plan.status || 'pending',
    start_date: plan.start_date,
    end_date: plan.end_date
  }));

  // Fix mapping for logs
  const mappedLogs = selectedPlanLogs.map(log => ({
    exercise_logs_id: log.exercise_logs_id || log.id,
    log_date: log.log_date ? formatDateToYYYYMMDD(new Date(log.log_date)) : '',
    note: log.note || "",
    is_completed: log.is_completed || false
  }));

  return (
    <PageTemplate>
      <AuthWrapper allowedRoles={["doctor"]}>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2">Exercise Management</h1>
            <p className="text-gray-600">Manage exercise types, patient assignments, and track progress</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8">
            {/* Exercise Types Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-green-800">Exercise Types</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage different types of exercises</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddTypeModal(true)}
                    className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white flex items-center gap-1 hover:opacity-90 transition-opacity"
                  >
                    <PlusCircle size={16} /> Add Type
                  </motion.button>
                </div>
              </div>

              <div className="p-6">
                {loadingTypes ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exerciseTypes.map((type) => (
                      <motion.div
                        key={type.exercise_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-green-800">{type.exercise_name}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedType(type);
                                setShowEditTypeModal(true);
                              }}
                              className="p-1 rounded-lg text-green-600 hover:bg-green-50"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedType(type);
                                setShowDeleteTypeModal(true);
                              }}
                              className="p-1 rounded-lg text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Users size={16} />
                          <span>{typeAssignments[type.exercise_id] || 0} patients assigned</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Patient Management Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-green-800">Patient Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage patients and their exercise plans</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAssignModal(true)}
                    className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white flex items-center gap-1 hover:opacity-90 transition-opacity"
                  >
                    <PlusCircle size={16} /> Assign Exercise
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                {/* Patient List - now takes 1/3 of the space */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Patients</h3>
                  {loadingPatients ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                    </div>
                  ) : (
                    <PatientList
                      patients={mappedPatients}
                      selectedPatientId={selectedPatientId}
                      onSelectPatient={handleSelectPatient}
                    />
                  )}
                </div>

                {/* Exercise Plans - now takes 2/3 of the space to give more room */}
                <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Exercise Plans</h3>
                  {selectedPatientId ? (
                    loadingPlans ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                      </div>
                    ) : (
                      <PatientPlans
                        plans={mappedPatientPlans}
                        selectedPlanId={selectedPlanId}
                        onSelectPlan={handleSelectPlan}
                        onEditPlan={handleEditPlan}
                        onDeletePlan={handleDeletePlan}
                      />
                    )
                  ) : (
                    <div className="text-gray-400 text-center mt-20 text-xl">
                      Select a patient to view their exercise plans
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Exercise Logs Calendar */}
            {selectedPlanId && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-green-800">Exercise Logs</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Track and manage exercise completion for {getPatientName(selectedPatientId)} - {selectedPlan?.exercise_name || 'Selected Plan'}
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
                    <ExerciseLogsCalendar
                      logs={mappedLogs}
                      onAddLog={handleAddLog}
                      onEditLog={handleEditLog}
                      onDeleteLog={handleDeleteLog}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Exercise Type Modal */}
        {showAddTypeModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={addTypeModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Add Exercise Type</h2>
                <button onClick={() => setShowAddTypeModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddType} className="p-4 space-y-4">
                {typeFormError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {typeFormError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newType.name}
                    onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Description</label>
                  <textarea
                    required
                    value={newType.description}
                    onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                  />
                </div>
                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddTypeModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingType}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isSubmittingType ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />} Add
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Exercise Type Modal */}
        {showEditTypeModal && selectedType && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={editTypeModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Edit Exercise Type</h2>
                <button onClick={() => setShowEditTypeModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditType} className="p-4 space-y-4">
                {typeFormError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {typeFormError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={selectedType.exercise_name}
                    onChange={(e) => setSelectedType({ ...selectedType, exercise_name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Description</label>
                  <textarea
                    required
                    value={selectedType.description}
                    onChange={(e) => setSelectedType({ ...selectedType, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                  />
                </div>
                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditTypeModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingType}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isSubmittingType ? <Loader2 size={16} className="animate-spin" /> : <Edit size={16} />} Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Exercise Type Modal */}
        {showDeleteTypeModal && selectedType && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={deleteTypeModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Delete Exercise Type</h2>
                <button onClick={() => setShowDeleteTypeModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <p className="mb-4 text-green-700">Are you sure you want to delete <span className="font-semibold text-red-600">{selectedType.exercise_name}</span>?</p>
                {typeFormError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {typeFormError}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteTypeModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteType}
                    disabled={isSubmittingType}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isSubmittingType ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Assign Plan Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={assignModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-6 bg-gradient-to-r from-green-50 to-teal-50">
                <div>
                  <h2 className="text-2xl font-bold text-green-800">Assign Exercise Plan</h2>
                  <p className="text-sm text-gray-600 mt-1">Create a new exercise plan for your patient</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAssignPlan} className="p-6 space-y-6">
                {planFormError && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                    <AlertCircle size={20} /> {planFormError}
                  </div>
                )}

                {/* Patient Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-green-700">Select Patient</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search patient by name or username..."
                      value={searchPatient}
                      onChange={(e) => setSearchPatient(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800 bg-white"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg mt-2 bg-white">
                    {searchPatient.trim() === "" ? (
                      <div className="p-4 text-center text-gray-500">
                        <User size={24} className="mx-auto mb-2" />
                        <p>Start typing to search patients</p>
                      </div>
                    ) : filteredPatients.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <AlertCircle size={24} className="mx-auto mb-2" />
                        <p>No patients found matching "{searchPatient}"</p>
                      </div>
                    ) : (
                      filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => {
                            setAssignData({ ...assignData, patient_id: patient.id });
                            setSearchPatient(patient.full_name);
                            setPatientIsSelected(true);
                            // Fetch exercise recommendations when patient is selected (call function)
                            fetchExerciseRecommendations(patient.id);
                          }}
                          className={`p-4 cursor-pointer transition-colors ${assignData.patient_id === patient.id
                            ? 'bg-green-50 border-l-4 border-green-500'
                            : 'hover:bg-green-50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            {patient.profile_picture ? (
                              <img
                                src={`data:image/jpeg;base64,${Buffer.from(patient.profile_picture.data).toString("base64")}`}
                                alt={patient.full_name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-green-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg border-2 border-green-200">
                                <User size={24} />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-green-800">{patient.full_name}</div>
                              <div className="text-sm text-gray-500">{patient.username}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Exercise Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-green-700">Select Exercise Type</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search exercise type..."
                      value={searchExercise}
                      onChange={(e) => setSearchExercise(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800 bg-white"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg mt-2 bg-white">
                    { !patientIsSelected  ? (
                      <div className="p-4 text-center text-gray-500">
                        <ClipboardList size={24} className="mx-auto mb-2" />
                        <p>Start selecting a patient to see the recommended exercises</p>
                      </div>
                    ) : filteredExercises.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <AlertCircle size={24} className="mx-auto mb-2" />
                        <p>No exercise types found matching "{searchExercise}"</p>
                      </div>
                    ) : (
                      filteredExercises.map((exercise) => {
                        const isRecommended = recommendedExercises.some((rec: { exercise_id: number; exercise_name: string }) => rec.exercise_id === exercise.exercise_id);
                        return (
                          <div
                            key={exercise.exercise_id}
                            onClick={() => {
                              setAssignData({ ...assignData, exercise_id: exercise.exercise_id });
                              setSearchExercise(exercise.exercise_name);
                            }}
                            className={`p-4 cursor-pointer transition-colors ${assignData.exercise_id === exercise.exercise_id
                                ? 'bg-green-50 border-l-4 border-green-500'
                                : 'hover:bg-green-50'
                              }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-green-800">{exercise.exercise_name}</div>
                                <div className="text-sm text-gray-500 mt-1">{exercise.description}</div>
                              </div>
                              {isRecommended && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Recommended
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-green-700">Start Date</label>
                    <CustomDatePicker
                      selectedDate={assignData.start_date ? new Date(assignData.start_date) : null}
                      onChange={(date) => setAssignData({ ...assignData, start_date: date ? date.toISOString().split('T')[0] : '' })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800 bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-green-700">End Date (Optional)</label>
                    <CustomDatePicker
                      selectedDate={assignData.end_date ? new Date(assignData.end_date) : null}
                      onChange={(date) => setAssignData({ ...assignData, end_date: date ? date.toISOString().split('T')[0] : '' })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPlan || !assignData.patient_id || !assignData.exercise_id || !assignData.start_date}
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all disabled:hover:opacity-50"
                  >
                    {isSubmittingPlan ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Assign Exercise Plan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Plan Modal */}
        {showEditPlanModal && planToEdit && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={editPlanModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-6 bg-gradient-to-r from-green-50 to-teal-50">
                <div>
                  <h2 className="text-2xl font-bold text-green-800">Edit Exercise Plan</h2>
                  <p className="text-sm text-gray-600 mt-1">Update the exercise plan details</p>
                </div>
                <button onClick={() => setShowEditPlanModal(false)} className="p-2 rounded-full hover:bg-green-100 text-green-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleEditPlanSubmit} className="p-6 space-y-6">
                {editPlanFormError && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                    <AlertCircle size={20} /> {editPlanFormError}
                  </div>
                )}

                {/* Status Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-green-700">Plan Status</label>
                  <select
                    required
                    value={planToEdit.status}
                    onChange={e => setPlanToEdit({ ...planToEdit, status: e.target.value })}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800 bg-white"
                  >
                    <option value="pending" className="py-2">Pending</option>
                    <option value="active" className="py-2">Active</option>
                    <option value="completed" className="py-2">Completed</option>
                  </select>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-green-700">Start Date</label>
                    <CustomDatePicker
                      selectedDate={planToEdit.start_date ? new Date(planToEdit.start_date) : null}
                      onChange={(date) => setPlanToEdit({ ...planToEdit, start_date: date ? date.toISOString().split('T')[0] : '' })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800 bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-green-700">End Date</label>
                    <CustomDatePicker
                      selectedDate={planToEdit.end_date ? new Date(planToEdit.end_date) : null}
                      onChange={(date) => setPlanToEdit({ ...planToEdit, end_date: date ? date.toISOString().split('T')[0] : '' })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditPlanModal(false)}
                    className="px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEditPlan}
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all disabled:hover:opacity-50"
                  >
                    {isSubmittingEditPlan ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Edit size={20} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Plan Modal */}
        {showDeletePlanModal && planToDelete && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={deletePlanModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Delete Exercise Plan</h2>
                <button onClick={() => setShowDeletePlanModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <p className="mb-4 text-green-700">Are you sure you want to delete <span className="font-semibold text-red-600">{planToDelete.exercise_name}</span>?</p>
                {deletePlanFormError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} /> {deletePlanFormError}
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeletePlanModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePlanConfirm}
                    disabled={isSubmittingDeletePlan}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-opacity"
                  >
                    {isSubmittingDeletePlan ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                  </button>
                </div>
              </div>
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
                <h2 className="text-xl font-bold text-green-800">Edit Exercise Log</h2>
                <button onClick={() => setShowEditLogModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditLogSubmit} className="p-4 space-y-4">
                {editLogFormError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
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
                <StyledCheckbox
                  id="is_completed"
                  checked={logToEdit.is_completed}
                  onChange={e => setLogToEdit({ ...logToEdit, is_completed: e.target.checked })}
                  label="Mark as completed"
                />
                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditLogModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  {logToEdit?.exercise_logs_id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteLog(logToEdit)}
                      disabled={isSubmittingEditLog}
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                      {isSubmittingEditLog ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                    </button>
                  )}
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
      </AuthWrapper>
    </PageTemplate>
  );
}
