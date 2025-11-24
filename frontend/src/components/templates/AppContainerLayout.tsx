import { ReactNode } from "react";
import { AppSidebar } from "../organisms/AppSidebar";
import { AppSwitcher } from "../molecules/AppSwitcher";
import { useAuth } from "../../contexts/AuthContext";
import type { AppMetadata, AppRoute } from "../../types/apps";

interface AppContainerLayoutProps {
  app: AppMetadata;
  routes: AppRoute[];
  children: ReactNode;
}

export function AppContainerLayout({ app, routes, children }: AppContainerLayoutProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-screen bg-bg-base">
      {/* Sidebar */}
      <AppSidebar routes={routes} appName={app.name} appColor={app.color} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-border flex-shrink-0">
          <div className="h-14 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AppSwitcher currentApp={app} />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-text-grey">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-text-grey hover:text-text-primary transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
