import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import AuditProgramPage from "./pages/AuditProgramPage";
import AuditsPage from "./pages/AuditsPage";
import ChecklistPage from "./pages/ChecklistPage";
import FindingsPage from "./pages/FindingsPage";
import CapaPage from "./pages/CapaPage";
import RisksPage from "./pages/RisksPage";
import EvidencePage from "./pages/EvidencePage";
import AssetsPage from "./pages/AssetsPage";
import ReportsPage from "./pages/ReportsPage";
import SummaryPage from "./pages/SummaryPage";
import VendorManagementAssessmentPage from "./pages/VendorManagementAssessmentPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

function UsersRoute() {
  const { user } = useAuth();
  const canManageUsers =
    user?.role === "Admin" || user?.role === "Lead Auditor";

  return canManageUsers ? <UsersPage /> : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/audit-program" element={<AuditProgramPage />} />
              <Route path="/audits" element={<AuditsPage />} />
              <Route path="/checklist" element={<ChecklistPage />} />
              <Route path="/findings" element={<FindingsPage />} />
              <Route path="/capa" element={<CapaPage />} />
              <Route path="/risks" element={<RisksPage />} />
              <Route path="/evidence" element={<EvidencePage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route
                path="/vendor-management"
                element={<VendorManagementAssessmentPage />}
              />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/summary" element={<SummaryPage />} />
              <Route path="/users" element={<UsersRoute />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
