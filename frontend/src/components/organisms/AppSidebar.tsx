import { useState } from "react";
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
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside
      className={`
        bg-white border-r border-border flex-shrink-0
        transition-all duration-300 ease-in-out
        ${isExpanded ? "w-56" : "w-16"}
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Header - アプリ一覧に戻る */}
      <div className={`h-14 border-b border-border flex items-center ${isExpanded ? "px-4" : "px-2 justify-center"}`}>
        {isExpanded ? (
          <Link to="/" className="flex items-center gap-2 text-text-grey hover:text-text-primary transition-colors no-underline">
            <Icon name="ChevronLeft" size={16} />
            <span className="text-sm whitespace-nowrap">アプリ一覧</span>
          </Link>
        ) : (
          <Icon name="ChevronLeft" size={20} className="text-text-grey" />
        )}
      </div>

      {/* Navigation */}
      <div className={`py-3 ${isExpanded ? "px-3" : "px-2"}`}>
        {/* App Name */}
        {isExpanded && (
          <h2 className={`text-sm font-bold ${colors.text} mb-3 px-2 whitespace-nowrap overflow-hidden text-ellipsis`}>
            {appName}
          </h2>
        )}

        <nav>
          <ul className="space-y-1">
            {routes.map((route) => (
              <li key={route.path}>
                <Link
                  to={route.path}
                  className={`
                    flex items-center rounded text-sm font-medium transition-all no-underline
                    ${isExpanded ? "gap-2 px-3 py-2.5" : "justify-center py-2.5"}
                    ${
                      isActive(route.path)
                        ? `${colors.bg} ${colors.text}`
                        : "text-text-grey hover:bg-bg-base hover:text-text-black"
                    }
                  `}
                  title={!isExpanded ? route.label : undefined}
                >
                  {route.icon && <Icon name={route.icon} size={18} />}
                  {isExpanded && (
                    <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                      {route.label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
