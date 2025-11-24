import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../api/client';

interface HeaderProps {
  onLogout?: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      onLogout?.();
      navigate('/login');
    } catch {
      // Still navigate to login on error
      navigate('/login');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="app-header">
      <div className="header-brand">
        <Link to="/">みのり</Link>
      </div>
      <nav className="header-nav">
        <Link to="/" className={isActive('/') ? 'active' : ''}>
          ダッシュボード
        </Link>
        <Link to="/schedule" className={isActive('/schedule') ? 'active' : ''}>
          スケジュール
        </Link>
        <Link to="/staffs" className={isActive('/staffs') ? 'active' : ''}>
          スタッフ
        </Link>
        <Link to="/patients" className={isActive('/patients') ? 'active' : ''}>
          患者
        </Link>
        <Link to="/visits" className={isActive('/visits') ? 'active' : ''}>
          訪問
        </Link>
      </nav>
      <div className="header-actions">
        <button onClick={handleLogout} className="btn btn-small">
          ログアウト
        </button>
      </div>
    </header>
  );
}
