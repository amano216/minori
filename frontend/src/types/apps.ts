export interface AppMetadata {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string; // Lucide icon name
  color: string;
  requiredRoles?: string[];
}

export interface AppRoute {
  path: string;
  label: string;
  icon?: string;
}

export const APPS: AppMetadata[] = [
  {
    id: "schedule",
    name: "スケジュール",
    description: "訪問予定の管理・最適化",
    path: "/schedule",
    icon: "Calendar",
    color: "blue",
  },
  {
    id: "patients",
    name: "患者管理",
    description: "患者・利用者情報の管理",
    path: "/patients",
    icon: "Users",
    color: "green",
  },
  {
    id: "staff",
    name: "スタッフ管理",
    description: "スタッフ情報の管理",
    path: "/staff",
    icon: "UserCog",
    color: "orange",
    requiredRoles: ["organization_admin", "group_admin"],
  },
  {
    id: "admin",
    name: "管理",
    description: "組織・ユーザー・権限の管理",
    path: "/admin",
    icon: "Settings",
    color: "purple",
    requiredRoles: ["organization_admin", "super_admin"],
  },
];

// Schedule App Routes
export const SCHEDULE_ROUTES: AppRoute[] = [
  { path: "/schedule/calendar", label: "カレンダー", icon: "Calendar" },
  { path: "/schedule/gantt", label: "ガントチャート", icon: "GanttChart" },
  { path: "/schedule/weekly", label: "週間ビュー", icon: "CalendarDays" },
  { path: "/schedule/visits", label: "訪問一覧", icon: "List" },
];

// Patients App Routes
export const PATIENTS_ROUTES: AppRoute[] = [
  { path: "/patients/list", label: "患者一覧", icon: "Users" },
];

// Staff App Routes
export const STAFF_ROUTES: AppRoute[] = [
  { path: "/staff/list", label: "スタッフ一覧", icon: "UserCog" },
];

// Admin App Routes
export const ADMIN_ROUTES: AppRoute[] = [
  { path: "/admin/dashboard", label: "ダッシュボード", icon: "LayoutDashboard" },
  { path: "/admin/organization", label: "組織設定", icon: "Building" },
  { path: "/admin/users", label: "ユーザー管理", icon: "Users" },
  { path: "/admin/roles", label: "ロール管理", icon: "Shield" },
  { path: "/admin/groups", label: "グループ管理", icon: "FolderTree" },
];
