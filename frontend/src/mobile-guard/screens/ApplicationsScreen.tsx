// ApplicationsScreen
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Application, storage, Guard } from '../../lib/storage';

interface ApplicationsScreenProps {
  guard: Guard;
}

const STATUS_CONFIG: Record<Application['status'], { icon: JSX.Element; color: string; bg: string; label: string }> = {
  Pending: { icon: <Loader size={14} />, color: '#854d0e', bg: '#fef9c3', label: 'Pending' },
  Applied: { icon: <Loader size={14} />, color: '#854d0e', bg: '#fef9c3', label: 'Applied' },
  Viewed: { icon: <Loader size={14} />, color: '#075985', bg: '#e0f2fe', label: 'Viewed' },
  Shortlisted: { icon: <CheckCircle size={14} />, color: '#1d4ed8', bg: '#dbeafe', label: 'Shortlisted' },
  Selected: { icon: <CheckCircle size={14} />, color: '#166534', bg: '#dcfce7', label: 'Selected' },
  'Offer Sent': { icon: <CheckCircle size={14} />, color: '#166534', bg: '#dcfce7', label: 'Offer Sent' },
  'Accepted by Guard': { icon: <CheckCircle size={14} />, color: '#166534', bg: '#dcfce7', label: 'Accepted' },
  'Declined by Guard': { icon: <XCircle size={14} />, color: '#7c2d12', bg: '#fee2e2', label: 'Declined' },
  Joined: { icon: <CheckCircle size={14} />, color: '#166534', bg: '#dcfce7', label: 'Joined' },
  Completed: { icon: <CheckCircle size={14} />, color: '#166534', bg: '#dcfce7', label: 'Completed' },
  Cancelled: { icon: <XCircle size={14} />, color: '#7c2d12', bg: '#fee2e2', label: 'Cancelled' },
  Rejected: { icon: <XCircle size={14} />, color: '#7c2d12', bg: '#fee2e2', label: 'Rejected' },
};

export default function ApplicationsScreen({ guard }: ApplicationsScreenProps) {
  const apps = storage.getApplications().filter(a => a.guardId === guard.id);
  const jobs = storage.getJobs();

  return (
    <div className="pb-6">
      {/* Header */}
      <div
        className="px-4 pt-5 pb-5"
        style={{
          background: 'linear-gradient(135deg, #0f1e3c, #1a2d50)',
          paddingTop: 'max(20px, env(safe-area-inset-top, 20px))',
        }}
      >
        <h1 className="text-white font-bold text-xl">My Applications</h1>
        <p className="text-blue-200 text-xs mt-1">{apps.length} application{apps.length !== 1 ? 's' : ''} submitted</p>
      </div>

      <div className="px-4 mt-4 space-y-2.5">
        {apps.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Briefcase size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">No applications yet</p>
            <p className="text-gray-300 text-sm mt-1">Browse jobs and apply to get started</p>
          </motion.div>
        ) : (
          apps.slice().reverse().map((app, i) => {
            const job = jobs.find(j => j.id === app.jobId);
            if (!job) return null;
            const statusCfg = STATUS_CONFIG[app.status];
            return (
              <motion.div
                key={app.id}
                className="rounded-2xl p-4"
                style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 mr-2">
                    <p className="font-bold text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{job.company}</p>
                  </div>
                  <span
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: statusCfg.bg, color: statusCfg.color }}
                  >
                    {statusCfg.icon}
                    {statusCfg.label}
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin size={10} />{job.city}</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{job.shift} Shift</span>
                  <span className="font-bold" style={{ color: '#166534' }}>₹{job.salary}/mo</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
                  Applied: {new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {app.notes && <span className="ml-2 text-gray-500">· {app.notes}</span>}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
