import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode;
  role?: 'creator' | 'admin';
}) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="wrap" style={{ paddingBlock: 100, textAlign: 'center' }}>
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && profile?.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}
