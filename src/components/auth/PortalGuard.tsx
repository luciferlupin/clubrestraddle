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
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '8px 14px',
          marginBottom: '14px',
          fontSize: '0.8rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          <span style={{ color: 'var(--text-muted)' }}>Staff Session:</span>
          <strong style={{ color: '#ffffff' }}>{currentStaffUser?.fullName}</strong>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              background:
                currentStaffUser?.role === 'admin'
                  ? 'rgba(192, 132, 252, 0.2)'
                  : currentStaffUser?.role === 'cashier'
                  ? 'rgba(245, 158, 11, 0.2)'
                  : 'rgba(16, 185, 129, 0.2)',
              color:
                currentStaffUser?.role === 'admin'
                  ? '#c084fc'
                  : currentStaffUser?.role === 'cashier'
                  ? '#fbbf24'
                  : '#34d399',
              textTransform: 'uppercase',
            }}
          >
            {currentStaffUser?.role}
          </span>
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={logoutStaff}
          title="Sign out of staff terminal"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171' }}
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>
      </div>

      {children}
    </div>
  );
};
