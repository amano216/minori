import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../atoms/Icon";
import { APPS, type AppMetadata } from "../../types/apps";

interface AppSwitcherProps {
  currentApp?: AppMetadata;
}

export function AppSwitcher({ currentApp }: AppSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAppClick = (app: AppMetadata) => {
    setIsOpen(false);
    // Navigate to the first route of the app
    const appRoutes: Record<string, string> = {
      schedule: "/schedule/calendar",
      patients: "/patients/list",
      staff: "/staff/list",
      admin: "/admin/dashboard",
    };
    navigate(appRoutes[app.id] || app.path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-bg-base transition-colors"
      >
        {currentApp ? (
          <>
            <Icon name={currentApp.icon} size={20} />
            <span className="font-medium text-text-primary">{currentApp.name}</span>
          </>
        ) : (
          <span className="font-medium text-text-primary">アプリを選択</span>
        )}
        <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-text-grey" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-border z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs text-text-grey font-medium">アプリ一覧</div>
            <div className="space-y-1">
              {APPS.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded hover:bg-bg-base transition-colors text-left ${
                    currentApp?.id === app.id ? "bg-bg-base" : ""
                  }`}
                >
                  <div className="mt-0.5">
                    <Icon name={app.icon} size={20} className={`text-${app.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary text-sm">{app.name}</div>
                    <div className="text-xs text-text-grey mt-0.5 line-clamp-1">{app.description}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-border mt-2 pt-2">
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-bg-base transition-colors text-sm text-text-grey no-underline"
              >
                <Icon name="LayoutGrid" size={16} />
                すべてのアプリを見る
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
