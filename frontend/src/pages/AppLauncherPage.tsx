import { Link } from "react-router-dom";
import { APPS, type AppMetadata } from "../types/apps";
import { Icon } from "../components/atoms/Icon";
import { useAuth } from "../contexts/AuthContext";

const COLOR_CLASSES: Record<string, { bg: string; hover: string; text: string; border: string }> = {
  blue: {
    bg: "bg-primary-50",
    hover: "hover:bg-primary-100",
    text: "text-main",
    border: "border-main/20",
  },
  green: {
    bg: "bg-success-50",
    hover: "hover:bg-success-100",
    text: "text-success-600",
    border: "border-success/20",
  },
  orange: {
    bg: "bg-warning-50",
    hover: "hover:bg-warning-100",
    text: "text-warning-600",
    border: "border-warning/20",
  },
  purple: {
    bg: "bg-purple-50",
    hover: "hover:bg-purple-100",
    text: "text-purple-600",
    border: "border-purple-200",
  },
};

function AppCard({ app }: { app: AppMetadata }) {
  const colors = COLOR_CLASSES[app.color] || COLOR_CLASSES.blue;

  return (
    <Link
      to={app.path}
      className={`group block p-8 rounded-2xl border-2 ${colors.bg} ${colors.hover} ${colors.border} transition-all duration-200 hover:shadow-lg hover:scale-105`}
    >
      <div className="flex flex-col items-start gap-4">
        <div className={`p-4 rounded-xl ${colors.bg} ${colors.text} border ${colors.border}`}>
          <Icon name={app.icon} size={32} />
        </div>
        <div>
          <h3 className={`text-xl font-bold ${colors.text} mb-2`}>{app.name}</h3>
          <p className="text-text-grey text-sm leading-relaxed">
            {app.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function AppLauncherPage() {
  const { user } = useAuth();

  // Filter apps based on user roles
  const availableApps = APPS.filter((app) => {
    if (!app.requiredRoles || app.requiredRoles.length === 0) {
      return true;
    }
    // TODO: Check user roles when role system is fully implemented
    return true;
  });

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Minori
              </h1>
              <p className="text-text-grey">
                訪問看護スケジュール管理システム
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-text-grey">
                {user?.email}
              </span>
              <Link
                to="/logout"
                className="text-sm text-text-grey hover:text-text-primary"
              >
                ログアウト
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            アプリを選択
          </h2>
          <p className="text-text-grey">
            利用したい機能のアプリを選んでください
          </p>
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </main>
    </div>
  );
}
