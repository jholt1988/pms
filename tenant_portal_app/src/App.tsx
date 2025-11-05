import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import PasswordResetPage from './PasswordResetPage';
import MaintenanceDashboard from './MaintenanceDashboard';
import PaymentsPage from './PaymentsPage';
import MessagingPage from './MessagingPage';
import LeaseManagementPage from './LeaseManagementPage';
import MyLeasePage from './MyLeasePage';
import RentalApplicationPage from './RentalApplicationPage';
import RentalApplicationsManagementPage from './RentalApplicationsManagementPage';
import ExpenseTrackerPage from './ExpenseTrackerPage';
import RentEstimatorPage from './RentEstimatorPage';
import AuditLogPage from './AuditLogPage';
import DocumentManagementPage from './DocumentManagementPage';
import ReportingPage from './ReportingPage';
import UserManagementPage from './UserManagementPage';
import NotificationCenter from './NotificationCenter';
import TenantShell from './TenantShell';
import StaffShell from './StaffShell';
import TenantInspectionPage from './TenantInspectionPage';
import InspectionManagementPage from './InspectionManagementPage';

const RequireAuth = () => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const RequireRole = ({ allowedRoles }: { allowedRoles: Array<string> }) => {
  const { user } = useAuth();
  if (!user?.role) {
    return <Navigate to="/" replace />;
  }

  return allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to="/" replace />;
};

const RoleBasedShell = () => {
  const { user } = useAuth();
  
  if (user?.role === 'PROPERTY_MANAGER') {
    return <StaffShell />;
  }
  
  return <TenantShell />;
};

export default function App(): React.ReactElement {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!token ? <SignupPage /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!token ? <ForgotPasswordPage /> : <Navigate to="/" replace />} />
        <Route path="/reset-password" element={!token ? <PasswordResetPage /> : <Navigate to="/" replace />} />
        <Route path="/rental-application" element={<RentalApplicationPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<RoleBasedShell />}>
            <Route index element={<MaintenanceDashboard />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="messaging" element={<MessagingPage />} />

            <Route element={<RequireRole allowedRoles={['PROPERTY_MANAGER']} />}>
              <Route path="lease-management" element={<LeaseManagementPage />} />
              <Route path="rental-applications-management" element={<RentalApplicationsManagementPage />} />
              <Route path="expense-tracker" element={<ExpenseTrackerPage />} />
              <Route path="rent-estimator" element={<RentEstimatorPage />} />
              <Route path="security-events" element={<AuditLogPage />} />
              <Route path="user-management" element={<UserManagementPage />} />
              <Route path="documents" element={<DocumentManagementPage />} />
              <Route path="reporting" element={<ReportingPage />} />
              <Route path="inspection-management" element={<InspectionManagementPage />} />
            </Route>

            <Route element={<RequireRole allowedRoles={['TENANT']} />}>
              <Route path="my-lease" element={<MyLeasePage />} />
              <Route path="inspections" element={<TenantInspectionPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
