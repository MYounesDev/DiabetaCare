import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Plus, AlertCircle, Droplet, X, Loader2, Trash2, CheckCircle } from 'lucide-react';
import {
  toLocalDate,
  formatToYYYYMMDD,
  formatToHHMM,
  getCurrentDate,
  combineDateTime,
  formatToISOString
} from '@/utils/dateUtils';

export interface BloodSugarMeasurement {
  blood_sugar_measurement_id: number;
  measured_at: string;
  value: number;
  blood_sugar_level_id: number;
  label: string;
}

interface BloodSugarCalendarProps {
  measurements: BloodSugarMeasurement[];
  onAddMeasurement: (date: string, value: number) => void;
  onEditMeasurement: (measurement: BloodSugarMeasurement) => void;
  onDeleteMeasurement: (measurement: BloodSugarMeasurement) => void;
}

export default function BloodSugarCalendar({ 
  measurements, 
  onAddMeasurement, 
  onEditMeasurement, 
  onDeleteMeasurement 
}: BloodSugarCalendarProps) {
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<BloodSugarMeasurement | null>(null);
  const [newValue, setNewValue] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('12:00');
  const [editValue, setEditValue] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('12:00');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dayMeasurements, setDayMeasurements] = useState<BloodSugarMeasurement[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for modal click outside handling
  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const measurementsModalRef = useRef<HTMLDivElement>(null);

  // Handle click outside modals
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showAddModal && addModalRef.current && !addModalRef.current.contains(event.target as Node)) {
        setShowAddModal(false);
      }
      if (showEditModal && editModalRef.current && !editModalRef.current.contains(event.target as Node)) {
        setShowEditModal(false);
      }
      if (showMeasurementsModal && measurementsModalRef.current && !measurementsModalRef.current.contains(event.target as Node)) {
        setShowMeasurementsModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddModal, showEditModal, showMeasurementsModal]);

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

  const getMeasurementsForDate = (date: string) => {
    return measurements.filter(m => formatToYYYYMMDD(m.measured_at) === date);
  };

  const getAverageAndCount = (measurements: BloodSugarMeasurement[]) => {
    if (measurements.length === 0) return { average: 0, count: 0 };
    const sum = measurements.reduce((acc, curr) => acc + Number(curr.value), 0);
    return {
      average: Math.round(sum / measurements.length),
      count: measurements.length
    };
  };

  const handleDayClick = (date: string) => {
    const measurementsForDay = getMeasurementsForDate(date);
    setSelectedDate(date);
    if (measurementsForDay.length > 0) {
      setDayMeasurements(measurementsForDay);
      setShowMeasurementsModal(true);
    } else {
      setShowAddModal(true);
    }
  };

  const handleAddClick = (date: string) => {
    setSelectedDate(date);
    setNewValue('');
    setNewTime('12:00');
    setShowMeasurementsModal(false);
    setShowAddModal(true);
  };

  const handleEditClick = (measurement: BloodSugarMeasurement) => {
    const measurementTime = new Date(measurement.measured_at);
    setEditTime(
      `${String(measurementTime.getHours()).padStart(2, '0')}:${String(measurementTime.getMinutes()).padStart(2, '0')}`
    );
    setEditValue(measurement.value.toString());
    setSelectedMeasurement(measurement);
    setShowMeasurementsModal(false);
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate && newValue && newTime) {
      setIsSubmitting(true);
      try {
        const dateTime = combineDateTime(selectedDate, newTime);
        await onAddMeasurement(formatToISOString(dateTime), parseFloat(newValue));
        setShowAddModal(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMeasurement && editValue && editTime) {
      setIsSubmitting(true);
      try {
        const dateTime = combineDateTime(formatToYYYYMMDD(selectedMeasurement.measured_at), editTime);
        await onEditMeasurement({
          ...selectedMeasurement,
          value: parseFloat(editValue),
          measured_at: formatToISOString(dateTime)
        });
        setShowEditModal(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedMeasurement) {
      setIsSubmitting(true);
      try {
        await onDeleteMeasurement(selectedMeasurement);
        setShowEditModal(false);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getValueColor = (value: number) => {
    if (value < 70) return 'text-red-600 bg-red-100'; // Low
    if (value > 180) return 'text-red-600 bg-red-100'; // High
    if (value >= 70 && value <= 99) return 'text-orange-600 bg-orange-100'; // Normal
    return 'text-yellow-600 bg-yellow-100'; // Intermediate
  };

  const renderCalendarDays = () => {
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    const weekDays = getWeekDays();
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
      const dayMeasurements = getMeasurementsForDate(dateString);
      const { average, count } = getAverageAndCount(dayMeasurements);
      const isToday = formatDateToYYYYMMDD(new Date()) === dateString;
      const isHovered = hoveredDate === dateString;

      days.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.02 }}
          onHoverStart={() => setHoveredDate(dateString)}
          onHoverEnd={() => setHoveredDate(null)}
          onClick={() => handleDayClick(dateString)}
          className={`
            h-24 p-2 rounded-lg border cursor-pointer transition-all relative
            ${isToday ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-300'}
            ${count > 0 ? 'bg-white' : 'bg-gray-50'}
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
                  className={`px-2 py-1 rounded-full ${getValueColor(average)}`}
                >
                  <span className="text-xs font-medium">{average} mg/dL</span>
                </motion.div>
                <span className={`text-xs ${count < 5 ? 'text-red-500' : 'text-gray-500'} mt-1`}>
                  {count} {count === 1 ? 'reading' : 'readings'}
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
            <h2 className="text-2xl font-bold text-orange-800">Blood Sugar Measurements</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-white transition-colors"
              >
                <ChevronLeft size={20} className="text-orange-600" />
              </button>
              <span className="text-lg font-semibold text-orange-800">
                {getMonthName(currentDate)} {currentDate.getFullYear()}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-white transition-colors"
              >
                <ChevronRight size={20} className="text-orange-600" />
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
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-300" />
              <span className="text-gray-600">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-600" />
              <span className="text-gray-600">Normal (70-99 mg/dL)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-600" />
              <span className="text-gray-600">Intermediate (100-125 mg/dL)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-100 border border-red-600" />
              <span className="text-gray-600">High/Low (&lt;70 or &gt;180 mg/dL)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Measurement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
          <motion.div
            ref={addModalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
              <h2 className="text-xl font-bold text-orange-800">Add Blood Sugar Measurement</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-full hover:bg-orange-100 text-orange-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-orange-700 mb-1">Blood Sugar Value (mg/dL)</label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                  placeholder="Enter value..."
                />
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
                  disabled={isSubmitting || !newValue}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit Measurement Modal */}
      {showEditModal && selectedMeasurement && (
        <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
          <motion.div
            ref={editModalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
              <h2 className="text-xl font-bold text-orange-800">Edit Blood Sugar Measurement</h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-full hover:bg-orange-100 text-orange-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-orange-700 mb-1">Date</label>
                <input
                  type="text"
                  value={formatDateToYYYYMMDD(new Date(selectedMeasurement.measured_at))}
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
                <label className="block text-sm font-medium text-orange-700 mb-1">Blood Sugar Value (mg/dL)</label>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                  placeholder="Enter value..."
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

      {/* Day Measurements Modal */}
      {showMeasurementsModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4">
          <motion.div
            ref={measurementsModalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
              <div>
                <h2 className="text-xl font-bold text-orange-800">Blood Sugar Measurements</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAddClick(selectedDate)}
                  className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center gap-1 hover:opacity-90 transition-opacity"
                >
                  <Plus size={16} /> Add
                </button>
                <button onClick={() => setShowMeasurementsModal(false)} className="p-1 rounded-full hover:bg-orange-100 text-orange-600">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {dayMeasurements.map((measurement) => (
                  <motion.div
                    key={measurement.blood_sugar_measurement_id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${getValueColor(measurement.value)} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => handleEditClick(measurement)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {formatToHHMM(measurement.measured_at)}
                      </span>
                      <span className="font-bold">{measurement.value} mg/dL</span>
                    </div>
                    {measurement.label && (
                      <p className="text-sm mt-1 text-gray-600">{measurement.label}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
} 
