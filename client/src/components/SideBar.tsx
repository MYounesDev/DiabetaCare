import Link from 'next/link';
import { useState } from 'react';
import { User, Hospital, Activity, ClipboardList, Utensils, HeartPulse, Droplet, Stethoscope, ChevronLeft, ChevronRight, Calendar, ChartSpline, Settings, Home, Syringe } from 'lucide-react';

type SideBarProps = {
  role: 'admin' | 'doctor' | 'patient';
};

export default function SideBar({ role }: SideBarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`${isOpen ? 'w-64' : 'w-20'} h-screen bg-gradient-to-b from-orange-100 to-red-200 shadow-lg p-4 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-8 p-2 rounded-lg bg-white/20 backdrop-blur-lg">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <Hospital className="text-orange-500" size={24} />
            <span className="text-orange-600 font-bold">DiabetaCare</span>
          </div>
        ) : (
          <Hospital className="text-orange-500" size={24} />
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
        >
          {isOpen ? <ChevronLeft className="text-orange-500" size={20} /> : <ChevronRight className="text-orange-500" size={20} />}
        </button>
      </div>

      <div className="space-y-4">
      <Link href={`/${role}/home`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Home className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Home</span>}
            </Link>
        {role === 'doctor' ? (
          <>
            <Link href="/doctor/patients" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <User className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Patients</span>}
            </Link>
            <Link href="/doctor/exercises" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <ClipboardList className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Exercises</span>}
            </Link>
            <Link href="/doctor/diets" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Utensils className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Diets</span>}
            </Link>
            <Link href="/doctor/symptoms" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <HeartPulse className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Symptoms</span>}
            </Link>
            <Link href="/doctor/blood-sugar" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Droplet className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Blood Sugar</span>}
            </Link>
            <Link href="/doctor/insulin-management" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Syringe className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Insulin Management</span>}
            </Link>
            <Link href="/doctor/statics" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <ChartSpline className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Statics</span>}
            </Link>
            <Link href="/doctor/settings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Settings className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Settings</span>}
            </Link>
          </>
        ) : role === 'patient' ? (
          <>
            <Link href="/patient/exercises" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <ClipboardList className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Exercises</span>}
            </Link>
            <Link href="/patient/diets" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Utensils className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Diets</span>}
            </Link>
            <Link href="/patient/symptoms" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <HeartPulse className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Symptoms</span>}
            </Link>
            <Link href="/patient/blood-sugar" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Droplet className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">Blood Sugar</span>}
            </Link>
            <Link href="/patient/my-insulin" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Syringe className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">My Insulin</span>}
            </Link>
            <Link href="/patient/my-doctor" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <Stethoscope className="text-orange-500" size={20} />
              {isOpen && <span className="text-orange-700">My Doctor</span>}
            </Link>
          </>
        ) : (
<>
          {/* Admin specific links */ }
          < Link href="/admin/dashboard" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/20 transition-colors">
        <Activity className="text-orange-500" size={20} />
        {isOpen && <span className="text-orange-700">Dashboard</span>}
      </Link>
</>
      )}
    </div>
    </div >
  );
}
