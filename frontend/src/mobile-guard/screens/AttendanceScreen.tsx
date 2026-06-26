import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, CheckCircle, LogIn, LogOut, Calendar } from 'lucide-react';
import { storage, Guard, Attendance } from '../../lib/storage';

interface AttendanceScreenProps {
  guard: Guard;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function calcHours(inTime: string, outTime: string): string {
  const [inH, inM] = inTime.split(':').map(Number);
  const [outH, outM] = outTime.split(':').map(Number);
  const totalMins = (outH * 60 + outM) - (inH * 60 + inM);
  if (totalMins <= 0) return '0h 0m';
  return `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`;
}

export default function AttendanceScreen({ guard }: AttendanceScreenProps) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const [allAttendance, setAllAttendance] = useState(storage.getAttendance());
  const [marking, setMarking] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);
  const [successType, setSuccessType] = useState<'in' | 'out' | null>(null);

  const myAttendance = allAttendance.filter(a => a.guardId === guard.id);
  const todayRecord = myAttendance.find(a => a.date === today);

  const canMarkIn = !todayRecord;
  const canMarkOut = todayRecord && !todayRecord.outTime;

  const handleMark = async (type: 'in' | 'out') => {
    setPulseActive(true);
    setMarking(true);
    await new Promise(r => setTimeout(r, 1200));

    const timeStr = now.toTimeString().substring(0, 5);

    if (type === 'in') {
      const newRecord: Attendance = {
        id: `ATT-${Date.now()}`,
        guardId: guard.id,
        date: today,
        inTime: timeStr,
        outTime: null,
        location: guard.currentLocation || guard.city,
        latitude: guard.latitude,
        longitude: guard.longitude,
        status: 'Present',
        hours: '',
      };
      storage.addAttendance(newRecord);
    } else if (todayRecord) {
      const hours = calcHours(todayRecord.inTime!, timeStr);
      storage.updateAttendance(todayRecord.id, { outTime: timeStr, hours });
    }

    setAllAttendance(storage.getAttendance());
    setMarking(false);
    setPulseActive(false);
    setSuccessType(type);
    setTimeout(() => setSuccessType(null), 2000);
  };

  const recentDays = myAttendance.slice(-7).reverse();

  return (
    <div className="pb-4">
      {/* Header */}
      <div
        className="px-4 pt-5 pb-6"
        style={{
          background: 'linear-gradient(135deg, #0f1e3c, #1a2d50)',
          paddingTop: 'max(20px, env(safe-area-inset-top, 20px))',
        }}
      >
        <h1 className="text-white font-bold text-xl mb-1">Attendance</h1>
        <p className="text-blue-200 text-xs">{formatDate(now)}</p>
      </div>

      {/* Main mark card */}
      <div className="px-4 mt-4">
        <motion.div
          className="rounded-3xl p-6 text-center relative overflow-hidden"
          style={{ background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* GPS pulse animation */}
          <div className="relative flex justify-center mb-5">
            {pulseActive && [1, 2, 3].map(ring => (
              <motion.div
                key={ring}
                className="absolute rounded-full border border-blue-300"
                style={{ width: 50 + ring * 30, height: 50 + ring * 30 }}
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: ring * 0.4 }}
              />
            ))}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: todayRecord?.outTime ? '#dcfce7' : todayRecord ? '#fef9c3' : '#f0f4f8' }}
            >
              <MapPin size={24} style={{ color: todayRecord?.outTime ? '#166534' : todayRecord ? '#854d0e' : '#64748b' }} />
            </div>
          </div>

          {/* Status */}
          <AnimatePresence mode="wait">
            {successType ? (
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CheckCircle size={40} style={{ color: '#22c55e' }} />
                <p className="font-bold text-lg text-gray-800">
                  {successType === 'in' ? 'Checked In!' : 'Checked Out!'}
                </p>
                <p className="text-sm text-gray-400">{formatTime(now)}</p>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm font-semibold text-gray-500 mb-1">
                  {todayRecord?.outTime ? 'Shift Complete' : todayRecord ? 'Currently Active' : 'Not Checked In'}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-4">
                  <MapPin size={12} />
                  <span>{guard.currentLocation || guard.city}</span>
                </div>

                {/* In/Out times */}
                <div className="flex justify-around bg-gray-50 rounded-2xl p-4 mb-5">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">CHECK IN</div>
                    <div className="font-bold text-gray-800">{todayRecord?.inTime || '--:--'}</div>
                    <div className="w-6 h-1 rounded-full mt-1.5 mx-auto" style={{ background: todayRecord ? '#22c55e' : '#e2e8f0' }} />
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">CHECK OUT</div>
                    <div className="font-bold text-gray-800">{todayRecord?.outTime || '--:--'}</div>
                    <div className="w-6 h-1 rounded-full mt-1.5 mx-auto" style={{ background: todayRecord?.outTime ? '#ef4444' : '#e2e8f0' }} />
                  </div>
                  <div className="w-px bg-gray-200" />
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">HOURS</div>
                    <div className="font-bold" style={{ color: '#0f1e3c' }}>{todayRecord?.hours || '--'}</div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  {canMarkIn && (
                    <motion.button
                      onClick={() => handleMark('in')}
                      disabled={marking}
                      className="flex-1 py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 mobile-touch-interactive"
                      style={{ background: 'linear-gradient(135deg, #0f1e3c, #1a2d50)' }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {marking ? (
                        <motion.div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                      ) : (
                        <><LogIn size={16} /> Check In</>
                      )}
                    </motion.button>
                  )}
                  {canMarkOut && (
                    <motion.button
                      onClick={() => handleMark('out')}
                      disabled={marking}
                      className="flex-1 py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 mobile-touch-interactive"
                      style={{ background: 'linear-gradient(135deg, #8b1a1a, #c0392b)' }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {marking ? (
                        <motion.div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                      ) : (
                        <><LogOut size={16} /> Check Out</>
                      )}
                    </motion.button>
                  )}
                  {todayRecord?.outTime && (
                    <div className="flex-1 py-4 rounded-2xl text-center text-sm font-bold" style={{ background: '#dcfce7', color: '#166534' }}>
                      Shift Complete
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Attendance history */}
      <div className="px-4 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} style={{ color: '#8b1a1a' }} />
          <h3 className="text-sm font-bold text-gray-700">Recent History</h3>
        </div>

        {recentDays.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No attendance records yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentDays.map((rec, i) => (
              <motion.div
                key={rec.id}
                className="rounded-2xl p-4 flex items-center justify-between"
                style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: rec.status === 'Present' ? '#dcfce7' : '#fee2e2' }}
                  >
                    <Clock size={16} style={{ color: rec.status === 'Present' ? '#166534' : '#7c2d12' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                    <p className="text-xs text-gray-400">
                      {rec.inTime} {rec.outTime ? `→ ${rec.outTime}` : '(not checked out)'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: '#0f1e3c' }}>{rec.hours || '--'}</div>
                  <div
                    className="text-xs font-medium px-2 py-0.5 rounded-full mt-0.5"
                    style={{
                      background: rec.status === 'Present' ? '#dcfce7' : '#fee2e2',
                      color: rec.status === 'Present' ? '#166534' : '#7c2d12',
                    }}
                  >
                    {rec.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
