"use client"
import SideBar from '@/components/SideBar';
import { Activity, ClipboardList, Utensils, HeartPulse, Droplet, Users } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement } from 'chart.js';
import { motion } from 'framer-motion';
import PageTemplate from '@/components/PageTemplate';

export default function DoctorHome() {
  // Register ChartJS components
  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement);

  const stats = [
    { title: 'Total Patients', value: '24', icon: Users, color: 'text-green-500' },
    { title: 'Pending Exercises', value: '5', icon: ClipboardList, color: 'text-teal-500' },
    { title: 'Diet Plans', value: '12', icon: Utensils, color: 'text-green-500' },
    { title: 'New Symptoms', value: '3', icon: HeartPulse, color: 'text-teal-500' },
    { title: 'Blood Sugar Alerts', value: '2', icon: Droplet, color: 'text-green-500' },
  ];

  // Chart data
  const patientActivityData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'New Patients',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Follow-ups',
        data: [8, 15, 10, 12, 9, 11],
        backgroundColor: 'rgba(20, 184, 166, 0.8)',
        borderRadius: 4,
      },
    ],
  };

  const bloodSugarTrendsData = {
    labels: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
    datasets: [
      {
        label: 'Average Blood Sugar (mg/dL)',
        data: [110, 135, 150, 125, 140, 115],
        borderColor: 'rgba(16, 185, 129, 0.8)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <PageTemplate>
    <div className="flex min-h-screen">
      
      <div className="flex-1 p-8 bg-gradient-to-br from-green-50 to-teal-100">
        <h1 className="text-3xl font-bold text-green-800 mb-8">Doctor Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4 hover:shadow-lg transition-shadow"
            >
              <div className={`p-3 rounded-full ${stat.color} bg-opacity-20`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-green-700">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <h2 className="text-xl font-semibold text-green-700 mb-4">Patient Activity</h2>
            <Bar 
              data={patientActivityData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                },
                animation: {
                  duration: 2000,
                },
              }}
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <h2 className="text-xl font-semibold text-green-700 mb-4">Blood Sugar Trends</h2>
            <Line 
              data={bloodSugarTrendsData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' },
                },
                animation: {
                  duration: 2000,
                },
              }}
            />
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-semibold text-green-700 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 border-b border-gray-100">
              <Activity className="text-green-500" size={20} />
              <p className="text-green-800">Patient <span className="font-medium">John Doe</span> completed their exercise plan</p>
            </div>
            <div className="flex items-center gap-3 p-3 border-b border-gray-100">
              <Activity className="text-green-500" size={20} />
              <p className="text-green-800">Patient <span className="font-medium">Jane Smith</span> reported new symptoms</p>
            </div>
            <div className="flex items-center gap-3 p-3">
              <Activity className="text-green-500" size={20} />
              <p className="text-green-800">Patient <span className="font-medium">Mike Johnson</span> has high blood sugar levels</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </PageTemplate>
  );
}
