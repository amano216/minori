import { Routes, Route, Navigate } from "react-router-dom";
import { AppContainerLayout } from "../components/templates/AppContainerLayout";
import { APPS, ADMIN_ROUTES } from "../types/apps";
import { OrganizationPage } from "../pages/OrganizationPage";
import { UsersPage } from "../pages/UsersPage";
import { GroupsPage } from "../pages/GroupsPage";

const adminApp = APPS.find((app) => app.id === "admin")!;

export function AdminApp() {
  return (
    <AppContainerLayout app={adminApp} routes={ADMIN_ROUTES}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/organization" replace />} />
        <Route path="/organization" element={<OrganizationPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/groups" element={<GroupsPage />} />
      </Routes>
    </AppContainerLayout>
  );
}
