import React, { useState, useEffect } from 'react';
import { ClubProvider, useClub } from './context/ClubContext';
import { AppHeader } from './components/layout/AppHeader';
import { ClubQRModal } from './components/common/ClubQRModal';
import { PortalGuard } from './components/auth/PortalGuard';

// Portals (Fully Responsive)
import { PlayerPortal } from './components/player/PlayerPortal';
import { CashierPortal } from './components/cashier/CashierPortal';
import { SecurityPortal } from './components/security/SecurityPortal';
import { AdminPortal } from './components/admin/AdminPortal';

const MainApp: React.FC = () => {
  const { activeRole, setActiveRole } = useClub();
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);

  // Read URL query parameters on initial page load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const portalParam = params.get('portal');
    const actionParam = params.get('action');

    if (portalParam && ['player', 'cashier', 'security', 'admin'].includes(portalParam)) {
      setActiveRole(portalParam as any);
    }

    if (actionParam === 'kyc' || actionParam === 'qr_scan' || actionParam === 'register') {
      setActiveRole('player');
      setShowNewPlayerForm(true);
    }
  }, [setActiveRole]);

  const handleOpenNewPlayerFromQR = () => {
    setActiveRole('player');
    setShowNewPlayerForm(true);
  };

  return (
    <div className="app-container">
      {/* Sleek Apple-like Glass Header */}
      <AppHeader onOpenQR={() => setIsQRModalOpen(true)} />

      {/* Main Fluid Responsive Canvas */}
      <main className="app-main">
        {activeRole === 'player' && (
          <PlayerPortal
            onOpenQR={() => setIsQRModalOpen(true)}
            showNewPlayerFormInitially={showNewPlayerForm}
          />
        )}

        {activeRole === 'cashier' && (
          <PortalGuard requiredRole="cashier">
            <CashierPortal />
          </PortalGuard>
        )}

        {activeRole === 'security' && (
          <PortalGuard requiredRole="security">
            <SecurityPortal />
          </PortalGuard>
        )}

        {activeRole === 'admin' && (
          <PortalGuard requiredRole="admin">
            <AdminPortal />
          </PortalGuard>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '16px 20px',
          background: 'rgba(7, 8, 12, 0.85)',
          backdropFilter: 'blur(16px)',
          color: 'var(--text-dim)',
          fontSize: '0.76rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          maxWidth: '1380px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#f59e0b' }}>♠</span>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Club Showdown • Poker Lounge & Club OS</span>
        </div>
        <div style={{ display: 'flex', gap: '14px', fontSize: '0.72rem' }}>
          <span>Role-Based Portal Access Control</span>
          <span>Apple San Francisco & DM Sans Typography</span>
        </div>
      </footer>

      {/* Global Entrance Registration QR Modal */}
      <ClubQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onOpenNewPlayerForm={handleOpenNewPlayerFromQR}
      />
    </div>
  );
};

export default function App() {
  return (
    <ClubProvider>
      <MainApp />
    </ClubProvider>
  );
}
