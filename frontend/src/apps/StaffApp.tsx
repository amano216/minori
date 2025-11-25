import { Routes, Route, Navigate } from "react-router-dom";
import { AppContainerLayout } from "../components/templates/AppContainerLayout";
import { APPS, STAFF_ROUTES } from "../types/apps";
import { StaffListPage } from "../pages/StaffListPage";
import { StaffFormPage } from "../pages/StaffFormPage";

const staffApp = APPS.find((app) => app.id === "staff")!;

export function StaffApp() {
  return (
    <AppContainerLayout app={staffApp} routes={STAFF_ROUTES}>
      <Routes>
        <Route path="/" element={<Navigate to="/staff/list" replace />} />
        <Route path="/list" element={<StaffListPage />} />
        <Route path="/new" element={<StaffFormPage />} />
        <Route path="/:id/edit" element={<StaffFormPage />} />
      </Routes>
    </AppContainerLayout>
  );
}
