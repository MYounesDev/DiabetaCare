import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, AlertCircle, Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import {
  toLocalDate,
  formatToYYYYMMDD,
  getCurrentDate,
} from '../utils/dateUtils';

export interface ExerciseLog {
  exercise_logs_id: number;
  log_date: string;
  note: string;
  is_completed: boolean;
}

interface CalendarProps {
  logs: ExerciseLog[];
  onAddLog: (date: string) => void;
  onEditLog: (log: ExerciseLog) => void;
  onDeleteLog: (log: ExerciseLog) => void;
}

export default function ExerciseLogsCalendar({ logs, onAddLog, onEditLog, onDeleteLog }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(getCurrentDate());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

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

  const getLogForDate = (date: string) => {
    // Find log where the date matches
    const log = logs.find(log => {
      // Format log date to YYYY-MM-DD for comparison
      const logDate = formatToYYYYMMDD(log.log_date);
      return logDate === date;
    });
    return log;
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
      const log = getLogForDate(dateString);
      const isToday = formatDateToYYYYMMDD(new Date()) === dateString;
      const isHovered = hoveredDate === dateString;

      days.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.02 }}
          onHoverStart={() => setHoveredDate(dateString)}
          onHoverEnd={() => setHoveredDate(null)}
          onClick={() => log ? onEditLog(log) : onAddLog(dateString)}
          className={`
            h-24 p-2 rounded-lg border cursor-pointer transition-all relative
            ${isToday ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-300'}
            ${log ? 'bg-white' : 'bg-gray-50'}
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
            {log && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`
                  p-1 rounded-full
                  ${log.is_completed ? 'bg-orange-100 text-orange-600' : 'bg-yellow-100 text-yellow-600'}
                `}
              >
                {log.is_completed ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              </motion.div>
            )}
          </div>
          {log && (
            <div className="mt-1">
              <p className="text-xs text-gray-600 line-clamp-2">{log.note}</p>
            </div>
          )}
          {!log && isHovered && (
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
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-orange-800">Exercise Logs</h2>
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
            <CheckCircle size={16} className="text-orange-600" />
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-yellow-600" />
            <span className="text-gray-600">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
} 