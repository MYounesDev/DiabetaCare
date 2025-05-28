"use client"
import { useState, useEffect, useRef } from 'react';
import { patientService } from '@/services/api';
import PageTemplate from '@/components/PageTemplate';
import AuthWrapper from '@/components/AuthWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  Calendar,
  MessageCircle,
  X,
  Send,
  Clock,
  Activity,
  FileText,
  ChevronRight,
  CalendarDays
} from 'lucide-react';

interface Doctor {
  doctor_id: string;
  doctor_name: string;
  doctor_email: string;
  doctor_phone: string;
  doctor_image?: {
    data: Buffer;
  };
}

interface Modal {
  isOpen: boolean;
  type: 'message' | 'schedule' | null;
}

export default function MyDoctor() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>({ isOpen: false, type: null });
  const [message, setMessage] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setModal({ isOpen: false, type: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await patientService.getDoctor();
        setDoctor(response.data.doctor);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch doctor information');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement message sending functionality
    alert('Message sent successfully!');
    setMessage('');
    setModal({ isOpen: false, type: null });
  };

  const renderModal = () => {
    if (!modal.isOpen) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 backdrop-blur-sm bg-orange-900/10 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {modal.type === 'message' ? (
              <div>
                <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
                  <div>
                    <h3 className="text-xl font-bold text-orange-800">Send Message to Doctor</h3>
                    <p className="text-sm text-gray-600 mt-1">Write your message below</p>
                  </div>
                  <button
                    onClick={() => setModal({ isOpen: false, type: null })}
                    className="p-1 rounded-full hover:bg-orange-100 text-orange-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSendMessage} className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-1">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800 bg-white resize-none h-32"
                    />
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setModal({ isOpen: false, type: null })}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                      <Send size={16} /> Send Message
                    </button>
                  </div>
                </form>
              </div>
            ) : modal.type === 'schedule' ? (
              <div>
                <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-orange-50">
                  <div>
                    <h3 className="text-xl font-bold text-orange-800">Schedule Appointment</h3>
                    <p className="text-sm text-gray-600 mt-1">Select a date and time for your appointment</p>
                  </div>
                  <button
                    onClick={() => setModal({ isOpen: false, type: null })}
                    className="p-1 rounded-full hover:bg-orange-100 text-orange-600"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">Select Day</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                        <button
                          key={day}
                          className="p-3 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        >
                          <div className="font-medium text-orange-800">{day}</div>
                          <div className="text-sm text-gray-500">Available</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-orange-700 mb-2">Available Time Slots</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map((time) => (
                        <button
                          key={time}
                          className="p-2 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none text-orange-800"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setModal({ isOpen: false, type: null })}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                      <Calendar size={16} /> Request Appointment
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <PageTemplate>
      <AuthWrapper allowedRoles={['patient']}>
        <div className="flex min-h-screen">
          <div className="flex-1 p-8 bg-gradient-to-br from-orange-50 to-red-100">
            {/* Header section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-orange-800">My Doctor</h1>
              <p className="text-gray-600 mt-2">View your assigned doctor's information and manage communications</p>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start">
                <AlertCircle className="text-red-500 mr-4" size={24} />
                <div>
                  <h3 className="text-red-800 font-semibold">Error</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            ) : doctor ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Doctor Profile Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden"
                >
                  <div className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mr-6">
                        {doctor.doctor_image ? (
                          <img
                            src={`data:image/jpeg;base64,${Buffer.from(doctor.doctor_image.data).toString("base64")}`}
                            alt={doctor.doctor_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <UserCircle size={48} />
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-orange-800">{doctor.doctor_name}</h2>
                        <p className="text-gray-500 mt-1">Primary Care Physician</p>
                        <div className="flex gap-4 mt-4">
                          <button
                            onClick={() => setModal({ isOpen: true, type: 'message' })}
                            className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                          >
                            <MessageCircle size={18} />
                            <span>Send Message</span>
                          </button>
                          <button
                            onClick={() => setModal({ isOpen: true, type: 'schedule' })}
                            className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                          >
                            <Calendar size={18} />
                            <span>Schedule Visit</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      <div className="space-y-4">
                        <div className="flex items-center text-gray-600">
                          <Mail className="mr-3" size={20} />
                          <span>{doctor.doctor_email}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Phone className="mr-3" size={20} />
                          <span>{doctor.doctor_phone}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center text-gray-600">
                          <Clock className="mr-3" size={20} />
                          <span>Available Mon-Fri, 9AM-5PM</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Activity className="mr-3" size={20} />
                          <span>Specializes in Diabetes Care</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  {/* Stats Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <h3 className="text-lg font-semibold text-orange-800 mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <CalendarDays className="mx-auto text-orange-600 mb-2" size={24} />
                        <div className="text-2xl font-bold text-orange-800">12</div>
                        <div className="text-sm text-gray-600">Total Visits</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <FileText className="mx-auto text-orange-600 mb-2" size={24} />
                        <div className="text-2xl font-bold text-orange-800">8</div>
                        <div className="text-sm text-gray-600">Reports</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Next Appointment */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <h3 className="text-lg font-semibold text-orange-800 mb-4">Next Appointment</h3>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-800 font-medium">Regular Checkup</p>
                          <p className="text-sm text-gray-600">Tomorrow, 10:00 AM</p>
                        </div>
                        <button className="text-orange-600 hover:text-orange-700">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <p className="text-yellow-800">No doctor has been assigned to you yet.</p>
              </div>
            )}
          </div>
        </div>
      </AuthWrapper>
      {renderModal()}
    </PageTemplate>
  );
} 