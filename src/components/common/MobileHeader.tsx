import React from 'react';
import { QrCode, ChevronDown, CircleDot, User, LogOut } from 'lucide-react';
import { useClub } from '../../context/ClubContext';

interface MobileHeaderProps {
  onOpenRoleSwitcher: () => void;
  onOpenQR: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenRoleSwitcher, onOpenQR }) => {
  const { activeRole, setActiveRole, todayCheckIns, currentStaffUser, logoutStaff } = useClub();

  const isPlayerMode = activeRole === 'player';
  const pendingCount = todayCheckIns.filter(c => c.verificationStatus === 'pending').length;

  const getPortalLabel = () => {
    switch (activeRole) {
      case 'player':
        return { name: 'Member Lounge', color: '#ffffff' };
      case 'cashier':
        return { name: 'Cashier Desk', color: '#ffffff' };
      case 'security':
        return { name: 'Security Desk', color: '#ffffff' };
      case 'admin':
        return { name: 'Admin Suite', color: '#ffffff' };
    }
  };

  const portalInfo = getPortalLabel();

  return (
    <header className="mobile-header">
      <div className="mobile-logo-wrap" onClick={() => setActiveRole('player')}>
        <div className="mobile-logo-badge">♠</div>
        <div className="mobile-logo-text">
          <span className="mobile-logo-title">CLUB RE STRADDLE</span>
          <span className="mobile-portal-pill" style={{ color: portalInfo.color }}>
            <CircleDot size={8} /> {portalInfo.name}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Only show station switcher and exit button in Staff Mode */}
        {!isPlayerMode ? (
          <>
            <button
              className="role-switch-btn"
              onClick={onOpenRoleSwitcher}
              title="Switch Staff Station"
            >
              <span>Desks</span>
              {activeRole === 'security' && pendingCount > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '1px 5px',
                    fontSize: '0.62rem',
                  }}
                >
                  {pendingCount}
                </span>
              )}
              <ChevronDown size={14} />
            </button>

            <button
              onClick={() => setActiveRole('player')}
              style={{
                background: 'rgba(225, 29, 72, 0.2)',
                border: '1px solid rgba(225, 29, 72, 0.4)',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '5px 8px',
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
              title="Exit to Player App"
            >
              <User size={13} /> Exit
            </button>
          </>
        ) : null}

        <button
          onClick={onOpenQR}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Club Entrance Registration QR"
        >
          <QrCode size={20} />
        </button>
      </div>
    </header>
  );
};
