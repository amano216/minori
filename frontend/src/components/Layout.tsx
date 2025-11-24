import type { ReactNode } from 'react';
import { AppLayout } from './templates/AppLayout';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { logout } = useAuth();

  return (
    <AppLayout onLogout={logout}>
      {children}
    </AppLayout>
  );
}
