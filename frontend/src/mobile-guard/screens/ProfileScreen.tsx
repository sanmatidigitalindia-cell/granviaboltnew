// ProfileScreen
import { motion } from 'framer-motion';
import {
  Phone, Mail, MapPin, Shield, CreditCard, FileText,
  Star, Clock, CheckCircle, ChevronRight
} from 'lucide-react';
import { Guard } from '../../lib/storage';

interface ProfileScreenProps {
  guard: Guard;
}

export default function ProfileScreen({ guard }: ProfileScreenProps) {
  const menuItems = [
    { icon: <FileText size={16} />, label: 'Document Upload', badge: 'Pending', color: '#854d0e', bg: '#fef9c3' },
    { icon: <Shield size={16} />, label: 'Aadhaar Verification', badge: guard.aadhaarStatus, color: guard.aadhaarStatus === 'Verified' ? '#166534' : '#854d0e', bg: guard.aadhaarStatus === 'Verified' ? '#dcfce7' : '#fef9c3' },
    { icon: <CheckCircle size={16} />, label: 'Police Verification', badge: guard.policeVerification, color: guard.policeVerification === 'Verified' ? '#166534' : '#854d0e', bg: guard.policeVerification === 'Verified' ? '#dcfce7' : '#fef9c3' },
    { icon: <CreditCard size={16} />, label: 'Bank Details', badge: guard.bankDetails ? 'Added' : 'Pending', color: guard.bankDetails ? '#166534' : '#854d0e', bg: guard.bankDetails ? '#dcfce7' : '#fef9c3' },
    { icon: <Star size={16} />, label: 'Ratings & Reviews', badge: 'View', color: '#0f1e3c', bg: '#f0f4f8' },
    { icon: <Clock size={16} />, label: 'Work History', badge: 'View', color: '#0f1e3c', bg: '#f0f4f8' },
  ];

  return (
    <div className="pb-6">
      {/* Profile header */}
      <div
        className="px-4 pt-6 pb-10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f1e3c, #1a2d50)',
          paddingTop: 'max(24px, env(safe-area-inset-top, 24px))',
        }}
      >
        <motion.div
          className="absolute w-48 h-48 rounded-full opacity-10"
          style={{ background: '#8b1a1a', bottom: -40, right: -40 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <div className="flex items-center gap-4 relative z-10">
          <motion.div
            className="w-18 h-18 rounded-3xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
            style={{ width: 72, height: 72, background: 'rgba(139,26,26,0.5)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            {guard.fullName.charAt(0)}
          </motion.div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-xl truncate">{guard.fullName}</h1>
            <p className="text-blue-200 text-xs font-mono mt-0.5">{guard.id}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ background: guard.status === 'Active' ? '#22c55e' : '#ef4444' }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs text-white opacity-80">{guard.status}</span>
              <span className="text-xs text-blue-200 ml-2">· {guard.experience}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact info card */}
      <motion.div
        className="mx-4 -mt-5 rounded-2xl p-4 relative z-10"
        style={{ background: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 text-sm">
            <Phone size={14} style={{ color: '#8b1a1a' }} className="flex-shrink-0" />
            <span className="text-gray-700 truncate">{guard.mobile}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail size={14} style={{ color: '#8b1a1a' }} className="flex-shrink-0" />
            <span className="text-gray-700 truncate">{guard.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin size={14} style={{ color: '#8b1a1a' }} className="flex-shrink-0" />
            <span className="text-gray-700 truncate">{guard.city}, {guard.state}</span>
          </div>
        </div>
      </motion.div>

      {/* Skills */}
      <div className="px-4 mt-5">
        <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {guard.skills.length > 0 ? guard.skills.map(skill => (
            <span key={skill} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: '#f0f4f8', color: '#0f1e3c' }}>
              {skill}
            </span>
          )) : <span className="text-xs text-gray-400">No skills added yet</span>}
        </div>
      </div>

      {/* Languages */}
      <div className="px-4 mt-4">
        <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Languages</h3>
        <div className="flex flex-wrap gap-2">
          {guard.languages.length > 0 ? guard.languages.map(lang => (
            <span key={lang} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: '#fef9c3', color: '#854d0e' }}>
              {lang}
            </span>
          )) : <span className="text-xs text-gray-400">No languages added yet</span>}
        </div>
      </div>

      {/* Documents & Verification */}
      <div className="px-4 mt-5">
        <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">Documents & Verification</h3>
        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.label}
              className="w-full flex items-center justify-between rounded-2xl p-4 mobile-touch-interactive"
              style={{ background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f0f4f8', color: '#0f1e3c' }}>
                  {item.icon}
                </div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: item.bg, color: item.color }}
                >
                  {item.badge}
                </span>
                <ChevronRight size={14} className="text-gray-300" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
