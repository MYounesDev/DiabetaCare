import React, { useState } from 'react';
import { Search, User } from 'lucide-react';

export interface Patient {
  id: number;
  full_name: string;
  username: string;
  profile_picture?: string;
}

interface PatientListProps {
  patients: Patient[];
  selectedPatientId: number | null;
  onSelectPatient: (id: number) => void;
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
        <h2 className="text-xl font-bold text-green-800 mb-4">Patients</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-green-800"
          />
        </div>
      </div>
      
      {filtered.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          <User className="mx-auto mb-2" size={24} />
          <p>No patients found</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {filtered.map(patient => (
            <button
              key={patient.id}
              onClick={() => onSelectPatient(patient.id)}
              className={`w-full p-4 flex items-center gap-4 transition-colors hover:bg-green-50 ${
                selectedPatientId === patient.id ? 'bg-green-50 border-l-4 border-green-500' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {patient.profile_picture ? (
                  <img 
                    src={`data:image/jpeg;base64,${Buffer.from(patient.profile_picture).toString('base64')}`}
                    alt={patient.full_name} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-green-100"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg border-2 border-green-200">
                    <User size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-green-800">{patient.full_name}</h3>
                <p className="text-sm text-gray-500">{patient.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientList; 