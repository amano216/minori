import { Link, useLocation } from "react-router-dom";
import { Icon } from "../atoms/Icon";
import type { AppRoute } from "../../types/apps";

interface AppSidebarProps {
  routes: AppRoute[];
  appName: string;
  appColor: string;
}

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-primary-50", text: "text-main" },
  green: { bg: "bg-success-50", text: "text-success-600" },
  orange: { bg: "bg-warning-50", text: "text-warning-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
};

export function AppSidebar({ routes, appName, appColor }: AppSidebarProps) {
  const location = useLocation();
  const colors = COLOR_CLASSES[appColor] || COLOR_CLASSES.blue;

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside className="w-56 bg-white border-r border-border flex-shrink-0">
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 text-text-grey hover:text-text-primary transition-colors no-underline">
          <Icon name="ChevronLeft" size={16} />
          <span className="text-sm">アプリ一覧に戻る</span>
        </Link>
      </div>

      <div className="p-3">
        <h2 className={`text-lg font-bold ${colors.text} mb-4 px-3`}>
          {appName}
        </h2>
        <nav>
          <ul className="space-y-1">
            {routes.map((route) => (
              <li key={route.path}>
                <Link
                  to={route.path}
                  className={`
                    flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium transition-colors no-underline
                    ${
                      isActive(route.path)
                        ? `${colors.bg} ${colors.text}`
                        : "text-text-grey hover:bg-bg-base hover:text-text-black"
                    }
                  `}
                >
                  {route.icon && <Icon name={route.icon} size={18} />}
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
