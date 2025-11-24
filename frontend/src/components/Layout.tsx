import type { ReactNode } from 'react';
import { Header } from './Header';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { logout } = useAuth();

  return (
    <div className="app-layout">
      <Header onLogout={logout} />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
