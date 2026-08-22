import React from 'react';
import { useClub } from '../../context/ClubContext';
import { StaffLoginForm } from './StaffLoginForm';
import { LogOut, UserRoundCheck } from 'lucide-react';

interface PortalGuardProps {
  requiredRole: 'cashier' | 'security' | 'admin' | 'cash';
  children: React.ReactNode;
}

export const PortalGuard: React.FC<PortalGuardProps> = ({ requiredRole, children }) => {
  const { currentStaffUser, logoutStaff, setActiveRole } = useClub();

  // Check authorization
  const isAuthorized = (() => {
    if (!currentStaffUser) return false;
    if (currentStaffUser.status === 'suspended') return false;
    if (currentStaffUser.role === 'admin') return true; // Admin can access everything
    if (requiredRole === 'cash' || requiredRole === 'cashier') {
      return currentStaffUser.role === 'cashier';
    }
    if (requiredRole === 'security') {
      return currentStaffUser.role === 'security';
    }
    return (currentStaffUser.role as string) === requiredRole;
  })();

  if (!isAuthorized) {
    return (
      <StaffLoginForm
        key={requiredRole}
        portalRole={requiredRole}
        onBackToPlayer={() => setActiveRole('player')}
      />
    );
  }

  return (
    <div>
      <div className="staff-session-bar">
        <div className="staff-session-identity">
          <UserRoundCheck size={18} aria-hidden="true" />
          <span>
            <strong>{currentStaffUser?.fullName}</strong>
            <small>{requiredRole} desk · {currentStaffUser?.role} access</small>
          </span>
        </div>
        <button type="button" onClick={logoutStaff} className="staff-signout-btn" aria-label="Sign out of staff portal">
          <LogOut size={16} /> <span>Sign out</span>
        </button>
      </div>

      {children}
    </div>
  );
};
