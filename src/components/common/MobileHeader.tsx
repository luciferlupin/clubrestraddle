import React from 'react';
import { QrCode, ChevronDown, CircleDot } from 'lucide-react';
import { useClub } from '../../context/ClubContext';

interface MobileHeaderProps {
  onOpenRoleSwitcher: () => void;
  onOpenQR: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenRoleSwitcher, onOpenQR }) => {
  const { activeRole, todayCheckIns } = useClub();

  const pendingCount = todayCheckIns.filter(c => c.verificationStatus === 'pending').length;

  const getPortalLabel = () => {
    switch (activeRole) {
      case 'player':
        return { name: 'Player Portal', color: '#38bdf8' };
      case 'cashier':
        return { name: 'Cashier Desk', color: '#f59e0b' };
      case 'security':
        return { name: 'Security Desk', color: '#10b981' };
      case 'admin':
        return { name: 'Admin Center', color: '#c084fc' };
    }
  };

  const portalInfo = getPortalLabel();

  return (
    <header className="mobile-header">
      <div className="mobile-logo-wrap">
        <div className="mobile-logo-badge">♠</div>
        <div className="mobile-logo-text">
          <span className="mobile-logo-title">CLUB SHOWDOWN</span>
          <span className="mobile-portal-pill" style={{ color: portalInfo.color }}>
            <CircleDot size={8} /> {portalInfo.name}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="role-switch-btn"
          onClick={onOpenRoleSwitcher}
          title="Switch Portal Role"
        >
          <span>Portals</span>
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
          onClick={onOpenQR}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gold-light)',
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
