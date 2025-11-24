import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/schedule', label: 'スケジュール' },
  { path: '/staffs', label: 'スタッフ' },
  { path: '/patients', label: '患者' },
  { path: '/visits', label: '訪問予定' },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/schedule') {
      return location.pathname === '/schedule' || location.pathname === '/schedule/weekly';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`w-56 bg-white border-r border-border flex-shrink-0 ${className}`}>
      <nav className="p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`
                  flex items-center px-3 py-2.5 rounded text-sm font-medium transition-colors no-underline
                  ${isActive(item.path)
                    ? 'bg-primary-50 text-main'
                    : 'text-text-grey hover:bg-bg-base hover:text-text-black'
                  }
                `}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
