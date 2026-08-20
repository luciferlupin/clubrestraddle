import React from 'react';
import { useClub } from '../../context/ClubContext';
import { StaffLoginForm } from './StaffLoginForm';
import { LogOut, ShieldCheck, DollarSign, LayoutDashboard } from 'lucide-react';

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
      {/* Active Staff Session Bar with 1-Click Station Switcher */}
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
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#e11d48',
              boxShadow: '0 0 8px #e11d48',
            }}
          />
          <span style={{ color: '#cbd5e1' }}>Logged in as:</span>
          <strong style={{ color: '#ffffff' }}>{currentStaffUser?.fullName}</strong>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #e11d48, #9f1239)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              textTransform: 'uppercase',
            }}
          >
            {currentStaffUser?.role}
          </span>
        </div>

        {/* 1-Click Station Switcher for Staff */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setActiveRole('admin')}
            style={{
              background: requiredRole === 'admin' ? '#e11d48' : 'rgba(255,255,255,0.06)',
              border: requiredRole === 'admin' ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: requiredRole === 'admin' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <LayoutDashboard size={12} /> Admin
          </button>

          <button
            onClick={() => setActiveRole('cashier')}
            style={{
              background: requiredRole === 'cashier' ? '#e11d48' : 'rgba(255,255,255,0.06)',
              border: requiredRole === 'cashier' ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: requiredRole === 'cashier' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <DollarSign size={12} /> Cashier
          </button>

          <button
            onClick={() => setActiveRole('security')}
            style={{
              background: requiredRole === 'security' ? '#e11d48' : 'rgba(255,255,255,0.06)',
              border: requiredRole === 'security' ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              padding: '5px 10px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              fontWeight: requiredRole === 'security' ? 800 : 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ShieldCheck size={12} /> Security
          </button>

          <button
            onClick={logoutStaff}
            className="btn btn-ghost btn-sm"
            style={{ color: '#fda4af', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </div>

      {children}
    </div>
  );
};
