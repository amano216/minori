import { useState } from "react";
import type { ReactNode } from "react";
import { AppIconSidebar } from "../organisms/AppIconSidebar";
import { AppSidebar } from "../organisms/AppSidebar";
import { Icon } from "../atoms/Icon";
import { useAuth } from "../../contexts/AuthContext";
import type { AppMetadata, AppRoute } from "../../types/apps";

interface AppContainerLayoutProps {
  app: AppMetadata;
  routes: AppRoute[];
  children: ReactNode;
}

export function AppContainerLayout({ app, routes, children }: AppContainerLayoutProps) {
  const { user } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  return (
    <div className="flex h-screen bg-bg-base">
      {/* App Icon Sidebar (左端) */}
      <AppIconSidebar />

      {/* App Navigation Sidebar (アプリ内ルート) */}
      <AppSidebar
        routes={routes}
        appName={app.name}
        appColor={app.color}
        isExpanded={isSidebarExpanded}
        onExpandChange={setIsSidebarExpanded}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-border flex-shrink-0">
          <div className="h-14 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* サイドバー開閉トグルボタン */}
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="p-2 rounded hover:bg-bg-base text-text-grey hover:text-text-primary transition-colors"
                title={isSidebarExpanded ? "サイドバーを閉じる" : "サイドバーを開く"}
              >
                <Icon name={isSidebarExpanded ? "PanelLeftClose" : "PanelLeft"} size={20} />
              </button>
              <h1 className="text-lg font-semibold text-text-primary">{app.name}</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-text-grey">{user?.email}</span>
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
