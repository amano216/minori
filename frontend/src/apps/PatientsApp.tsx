import { Routes, Route, Navigate } from "react-router-dom";
import { AppContainerLayout } from "../components/templates/AppContainerLayout";
import { APPS, PATIENTS_ROUTES } from "../types/apps";
import { PatientListPage } from "../pages/PatientListPage";

const patientsApp = APPS.find((app) => app.id === "patients")!;

export function PatientsApp() {
  return (
    <AppContainerLayout app={patientsApp} routes={PATIENTS_ROUTES}>
      <Routes>
        <Route path="/" element={<Navigate to="/patients/list" replace />} />
        <Route path="/list" element={<PatientListPage />} />
        {/* 旧ルートからの互換性のためリダイレクト */}
        <Route path="/new" element={<Navigate to="/patients/list" replace />} />
        <Route path="/:id" element={<Navigate to="/patients/list" replace />} />
        <Route path="/:id/edit" element={<Navigate to="/patients/list" replace />} />
      </Routes>
    </AppContainerLayout>
  );
}
