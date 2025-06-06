"use client";

import { useState, useEffect } from "react";
import { patientService } from "@/services/api";
import PageTemplate from "@/components/layout/PageTemplate";
import AuthWrapper from "@/components/auth/AuthWrapper";
import InsulinLogsCalendar from '@/components/calendar/InsulinLogsCalendar';

interface InsulinLog {
  insulin_log_id: number;
  patient_id: number;
  log_date: string;
  log_time: string;
  insulin_dosage_ml: number;
  note: string;
}

export default function PatientInsulin() {
  // State for insulin logs
  const [logs, setLogs] = useState<InsulinLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  if (!userData?.id) {
    throw new Error('User ID not found');
  }

  // Fetch logs on mount
  useEffect(() => {
    fetchInsulinLogs();
  }, []);

  const fetchInsulinLogs = async () => {
    try {
      setLoadingLogs(true);
      const response = await patientService.getInsulinLogs(userData.id);
      setLogs(response.data.patientInsulinLogs);
    } catch (error) {
      console.error('Error fetching insulin logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleAddLog = async (log: Omit<InsulinLog, 'insulin_log_id'>) => {
    try {
      await patientService.addInsulinLog({
        patient_id: userData.id,
        log_date: log.log_date,
        log_time: log.log_time,
        insulin_dosage_ml: log.insulin_dosage_ml,
        note: log.note
      });
      fetchInsulinLogs();
    } catch (error) {
      console.error('Error adding insulin log:', error);
    }
  };

  const handleEditLog = async (log: InsulinLog) => {
    try {
      await patientService.updateInsulinLog({
        insulin_log_id: log.insulin_log_id,
        log_date: log.log_date,
        log_time: log.log_time,
        insulin_dosage_ml: log.insulin_dosage_ml,
        note: log.note
      });
      fetchInsulinLogs();
    } catch (error) {
      console.error('Error updating insulin log:', error);
    }
  };

  const handleDeleteLog = async (logId: number) => {
    try {
      await patientService.deleteInsulinLog(logId);
      fetchInsulinLogs();
    } catch (error) {
      console.error('Error deleting insulin log:', error);
    }
  };

  return (
    <PageTemplate>
      <AuthWrapper allowedRoles={["patient"]}>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-orange-800 mb-2">My Insulin Monitoring</h1>
            <p className="text-gray-600">Track and manage your insulin doses throughout the day</p>
          </div>

          {/* Main Content */}
          <div>
            {loadingLogs ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <InsulinLogsCalendar
                logs={logs}
                patientId={userData.id}
                onAddLog={handleAddLog}
                onEditLog={handleEditLog}
                onDeleteLog={handleDeleteLog}
              />
            )}
          </div>
        </div>
      </AuthWrapper>
    </PageTemplate>
  );
}
