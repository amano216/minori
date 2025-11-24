import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../atoms/Button';
import { Sidebar } from '../organisms/Sidebar';
import { logout } from '../../api/client';

interface AppLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

export function AppLayout({ children, onLogout }: AppLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      onLogout?.();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link
              to="/schedule"
              className="text-lg font-bold text-main hover:text-primary-600 transition-colors no-underline"
            >
              みのり
            </Link>
            <Button
              variant="text"
              size="sm"
              onClick={handleLogout}
            >
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1">
        {/* Sidebar - Hidden on mobile */}
        <Sidebar className="hidden md:block" />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <div className="max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}

function MobileNav() {
  const navItems = [
    { path: '/schedule', label: 'スケジュール' },
    { path: '/staffs', label: 'スタッフ' },
    { path: '/patients', label: '患者' },
    { path: '/visits', label: '訪問' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex-1 py-3 text-center text-xs text-text-grey hover:text-main no-underline"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
