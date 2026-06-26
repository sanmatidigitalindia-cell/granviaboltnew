import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, User, Phone, MapPin, FileText, CreditCard } from 'lucide-react';
import { storage, Guard } from '../../lib/storage';

interface AddGuardProps {
  onSuccess: () => void;
}

const SKILLS = ['CCTV Monitoring', 'Access Control', 'Fire Safety', 'Patrolling', 'Emergency Response', 'First Aid', 'VIP Security', 'Crowd Management', 'Communication', 'Investigation'];
const LANGUAGES = ['Hindi', 'English', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Kannada', 'Punjabi', 'Urdu'];
const STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Telangana', 'Punjab'];

function FloatingInput({
  label, value, onChange, type = 'text', required = false,
  placeholder = '', error = '',
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <label
        className="block text-xs font-semibold mb-1.5 tracking-wide"
        style={{ color: focused ? '#0f1e3c' : '#64748b' }}
      >
        {label}{required && <span style={{ color: '#8b1a1a' }}> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{
          border: `1.5px solid ${error ? '#ef4444' : focused ? '#0f1e3c' : '#e2e8f0'}`,
          background: focused ? 'white' : '#f8fafc',
          color: '#0f1e3c',
        }}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            className="text-xs text-red-500 mt-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function SelectInput({ label, value, onChange, options, required }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 tracking-wide text-gray-500">
        {label}{required && <span style={{ color: '#8b1a1a' }}> *</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#0f1e3c' }}
      >
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function MultiSelect({ label, selected, options, onChange }: {
  label: string; selected: string[]; options: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (item: string) => {
    onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item]);
  };
  return (
    <div>
      <label className="block text-xs font-semibold mb-2 tracking-wide text-gray-500">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <motion.button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all"
            style={{
              borderColor: selected.includes(opt) ? '#0f1e3c' : '#e2e8f0',
              background: selected.includes(opt) ? '#0f1e3c' : 'white',
              color: selected.includes(opt) ? 'white' : '#64748b',
            }}
            whileTap={{ scale: 0.95 }}
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default function AddGuard({ onSuccess }: AddGuardProps) {
  const [form, setForm] = useState({
    fullName: '', mobile: '', email: '', password: '',
    gender: '', dob: '', address: '', city: '', state: '',
    currentLocation: '', latitude: '', longitude: '', experience: '',
    aadhaarStatus: 'Pending', policeVerification: 'Pending',
    skills: [] as string[], languages: [] as string[], status: 'Active',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (key: string) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.mobile.match(/^[6-9]\d{9}$/)) e.mobile = 'Enter valid 10-digit mobile number';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter valid email';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.gender) e.gender = 'Please select gender';
    if (!form.dob) e.dob = 'Date of birth is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.state) e.state = 'State is required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));

    const newGuard: Guard = {
      id: storage.generateId('GRD'),
      ...form,
      bankDetails: null,
      avatar: null,
      createdAt: new Date().toISOString(),
      aadhaarStatus: form.aadhaarStatus as Guard['aadhaarStatus'],
      policeVerification: form.policeVerification as Guard['policeVerification'],
      status: form.status as Guard['status'],
    };

    storage.addGuard(newGuard);
    setSubmitting(false);
    setSuccess(true);
    setTimeout(onSuccess, 1500);
  };

  const sections = [
    {
      title: 'Personal Information',
      icon: <User size={16} />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingInput label="Full Name" value={form.fullName} onChange={set('fullName')} required error={errors.fullName} placeholder="Enter full name" />
          <SelectInput label="Gender" value={form.gender} onChange={set('gender')} options={['Male', 'Female', 'Other']} required />
          <FloatingInput label="Date of Birth" value={form.dob} onChange={set('dob')} type="date" required error={errors.dob} />
          <FloatingInput label="Experience" value={form.experience} onChange={set('experience')} placeholder="e.g. 3 years" />
        </div>
      ),
    },
    {
      title: 'Contact Details',
      icon: <Phone size={16} />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FloatingInput label="Mobile Number" value={form.mobile} onChange={set('mobile')} required error={errors.mobile} placeholder="10-digit mobile" />
          <FloatingInput label="Email Address" value={form.email} onChange={set('email')} type="email" required error={errors.email} placeholder="email@example.com" />
          <FloatingInput label="Login Password" value={form.password} onChange={set('password')} type="password" required error={errors.password} placeholder="Min 6 characters" />
        </div>
      ),
    },
    {
      title: 'Location Information',
      icon: <MapPin size={16} />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FloatingInput label="Address" value={form.address} onChange={set('address')} placeholder="Full address" />
          </div>
          <FloatingInput label="City" value={form.city} onChange={set('city')} required error={errors.city} placeholder="City" />
          <SelectInput label="State" value={form.state} onChange={set('state')} options={STATES} required />
          <FloatingInput label="Current Location" value={form.currentLocation} onChange={set('currentLocation')} placeholder="Area name" />
          <div className="grid grid-cols-2 gap-2">
            <FloatingInput label="Latitude" value={form.latitude} onChange={set('latitude')} placeholder="18.9000" />
            <FloatingInput label="Longitude" value={form.longitude} onChange={set('longitude')} placeholder="72.8000" />
          </div>
        </div>
      ),
    },
    {
      title: 'Skills & Languages',
      icon: <FileText size={16} />,
      content: (
        <div className="space-y-4">
          <MultiSelect label="Skills" selected={form.skills} options={SKILLS} onChange={v => setForm(f => ({ ...f, skills: v }))} />
          <MultiSelect label="Languages Known" selected={form.languages} options={LANGUAGES} onChange={v => setForm(f => ({ ...f, languages: v }))} />
        </div>
      ),
    },
    {
      title: 'Verification & Status',
      icon: <CreditCard size={16} />,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SelectInput label="Aadhaar Status" value={form.aadhaarStatus} onChange={set('aadhaarStatus')} options={['Pending', 'Verified', 'Rejected']} />
          <SelectInput label="Police Verification" value={form.policeVerification} onChange={set('policeVerification')} options={['Pending', 'Verified', 'Rejected']} />
          <SelectInput label="Account Status" value={form.status} onChange={set('status')} options={['Active', 'Blocked']} />
          <div className="sm:col-span-3">
            <div className="rounded-xl p-4 text-sm text-gray-500 flex items-start gap-2" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-blue-500" />
              Bank details and document uploads are available in the service partner profile after creation.
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 w-full max-w-7xl"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#0f1e3c' }}>Add New Service Partner</h1>
        <p className="text-sm text-gray-500 mt-0.5">Create service partner account – credentials will be usable in the mobile app</p>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div
            className="mb-6 rounded-2xl p-6 flex flex-col items-center gap-3"
            style={{ background: '#dcfce7', border: '2px solid #86efac' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <CheckCircle size={40} style={{ color: '#166534' }} />
            <p className="font-bold text-green-800">Service Partner created successfully!</p>
            <p className="text-sm text-green-600">Redirecting to service partner list...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {!success && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              className={`rounded-2xl overflow-hidden h-full ${section.title === 'Verification & Status' ? 'xl:col-span-2' : ''}`}
              style={{ background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div
                className="flex items-center gap-2 px-6 py-4 border-b border-gray-100"
                style={{ color: '#0f1e3c' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(15,30,60,0.08)' }}>
                  {section.icon}
                </div>
                <span className="font-bold text-sm">{section.title}</span>
              </div>
              <div className="p-6">
                {section.content}
              </div>
            </motion.div>
          ))}

          <div className="xl:col-span-2 flex justify-start gap-3 pt-2">
            <motion.button
              type="submit"
              disabled={submitting}
              className="min-w-56 px-6 py-3.5 rounded-2xl font-bold text-white text-sm tracking-wide flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #0f1e3c, #1a2d50)' }}
              whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(15,30,60,0.3)' }}
              whileTap={{ scale: 0.98 }}
            >
              {submitting ? (
                <motion.div
                  className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                'Create Service Partner Account'
              )}
            </motion.button>
            <motion.button
              type="button"
              onClick={onSuccess}
              className="px-6 py-3.5 rounded-2xl font-bold text-sm"
              style={{ background: '#f1f5f9', color: '#64748b' }}
              whileHover={{ background: '#e2e8f0' }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
