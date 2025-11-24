import type { ReactNode } from 'react';
import { Header } from '../organisms/Header';

interface DashboardLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

export function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-secondary-50">
      <Header onLogout={onLogout} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
