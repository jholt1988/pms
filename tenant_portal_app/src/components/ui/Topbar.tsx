import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  UserSquare,
  LogOut 
} from 'lucide-react';

interface TopbarProps {
  className?: string;
  userRole?: string;
  onLogout?: () => void;
}

interface NavLink {
  path: string;
  label: string;
}

const navigationLinks: NavLink[] = [
  { path: '/', label: 'Dashboard' },
  { path: '/maintenance', label: 'Maintenance' },
  { path: '/payments', label: 'Payments' },
  { path: '/messaging', label: 'Messaging' },
  { path: '/lease-management', label: 'Leases' },
  { path: '/rental-applications-management', label: 'Applications' },
  { path: '/expense-tracker', label: 'Expenses' },
  { path: '/rent-estimator', label: 'Rent Estimator' },
  { path: '/security-events', label: 'Audit Log' },
];

export const Topbar: React.FC<TopbarProps> = ({ 
  className = '', 
  userRole = 'Property Manager',
  onLogout 
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      // Default logout behavior
      navigate('/login');
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`topbar ${className}`}>
      <div className="brand">
        <div className="logo">
          <Building2 className="w-[18px] h-[18px]" />
        </div>
        <div className="title">Property Management Suite</div>
      </div>
      
      <div className="top-actions">
        <div className="nav">
          {navigationLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={isActive(link.path) ? 'active' : ''}
            >
              {link.label}
            </Link>
          ))}
        </div>
        
        <div className="role-switch">
          <UserSquare className="w-[14px] h-[14px]" />
          <span>Logged in as: {userRole}</span>
        </div>
        
        <div className="logout" onClick={handleLogout}>
          <LogOut className="w-[14px] h-[14px] mr-1" />
          Logout
        </div>
      </div>
    </div>
  );
};