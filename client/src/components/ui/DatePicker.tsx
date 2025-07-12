import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toLocalDate, toUTCDate } from '@/utils/dateUtils';

interface CustomDatePickerProps {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
  dateFormat?: string;
  placeholderText?: string;
  className?: string;
  required?: boolean;
  label?: string;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selectedDate,
  onChange,
  dateFormat = "dd/MM/yyyy",
  placeholderText = "Select date",
  className = "w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none text-green-800",
  required = false,
  label
}) => {
  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Convert to UTC before passing back to parent
      onChange(toUTCDate(date));
    } else {
      onChange(null);
    }
  };

  // Convert UTC date to local timezone for display
  const localDate = selectedDate ? toLocalDate(selectedDate) : null;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-green-700 mb-1">
          {label}
        </label>
      )}
      <DatePicker
        selected={localDate}
        onChange={handleDateChange}
        dateFormat={dateFormat}
        placeholderText={placeholderText}
        className={className}
        required={required}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        isClearable
      />
    </div>
  );
};

export default CustomDatePicker; 
