import { useEffect, useState } from 'react';
import { getAadhaarStatus } from '../../services/aadhaarVerificationService';
import AadhaarVerificationSlider from '../../pages/auth/AadhaarVerificationSlider';

export default function AadhaarGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    getAadhaarStatus()
      .then(status => setVerified(Boolean(status.is_aadhaar_verified)))
      .catch(() => setVerified(false));
  }, []);

  if (verified === null) return <div className="min-h-screen grid place-items-center text-sm text-gray-500">Loading...</div>;
  if (!verified) return <AadhaarVerificationSlider onCompleted={() => setVerified(true)} />;
  return <>{children}</>;
}
