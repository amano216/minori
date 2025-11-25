import { type ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppSidebar } from "../organisms/AppSidebar";
import { Icon } from "../atoms/Icon";
import { useAuth } from "../../contexts/AuthContext";
import { APPS, type AppMetadata, type AppRoute } from "../../types/apps";

interface AppContainerLayoutProps {
  app: AppMetadata;
  routes: AppRoute[];
  children: ReactNode;
}

export function AppContainerLayout({ app, routes, children }: AppContainerLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const availableApps = APPS.filter((a) => {
    if (!a.requiredRoles) return true;
    // TODO: ユーザーのロールチェックを実装
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* App Navigation Sidebar */}
      <AppSidebar routes={routes} appName={app.name} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - GitHub風 */}
        <header className="bg-gray-900 text-white border-b border-gray-800 flex-shrink-0">
          <div className="h-14 px-4 flex items-center justify-between">
            {/* Left: App Switcher */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setIsAppMenuOpen(!isAppMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-800 transition-colors"
                >
                  <Icon name={app.icon} size={18} />
                  <span className="text-sm font-semibold">{app.name}</span>
                  <Icon name="ChevronDown" size={16} />
                </button>

                {/* App Menu Dropdown */}
                {isAppMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsAppMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                        アプリケーション
                      </div>
                      {availableApps.map((a) => (
                        <Link
                          key={a.id}
                          to={a.path}
                          onClick={() => setIsAppMenuOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2 text-sm no-underline transition-colors
                            ${
                              a.id === app.id
                                ? "bg-gray-100 text-gray-900 font-semibold"
                                : "text-gray-700 hover:bg-gray-50"
                            }
                          `}
                        >
                          <Icon name={a.icon} size={18} />
                          <div>
                            <div className="font-medium">{a.name}</div>
                            <div className="text-xs text-gray-500">{a.description}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-800 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm">{user?.email}</span>
                  <Icon name="ChevronDown" size={16} />
                </button>

                {/* User Menu Dropdown */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200">
                        <div className="font-semibold">{user?.email}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {/* TODO: ロール表示 */}
                          管理者
                        </div>
                      </div>
                      <Link
                        to="/admin/organization"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 no-underline"
                      >
                        <Icon name="Settings" size={16} />
                        設定
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                      >
                        <Icon name="LogOut" size={16} />
                        ログアウト
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
