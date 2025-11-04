import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';
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

const AppLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          background: '#f0f0f0',
        }}
      >
        <h1>Property Management Suite</h1>
        <nav>
          <Link to="/" style={{ marginRight: '1rem' }}>
            Maintenance
          </Link>
          <Link to="/payments" style={{ marginRight: '1rem' }}>
            Payments
          </Link>
          <Link to="/messaging" style={{ marginRight: '1rem' }}>
            Messaging
          </Link>
          {user?.role === 'PROPERTY_MANAGER' && (
            <>
              <Link to="/lease-management" style={{ marginRight: '1rem' }}>
                Lease Management
              </Link>
              <Link to="/rental-applications-management" style={{ marginRight: '1rem' }}>
                Applications
              </Link>
              <Link to="/expense-tracker" style={{ marginRight: '1rem' }}>
                Expense Tracker
              </Link>
              <Link to="/rent-estimator" style={{ marginRight: '1rem' }}>
                Rent Estimator
              </Link>
              <Link to="/security-events" style={{ marginRight: '1rem' }}>
                Audit Log
              </Link>
            </>
          )}
          {user?.role === 'TENANT' && (
            <Link to="/my-lease" style={{ marginRight: '1rem' }}>
              My Lease
            </Link>
          )}
        </nav>
        <button onClick={logout} style={{ padding: '0.5rem 1rem' }}>
          Logout
        </button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default function App(): React.ReactElement {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!token ? <SignupPage /> : <Navigate to="/" replace />} />
        <Route path="/rental-application" element={<RentalApplicationPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<MaintenanceDashboard />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="messaging" element={<MessagingPage />} />

            <Route element={<RequireRole allowedRoles={['PROPERTY_MANAGER']} />}>
              <Route path="lease-management" element={<LeaseManagementPage />} />
              <Route path="rental-applications-management" element={<RentalApplicationsManagementPage />} />
              <Route path="expense-tracker" element={<ExpenseTrackerPage />} />
              <Route path="rent-estimator" element={<RentEstimatorPage />} />
              <Route path="security-events" element={<AuditLogPage />} />
            </Route>

            <Route element={<RequireRole allowedRoles={['TENANT']} />}>
              <Route path="my-lease" element={<MyLeasePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
