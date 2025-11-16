import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { Topbar } from './Topbar';

// components/ui/AppShell.tsx

interface AppShellProps {
  onLogout?: () => void;
  children?: React.ReactNode;
  sidebarVisible?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ onLogout, children, sidebarVisible = true }) => {
  console.log('[AppShell] Rendering Property Manager shell');

  return (
    <div className="app-container">
      <Topbar onLogout={onLogout} />
      <div className="layout">
        {sidebarVisible && <Sidebar userRole="PROPERTY_MANAGER" onLogout={onLogout} />}
        <MainContent>
          {children ?? <Outlet />}
        </MainContent>
      </div>
    </div>
  );
};
