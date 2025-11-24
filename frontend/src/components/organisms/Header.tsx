import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../atoms/Button';
import { logout } from '../../api/client';

interface HeaderProps {
  onLogout?: () => void;
}

interface NavItem {
  path: string;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'ダッシュボード' },
  { path: '/schedule', label: 'スケジュール' },
  { path: '/staffs', label: 'スタッフ' },
  { path: '/patients', label: '患者' },
  { path: '/visits', label: '訪問' },
];

export function Header({ onLogout }: HeaderProps) {
  const location = useLocation();
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link
            to="/"
            className="text-lg font-bold text-main hover:text-primary-600 transition-colors no-underline"
          >
            みのり
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  px-3 py-2 rounded text-sm font-medium transition-colors no-underline
                  min-h-[40px] flex items-center
                  ${isActive(item.path)
                    ? 'bg-primary-50 text-main'
                    : 'text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="text"
              size="sm"
              onClick={handleLogout}
            >
              ログアウト
            </Button>
          </div>
        </div>

        {/* Navigation - Mobile */}
        <nav className="md:hidden flex items-center gap-0.5 pb-2 overflow-x-auto -mx-4 px-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                px-3 py-2 rounded text-sm font-medium whitespace-nowrap transition-colors no-underline
                min-h-[40px] flex items-center
                ${isActive(item.path)
                  ? 'bg-primary-50 text-main'
                  : 'text-secondary-700 hover:bg-secondary-100'
                }
              `}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
