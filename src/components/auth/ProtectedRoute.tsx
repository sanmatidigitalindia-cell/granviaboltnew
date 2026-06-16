import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <>{fallback}</>;
  if (!user) return <>{fallback}</>;
  return <>{children}</>;
}
