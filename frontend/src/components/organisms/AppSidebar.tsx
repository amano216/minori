import { Link, useLocation } from "react-router-dom";
import { Icon } from "../atoms/Icon";
import type { AppRoute } from "../../types/apps";

interface AppSidebarProps {
  routes: AppRoute[];
  appName: string;
}

export function AppSidebar({ routes }: AppSidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside
      className="bg-white border-r border-gray-200 flex-shrink-0 w-16 sm:w-20 flex flex-col items-center py-4 z-30"
    >
      {/* Navigation */}
      <nav className="w-full px-2 space-y-4">
        <ul className="space-y-2">
          {routes.map((route) => (
            <li key={route.path}>
              <Link
                to={route.path}
                className={`
                  flex flex-col items-center justify-center w-full aspect-square rounded-xl transition-all no-underline
                  ${
                    isActive(route.path)
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  }
                `}
                title={route.label}
              >
                {route.icon && <Icon name={route.icon} size={24} />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
