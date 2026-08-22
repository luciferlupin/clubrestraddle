import React from 'react';
import { QrCode, ChevronDown, CircleDot } from 'lucide-react';
import { QuadSuits, CardSuit } from './PokerGraphics';
import { useClub } from '../../context/ClubContext';

interface MobileHeaderProps {
  onOpenRoleSwitcher: () => void;
  onOpenQR: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenRoleSwitcher, onOpenQR }) => {
  const { activeRole, setActiveRole, todayCheckIns } = useClub();

  const isPlayerMode = activeRole === 'player';
  const pendingCount = todayCheckIns.filter(c => c.verificationStatus === 'pending').length;

  const getPortalLabel = () => {
    switch (activeRole) {
      case 'player':
        return { name: 'Member', color: '#ffffff' };
      case 'cashier':
        return { name: 'Cashier', color: '#ffffff' };
      case 'cash':
        return { name: 'Cash Desk', color: '#fbbf24' };
      case 'security':
        return { name: 'Security', color: '#ffffff' };
      case 'admin':
        return { name: 'Admin', color: '#ffffff' };
    }
  };

  const portalInfo = getPortalLabel();

  return (
    <header className="mobile-header">
      <button
        type="button"
        className="mobile-logo-wrap"
        onClick={isPlayerMode ? () => setActiveRole('player') : onOpenRoleSwitcher}
        aria-label={isPlayerMode ? 'Club Re Straddle member portal' : 'Open staff desk switcher'}
      >
        <div className="mobile-logo-badge" style={{ background: 'transparent', border: 'none' }}>
          <QuadSuits size={38} />
        </div>
        <div className="mobile-logo-text">
          <span className="mobile-logo-title">CLUB RE STRADDLE</span>
          <span className="mobile-portal-pill" style={{ color: portalInfo.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CardSuit suit={activeRole === 'player' ? 'spade' : activeRole === 'cashier' ? 'diamond' : activeRole === 'cash' ? 'diamond' : activeRole === 'security' ? 'club' : 'heart'} size={9} />
            {portalInfo.name}
          </span>
        </div>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Staff roles and registration stay one tap away without crowding the phone header. */}
        {!isPlayerMode ? (
          <button
            type="button"
            className="role-switch-btn"
            onClick={onOpenRoleSwitcher}
            aria-label={`Switch staff desk. Current desk: ${portalInfo.name}`}
          >
            <span>{portalInfo.name}</span>
            {activeRole === 'security' && pendingCount > 0 && <span className="staff-header-count">{pendingCount}</span>}
            <ChevronDown size={14} />
          </button>
        ) : null}

        {!isPlayerMode && (
          <button
            type="button"
            onClick={onOpenQR}
            className="mobile-header-action"
            aria-label="Open club entrance registration QR"
          >
            <QrCode size={20} />
          </button>
        )}
      </div>
    </header>
  );
};
