"use client";
import { useState, useEffect } from "react";
import { patientService } from "@/services/api";
import PageTemplate from "@/components/layout/PageTemplate";
import AuthWrapper from "@/components/auth/AuthWrapper";
import BloodSugarCalendar, { BloodSugarMeasurement } from '@/components/calendar/BloodSugarCalendar';

export default function PatientBloodSugar() {
  // State for blood sugar measurements
  const [measurements, setMeasurements] = useState<BloodSugarMeasurement[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  if (!userData?.id) {
    throw new Error('User ID not found');
  }
  // Fetch measurements on mount
  useEffect(() => {
    fetchBloodSugarMeasurements();
  }, []);

  const fetchBloodSugarMeasurements = async () => {
    try {
      setLoadingMeasurements(true);


      const response = await patientService.getBloodSugarMeasurements(userData.id);
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

  const handleAddMeasurement = async (date: string, value: number) => {
    try {
      await patientService.addBloodSugarMeasurement({
        patient_id: userData.id,
        value,
        measured_at: date // This includes both date and time
      });
      fetchBloodSugarMeasurements();
    } catch (error) {
      console.error('Error adding blood sugar measurement:', error);
    }
  };

  const handleEditMeasurement = async (measurement: BloodSugarMeasurement) => {
    try {
      await patientService.updateBloodSugarMeasurement({
        blood_sugar_measurement_id: measurement.blood_sugar_measurement_id,
        value: measurement.value,
        measured_at: measurement.measured_at // This includes both date and time
      });
      fetchBloodSugarMeasurements();
    } catch (error) {
      console.error('Error updating blood sugar measurement:', error);
    }
  };

  const handleDeleteMeasurement = async (measurement: BloodSugarMeasurement) => {
    try {
      await patientService.deleteBloodSugarMeasurement(measurement.blood_sugar_measurement_id);
      fetchBloodSugarMeasurements();
    } catch (error) {
      console.error('Error deleting blood sugar measurement:', error);
    }
  };

  return (
    <PageTemplate>
      <AuthWrapper allowedRoles={["patient"]}>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-800 mb-2">My Blood Sugar Monitoring</h1>
            <p className="text-gray-600">Track and manage your blood sugar measurements throughout the day</p>
          </div>

          {/* Main Content */}
          <div>
            {loadingMeasurements ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : (
              <BloodSugarCalendar
                measurements={measurements}
                onAddMeasurement={handleAddMeasurement}
                onEditMeasurement={handleEditMeasurement}
                onDeleteMeasurement={handleDeleteMeasurement}
              />
            )}
          </div>
        </div>
      </AuthWrapper>
    </PageTemplate>
  );
} 
