// MobilePlaceholder
import { motion } from 'framer-motion';

const SCREEN_INFO: Record<string, { title: string; icon: string; desc: string }> = {
  wallet: { title: 'Wallet', icon: '💰', desc: 'View your Granvia coin balance, earn coins, and manage payouts.' },
  transactions: { title: 'Transactions', icon: '💳', desc: 'Track all your payment history and earnings.' },
  notifications: { title: 'Notifications', icon: '🔔', desc: 'Stay updated with job alerts, application status, and messages.' },
  support: { title: 'Support', icon: '🎧', desc: 'Contact our support team for help or raise a ticket.' },
  settings: { title: 'Settings', icon: '⚙️', desc: 'Manage your account preferences and app settings.' },
  'accepted-jobs': { title: 'Accepted Jobs', icon: '✅', desc: 'View jobs you have been selected for and manage your assignments.' },
  agreement: { title: 'Agreement & Onboarding', icon: '📄', desc: 'Review and sign your employment agreements.' },
};

export default function MobilePlaceholder({ screen }: { screen: string }) {
  const info = SCREEN_INFO[screen] || { title: 'Coming Soon', icon: '🚀', desc: 'This feature is under development.' };

  return (
    <div className="pb-6">
      <div
        className="px-4 pt-5 pb-5"
        style={{
          background: 'linear-gradient(135deg, #0f1e3c, #1a2d50)',
          paddingTop: 'max(20px, env(safe-area-inset-top, 20px))',
        }}
      >
        <h1 className="text-white font-bold text-xl">{info.title}</h1>
      </div>

      <motion.div
        className="mx-4 mt-8 rounded-3xl p-8 text-center"
        style={{ background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="text-5xl mb-5"
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {info.icon}
        </motion.div>
        <h2 className="text-lg font-bold mb-2" style={{ color: '#0f1e3c' }}>{info.title}</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">{info.desc}</p>
        <div
          className="text-xs px-4 py-2.5 rounded-xl font-medium"
          style={{ background: 'rgba(139,26,26,0.06)', color: '#8b1a1a' }}
        >
          Coming soon – backend integration ready
        </div>
      </motion.div>
    </div>
  );
}
