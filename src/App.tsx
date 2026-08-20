import React, { useState, useEffect } from 'react';
import { ClubProvider, useClub } from './context/ClubContext';
import { AppHeader } from './components/layout/AppHeader';
import { ClubQRModal } from './components/common/ClubQRModal';
import { PortalGuard } from './components/auth/PortalGuard';

// Portals (Desktop Dashboards)
import { PlayerPortal } from './components/player/PlayerPortal';
import { CashierPortal } from './components/cashier/CashierPortal';
import { SecurityPortal } from './components/security/SecurityPortal';
import { AdminPortal } from './components/admin/AdminPortal';

// Portals (Dedicated Mobile Viewport)
import { MobilePlayerPortal } from './components/player/MobilePlayerPortal';
import { MobileCashierPortal } from './components/cashier/MobileCashierPortal';
import { MobileSecurityPortal } from './components/security/MobileSecurityPortal';
import { MobileAdminPortal } from './components/admin/MobileAdminPortal';
import { MobileHeader } from './components/common/MobileHeader';
import { RoleSwitcherDrawer } from './components/common/RoleSwitcherDrawer';

const MainApp: React.FC = () => {
  const { activeRole, setActiveRole } = useClub();
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= 768;
    }
    return false;
  });

  // Track screen size changes for fixed mobile viewport vs desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Read URL query parameters on initial page load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const portalParam = params.get('portal');
    const actionParam = params.get('action');
    const scanParam = params.get('scan');
    const playerParam = params.get('player') || params.get('playerId');

    if (portalParam && ['player', 'cashier', 'security', 'admin'].includes(portalParam)) {
      setActiveRole(portalParam as any);
    } else if (scanParam || playerParam) {
      setActiveRole('security');
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
    <div className={`app-container ${isMobile ? 'is-mobile-device' : 'is-desktop-device'}`}>
      {/* Header: Adaptive Mobile Header on Phones, Glass Header on Desktop */}
      {isMobile ? (
        <MobileHeader
          onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
          onOpenQR={() => setIsQRModalOpen(true)}
        />
      ) : (
        <AppHeader onOpenQR={() => setIsQRModalOpen(true)} />
      )}

      {/* Main Viewport Fitted Canvas */}
      <main className="app-main">
        {isMobile ? (
          /* Mobile Dedicated Portals */
          <>
            {activeRole === 'player' && (
              <MobilePlayerPortal
                onOpenQR={() => setIsQRModalOpen(true)}
                showNewPlayerFormInitially={showNewPlayerForm}
              />
            )}

            {activeRole === 'cashier' && (
              <PortalGuard requiredRole="cashier">
                <MobileCashierPortal />
              </PortalGuard>
            )}

            {activeRole === 'security' && (
              <PortalGuard requiredRole="security">
                <MobileSecurityPortal />
              </PortalGuard>
            )}

            {activeRole === 'admin' && (
              <PortalGuard requiredRole="admin">
                <MobileAdminPortal />
              </PortalGuard>
            )}
          </>
        ) : (
          /* Desktop / Laptop Portals */
          <>
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
          </>
        )}
      </main>

      {/* Mobile Station Switcher Bottom Sheet */}
      {isMobile && (
        <RoleSwitcherDrawer
          isOpen={isRoleSwitcherOpen}
          onClose={() => setIsRoleSwitcherOpen(false)}
          onOpenQR={() => setIsQRModalOpen(true)}
        />
      )}

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(225, 29, 72, 0.35)',
          padding: '16px 24px',
          background: '#0c080b',
          backdropFilter: 'blur(16px)',
          color: '#cbd5e1',
          fontSize: '0.78rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          maxWidth: '1380px',
          margin: '0 auto',
          width: '100%',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#ffffff' }}>♠</span>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>CLUB RE STRADDLE • Poker Lounge & Club OS</span>
        </div>
        <div style={{ display: 'flex', gap: '14px', fontSize: '0.74rem', color: '#cbd5e1' }}>
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
