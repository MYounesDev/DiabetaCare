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
import PatientList from '@/app/doctor/diets/PatientList';
import PatientPlans from './PatientPlans';
import DietLogsCalendar from '@/app/doctor/diets/DietLogsCalendar';

export default function DoctorDiets() {
  // Diet Types
  const [dietTypes, setDietTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typeError, setTypeError] = useState(null);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showEditTypeModal, setShowEditTypeModal] = useState(false);
  const [showDeleteTypeModal, setShowDeleteTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [newType, setNewType] = useState({ name: "", description: "" });
  const [isSubmittingType, setIsSubmittingType] = useState(false);
  const [typeFormError, setTypeFormError] = useState("");
  const [typeFormSuccess, setTypeFormSuccess] = useState("");
  const [typeAssignments, setTypeAssignments] = useState({});
  const addTypeModalRef = useRef(null);
  const editTypeModalRef = useRef(null);
  const deleteTypeModalRef = useRef(null);

  // Patient Diets
  const [patientDiets, setPatientDiets] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [planError, setPlanError] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignData, setAssignData] = useState({
    patient_id: "",
    diet_id: "",
    doctor_id: "",
    status: "pending",
    start_date: "",
    end_date: "",
  });
  const [searchPatient, setSearchPatient] = useState("");
  const [searchDiet, setSearchDiet] = useState("");
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planFormError, setPlanFormError] = useState("");
  const [planFormSuccess, setPlanFormSuccess] = useState("");
  const assignModalRef = useRef(null);

  // Completed Diet Logs
  const [completedLogs, setCompletedLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState(null);

  // Patients for assignment
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  // New state for selection
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  const selectedPatientPlans = patientDiets.filter(
    pe => pe.patient_id === selectedPatientId
  );

  const selectedPlan = selectedPatientPlans.find(
    pe => pe.id === selectedPlanId
  );

  // For calendar, filter logs for selected plan
  const selectedPlanLogs = completedLogs.filter(
    log => log.patient_diet_id === selectedPlanId
  );

  // Edit/delete plan modals
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [showDeletePlanModal, setShowDeletePlanModal] = useState(false);
  const [planToEdit, setPlanToEdit] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [isSubmittingEditPlan, setIsSubmittingEditPlan] = useState(false);
  const [editPlanFormError, setEditPlanFormError] = useState("");
  const [editPlanFormSuccess, setEditPlanFormSuccess] = useState("");
  const [isSubmittingDeletePlan, setIsSubmittingDeletePlan] = useState(false);
  const [deletePlanFormError, setDeletePlanFormError] = useState("");
  const [deletePlanFormSuccess, setDeletePlanFormSuccess] = useState("");

  // Edit log modal
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [logToEdit, setLogToEdit] = useState(null);
  const [isSubmittingEditLog, setIsSubmittingEditLog] = useState(false);
  const [editLogFormError, setEditLogFormError] = useState("");
  const [editLogFormSuccess, setEditLogFormSuccess] = useState("");

  // Filter patients and diets based on search
  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchPatient.toLowerCase())
  );

  const filteredDiets = dietTypes.filter(diet =>
    diet.diet_name.toLowerCase().includes(searchDiet.toLowerCase())
  );

  // Fetch all data on mount
  useEffect(() => {
    fetchDietTypes();
    fetchPatients();
  }, []);

  // Fetch diets when selected patient changes
  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientDiets(selectedPatientId);
      setSelectedPlanId(null); // Reset selected plan when patient changes
      setCompletedLogs([]); // Clear logs when patient changes
    } else {
      setPatientDiets([]);
      setCompletedLogs([]);
    }
  }, [selectedPatientId]);

  // Fetch logs when selected plan changes
  useEffect(() => {
    if (selectedPatientId && selectedPlanId) {
      console.log('1');
      fetchCompletedLogs(selectedPlanId);
    } else {
      setCompletedLogs([]);
    }
  }, [selectedPatientId, selectedPlanId]);

  // Format a date as YYYY-MM-DD string without timezone issues
  const formatDateToYYYYMMDD = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch diet types with assignments
  const fetchDietTypes = async () => {
    setLoadingTypes(true);
    setTypeError(null);
    try {
      const res = await doctorService.getDietTypes();
      const types = res.data.dietPlans || [];
      setDietTypes(types);

      // Fetch assignments for each type
      const assignments = {};
      for (const type of types) {
        const assignRes = await doctorService.getSumPatientDietAssignments(type.diet_id);
        assignments[type.diet_id] = assignRes.data.totalAssignments;
      }
      setTypeAssignments(assignments);
    } catch (err) {
      console.error("Error fetching diet types:", err);
      setTypeError("Failed to load diet types");
    } finally {
      setLoadingTypes(false);
    }
  };

  // Fetch patient diets
  const fetchPatientDiets = async (patientId) => {
    if (!patientId) return;

    setLoadingPlans(true);
    setPlanError(null);
    try {
      console.log(`Fetching diets for patient ${patientId}`);
      // Using the new patient-specific endpoint
      const res = await doctorService.getPatientDietsByPatient(patientId);
      console.log('Patient diets response:', res.data);
      setPatientDiets(res.data.patientDiets || []);
    } catch (err) {
      console.error("Error fetching patient diets:", err);
      setPlanError(typeof err === 'string' ? err : err.message || "Failed to load patient diet plans");
    } finally {
      setLoadingPlans(false);
    }
  };

  // Fetch completed logs
  const fetchCompletedLogs = async (patient_diet_id) => {
    if (!patient_diet_id) return;

    setLoadingLogs(true);
    setLogsError(null);
    try {
      console.log(`Fetching logs for patient_diet_id ${patient_diet_id}`);
      // Using correct parameters for the API call
      const res = await doctorService.getPatientDietLogs(patient_diet_id);
      console.log('Patient diet logs response:', res.data);
      setCompletedLogs(res.data.dietLogs || []);
    } catch (err) {
      console.error("Error fetching diet logs:", err);
      setLogsError(typeof err === 'string' ? err : err.message || "Failed to load completed diet logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Fetch patients
  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      console.log('Fetching patients');
      const res = await doctorService.getPatients();
      console.log('Patients response:', res.data);
      setPatients(res.data.patients || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Handle click outside modals
  useEffect(() => {
    function handleClickOutside(event) {
      if (showAddTypeModal && addTypeModalRef.current && !addTypeModalRef.current.contains(event.target)) {
        setShowAddTypeModal(false);
      }
      if (showEditTypeModal && editTypeModalRef.current && !editTypeModalRef.current.contains(event.target)) {
        setShowEditTypeModal(false);
      }
      if (showDeleteTypeModal && deleteTypeModalRef.current && !deleteTypeModalRef.current.contains(event.target)) {
        setShowDeleteTypeModal(false);
      }
      if (showAssignModal && assignModalRef.current && !assignModalRef.current.contains(event.target)) {
        setShowAssignModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddTypeModal, showEditTypeModal, showDeleteTypeModal, showAssignModal]);

  // Add Diet Type
  const handleAddType = async (e) => {
    e.preventDefault();
    setIsSubmittingType(true);
    setTypeFormError("");
    setTypeFormSuccess("");
    try {
      await doctorService.createDietType(newType.name, newType.description);
      setTypeFormSuccess("Diet type added successfully!");
      setShowAddTypeModal(false);
      setNewType({ name: "", description: "" });
      fetchDietTypes();
    } catch (err) {
      setTypeFormError(err.message || "Failed to add diet type");
    } finally {
      setIsSubmittingType(false);
    }
  };

  // Edit Diet Type
  const handleEditType = async (e) => {
    e.preventDefault();
    setIsSubmittingType(true);
    setTypeFormError("");
    setTypeFormSuccess("");
    try {
      if (!selectedType) return;
      await doctorService.updateDietType(selectedType.diet_id, selectedType.diet_name, selectedType.description);
      setTypeFormSuccess("Diet type updated successfully!");
      setShowEditTypeModal(false);
      fetchDietTypes();
    } catch (err) {
      setTypeFormError(err.message || "Failed to update diet type");
    } finally {
      setIsSubmittingType(false);
    }
  };

  // Delete Diet Type
  const handleDeleteType = async () => {
    setIsSubmittingType(true);
    setTypeFormError("");
    setTypeFormSuccess("");
    try {
      if (!selectedType) return;
      await doctorService.deleteDietType(selectedType.diet_id);
      setTypeFormSuccess("Diet type deleted successfully!");
      setShowDeleteTypeModal(false);
      fetchDietTypes();
    } catch (err) {
      setTypeFormError(err.message || "Failed to delete diet type");
    } finally {
      setIsSubmittingType(false);
    }
  };

  // Assign Diet Plan to Patient
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
      await doctorService.addPatientDiet(dataToSubmit);
      setPlanFormSuccess("Diet plan assigned successfully!");
      setShowAssignModal(false);
      setAssignData({
        patient_id: "",
        diet_id: "",
        doctor_id: "",
        status: "pending",
        start_date: "",
        end_date: "",
      });
      fetchPatientDiets(selectedPatientId);
    } catch (err) {
      setPlanFormError(err.message || "Failed to assign diet plan");
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // UI helpers - fixed to work with actual data structures
  const getPatientName = (id) => {
    const p = patients.find(pt => pt.id === id);
    return p ? p.full_name : id;
  };

  const getDietName = (id) => {
    const ex = dietTypes.find(et => et.id === id);
    return ex ? ex.name : id;
  };

  // Selection handlers
  const handleSelectPatient = (id) => {
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
      const originalPlan = patientDiets.find(p => p.id === planToEdit.diet_logs_id);
      if (!originalPlan) {
        throw new Error("Original plan data not found");
      }

      // Prepare the update data with all required fields
      const updateData = {
        patient_diet_id: planToEdit.diet_logs_id,
        patient_id: originalPlan.patient_id,
        diet_id: originalPlan.diet_id,
        doctor_id: originalPlan.doctor_id,
        status: planToEdit.status,
        start_date: planToEdit.start_date,
        end_date: planToEdit.end_date || null
      };

      await doctorService.updatePatientDiet(updateData);
      setEditPlanFormSuccess("Plan updated successfully!");
      setShowEditPlanModal(false);
      setPlanToEdit(null);
      fetchPatientDiets(selectedPatientId);
    } catch (err) {
      setEditPlanFormError(err.message || "Failed to update plan");
    } finally {
      setIsSubmittingEditPlan(false);
    }
  };

  const handleDeletePlan = (plan) => {
    if (!plan || !plan.diet_logs_id) {
      setDeletePlanFormError("Invalid plan selected");
      return;
    }
    setPlanToDelete(plan);
    setShowDeletePlanModal(true);
    setDeletePlanFormError("");
    setDeletePlanFormSuccess("");
  };

  const handleDeletePlanConfirm = async () => {
    if (!planToDelete || !planToDelete.diet_logs_id) {
      setDeletePlanFormError("Invalid plan selected");
      return;
    }
    setIsSubmittingDeletePlan(true);
    setDeletePlanFormError("");
    setDeletePlanFormSuccess("");
    try {
      await doctorService.deletePatientDiet(planToDelete.diet_logs_id);
      setDeletePlanFormSuccess("Plan deleted successfully!");
      setShowDeletePlanModal(false);
      setPlanToDelete(null);
      setSelectedPlanId(null); // hide the calendar after delete the plan
      fetchPatientDiets(selectedPatientId);
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
      diet_id: selectedPlanId,
      patient_diet_id: selectedPlanId,
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
    console.log('HIT HIT');
    console.log('logToEdit', logToEdit);
    e.preventDefault();
    if (!logToEdit) return;
    setIsSubmittingEditLog(true);
    setEditLogFormError("");
    setEditLogFormSuccess("");
    try {
      if (logToEdit.diet_logs_id) {
        // Update existing log
        await doctorService.updateDietLog(logToEdit);
      } else {
        // Create new log
        await doctorService.addDietLog(logToEdit);
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
    if (!log || !log.diet_logs_id) {
      setEditLogFormError("Invalid log selected");
      return;
    }
    setIsSubmittingEditLog(true);
    setEditLogFormError("");
    setEditLogFormSuccess("");
    try {
      await doctorService.deleteDietLog(log.diet_logs_id);
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
    diet_logs_id: patient.diet_logs_id || patient.id,
    full_name: patient.full_name,
    username: patient.username,
    profile_picture: patient.profile_picture
  }));

  // Fix mapping for patient plans
  const mappedPatientPlans = selectedPatientPlans.map(plan => ({
    diet_logs_id: plan.diet_logs_id || plan.id || plan.diet_id,
    diet_name: plan.diet_name || getDietName(plan.diet_id),
    status: plan.status || 'pending',
    start_date: plan.start_date,
    end_date: plan.end_date
  }));

  // Fix mapping for logs
  const mappedLogs = selectedPlanLogs.map(log => ({
    diet_logs_id: log.diet_logs_id || log.id,
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
            <h1 className="text-3xl font-bold text-green-800 mb-2">Diet Management</h1>
            <p className="text-gray-600">Manage diet types, patient assignments, and track progress</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8">
            {/* Diet Types Section */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-green-800">Diet Types</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage different types of diets</p>
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
                    {dietTypes.map((type) => (
                      <motion.div
                        key={type.diet_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-green-800">{type.diet_name}</h3>
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
                          <span>{typeAssignments[type.diet_id] || 0} patients assigned</span>
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
                    <p className="text-sm text-gray-500 mt-1">Manage patients and their diet plans</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAssignModal(true)}
                    className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white flex items-center gap-1 hover:opacity-90 transition-opacity"
                  >
                    <PlusCircle size={16} /> Assign Diet
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

                {/* Diet Plans - now takes 2/3 of the space to give more room */}
                <div className="bg-gray-50 rounded-lg p-4 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Diet Plans</h3>
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
                      Select a patient to view their diet plans
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Diet Logs Calendar */}
            {selectedPlanId && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-green-800">Diet Logs</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Track and manage diet completion for {getPatientName(selectedPatientId)} - {selectedPlan?.diet_name || 'Selected Plan'}
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

        {/* Add Diet Type Modal */}
        {showAddTypeModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={addTypeModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Add Diet Type</h2>
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

        {/* Edit Diet Type Modal */}
        {showEditTypeModal && selectedType && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={editTypeModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Edit Diet Type</h2>
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
                    value={selectedType.diet_name}
                    onChange={(e) => setSelectedType({ ...selectedType, diet_name: e.target.value })}
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

        {/* Delete Diet Type Modal */}
        {showDeleteTypeModal && selectedType && (
          <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={deleteTypeModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Delete Diet Type</h2>
                <button onClick={() => setShowDeleteTypeModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <p className="mb-4 text-green-700">Are you sure you want to delete <span className="font-semibold text-red-600">{selectedType.diet_name}</span>?</p>
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
                  <h2 className="text-2xl font-bold text-green-800">Assign Diet Plan</h2>
                  <p className="text-sm text-gray-600 mt-1">Create a new diet plan for your patient</p>
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

                {/* Diet Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-green-700">Select Diet Type</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search diet type..."
                      value={searchDiet}
                      onChange={(e) => setSearchDiet(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800 bg-white"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg mt-2 bg-white">
                    {searchDiet.trim() === "" ? (
                      <div className="p-4 text-center text-gray-500">
                        <ClipboardList size={24} className="mx-auto mb-2" />
                        <p>Start typing to search diet types</p>
                      </div>
                    ) : filteredDiets.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <AlertCircle size={24} className="mx-auto mb-2" />
                        <p>No diet types found matching "{searchDiet}"</p>
                      </div>
                    ) : (
                      filteredDiets.map((diet) => (
                        <div
                          key={diet.diet_id}
                          onClick={() => {
                            setAssignData({ ...assignData, diet_id: diet.diet_id });
                            setSearchDiet(diet.diet_name);
                          }}
                          className={`p-4 cursor-pointer transition-colors ${assignData.diet_id === diet.diet_id
                            ? 'bg-green-50 border-l-4 border-green-500'
                            : 'hover:bg-green-50'
                            }`}
                        >
                          <div className="font-medium text-green-800">{diet.diet_name}</div>
                          <div className="text-sm text-gray-500 mt-1">{diet.description}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-green-700">Start Date</label>
                    <input
                      type="date"
                      required
                      value={assignData.start_date}
                      onChange={(e) => setAssignData({ ...assignData, start_date: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-green-700">End Date (Optional)</label>
                    <input
                      type="date"
                      value={assignData.end_date}
                      onChange={(e) => setAssignData({ ...assignData, end_date: e.target.value })}
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
                    disabled={isSubmittingPlan || !assignData.patient_id || !assignData.diet_id || !assignData.start_date}
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all disabled:hover:opacity-50"
                  >
                    {isSubmittingPlan ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        Assign Diet Plan
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-6 bg-gradient-to-r from-green-50 to-teal-50">
                <div>
                  <h2 className="text-2xl font-bold text-green-800">Edit Diet Plan</h2>
                  <p className="text-sm text-gray-600 mt-1">Update the diet plan details</p>
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
                    <input
                      type="date"
                      required
                      value={planToEdit.start_date}
                      onChange={e => setPlanToEdit({ ...planToEdit, start_date: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-green-700">End Date</label>
                    <input
                      type="date"
                      value={planToEdit.end_date || ''}
                      onChange={e => setPlanToEdit({ ...planToEdit, end_date: e.target.value })}
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                <h2 className="text-xl font-bold text-green-800">Delete Diet Plan</h2>
                <button onClick={() => setShowDeletePlanModal(false)} className="p-1 rounded-full hover:bg-green-100 text-green-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <p className="mb-4 text-green-700">Are you sure you want to delete <span className="font-semibold text-red-600">{planToDelete.diet_name}</span>?</p>
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={logToEdit.is_completed}
                    onChange={e => setLogToEdit({ ...logToEdit, is_completed: e.target.checked })}
                    id="is_completed"
                  />
                  <label htmlFor="is_completed" className="text-green-700">Mark as completed</label>
                </div>
                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditLogModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  {logToEdit?.diet_logs_id && (
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
