export interface AppMetadata {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string; // Lucide icon name
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
  },
  {
    id: "patients",
    name: "患者管理",
    description: "患者・利用者情報の管理",
    path: "/patients",
    icon: "Users",
  },
  {
    id: "admin",
    name: "管理",
    description: "組織・ユーザー・権限の管理",
    path: "/admin",
    icon: "Settings",
    requiredRoles: ["organization_admin", "super_admin"],
  },
];

// Schedule App Routes
export const SCHEDULE_ROUTES: AppRoute[] = [
  { path: "/schedule", label: "スケジュール", icon: "Calendar" },
  { path: "/schedule/visits", label: "訪問一覧", icon: "List" },
];

// Patients App Routes
export const PATIENTS_ROUTES: AppRoute[] = [
  { path: "/patients/list", label: "患者一覧", icon: "Users" },
];

// Admin App Routes
export const ADMIN_ROUTES: AppRoute[] = [
  { path: "/admin/organization", label: "組織設定", icon: "Building" },
  { path: "/admin/users", label: "ユーザー管理", icon: "Users" },
  { path: "/admin/groups", label: "グループ管理", icon: "FolderTree" },
  { path: "/admin/account", label: "アカウント設定", icon: "UserCog" },
];
