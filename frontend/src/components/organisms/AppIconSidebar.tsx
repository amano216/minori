import { Link, useLocation } from "react-router-dom";
import { Icon } from "../atoms/Icon";
import { APPS } from "../../types/apps";
import { useAuth } from "../../contexts/AuthContext";

const COLOR_CLASSES = {
  blue: "bg-blue-500 hover:bg-blue-600",
  green: "bg-green-500 hover:bg-green-600",
  purple: "bg-purple-500 hover:bg-purple-600",
  orange: "bg-orange-500 hover:bg-orange-600",
  red: "bg-red-500 hover:bg-red-600",
};

export function AppIconSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  // 現在のアプリを判定
  const currentAppId = APPS.find((app) =>
    location.pathname.startsWith(app.path)
  )?.id;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="w-16 bg-white border-r border-border flex flex-col items-center py-4 gap-2">
      {/* アプリアイコン一覧 */}
      <div className="flex-1 flex flex-col gap-2">
        {APPS.map((app) => {
          const isActive = currentAppId === app.id;
          const colorClass = COLOR_CLASSES[app.color as keyof typeof COLOR_CLASSES] || COLOR_CLASSES.blue;

          return (
            <Link
              key={app.id}
              to={app.path}
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center
                transition-all duration-200
                ${isActive
                  ? `${colorClass} text-white shadow-md`
                  : 'bg-bg-base hover:bg-gray-100 text-text-grey'
                }
              `}
              title={app.name}
            >
              <Icon name={app.icon} size={24} />
            </Link>
          );
        })}
      </div>

      {/* 下部: ユーザー情報とログアウト */}
      <div className="flex flex-col items-center gap-2 pt-2 border-t border-border">
        {/* ユーザーアイコン */}
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-text-grey text-sm font-medium">
          {user?.email?.charAt(0).toUpperCase() || "U"}
        </div>

        {/* ログアウトボタン */}
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-lg bg-bg-base hover:bg-red-50 text-text-grey hover:text-red-600 flex items-center justify-center transition-colors"
          title="ログアウト"
        >
          <Icon name="LogOut" size={20} />
        </button>
      </div>
    </aside>
  );
}
