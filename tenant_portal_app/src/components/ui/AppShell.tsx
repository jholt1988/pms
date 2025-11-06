import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { Topbar } from './Topbar';

// components/ui/AppShell.tsx

interface AppShellProps {
  onLogout?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ onLogout }) => {
    console.log('[AppShell] Rendering Property Manager shell');
    
    return (
        <div className="app-container">
            <Topbar onLogout={onLogout} />
            <div className="layout">
                <Sidebar userRole="PROPERTY_MANAGER" onLogout={onLogout} />
                <MainContent>
                    <Outlet />
                </MainContent>
            </div>
        </div>
    );
};