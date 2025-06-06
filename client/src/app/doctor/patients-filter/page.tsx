"use client"
import { useState, useEffect, useRef } from 'react';
import { doctorService } from '@/services/api';
import PageTemplate from '@/components/layout/PageTemplate';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { motion } from 'framer-motion';
import CustomDatePicker from '@/components/ui/DatePicker';
import {
  Users,
  UserPlus,
  Search,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  Calendar,
  User,
  List,
  Grid,
  ChevronRight,
  UserCircle,
  Eye
} from 'lucide-react';

interface NewPatient {
  username: string;
  email: string;
  phone_number: string;
  full_name: string;
  birth_date: Date | null;
  gender: string;
  role: string;
}

interface Patient {
  id: string;
  username: string;
  email: string;
  phone_number: string;
  full_name: string;
  birth_date: string;
  gender: string;
  role: string;
  profile_picture?: string;
}

interface PatientSummary {
  symptoms: Array<{
    symptom_id: string;
    symptom_name: string;
  }>;
  avgBloodSugar: number;
}

export default function DoctorPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [patientSummaries, setPatientSummaries] = useState<{ [key: string]: PatientSummary }>({});
  const [filterSymptom, setFilterSymptom] = useState('');
  const [filterBloodSugar, setFilterBloodSugar] = useState<'all' | 'normal' | 'high' | 'low'>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Refs for modal content to handle outside clicks
  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const viewModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  // State for new patient form
  const [newPatient, setNewPatient] = useState<NewPatient>({
    username: '',
    email: '',
    phone_number: '',
    full_name: '',
    birth_date: null,
    gender: 'male',
    role: 'patient'
  });

  // State for form processing
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Handle click outside to close modals
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showAddModal && addModalRef.current && !addModalRef.current.contains(event.target as Node)) {
        setShowAddModal(false);
      }
      if (showEditModal && editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
        setShowEditModal(false);
      }
      if (showViewModal && viewModalRef.current && !viewModalRef.current.contains(event.target as Node)) {
        setShowViewModal(false);
      }
      if (showDeleteModal && deleteModalRef.current && !deleteModalRef.current.contains(event.target as Node)) {
        setShowDeleteModal(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddModal, showEditModal, showViewModal, showDeleteModal]);

  // Function to fetch patient summaries
  const fetchPatientSummaries = async (patientsToFetch: Patient[]) => {
    const summaries: { [key: string]: PatientSummary } = {};
    
    await Promise.all(
      patientsToFetch.map(async (patient) => {
        try {
          const summary = await doctorService.getPatientSummary(patient.id);
          summaries[patient.id] = {
            symptoms: summary.symptoms,
            avgBloodSugar: summary.avgBloodSugar
          };
        } catch (error) {
          console.error(`Error fetching summary for patient ${patient.id}:`, error);
        }
      })
    );

    setPatientSummaries(summaries);
  };

  // Function to fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getPatients();
      const fetchedPatients = response.data.patients;
      setPatients(fetchedPatients);
      await fetchPatientSummaries(fetchedPatients);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  // Update useEffect to use fetchData
  useEffect(() => {
    fetchData();
  }, []);

  // Filter patients based on search term, symptoms, and blood sugar
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const summary = patientSummaries[patient.id];
    if (!summary) return matchesSearch;

    const matchesSymptom = !filterSymptom || 
                          summary.symptoms.some(s => s.symptom_name.toLowerCase().includes(filterSymptom.toLowerCase()));

    let matchesBloodSugar = false;
    if (true) {
      switch (filterBloodSugar) {
        case 'all':
          matchesBloodSugar = true;
          break;
        case 'normal':
          matchesBloodSugar = summary.avgBloodSugar >= 70 && summary.avgBloodSugar <= 99;
          break;
        case 'high':
          matchesBloodSugar = summary.avgBloodSugar > 125;
          break;
        case 'low':
          matchesBloodSugar = summary.avgBloodSugar < 70 && summary.avgBloodSugar > 0;
          break;
      }
    } 

    return matchesSearch && matchesSymptom && matchesBloodSugar;
  });

  // Function to handle adding a new patient
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const patientData = {
        ...newPatient,
        birth_date: newPatient.birth_date ? newPatient.birth_date.toISOString().split('T')[0] : null
      };
      await doctorService.addPatient(patientData);
      setFormSuccess('Patient added successfully!');
      setShowAddModal(false);
      setNewPatient({
        username: '',
        email: '',
        phone_number: '',
        full_name: '',
        birth_date: null,
        gender: 'male',
        role: 'patient'
      });
      fetchData(); // Use fetchData instead of fetchPatients
    } catch (err) {
      setFormError((err as Error).message || 'Failed to add patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle updating a patient
  const handleUpdatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    setIsSubmitting(true);
    setFormError('');

    try {
      // Convert Date to ISO string for the API
      const { profile_picture, ...patientData} = {
        ...selectedPatient,
        birth_date: selectedPatient.birth_date ? new Date(selectedPatient.birth_date).toISOString().split('T')[0] : null
      };
      await doctorService.updateUser(selectedPatient.id, patientData);
      setFormSuccess('Patient updated successfully!');
      setShowEditModal(false);
      fetchData(); // Refresh patient list
    } catch (err) {
      setFormError((err as Error).message || 'Failed to update patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle deleting a patient
  const handleDeletePatient = async () => {
    if (!selectedPatient) return;
    
    try {
      await doctorService.deletePatient(selectedPatient.id);
      setFormSuccess('Patient deleted successfully!');
      setShowDeleteModal(false);
      fetchData(); // Refresh patient list
    } catch (err) {
      setFormError((err as Error).message || 'Failed to delete patient');
    }
  };

  // Function to calculate age from birth date
  const calculateAge = (birth_date: string | null) => {
    if (!birth_date) return 'N/A';
    const today = new Date();
    const birth_dateObj = new Date(birth_date);
    let age = today.getFullYear() - birth_dateObj.getFullYear();
    const monthDiff = today.getMonth() - birth_dateObj.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth_dateObj.getDate())) {
      age--;
    }

    return age;
  };

  // Function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to format gender display
  const formatGender = (gender: string) => {
    if (!gender) return 'N/A';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  return (
    <PageTemplate>
      <AuthWrapper allowedRoles={['doctor']}>
        <div className="flex min-h-screen">
          <div className="flex-1 p-8 bg-gradient-to-br from-orange-50 to-red-100">
            {/* Header section */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-orange-800">Patients Management</h1>

              <div className="flex gap-4">
                {/* View mode toggle */}
                <div className="flex items-center bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                  <button
                    onClick={() => setViewMode('card')}
                    className={`p-2 ${viewMode === 'card' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'text-gray-600 hover:bg-orange-50'}`}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'text-gray-600 hover:bg-orange-50'}`}
                  >
                    <List size={20} />
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg shadow transition-colors"
                >
                  <UserPlus size={18} />
                  Add New Patient
                </motion.button>
              </div>
            </div>

            {/* Search and filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-800"
                />
              </div>

              {/* Symptom filter */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter by symptom..."
                  value={filterSymptom}
                  onChange={(e) => setFilterSymptom(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-800"
                />
              </div>

              {/* Blood sugar filter */}
              <select
                value={filterBloodSugar}
                onChange={(e) => setFilterBloodSugar(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-800"
              >
                <option value="all">All Blood Sugar Levels</option>
                <option value="normal">Normal (70-99 mg/dL)</option>
                <option value="high">High (&gt;125 mg/dL)</option>
                <option value="low">Low (&lt;70 mg/dL)</option>
              </select>
            </div>

            {/* Patient grid/list */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-md">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h3 className="text-xl font-medium text-red-500">{error}</h3>
              </div>
            ) : (
              filteredPatients.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-md">
                  <Users className="mx-auto text-gray-400 mb-4" size={48} />
                  <h3 className="text-xl font-medium text-gray-500">No patients found</h3>
                  <p className="text-gray-400 mt-2">Try adjusting your search or add a new patient</p>
                </div>
              ) : viewMode === 'card' ? (
                // Card view
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPatients.map((patient, index) => (
                    <motion.div
                      key={patient.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex-shrink-0">
                            {patient.profile_picture ? (
                              <img
                                src={`data:image/jpeg;base64,${Buffer.from(patient.profile_picture.data).toString("base64")}`}
                                alt={patient.full_name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-orange-100"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xl border-2 border-orange-200">
                                <User size={32} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-orange-800">{patient.full_name}</h3>
                            <p className="text-gray-500">@{patient.username}</p>
                          </div>
                        </div>

                        {/* Patient summary information */}
                        {patientSummaries[patient.id] && (
                          <div className="mt-4 space-y-3">
                            {/* Symptoms */}
                            <div>
                              <h4 className="text-sm font-semibold text-orange-700 mb-1">Symptoms:</h4>
                              <div className="flex flex-wrap gap-2">
                                {patientSummaries[patient.id].symptoms.length > 0 ? (
                                  patientSummaries[patient.id].symptoms.map((symptom: any) => (
                                    <span
                                      key={symptom.symptom_id}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                                    >
                                      {symptom.symptom_name}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-sm text-gray-500">No symptoms recorded</span>
                                )}
                              </div>
                            </div>

                            {/* Average Blood Sugar */}
                            <div>
                              <h4 className="text-sm font-semibold text-orange-700 mb-1">Average Blood Sugar:</h4>
                              {patientSummaries[patient.id].avgBloodSugar > 0 ? (
                                <div className={`text-lg font-semibold ${
                                  patientSummaries[patient.id].avgBloodSugar >= 70 && patientSummaries[patient.id].avgBloodSugar <= 99
                                    ? 'text-green-600'
                                    : patientSummaries[patient.id].avgBloodSugar > 125
                                    ? 'text-red-600'
                                    : patientSummaries[patient.id].avgBloodSugar < 70
                                    ? 'text-yellow-600'
                                    : 'text-orange-600'
                                }`}>
                                  {(Number(patientSummaries[patient.id].avgBloodSugar)).toFixed(1)} mg/dL
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">No measurements recorded</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-6 flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowViewModal(true);
                            }}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <Eye size={20} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowEditModal(true);
                            }}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <Edit size={20} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // List view
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symptoms</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Blood Sugar</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPatients.map((patient) => (
                        <tr key={patient.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {patient.profile_picture ? (
                                  <img
                                    src={`data:image/jpeg;base64,${Buffer.from(patient.profile_picture.data).toString("base64")}`}
                                    alt={patient.full_name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                    <User size={20} className="text-orange-600" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-orange-800">{patient.full_name}</div>
                                <div className="text-sm text-gray-500">@{patient.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {patientSummaries[patient.id]?.symptoms.length > 0 ? (
                                patientSummaries[patient.id].symptoms.map((symptom: any) => (
                                  <span
                                    key={symptom.symptom_id}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                                  >
                                    {symptom.symptom_name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-gray-500">No symptoms</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {patientSummaries[patient.id]?.avgBloodSugar > 0 ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                patientSummaries[patient.id].avgBloodSugar >= 70 && patientSummaries[patient.id].avgBloodSugar <= 99
                                  ? 'bg-green-100 text-green-800'
                                  : patientSummaries[patient.id].avgBloodSugar > 125
                                  ? 'bg-red-100 text-red-800'
                                  : patientSummaries[patient.id].avgBloodSugar < 70
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {patientSummaries[patient.id].avgBloodSugar} mg/dL
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">No data</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setShowViewModal(true);
                                }}
                                className="text-orange-600 hover:text-orange-900"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setShowEditModal(true);
                                }}
                                className="text-orange-600 hover:text-orange-900"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        </div>

        {/* Add Patient Modal with blur effect */}
        {showAddModal && (
          <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={addModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
                <h2 className="text-xl font-bold text-orange-800">Add New Patient</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-full hover:bg-orange-100 text-orange-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="p-4 space-y-4">
                {formError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newPatient.full_name}
                    onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newPatient.username}
                    onChange={(e) => setNewPatient({ ...newPatient, username: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newPatient.phone_number}
                    onChange={(e) => setNewPatient({ ...newPatient, phone_number: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">Birth Date</label>
                  <CustomDatePicker
                    selectedDate={newPatient.birth_date}
                    onChange={(date) => setNewPatient({ ...newPatient, birth_date: date })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">Gender</label>
                  <select
                    required
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-transform"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Add Patient
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Patient Modal with blur effect */}
        {showEditModal && selectedPatient && (
          <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={editModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
                <h2 className="text-xl font-bold text-orange-800">Edit Patient</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-full hover:bg-orange-100 text-orange-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdatePatient} className="p-4 space-y-4">
                {formError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {formError}
                  </div>
                )}

                {formSuccess && (
                  <div className="bg-orange-50 text-orange-600 p-3 rounded-lg text-sm flex items-center gap-2">
                    <CheckCircle size={16} />
                    {formSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={selectedPatient.full_name}
                    onChange={(e) => setSelectedPatient({ ...selectedPatient, full_name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={selectedPatient.email}
                    onChange={(e) => setSelectedPatient({ ...selectedPatient, email: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={selectedPatient.phone_number}
                    onChange={(e) => setSelectedPatient({ ...selectedPatient, phone_number: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">Birth Date</label>
                  <CustomDatePicker
                    selectedDate={selectedPatient.birth_date ? new Date(selectedPatient.birth_date) : null}
                    onChange={(date) => {
                      if (selectedPatient) {
                        setSelectedPatient({
                          ...selectedPatient,
                          birth_date: date ? date.toISOString().split('T')[0] : ''
                        });
                      }
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-700 mb-1">Gender</label>
                  <select
                    required
                    value={selectedPatient.gender}
                    onChange={(e) => setSelectedPatient({ ...selectedPatient, gender: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-transform"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* View Patient Modal with blur effect */}
        {showViewModal && selectedPatient && (
          <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={viewModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
                <h2 className="text-xl font-bold text-orange-800">Patient Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-1 rounded-full hover:bg-orange-100 text-orange-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    {selectedPatient.profile_picture ? (
                      <img
                        src={`data:image/jpeg;base64,${Buffer.from(selectedPatient.profile_picture).toString("base64")}`}
                        alt={selectedPatient.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                    <p className="text-lg font-medium text-orange-800">{selectedPatient.full_name}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Username</h3>
                    <p className="text-lg font-medium text-orange-800">{selectedPatient.username}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="text-lg font-medium text-orange-800">{selectedPatient.email}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                    <p className="text-lg font-medium text-orange-800">{selectedPatient.phone_number}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Birth Date</h3>
                    <p className="text-lg font-medium text-orange-800">{formatDate(selectedPatient.birth_date)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                    <p className="text-lg font-medium text-orange-800">{formatGender(selectedPatient.gender)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Age</h3>
                    <p className="text-lg font-medium text-orange-800">{calculateAge(selectedPatient.birth_date)} years</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShowEditModal(true);
                    }}
                    className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-800 flex items-center gap-2"
                  >
                    <Edit size={16} />
                    Edit Details
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal with blur effect */}
        {showDeleteModal && selectedPatient && (
          <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
            <motion.div
              ref={deleteModalRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-lg max-w-md w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                    <AlertCircle size={24} />
                  </div>
                </div>

                <h3 className="text-lg text-center mb-2 font-bold text-red-700">Delete Patient</h3>
                <p className="text-gray-600 text-center mb-6">
                  Are you sure you want to delete {selectedPatient.full_name}? This action cannot be undone.
                </p>

                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeletePatient}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-transform"
                  >
                    Delete
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
