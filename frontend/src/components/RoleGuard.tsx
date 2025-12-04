import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Role = 'super_admin' | 'organization_admin' | 'staff';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  redirectTo?: string;
}

/**
 * ロールベースのアクセス制御コンポーネント
 * 
 * 指定されたロールを持つユーザーのみがコンテンツを表示できる
 * 許可されていないユーザーはリダイレクトされる
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedRoles, 
  redirectTo = '/' 
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // 未認証の場合はログインページへ
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ロールチェック
  const hasAllowedRole = allowedRoles.includes(user.role as Role);

  if (!hasAllowedRole) {
    // 権限がない場合はリダイレクト
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

// 管理者用の便利なプリセット
export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleGuard allowedRoles={['super_admin', 'organization_admin']}>
      {children}
    </RoleGuard>
  );
};

export default RoleGuard;
