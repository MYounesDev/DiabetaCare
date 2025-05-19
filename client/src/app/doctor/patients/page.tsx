"use client"
import { useState, useEffect, useRef } from 'react';
import { doctorService } from '@/services/api';
import PageTemplate from '@/components/PageTemplate';
import AuthWrapper from '@/components/AuthWrapper';
import { motion } from 'framer-motion';

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
  UserCircle
} from 'lucide-react';

export default function DoctorPatients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
  
    // Refs for modal content to handle outside clicks
    const addModalRef = useRef(null);
    const editModalRef = useRef(null);
    const viewModalRef = useRef(null);
    const deleteModalRef = useRef(null);
  
    // State for new patient form
    const [newPatient, setNewPatient] = useState({
      username: '',
      email: '',
      phone_number: '',
      full_name: '',
      birth_date: '',
      gender: 'male',
      role: 'patient'
    });
  
    // State for form processing
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [formSuccess, setFormSuccess] = useState('');
  
    // Handle click outside to close modals
    useEffect(() => {
      function handleClickOutside(event) {
        if (showAddModal && addModalRef.current && !addModalRef.current.contains(event.target)) {
          setShowAddModal(false);
        }
        if (showEditModal && editModalRef.current && !editModalRef.current.contains(event.target)) {
          setShowEditModal(false);
        }
        if (showViewModal && viewModalRef.current && !viewModalRef.current.contains(event.target)) {
          setShowViewModal(false);
        }
        if (showDeleteModal && deleteModalRef.current && !deleteModalRef.current.contains(event.target)) {
          setShowDeleteModal(false);
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showAddModal, showEditModal, showViewModal, showDeleteModal]);
  
    // Fetch patients on component mount
    useEffect(() => {
      fetchPatients();
    }, []);
  
    // Function to fetch patients
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await doctorService.getPatients();
        setPatients(response.data.patients);
        setLoading(false);
      } catch (err) {
        setError('Failed to load patients data');
        setLoading(false);
        console.error(err);
      }
    };
  
    // Function to handle adding a new patient
    const handleAddPatient = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setFormError('');
      setFormSuccess('');
      
      try {   
        await doctorService.addPatient(newPatient);
        setFormSuccess('Patient added successfully!');
        setShowAddModal(false);
        setNewPatient({
          username: '',
          email: '',
          phone_number: '',
          full_name: '',
          birth_date: '',
          gender: 'male',
          role: 'patient'
        });
        fetchPatients(); // Refresh patient list
      } catch (err) {
        setFormError(err.message || 'Failed to add patient');
      } finally {
        setIsSubmitting(false);
      }
    };
  
    // Function to handle updating a patient
    const handleUpdatePatient = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);
      setFormError('');
      
      try {
        await doctorService.updateUser(selectedPatient.id, selectedPatient);
        setFormSuccess('Patient updated successfully!');
        setShowEditModal(false);
        fetchPatients(); // Refresh patient list
      } catch (err) {
        setFormError(err.message || err.response?.data?.message || 'Failed to update patient');
      } finally {
        setIsSubmitting(false);
      }
    };
  
    // Function to handle deleting a patient
    const handleDeletePatient = async () => {
      try {
        await doctorService.deletePatient(selectedPatient.id);
        setFormSuccess('Patient deleted successfully!');
        setShowDeleteModal(false);
        fetchPatients(); // Refresh patient list
      } catch (err) {
        setFormError(err.message || 'Failed to delete patient');
      }
    };
  
    // Function to filter patients based on search term
    const filteredPatients = patients.filter(patient => 
      patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone_number?.includes(searchTerm)
    );
  
    // Function to calculate age from birth date
    const calculateAge = (birth_date) => {
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
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Function to format gender display
    const formatGender = (gender) => {
      if (!gender) return 'N/A';
      return gender.charAt(0).toUpperCase() + gender.slice(1);
    };

    return (
      <PageTemplate>
        <AuthWrapper allowedRoles={['doctor']}>
          <div className="flex min-h-screen">
            <div className="flex-1 p-8 bg-gradient-to-br from-green-50 to-teal-100">
              {/* Header section */}
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-green-800">Patients Management</h1>
                
                <div className="flex gap-4">
                  {/* View mode toggle */}
                  <div className="flex items-center bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`p-2 ${viewMode === 'card' ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' : 'text-gray-600 hover:bg-green-50'}`}
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white' : 'text-gray-600 hover:bg-green-50'}`}
                    >
                      <List size={20} />
                    </button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg shadow transition-colors"
                  >
                    <UserPlus size={18} />
                    Add New Patient
                  </motion.button>
                </div>
              </div>
              
              {/* Search and filters */}
              <div className="bg-white p-4 rounded-xl shadow-md mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search patients by name, email or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-green-800"
                  />
                </div>
              </div>
              
              {/* Patients list */}
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={24} />
                    <h2 className="text-xl font-semibold text-red-700">Error</h2>
                  </div>
                  <p className="mt-2 text-red-600">{error}</p>
                  <button 
                    onClick={() => fetchPatients()} 
                    className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
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
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4">
                                {patient.profile_picture ? (
                                  <img 
                                    src={`data:image/jpeg;base64,${Buffer.from(patient.profile_picture.data).toString("base64")}`}
                                    alt={patient.full_name} 
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User size={24} />
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-green-800">{patient.full_name}</h3>
                                <p className="text-sm text-gray-500">
                                  {formatGender(patient.gender)}, {calculateAge(patient.birth_date)} years
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-gray-600">
                              <Mail size={16} className="mr-2 text-green-600" />
                              <span className="text-sm">{patient.email}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Phone size={16} className="mr-2 text-green-600" />
                              <span className="text-sm">{patient.phone_number}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Calendar size={16} className="mr-2 text-green-600" />
                              <span className="text-sm">{formatDate(patient.birth_date)}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <UserCircle size={16} className="mr-2 text-green-600" />
                              <span className="text-sm">{formatGender(patient.gender)}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between pt-4 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowViewModal(true);
                              }}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              View Details
                            </button>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setShowEditModal(true);
                                }}
                                className="p-1 rounded-full hover:bg-green-50 text-green-600"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1 rounded-full hover:bg-red-50 text-red-500"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  // List view
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-green-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                            Patient
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                            Contact
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                            Birth Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                            Gender
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                            Age
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-green-800 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPatients.map((patient, index) => (
                          <tr 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          
                          key={patient.id} className="hover:bg-green-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                  {patient.profile_picture ? (
                                    <img 
                                      src={`data:image/jpeg;base64,${Buffer.from(patient.profile_picture.data).toString("base64")}`}
                                      alt={patient.full_name} 
                                      className="w-full h-full rounded-full object-cover"
                                    />
                                  ) : (
                                    <User size={18} />
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-green-800">{patient.full_name}</div>
                                  <div className="text-sm text-gray-500">{patient.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{patient.email}</div>
                              <div className="text-sm text-gray-600">{patient.phone_number}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(patient.birth_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatGender(patient.gender)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {calculateAge(patient.birth_date)} years
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    setShowViewModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <ChevronRight size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    setShowEditModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPatient(patient);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-red-500 hover:text-red-700"
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
            <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
              <motion.div
                ref={addModalRef}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                  <h2 className="text-xl font-bold text-green-800">Add New Patient</h2>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="p-1 rounded-full hover:bg-green-100 text-green-600"
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
                    <label className="block text-sm font-medium text-green-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newPatient.full_name}
                      onChange={(e) => setNewPatient({...newPatient, full_name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={newPatient.username}
                      onChange={(e) => setNewPatient({...newPatient, username: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={newPatient.email}
                      onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={newPatient.phone_number}
                      onChange={(e) => setNewPatient({...newPatient, phone_number: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Birth Date</label>
                    <input
                      type="date"
                      required
                      value={newPatient.birth_date}
                      onChange={(e) => setNewPatient({...newPatient, birth_date: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Gender</label>
                    <select
                      required
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
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
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-transform"
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
            <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
              <motion.div
                ref={editModalRef}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                  <h2 className="text-xl font-bold text-green-800">Edit Patient</h2>
                  <button 
                    onClick={() => setShowEditModal(false)}
                    className="p-1 rounded-full hover:bg-green-100 text-green-600"
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
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2">
                      <CheckCircle size={16} />
                      {formSuccess}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={selectedPatient.full_name}
                      onChange={(e) => setSelectedPatient({...selectedPatient, full_name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={selectedPatient.email}
                      onChange={(e) => setSelectedPatient({...selectedPatient, email: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={selectedPatient.phone_number}
                      onChange={(e) => setSelectedPatient({...selectedPatient, phone_number: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Birth Date</label>
                    <input
                      type="date"
                      required
                      value={selectedPatient.birth_date ? selectedPatient.birth_date.split('T')[0] : ''}
                      onChange={(e) => setSelectedPatient({...selectedPatient, birth_date: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">Gender</label>
                    <select
                      required
                      value={selectedPatient.gender}
                      onChange={(e) => setSelectedPatient({...selectedPatient, gender: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800"
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
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:scale-105 transition-transform"
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
            <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
              <motion.div
                ref={viewModalRef}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-green-50">
                  <h2 className="text-xl font-bold text-green-800">Patient Details</h2>
                  <button 
                    onClick={() => setShowViewModal(false)}
                    className="p-1 rounded-full hover:bg-green-100 text-green-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                      {selectedPatient.profile_picture ? (
                        <img 
                          src={`data:image/jpeg;base64,${Buffer.from(selectedPatient.profile_picture.data).toString("base64")}`}
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
                      <p className="text-lg font-medium text-green-800">{selectedPatient.full_name}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Username</h3>
                      <p className="text-lg font-medium text-green-800">{selectedPatient.username}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p className="text-lg font-medium text-green-800">{selectedPatient.email}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                      <p className="text-lg font-medium text-green-800">{selectedPatient.phone_number}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Birth Date</h3>
                      <p className="text-lg font-medium text-green-800">{formatDate(selectedPatient.birth_date)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                      <p className="text-lg font-medium text-green-800">{formatGender(selectedPatient.gender)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Age</h3>
                      <p className="text-lg font-medium text-green-800">{calculateAge(selectedPatient.birth_date)} years</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        setShowEditModal(true);
                      }}
                      className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-800 flex items-center gap-2"
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
            <div className="fixed inset-0 backdrop-blur-sm bg-green-900/10 flex items-center justify-center z-50 p-4">
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
                  
                  <h3 className="text-lg font-bold text-center mb-2">Delete Patient</h3>
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