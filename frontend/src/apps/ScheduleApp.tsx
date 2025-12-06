import { Routes, Route, Navigate } from "react-router-dom";
import { AppContainerLayout } from "../components/templates/AppContainerLayout";
import { APPS, SCHEDULE_ROUTES } from "../types/apps";
import { UnifiedSchedulePage } from "../pages/UnifiedSchedulePage";
import { VisitListPage } from "../pages/VisitListPage";
import { TaskListPage } from "../pages/TaskListPage";

const scheduleApp = APPS.find((app) => app.id === "schedule")!;

export function ScheduleApp() {
  return (
    <AppContainerLayout app={scheduleApp} routes={SCHEDULE_ROUTES}>
      <Routes>
        <Route path="/" element={<UnifiedSchedulePage />} />
        <Route path="/visits" element={<VisitListPage />} />
        <Route path="/tasks" element={<TaskListPage />} />
        <Route path="/visits/new" element={<Navigate to="/schedule/visits" replace />} />
        <Route path="/visits/:id" element={<Navigate to="/schedule/visits" replace />} />
        <Route path="/visits/:id/edit" element={<Navigate to="/schedule/visits" replace />} />
      </Routes>
    </AppContainerLayout>
  );
}
