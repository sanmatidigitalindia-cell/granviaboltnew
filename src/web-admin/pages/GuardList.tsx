import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Eye, Shield, ShieldOff,
  Phone, Mail, MapPin, XCircle, User
} from 'lucide-react';
import { storage, Guard } from '../../lib/storage';

interface GuardListProps {
  onAddGuard: () => void;
}

export default function GuardList({ onAddGuard }: GuardListProps) {
  const [guards, setGuards] = useState(storage.getGuards());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Active' | 'Blocked'>('All');
  const [selectedGuard, setSelectedGuard] = useState<Guard | null>(null);

  const filtered = guards.filter(g => {
    const matchSearch = g.fullName.toLowerCase().includes(search.toLowerCase()) ||
      g.mobile.includes(search) || g.city.toLowerCase().includes(search.toLowerCase()) ||
      g.id.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || g.status === filter;
    return matchSearch && matchFilter;
  });

  const toggleBlock = (id: string) => {
    const guard = guards.find(g => g.id === id);
    if (!guard) return;
    const newStatus = guard.status === 'Active' ? 'Blocked' : 'Active';
    storage.updateGuard(id, { status: newStatus });
    setGuards(storage.getGuards());
    if (selectedGuard?.id === id) setSelectedGuard({ ...selectedGuard, status: newStatus });
  };

  const statusColor = (status: string) => status === 'Active' ? '#166534' : '#7c2d12';
  const statusBg = (status: string) => status === 'Active' ? '#dcfce7' : '#fee2e2';
  const verifyColor = (status: string) => status === 'Verified' ? '#166534' : status === 'Rejected' ? '#7c2d12' : '#854d0e';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f1e3c' }}>Service Partner Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">{guards.length} total service partners registered</p>
        </div>
        <motion.button
          onClick={onAddGuard}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #0f1e3c, #1a2d50)' }}
          whileHover={{ scale: 1.03, boxShadow: '0 8px 20px rgba(15,30,60,0.3)' }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} />
          Add Service Partner
        </motion.button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, city, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'white', border: '1.5px solid #e2e8f0', color: '#0f1e3c' }}
          />
        </div>
        <div className="flex gap-2">
          {(['All', 'Active', 'Blocked'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: filter === f ? '#0f1e3c' : 'white',
                color: filter === f ? 'white' : '#64748b',
                border: filter === f ? 'none' : '1.5px solid #e2e8f0',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Partner ID', 'Name', 'Contact', 'Location', 'Skills', 'Verifications', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((guard, i) => (
                  <motion.tr
                    key={guard.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedGuard(guard)}
                  >
                    <td className="px-4 py-3.5 text-xs font-mono font-bold" style={{ color: '#8b1a1a' }}>
                      {guard.id}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #0f1e3c, #8b1a1a)' }}
                        >
                          {guard.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{guard.fullName}</div>
                          <div className="text-xs text-gray-400">{guard.gender} · {guard.experience}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-xs text-gray-700">{guard.mobile}</div>
                      <div className="text-xs text-gray-400 truncate max-w-32">{guard.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin size={10} />
                        {guard.city}, {guard.state.substring(0, 2)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 flex-wrap max-w-36">
                        {guard.skills.slice(0, 2).map(s => (
                          <span key={s} className="text-xs px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700">
                            {s}
                          </span>
                        ))}
                        {guard.skills.length > 2 && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">
                            +{guard.skills.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="w-12 text-gray-400">Aadhaar</span>
                          <span className="font-medium" style={{ color: verifyColor(guard.aadhaarStatus) }}>
                            {guard.aadhaarStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="w-12 text-gray-400">Police</span>
                          <span className="font-medium" style={{ color: verifyColor(guard.policeVerification) }}>
                            {guard.policeVerification}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ color: statusColor(guard.status), background: statusBg(guard.status) }}
                      >
                        {guard.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <motion.button
                          onClick={() => setSelectedGuard(guard)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          title="View Profile"
                        >
                          <Eye size={14} />
                        </motion.button>
                        <motion.button
                          onClick={() => toggleBlock(guard.id)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: guard.status === 'Active' ? '#7c2d12' : '#166534' }}
                          whileHover={{ scale: 1.1 }}
                          title={guard.status === 'Active' ? 'Block' : 'Unblock'}
                        >
                          {guard.status === 'Active' ? <ShieldOff size={14} /> : <Shield size={14} />}
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <User size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No guards found</p>
            </div>
          )}
        </div>
      </div>

      {/* Guard Profile Modal */}
      <AnimatePresence>
        {selectedGuard && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedGuard(null)}
          >
            <motion.div
              className="w-full max-w-2xl rounded-2xl overflow-hidden"
              style={{ background: 'white', boxShadow: '0 24px 60px rgba(0,0,0,0.2)' }}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Profile header */}
              <div
                className="px-8 py-6 flex items-center gap-6"
                style={{ background: 'linear-gradient(135deg, #0f1e3c, #1a2d50)' }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
                  style={{ background: 'rgba(139,26,26,0.6)' }}
                >
                  {selectedGuard.fullName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">{selectedGuard.fullName}</h2>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: statusColor(selectedGuard.status), background: statusBg(selectedGuard.status) }}
                    >
                      {selectedGuard.status}
                    </span>
                  </div>
                  <p className="text-blue-200 text-sm mt-0.5 font-mono">{selectedGuard.id}</p>
                  <div className="flex gap-4 mt-2 text-xs text-blue-200">
                    <span className="flex items-center gap-1"><Phone size={10} />{selectedGuard.mobile}</span>
                    <span className="flex items-center gap-1"><Mail size={10} />{selectedGuard.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedGuard(null)}
                  className="text-white/40 hover:text-white transition-colors ml-auto self-start"
                >
                  <XCircle size={22} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-2 gap-6 max-h-96 overflow-y-auto">
                {[
                  { label: 'Gender', value: selectedGuard.gender },
                  { label: 'Date of Birth', value: selectedGuard.dob },
                  { label: 'Experience', value: selectedGuard.experience },
                  { label: 'City', value: selectedGuard.city },
                  { label: 'State', value: selectedGuard.state },
                  { label: 'Address', value: selectedGuard.address },
                  { label: 'Current Location', value: selectedGuard.currentLocation },
                  { label: 'GPS', value: `${selectedGuard.latitude}, ${selectedGuard.longitude}` },
                  { label: 'Aadhaar Status', value: selectedGuard.aadhaarStatus },
                  { label: 'Police Verification', value: selectedGuard.policeVerification },
                  { label: 'Bank Details', value: selectedGuard.bankDetails ? 'Added' : 'Not Added' },
                  { label: 'Joined', value: new Date(selectedGuard.createdAt).toLocaleDateString() },
                ].map(field => (
                  <div key={field.label}>
                    <div className="text-xs text-gray-400 font-medium">{field.label}</div>
                    <div className="text-sm font-semibold text-gray-800 mt-0.5">{field.value}</div>
                  </div>
                ))}
                <div>
                  <div className="text-xs text-gray-400 font-medium">Skills</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedGuard.skills.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium">Languages</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedGuard.languages.map(l => (
                      <span key={l} className="text-xs px-2 py-0.5 rounded-md bg-green-50 text-green-700">{l}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => toggleBlock(selectedGuard.id)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: selectedGuard.status === 'Active' ? '#fee2e2' : '#dcfce7',
                    color: selectedGuard.status === 'Active' ? '#7c2d12' : '#166534',
                  }}
                >
                  {selectedGuard.status === 'Active' ? 'Block Service Partner' : 'Unblock Service Partner'}
                </button>
                <button
                  onClick={() => setSelectedGuard(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#0f1e3c' }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
