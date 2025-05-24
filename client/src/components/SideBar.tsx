import Link from 'next/link';
import { useState } from 'react';
import { User, Hospital, Activity, ClipboardList, Utensils, HeartPulse, Droplet, Stethoscope, ChevronLeft, ChevronRight, Calendar, FileText, Settings, Home } from 'lucide-react';

type SideBarProps = {
  role: 'admin' | 'doctor' | 'patient';
};

export default function SideBar({ role }: SideBarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} h-screen bg-gradient-to-b from-green-100 to-teal-200 shadow-lg p-4 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-8 p-2 rounded-lg bg-white/20 backdrop-blur-lg">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <Hospital className="text-green-500" size={24} />
            <span className="text-green-600 font-bold">DiabetaCare</span>
          </div>
        ) : (
          <Hospital className="text-green-500" size={24} />
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          {isOpen ? <ChevronLeft className="text-green-500" size={20} /> : <ChevronRight className="text-green-500" size={20} />}
        </button>
      </div>

      <div className="space-y-4">
      <Link href={`/${role}/home`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Home className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Home</span>}
            </Link>
        {role === 'doctor' ? (
          <>
            <Link href="/doctor/patients" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <User className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Patients</span>}
            </Link>
            <Link href="/doctor/exercises" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <ClipboardList className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Exercises</span>}
            </Link>
            <Link href="/doctor/diets" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Utensils className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Diets</span>}
            </Link>
            <Link href="/doctor/symptoms" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <HeartPulse className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Symptoms</span>}
            </Link>
            <Link href="/doctor/blood-sugar" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Droplet className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Blood Sugar</span>}
            </Link>
            <Link href="/doctor/appointments" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Calendar className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Appointments</span>}
            </Link>
            <Link href="/doctor/reports" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <FileText className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Reports</span>}
            </Link>
            <Link href="/doctor/settings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Settings className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Settings</span>}
            </Link>
          </>
        ) : role === 'patient' ? (
          <>
            <Link href="/patient/exercises" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <ClipboardList className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Exercises</span>}
            </Link>
            <Link href="/patient/diets" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Utensils className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Diets</span>}
            </Link>
            <Link href="/patient/symptoms" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <HeartPulse className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Symptoms</span>}
            </Link>
            <Link href="/patient/blood-sugar" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Droplet className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Blood Sugar</span>}
            </Link>
            <Link href="/patient/my-doctor" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Stethoscope className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">My Doctor</span>}
            </Link>
            <Link href="/patient/appointments" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Calendar className="text-green-500" size={20} />
              {isOpen && <span className="text-green-700">Appointments</span>}
            </Link>
          </>
        ) : (
<>
          {/* Admin specific links */ }
          < Link href="/admin/dashboard" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
        <Activity className="text-green-500" size={20} />
        {isOpen && <span className="text-green-700">Dashboard</span>}
      </Link>
</>
      )}
    </div>
    </div >
  );
}
