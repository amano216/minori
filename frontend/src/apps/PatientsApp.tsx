import { Routes, Route, Navigate } from "react-router-dom";
import { AppContainerLayout } from "../components/templates/AppContainerLayout";
import { APPS, PATIENTS_ROUTES } from "../types/apps";
import { PatientListPage } from "../pages/PatientListPage";
import { PatientFormPage } from "../pages/PatientFormPage";

const patientsApp = APPS.find((app) => app.id === "patients")!;

export function PatientsApp() {
  return (
    <AppContainerLayout app={patientsApp} routes={PATIENTS_ROUTES}>
      <Routes>
        <Route path="/" element={<Navigate to="/patients/list" replace />} />
        <Route path="/list" element={<PatientListPage />} />
        <Route path="/new" element={<PatientFormPage />} />
        <Route path="/:id/edit" element={<PatientFormPage />} />
      </Routes>
    </AppContainerLayout>
  );
}
