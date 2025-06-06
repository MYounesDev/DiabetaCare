import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, AlertCircle, Plus, ChevronLeft, ChevronRight, Clock, X, Info, Loader2, Trash2 } from 'lucide-react';
import { doctorService } from "@/services/api";
import {
  toLocalDate,
  formatToYYYYMMDD,
  formatToHHMM,
  getCurrentDate,
  formatToISOString,
  combineDateTime
} from '@/utils/dateUtils';

interface InsulinLog {
    insulin_log_id: number;
    patient_id: number;
    log_date: string;
    log_time: string;
    insulin_dosage_ml: number;
    note: string;
  }
  
  interface InsulinRecommendation {
    level_description: string;
    insulin_dosage_ml: number;
    note: string;
    canTrustResult: boolean;
  }
  
  interface InsulinLogsCalendarProps {
    logs: InsulinLog[];
    patientId: number; // Required prop for fetching recommendations
    onAddLog: (log: Omit<InsulinLog, 'insulin_log_id'>) => void;
    onEditLog: (log: InsulinLog) => void;
    onDeleteLog: (logId: number) => void;
  }
  
  export default function InsulinLogsCalendar({ logs, patientId, onAddLog, onEditLog, onDeleteLog }: InsulinLogsCalendarProps) {
    const [currentDate, setCurrentDate] = useState(getCurrentDate());
    const [hoveredDate, setHoveredDate] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState<InsulinLog | null>(null);
    const [newValue, setNewValue] = useState<string>('');
    const [newTime, setNewTime] = useState<string>('12:00');
    const [editValue, setEditValue] = useState<string>('');
    const [editTime, setEditTime] = useState<string>('12:00');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [dayLogs, setDayLogs] = useState<InsulinLog[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [recommendation, setRecommendation] = useState<InsulinRecommendation | null>(null);
    const [canTrustResult, setCanTrustResult] = useState<boolean>(false);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [neededRecords, setNeededRecords] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [newNote, setNewNote] = useState<string>('');
    const timeModalRef = useRef<HTMLDivElement>(null);
    // Refs for modal click outside handling
    const addModalRef = useRef<HTMLDivElement>(null);
    const editModalRef = useRef<HTMLDivElement>(null);
    const logsModalRef = useRef<HTMLDivElement>(null);

    // Handle click outside modals
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (showAddModal && addModalRef.current && !addModalRef.current.contains(event.target as Node)) {
          setShowAddModal(false);
        }
        if (showEditModal && editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
          setShowEditModal(false);
        }
        if (showLogsModal && logsModalRef.current && !logsModalRef.current.contains(event.target as Node)) {
          setShowLogsModal(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showAddModal, showEditModal, showLogsModal]);

    // Handle click outside modal
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (timeModalRef.current && !timeModalRef.current.contains(event.target as Node)) {
          handleCloseModal();
        }
      };

      if (showAddModal || showEditModal || showLogsModal) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showAddModal, showEditModal, showLogsModal]);

    const handleCloseModal = () => {
      setShowAddModal(false);
      setShowEditModal(false);
      setShowLogsModal(false);
      setSelectedDate('');
      setNewValue('');
      setNewTime('12:00');
      setEditValue('');
      setEditTime('12:00');
      setSelectedLog(null);
      setRecommendation(null);
    };

    // Format a date as YYYY-MM-DD string without timezone issues
    const formatDateToYYYYMMDD = (date: Date): string => {
        return formatToYYYYMMDD(date);
    };

    const getFirstDayOfMonth = (date: Date) => {
        return toLocalDate(new Date(date.getFullYear(), date.getMonth(), 1));
    };

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getMonthName = (date: Date) => {
        return date.toLocaleString('default', { month: 'long' });
    };

    const getWeekDays = () => {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    };

    const handlePrevMonth = () => {
        setCurrentDate(toLocalDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)));
    };

    const handleNextMonth = () => {
        setCurrentDate(toLocalDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)));
    };

    const getLogsForDate = (date: string) => {
        return logs.filter(log => formatToYYYYMMDD(log.log_date) === date);
    };

    const getSumInsulinAndCount = (logs: InsulinLog[]) => {
        if (logs.length === 0) return { sumInsulin: 0, count: 0 };
        const sum = logs.reduce((acc, curr) => acc + Number(curr.insulin_dosage_ml), 0);
        return {
            sumInsulin: Number((sum).toFixed(1)),
            count: logs.length
        };
    };

    const handleDayClick = (date: string) => {
        const logsForDay = getLogsForDate(date);
        setSelectedDate(date);
        if (logsForDay.length > 0) {
            setDayLogs(logsForDay);
            setShowLogsModal(true);
        } else {
            setShowAddModal(true);
        }
    };

    const handleAddClick = (date: string) => {
        setSelectedDate(date);
        setNewValue('');
        setNewTime('12:00');
        setRecommendation(null);
        setShowLogsModal(false);
        setShowAddModal(true);
    };

    const handleTimeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedDate && newTime) {
            setIsSubmitting(true);
            try {
                const dateTime = combineDateTime(selectedDate, newTime);
                const recommendationResult = await doctorService.getInsulinRecommendationByPatient({
                    patient_id: patientId,
                    datetime: formatToISOString(dateTime)
                });
                setRecommendation(recommendationResult.data.recommendedInsulin);
                setCanTrustResult(recommendationResult.data.canTrustResult);
                setTotalRecords(recommendationResult.data.totalRecords);
                setNeededRecords(recommendationResult.data.neededRecords);
                setNewValue(recommendationResult.data.recommendedInsulin.insulin_dosage_ml.toString());
            } catch (error) {
                console.error('Error fetching recommendation:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedDate && newValue && newTime) {
            setIsSubmitting(true);
            try {
                const dateTime = combineDateTime(selectedDate, newTime);
                const newLog = {
                    patient_id: patientId,
                    log_date: formatToISOString(dateTime),
                    log_time: newTime,
                    insulin_dosage_ml: parseFloat(newValue),
                    note: newNote
                };
                await onAddLog(newLog);
                setShowAddModal(false);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleEditClick = (log: InsulinLog) => {
        const logTime = new Date(log.log_date);
        setEditTime(
            `${String(logTime.getHours()).padStart(2, '0')}:${String(logTime.getMinutes()).padStart(2, '0')}`
        );
        setEditValue(log.insulin_dosage_ml.toString());
        setSelectedLog(log);
        setShowLogsModal(false);
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedLog && editValue && editTime) {
            setIsSubmitting(true);
            try {
                const dateTime = combineDateTime(formatToYYYYMMDD(selectedLog.log_date), editTime);
                await onEditLog({
                    ...selectedLog,
                    insulin_dosage_ml: parseFloat(editValue),
                    log_date: formatToISOString(dateTime),
                    log_time: editTime
                });
                setShowEditModal(false);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleDelete = async () => {
        if (selectedLog) {
            setIsSubmitting(true);
            try {
                await onDeleteLog(selectedLog.insulin_log_id);
                setShowEditModal(false);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const getInsulinLevel = (sumInsulin: number) => {
        if (sumInsulin === 0) return 'none';
        if (sumInsulin <= 2) return 'low';
        if (sumInsulin <= 4) return 'medium';
        return 'high';
    };

    const renderCalendarDays = () => {
        const firstDay = getFirstDayOfMonth(currentDate);
        const daysInMonth = getDaysInMonth(currentDate);
        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(
                <div key={`empty-${i}`} className="h-24 bg-gray-50 rounded-lg border border-gray-100" />
            );
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateString = formatDateToYYYYMMDD(date);
            const dayLogs = getLogsForDate(dateString);
            const { sumInsulin, count } = getSumInsulinAndCount(dayLogs);
            const isToday = formatDateToYYYYMMDD(new Date()) === dateString;
            const isHovered = hoveredDate === dateString;
            const insulinLevel = getInsulinLevel(sumInsulin);

            const getBgColor = () => {
                if (isToday) return 'bg-orange-50';
                if (insulinLevel === 'low') return 'bg-red-50';
                if (insulinLevel === 'medium') return 'bg-yellow-50';
                if (insulinLevel === 'high') return 'bg-red-50';
                return 'bg-gray-50';
            };

            const getBorderColor = () => {
                if (isToday) return 'border-orange-500';
                if (insulinLevel === 'low') return 'border-red-300';
                if (insulinLevel === 'medium') return 'border-yellow-300';
                if (insulinLevel === 'high') return 'border-red-300';
                return 'border-gray-100';
            };

            const getHoverBorderColor = () => {
                if (isToday) return 'hover:border-orange-500';
                if (insulinLevel === 'low') return 'hover:border-red-500';
                if (insulinLevel === 'medium') return 'hover:border-yellow-500';
                if (insulinLevel === 'high') return 'hover:border-red-500';
                return 'hover:border-orange-300';
            };

            days.push(
                <motion.div
                    key={day}
                    whileHover={{ scale: 1.02 }}
                    onHoverStart={() => setHoveredDate(dateString)}
                    onHoverEnd={() => setHoveredDate(null)}
                    onClick={() => handleDayClick(dateString)}
                    className={`
                        h-24 p-2 rounded-lg border cursor-pointer transition-all relative
                        ${getBgColor()}
                        ${getBorderColor()}
                        ${getHoverBorderColor()}
                        ${isHovered ? 'shadow-md' : 'hover:shadow-sm'}
                    `}
                >
                    <div className="flex justify-between items-start">
                        <span className={`
                            text-sm font-medium
                            ${isToday ? 'text-orange-700' : 'text-gray-700'}
                        `}>
                            {day}
                        </span>
                        {count > 0 && (
                            <div className="flex flex-col items-end">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`
                                        px-2 py-1 rounded-full
                                        ${insulinLevel === 'low' ? 'bg-red-100 text-red-600' : ''}
                                        ${insulinLevel === 'medium' ? 'bg-yellow-100 text-yellow-600' : ''}
                                        ${insulinLevel === 'high' ? 'bg-red-100 text-red-600' : ''}
                                        ${insulinLevel === 'none' ? 'bg-gray-100 text-gray-600' : ''}
                                    `}
                                >
                                    <span className="text-xs font-medium">{sumInsulin} mL</span>
                                </motion.div>
                                <span className="text-xs text-gray-500 mt-1">
                                    {count} {count === 1 ? 'dose' : 'doses'}
                                </span>
                            </div>
                        )}
                    </div>
                    {!count && isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-orange-50 bg-opacity-90 rounded-lg"
                        >
                            <Plus size={20} className="text-orange-600" />
                        </motion.div>
                    )}
                </motion.div>
            );
        }

        return days;
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Calendar Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-orange-800">Insulin Logs</h2>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 rounded-lg hover:bg-white transition-colors text-orange-600"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-lg font-semibold text-orange-800">
                                {getMonthName(currentDate)} {currentDate.getFullYear()}
                            </span>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 rounded-lg hover:bg-white transition-colors text-orange-600"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="p-6">
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {getWeekDays().map(day => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {renderCalendarDays()}
                    </div>
                </div>

                {/* Legend */}
                <div className="px-6 pb-4">
                    <div className="flex items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300" />
                            <span className="text-gray-600">Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300" />
                            <span className="text-gray-600">Low (≤2 mL)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300" />
                            <span className="text-gray-600">Medium (3-4 mL)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300" />
                            <span className="text-gray-600">High (≥5 mL)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Log Modal */}
            {showAddModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
                    <motion.div
                        ref={addModalRef}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
                            <h2 className="text-xl font-bold text-orange-800">Add Insulin Log</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-orange-100 text-orange-600">
                                <X size={20} />
                            </button>
                        </div>
                        {!recommendation ? (
                            <form onSubmit={handleTimeSubmit} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-orange-700 mb-1">Date</label>
                                    <input
                                        type="text"
                                        value={selectedDate}
                                        disabled
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-orange-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={newTime}
                                        onChange={(e) => setNewTime(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
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
                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Get Recommendation
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
                                {/* Recommendation Display */}
                                <div className={`p-4 rounded-lg ${canTrustResult ? 'bg-orange-50' : 'bg-red-50'} mb-4`}>
                                    <div className="flex items-start gap-3">
                                        {canTrustResult ? (
                                            <Info className="h-5 w-5 text-orange-600 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                        )}
                                        <div>
                                            <h3 className={`font-medium ${canTrustResult ? 'text-orange-800' : 'text-red-800'}`}>
                                                Recommended Insulin Dosage
                                            </h3>
                                            <p className="text-sm mt-1 text-gray-700">
                                                {recommendation.insulin_dosage_ml} mL
                                            </p>
                                            <div className="mt-2 text-xs">
                                                <div className={`flex items-center gap-1 ${canTrustResult ? 'text-orange-600' : 'text-red-600'}`}>
                                                    <span>Records: {totalRecords}</span>
                                                    {!canTrustResult && (
                                                        <span className="ml-1">
                                                            (Need {neededRecords} more records for reliable prediction)
                                                        </span>
                                                    )}
                                                </div>
                                                {!canTrustResult && (
                                                    <p className="text-red-600 mt-1">
                                                        This recommendation may not be accurate. Please use your clinical judgment.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-orange-700 mb-1">Date</label>
                                    <input
                                        type="text"
                                        value={selectedDate}
                                        disabled
                                        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-orange-700 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={newTime}
                                        disabled
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-orange-700 mb-1">Insulin Dosage (mL)</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                                        placeholder="Enter dosage..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-orange-700 mb-1">Note</label>
                                    <textarea
                                        name="note"
                                        rows={3}
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                                        placeholder="Add any additional notes..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRecommendation(null);
                                            setNewValue('');
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !newValue}
                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Log
                                    </button>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}

            {/* Edit Log Modal */}
            {showEditModal && selectedLog && (
                <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
                    <motion.div
                        ref={editModalRef}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
                            <h2 className="text-xl font-bold text-orange-800">Edit Insulin Log</h2>
                            <button onClick={() => setShowEditModal(false)} className="p-1 rounded-full hover:bg-orange-100 text-orange-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-orange-700 mb-1">Date</label>
                                <input
                                    type="text"
                                    value={formatToYYYYMMDD(selectedLog.log_date)}
                                    disabled
                                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-orange-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={editTime}
                                    onChange={(e) => setEditTime(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-orange-700 mb-1">Insulin Dosage (mL)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                                    placeholder="Enter dosage..."
                                />
                            </div>
                            <div className="pt-4 border-t border-gray-200 flex justify-between">
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !editValue}
                                        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Save
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Day Logs Modal */}
            {showLogsModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
                    <motion.div
                        ref={logsModalRef}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
                            <div>
                                <h2 className="text-xl font-bold text-orange-800">Insulin Logs</h2>
                                <p className="text-sm text-gray-600 mt-1">{selectedDate}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleAddClick(selectedDate)}
                                    className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center gap-1 hover:opacity-90 transition-opacity"
                                >
                                    <Plus size={16} /> Add
                                </button>
                                <button onClick={() => setShowLogsModal(false)} className="p-1 rounded-full hover:bg-orange-100 text-orange-600">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {dayLogs.map((log) => {
                                    const getLogColor = (dosage: number) => {
                                        if (dosage <= 1) return 'bg-orange-100 text-orange-600';
                                        if (dosage == 2.0) return 'bg-yellow-100 text-yellow-600';
                                        if (dosage >= 3) return 'bg-red-100 text-red-600';
                                        return 'bg-gray-100 text-gray-600';
                                    };

                                    return (
                                        <motion.div
                                            key={log.insulin_log_id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getLogColor(log.insulin_dosage_ml)}`}
                                            onClick={() => handleEditClick(log)}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">
                                                    {formatToHHMM(log.log_date)}
                                                </span>
                                                <span className="font-bold">{log.insulin_dosage_ml} mL</span>
                                            </div>
                                            {log.note && (
                                                <p className="text-sm mt-1 text-gray-600">{log.note}</p>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex flex-wrap gap-3 justify-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300" />
                                        <span className="text-gray-600">0-1 mL</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300" />
                                        <span className="text-gray-600">2 mL</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300" />
                                        <span className="text-gray-600">3 mL</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300" />
                                        <span className="text-gray-600">Other</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </>
    );
}
