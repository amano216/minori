import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "../atoms/Icon";
import type { AppRoute } from "../../types/apps";

interface AppSidebarProps {
  routes: AppRoute[];
  appName: string;
}

export function AppSidebar({ routes, appName }: AppSidebarProps) {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside
      className={`
        bg-gray-50 border-r border-gray-200 flex-shrink-0
        transition-all duration-300 ease-in-out
        ${isExpanded ? "w-56" : "w-16"}
      `}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Navigation */}
      <div className={`py-4 ${isExpanded ? "px-3" : "px-2"}`}>
        {/* App Name */}
        {isExpanded && (
          <h2 className="text-xs font-semibold text-gray-500 uppercase mb-3 px-2 whitespace-nowrap overflow-hidden text-ellipsis">
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
                    flex items-center rounded-md text-sm font-medium transition-all no-underline
                    ${isExpanded ? "gap-3 px-3 py-2" : "justify-center py-2.5"}
                    ${
                      isActive(route.path)
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
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
