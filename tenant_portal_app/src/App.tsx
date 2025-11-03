import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
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

/**
 * The main application component.
 * It handles routing and renders the appropriate pages based on the user's authentication status and role.
 */
export default function App(): React.ReactElement {
  const { token, logout, user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!token ? <SignupPage /> : <Navigate to="/" />} />
        <Route
          path="/"
          element={
            token ? (
              <div>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f0f0f0' }}>
                  <h1>Property Management Suite</h1>
                  <nav>
                    <Link to="/" style={{ marginRight: '1rem' }}>Maintenance</Link>
                    <Link to="/payments" style={{ marginRight: '1rem' }}>Payments</Link>
                    <Link to="/messaging" style={{ marginRight: '1rem' }}>Messaging</Link>
                    {user?.role === 'PROPERTY_MANAGER' && (
                      <>
                        <Link to="/lease-management" style={{ marginRight: '1rem' }}>Lease Management</Link>
                        <Link to="/rental-applications-management" style={{ marginRight: '1rem' }}>Applications</Link>
                        <Link to="/expense-tracker" style={{ marginRight: '1rem' }}>Expense Tracker</Link>
                        <Link to="/rent-estimator" style={{ marginRight: '1rem' }}>Rent Estimator</Link>
                      </>
                    )}
                    {user?.role === 'TENANT' && (
                      <>
                        <Link to="/my-lease" style={{ marginRight: '1rem' }}>My Lease</Link>
                      </>
                    )}
                  </nav>
                  <button onClick={logout} style={{ padding: '0.5rem 1rem' }}>Logout</button>
                </header>
                <main>
                  <Routes>
                    <Route path="/" element={<MaintenanceDashboard />} />
                    <Route path="/payments" element={<PaymentsPage />} />
                    <Route path="/messaging" element={<MessagingPage />} />
                    {user?.role === 'PROPERTY_MANAGER' && (
                      <>
                        <Route path="/lease-management" element={<LeaseManagementPage />} />
                        <Route path="/expense-tracker" element={<ExpenseTrackerPage />} />
                        <Route path="/rent-estimator" element={<RentEstimatorPage />} />
                      </>
                    )}
                    {user?.role === 'TENANT' && (
                      <Route path="/my-lease" element={<MyLeasePage />} />
                    )}
                    <Route path="/rental-applications-management" element={<RentalApplicationsManagementPage />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/payments" element={token ? <PaymentsPage /> : <Navigate to="/login" />} />
        <Route path="/messaging" element={token ? <MessagingPage /> : <Navigate to="/login" />} />
        <Route path="/lease-management" element={token && user?.role === 'PROPERTY_MANAGER' ? <LeaseManagementPage /> : <Navigate to="/login" />} />
        <Route path="/my-lease" element={token && user?.role === 'TENANT' ? <MyLeasePage /> : <Navigate to="/login" />} />
        <Route path="/rental-application" element={<RentalApplicationPage />} />
        <Route path="/rental-applications-management" element={token && user?.role === 'PROPERTY_MANAGER' ? <RentalApplicationsManagementPage /> : <Navigate to="/login" />} />
        <Route path="/expense-tracker" element={token && user?.role === 'PROPERTY_MANAGER' ? <ExpenseTrackerPage /> : <Navigate to="/login" />} />
        <Route path="/rent-estimator" element={token && user?.role === 'PROPERTY_MANAGER' ? <RentEstimatorPage /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};
