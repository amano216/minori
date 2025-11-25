import { Routes, Route } from "react-router-dom";
import { AppContainerLayout } from "../components/templates/AppContainerLayout";
import { APPS, SCHEDULE_ROUTES } from "../types/apps";
import { UnifiedSchedulePage } from "../pages/UnifiedSchedulePage";
import { VisitListPage } from "../pages/VisitListPage";
import { VisitFormPage } from "../pages/VisitFormPage";
import { VisitDetailPage } from "../pages/VisitDetailPage";

const scheduleApp = APPS.find((app) => app.id === "schedule")!;

export function ScheduleApp() {
  return (
    <AppContainerLayout app={scheduleApp} routes={SCHEDULE_ROUTES}>
      <Routes>
        <Route path="/" element={<UnifiedSchedulePage />} />
        <Route path="/visits" element={<VisitListPage />} />
        <Route path="/visits/new" element={<VisitFormPage />} />
        <Route path="/visits/:id" element={<VisitDetailPage />} />
        <Route path="/visits/:id/edit" element={<VisitFormPage />} />
      </Routes>
    </AppContainerLayout>
  );
}
