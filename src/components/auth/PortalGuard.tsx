import React from 'react';
import { useClub } from '../../context/ClubContext';
import { StaffLoginForm } from './StaffLoginForm';
import { LogOut, ShieldCheck, UserCheck } from 'lucide-react';

interface PortalGuardProps {
  requiredRole: 'cashier' | 'security' | 'admin';
  children: React.ReactNode;
}

export const PortalGuard: React.FC<PortalGuardProps> = ({ requiredRole, children }) => {
  const { currentStaffUser, logoutStaff, setActiveRole } = useClub();

  // Check authorization
  const isAuthorized = (() => {
    if (!currentStaffUser) return false;
    if (currentStaffUser.status === 'suspended') return false;
    if (currentStaffUser.role === 'admin') return true; // Admin can access everything
    return currentStaffUser.role === requiredRole;
  })();

  if (!isAuthorized) {
    return (
      <StaffLoginForm
        portalRole={requiredRole}
        onBackToPlayer={() => setActiveRole('player')}
      />
    );
  }

  return (
    <div>
      {/* Active Staff Session Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#130a0e',
          border: '1px solid rgba(225, 29, 72, 0.35)',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '16px',
          fontSize: '0.82rem',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#8B0000',
              boxShadow: '0 0 8px #8B0000',
            }}
          />
          <span style={{ color: '#cbd5e1' }}>Staff Session:</span>
          <strong style={{ color: '#ffffff' }}>{currentStaffUser?.fullName}</strong>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #8B0000, #4a0000)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase',
            }}
          >
            {currentStaffUser?.role}
          </span>
        </div>

        <button
          onClick={logoutStaff}
          className="btn btn-ghost btn-sm"
          style={{ color: '#fda4af', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>

      {children}
    </div>
  );
};
