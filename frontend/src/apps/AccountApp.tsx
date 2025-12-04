import { Routes, Route, Navigate } from "react-router-dom";
import { AppContainerLayout } from "../components/templates/AppContainerLayout";
import { APPS, ACCOUNT_ROUTES } from "../types/apps";
import { AccountSettingsPage } from "../pages/AccountSettingsPage";

const accountApp = APPS.find((app) => app.id === "account")!;

export function AccountApp() {
  return (
    <AppContainerLayout app={accountApp} routes={ACCOUNT_ROUTES}>
      <Routes>
        <Route path="/" element={<Navigate to="/account/settings" replace />} />
        <Route path="/settings" element={<AccountSettingsPage />} />
      </Routes>
    </AppContainerLayout>
  );
}
