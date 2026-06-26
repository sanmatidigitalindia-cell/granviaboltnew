import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GranviaLogo from '../components/GranviaLogo';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2000);
    const t4 = setTimeout(() => onComplete(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const particles = Array.from({ length: 16 }, (_, i) => i);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f1e3c 40%, #1a0a0a 100%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated gradient mesh */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute rounded-full"
          style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(139,26,26,0.15) 0%, transparent 70%)', top: -100, left: -100 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(15,30,60,0.8) 0%, rgba(139,26,26,0.1) 70%)', bottom: -100, right: -100 }}
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      {/* Floating particles */}
      {particles.map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: i % 3 === 0 ? '#8b1a1a' : '#ffffff',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            y: [0, -60, -120],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 2,
            repeat: Infinity,
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Outer glow ring */}
        <div className="relative flex items-center justify-center">
          {/* Animated rings */}
          {[1, 2, 3].map(ring => (
            <motion.div
              key={ring}
              className="absolute rounded-full border"
              style={{
                width: 80 + ring * 40,
                height: 80 + ring * 40,
                borderColor: ring === 1 ? 'rgba(139,26,26,0.6)' : ring === 2 ? 'rgba(139,26,26,0.3)' : 'rgba(139,26,26,0.15)',
                borderWidth: ring === 1 ? 2 : 1,
              }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, delay: ring * 0.2 }}
              initial={{ scale: 0, opacity: 0 }}
            />
          ))}

          {/* Spinning loading ring */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 140,
              height: 140,
              border: '2px solid transparent',
              borderTopColor: '#8b1a1a',
              borderRightColor: 'rgba(139,26,26,0.3)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={phase >= 1 ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <GranviaLogo size={64} showText={false} iconColor="white" accentColor="#8b1a1a" />
          </motion.div>

          {/* Maroon pulse dot */}
          <motion.div
            className="absolute rounded-full bg-red-800"
            style={{ width: 12, height: 12, bottom: -4, right: -4 }}
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </div>

        {/* Brand text */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.h1
            className="text-white font-bold tracking-widest"
            style={{ fontFamily: 'Georgia, serif', fontSize: 32 }}
          >
            GRANVIA
          </motion.h1>
          <motion.p
            className="tracking-widest mt-1"
            style={{ color: '#8b1a1a', fontSize: 11, letterSpacing: '0.3em' }}
          >
            SECURITY SOLUTIONS
          </motion.p>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          className="w-48 h-0.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : {}}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #8b1a1a, #c0392b)' }}
            initial={{ width: '0%' }}
            animate={phase >= 2 ? { width: '100%' } : {}}
            transition={{ duration: 0.8 }}
          />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-gray-400 text-xs tracking-widest"
          initial={{ opacity: 0 }}
          animate={phase >= 3 ? { opacity: 1 } : {}}
          transition={{ duration: 0.4 }}
        >
          ADMIN CONTROL CENTER
        </motion.p>
      </div>
    </motion.div>
  );
}
