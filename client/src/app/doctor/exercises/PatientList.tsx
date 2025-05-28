import React, { useState } from 'react';
import { Search, User } from 'lucide-react';

export interface Patient {
  exercise_logs_id: string;
  full_name: string;
  username: string;
  profile_picture?: string;
}

interface PatientListProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({ patients, selectedPatientId, onSelectPatient }) => {
  const [search, setSearch] = useState('');
  const filtered = patients.filter(p => 
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-orange-800 mb-4">Patients</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-orange-800"
          />
        </div>
      </div>
      
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <User className="mx-auto mb-2" size={24} />
            <p>No patients found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(patient => (
              <button
                key={patient.exercise_logs_id}
                onClick={() => onSelectPatient(patient.exercise_logs_id)}
                className={`w-full p-4 flex items-center gap-4 transition-colors hover:bg-orange-50 ${
                  selectedPatientId === patient.exercise_logs_id ? 'bg-orange-50 border-l-4 border-orange-500' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {patient.profile_picture ? (
                    <img 
                      src={`data:image/jpeg;base64,${Buffer.from(patient.profile_picture.data).toString("base64")}`}
                      alt={patient.full_name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-orange-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-lg border-2 border-orange-200">
                      <User size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-orange-800">{patient.full_name}</h3>
                  <p className="text-sm text-gray-500">{patient.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList; 