import { type ReactNode, useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogOut, ChevronRight, UserCog } from "lucide-react";
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
  const location = useLocation();
  
  // Desktop: Sub Sidebar open state (default: open for better UX)
  // Mobile: Drawer open state (for sub-menu)
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  
  // User menu dropdown state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const availableApps = APPS.filter((a) => {
    // accountアプリはナビゲーションから除外（ユーザーメニューからアクセス）
    if (a.id === "account") return false;
    // ロール制限がある場合はチェック
    if (a.requiredRoles && user) {
      return a.requiredRoles.includes(user.role);
    }
    return true;
  });

  // Close menu when route changes
  // useEffect(() => {
  //   setIsMenuOpen(false);
  // }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* =================================================================================
          Desktop: App Rail (Always Visible)
          Leftmost vertical bar with app icons.
         ================================================================================= */}
      <aside className="hidden md:flex flex-col w-16 bg-gray-900 text-white flex-shrink-0 z-50 items-center py-6 gap-6 fixed left-0 top-0 bottom-0 shadow-xl">
        {/* Logo */}
        <div className="w-10 h-10 bg-main rounded-xl flex items-center justify-center shadow-lg shadow-main/20 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span className="font-bold text-lg text-white">M</span>
        </div>

        {/* App Icons */}
        <nav className="flex-1 flex flex-col gap-4 w-full px-2 items-center">
          {availableApps.map((a) => {
            const isActive = a.id === app.id;
            return (
              <div key={a.id} className="group relative flex items-center justify-center">
                <Link
                  to={a.path}
                  onClick={() => {
                    // If clicking a different app, open the menu to show its routes
                    // If clicking current app, toggle menu
                    if (!isActive) {
                      setIsMenuOpen(true);
                    } else {
                      setIsMenuOpen(!isMenuOpen);
                    }
                  }}
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                    ${isActive 
                      ? "bg-main text-white shadow-lg shadow-main/30 scale-110" 
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-100 hover:scale-105"
                    }
                  `}
                >
                  <Icon name={a.icon} size={20} strokeWidth={isActive ? 2.5 : 2} />
                </Link>
                
                {/* Tooltip (Only if menu is closed) */}
                {!isMenuOpen && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-700 translate-x-2 group-hover:translate-x-0">
                    {a.name}
                    <div className="absolute top-1/2 right-full -mt-1 border-4 border-transparent border-r-gray-800" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions - User Menu */}
        <div className="relative px-2 w-full flex justify-center mb-4" ref={userMenuRef}>
          <div className="group relative flex items-center justify-center">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                isUserMenuOpen 
                  ? "bg-main text-white ring-2 ring-main/30 scale-110" 
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600 hover:scale-105 border-2 border-gray-600"
              }`}
            >
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </button>
            
            {/* User Dropdown Menu - 右側に表示 */}
            {isUserMenuOpen && (
              <div className="absolute left-full ml-4 bottom-0 w-52 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/80">
                  <p className="text-xs text-gray-400 mb-0.5">ログイン中</p>
                  <p className="text-sm text-white font-medium truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/account/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <UserCog size={16} />
                    アカウント設定
                  </Link>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    <LogOut size={16} />
                    ログアウト
                  </button>
                </div>
                {/* Arrow pointing to user icon */}
                <div className="absolute bottom-3 right-full border-8 border-transparent border-r-gray-800" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =================================================================================
          Desktop: Sub Sidebar (Slide-in Overlay)
          Shows the routes for the current app.
         ================================================================================= */}
      <aside 
        className={`
          hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-2xl border-r border-gray-200/50 fixed top-0 bottom-0 z-40 shadow-[20px_0_40px_-10px_rgba(0,0,0,0.1)]
          transition-all duration-500 [transition-timing-function:cubic-bezier(0.19,1,0.22,1)]
          ${isMenuOpen ? "translate-x-16 opacity-100 visible" : "-translate-x-4 opacity-0 invisible"} 
        `}
        style={{ left: 0 }}
      >
        <div className="h-20 flex items-center px-6 border-b border-gray-100/50">
          <div>
            <h1 className="font-bold text-xl text-gray-900 tracking-tight flex items-center gap-2">
              <Icon name={app.icon} size={20} className="text-main" />
              {app.name}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{app.description}</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {routes.map((route) => {
            const isActive = route.path === "/" 
              ? location.pathname === "/"
              : location.pathname.startsWith(route.path);
              
            return (
              <Link
                key={route.path}
                to={route.path}
                onClick={() => {
                  // Close menu on mobile or desktop overlay when a link is clicked
                  setIsMenuOpen(false);
                }}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive
                    ? "bg-main/10 text-main"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1"
                  }
                `}
              >
                {route.icon && <Icon name={route.icon} size={18} strokeWidth={isActive ? 2.5 : 2} />}
                <span className="flex-1">{route.label}</span>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100/50 bg-gray-50/50">
          <div className="flex items-center gap-3 px-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 font-medium mb-0.5">ログイン中</p>
              <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Desktop Backdrop to close sidebar */}
      <div 
        className={`
          hidden md:block fixed inset-0 z-30 bg-black/5 backdrop-blur-[2px] transition-all duration-500
          ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* =================================================================================
          Mobile: Header (Top)
          Shows current app name and hamburger for sub-menu.
         ================================================================================= */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-gray-200 z-40 flex items-center justify-between px-4 transition-all duration-300">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <Icon name={app.icon} size={20} className="text-main" />
            {app.name}
          </span>
        </div>
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 -mr-2 rounded-lg text-gray-600 hover:bg-gray-100 active:scale-95 transition-transform"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile: Sub Menu Drawer (Right Side Slide-in) */}
      <div 
        className={`
          md:hidden fixed inset-0 z-50 flex justify-end transition-all duration-500
          ${isMenuOpen ? "visible" : "invisible pointer-events-none"}
        `}
      >
        <div 
          className={`
            fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-500
            ${isMenuOpen ? "opacity-100" : "opacity-0"}
          `}
          onClick={() => setIsMenuOpen(false)}
        />
        <div 
          className={`
            relative w-4/5 max-w-xs bg-white/90 backdrop-blur-xl shadow-2xl h-full flex flex-col
            transition-transform duration-500 [transition-timing-function:cubic-bezier(0.19,1,0.22,1)]
            ${isMenuOpen ? "translate-x-0" : "translate-x-full"}
          `}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100/50">
            <span className="font-bold text-lg text-gray-900">メニュー</span>
            <button
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-500"
              onClick={() => setIsMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-1">
              {routes.map((route) => {
                const isActive = location.pathname.startsWith(route.path);
                return (
                  <Link
                    key={route.path}
                    to={route.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`group flex items-center px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-main/10 text-main shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="mr-4 flex-shrink-0">
                      {route.icon && <Icon name={route.icon} size={22} strokeWidth={isActive ? 2.5 : 2} />}
                    </div>
                    {route.label}
                    {isActive && <ChevronRight className="ml-auto opacity-50" size={18} />}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-100/50 bg-gray-50/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-700 shadow-sm">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500">ログイン中</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                to="/account/settings"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-colors"
              >
                <UserCog size={18} />
                アカウント設定
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-red-600 bg-white border border-red-100 rounded-xl hover:bg-red-50 shadow-sm transition-colors"
              >
                <LogOut size={18} />
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================================
          Mobile: Bottom Navigation (App Switcher)
          "Mobile First" optimization for quick app switching.
         ================================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(3.5rem+env(safe-area-inset-bottom))] bg-white border-t border-gray-200 z-40 flex justify-around items-start pt-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {availableApps.map((a) => {
          const isActive = a.id === app.id;
          return (
            <Link
              key={a.id}
              to={a.path}
              className={`
                flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-200 active:scale-95
                ${isActive ? "text-main" : "text-gray-400 hover:text-gray-600"}
              `}
            >
              <div className={`
                relative p-1.5 rounded-xl transition-all duration-300
                ${isActive ? "bg-main/10 -translate-y-1" : ""}
              `}>
                <Icon name={a.icon} size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-70"}`}>
                {a.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* =================================================================================
          Main Content Area
         ================================================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden relative md:pl-16 transition-all duration-300">
        {/* Spacer for Mobile Header */}
        <div className="md:hidden h-14 flex-shrink-0" />

        <main className="flex-1 overflow-auto bg-gray-50/50 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}
