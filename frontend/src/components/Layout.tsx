import type { ReactNode } from 'react';
import { DashboardLayout } from './templates/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { logout } = useAuth();

  return (
    <DashboardLayout onLogout={logout}>
      {children}
    </DashboardLayout>
  );
}
