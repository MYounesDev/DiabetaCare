"use client";
import { useState, useEffect } from "react";
import { doctorService } from "@/services/api";
import PageTemplate from "@/components/layout/PageTemplate";
import AuthWrapper from "@/components/auth/AuthWrapper";
import PatientList from '@/components/patients/PatientList';
import BloodSugarCalendar, { BloodSugarMeasurement } from '@/components/calendar/BloodSugarCalendar';

interface Patient {
  id: string;
  full_name: string;
  username: string;
  profile_picture?: string;
}

export default function DoctorBloodSugar() {
  // State for patients
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // State for blood sugar measurements
  const [measurements, setMeasurements] = useState<BloodSugarMeasurement[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Fetch measurements when selected patient changes
  useEffect(() => {
    if (selectedPatientId) {
      fetchBloodSugarMeasurements(selectedPatientId);
    } else {
      setMeasurements([]);
    }
  }, [selectedPatientId]);

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

  const fetchBloodSugarMeasurements = async (patientId: string) => {
    try {
      setLoadingMeasurements(true);
      const response = await doctorService.getBloodSugarMeasurements(patientId);
      // Sort measurements by measured_at in descending order
      const sortedMeasurements = response.data.bloodSugarMeasurements.sort(
        (a: BloodSugarMeasurement, b: BloodSugarMeasurement) =>
          new Date(b.measured_at).getTime() - new Date(a.measured_at).getTime()
      );
      setMeasurements(sortedMeasurements);
    } catch (error) {
      console.error('Error fetching blood sugar measurements:', error);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
  };

  const handleAddMeasurement = async (date: string, value: number) => {
    try {
      await doctorService.addBloodSugarMeasurement({
        patient_id: selectedPatientId,
        value,
        measured_at: date // This now includes both date and time
      });
      if (selectedPatientId) {
        fetchBloodSugarMeasurements(selectedPatientId);
      }
    } catch (error) {
      console.error('Error adding blood sugar measurement:', error);
    }
  };

  const handleEditMeasurement = async (measurement: BloodSugarMeasurement) => {
    try {
      await doctorService.updateBloodSugarMeasurement({
        blood_sugar_measurement_id: measurement.blood_sugar_measurement_id,
        patient_id: selectedPatientId,
        value: measurement.value,
        measured_at: measurement.measured_at // This now includes both date and time
      });
      if (selectedPatientId) {
        fetchBloodSugarMeasurements(selectedPatientId);
      }
    } catch (error) {
      console.error('Error updating blood sugar measurement:', error);
    }
  };

  const handleDeleteMeasurement = async (measurement: BloodSugarMeasurement) => {
    try {
      await doctorService.deleteBloodSugarMeasurement(measurement.blood_sugar_measurement_id);
      if (selectedPatientId) {
        fetchBloodSugarMeasurements(selectedPatientId);
      }
    } catch (error) {
      console.error('Error deleting blood sugar measurement:', error);
    }
  };

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
            <h1 className="text-3xl font-bold text-orange-800 mb-2">Blood Sugar Monitoring</h1>
            <p className="text-gray-600">Track and manage patient blood sugar measurements throughout the day</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Patient List - takes 1/3 of the space */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-orange-800">Patients</h2>
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

            {/* Blood Sugar Calendar - takes 2/3 of the space */}
            <div className="lg:col-span-2">
              {selectedPatientId ? (
                loadingMeasurements ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                  </div>
                ) : (
                  <BloodSugarCalendar
                    measurements={measurements}
                    onAddMeasurement={handleAddMeasurement}
                    onEditMeasurement={handleEditMeasurement}
                    onDeleteMeasurement={handleDeleteMeasurement}
                  />
                )
              ) : (
                <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm">
                  <p className="text-gray-400 text-xl">Select a patient to view blood sugar measurements</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AuthWrapper>
    </PageTemplate>
  );
}
