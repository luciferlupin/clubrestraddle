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
import { LogOut, Spade } from 'lucide-react';

const MainApp: React.FC = () => {
  const { activeRole, setActiveRole } = useClub();
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(() => {
    if (typeof window === 'undefined') return false;
    const action = new URLSearchParams(window.location.search).get('action');
    return action === 'kyc' || action === 'qr_scan' || action === 'register';
  });
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

  // Read URL pathname and query parameters on initial page load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const portalParam = params.get('portal');
    const actionParam = params.get('action');
    const scanParam = params.get('scan');
    const playerParam = params.get('player') || params.get('playerId');

    // 1. Staff OS Direct Links: /staff, /admin, /cashier, /security or ?portal=staff/admin/cashier/security
    if (
      pathname.startsWith('/staff') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/cashier') ||
      pathname.startsWith('/security') ||
      ['staff', 'cashier', 'security', 'admin'].includes(portalParam || '') ||
      scanParam ||
      playerParam
    ) {
      if (pathname.startsWith('/cashier') || portalParam === 'cashier') {
        setActiveRole('cashier');
      } else if (pathname.startsWith('/security') || portalParam === 'security' || scanParam || playerParam) {
        setActiveRole('security');
      } else {
        setActiveRole('admin');
      }
    } else {
      // 2. Player Portal Default Link: / or /player
      setActiveRole('player');
    }

    if (actionParam === 'kyc' || actionParam === 'qr_scan' || actionParam === 'register') {
      setActiveRole('player');
    }
  }, [setActiveRole]);

  const handleOpenNewPlayerFromQR = () => {
    setActiveRole('player');
    setShowNewPlayerForm(true);
  };

  const isPlayerMode = activeRole === 'player';

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
                key={showNewPlayerForm ? 'player-register' : 'player-standard'}
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
                key={showNewPlayerForm ? 'desktop-player-register' : 'desktop-player-standard'}
                onOpenQR={() => setIsQRModalOpen(true)}
                showNewPlayerFormInitially={showNewPlayerForm}
                onRegistrationFlowComplete={() => setShowNewPlayerForm(false)}
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

      {/* Mobile Station Switcher Bottom Sheet (Only in Staff Mode) */}
      {isMobile && !isPlayerMode && (
        <RoleSwitcherDrawer
          isOpen={isRoleSwitcherOpen}
          onClose={() => setIsRoleSwitcherOpen(false)}
          onOpenQR={() => setIsQRModalOpen(true)}
        />
      )}

      {/* Desktop footer; mobile player journeys keep the primary action in reach. */}
      {!isMobile && (
      <footer
        style={{
          borderTop: '1px solid rgba(225, 29, 72, 0.35)',
          padding: '14px 20px',
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
          <Spade size={14} color="#ffffff" fill="currentColor" aria-hidden="true" />
          <span style={{ fontWeight: 700, color: '#ffffff' }}>
            {isPlayerMode ? 'CLUB RE STRADDLE • Luxury Poker Lounge & Member Club' : 'CLUB RE STRADDLE • Staff Operations OS'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.74rem', color: '#94a3b8' }}>
          {isPlayerMode ? (
            <>
              <span>Members Only • 21+ Required</span>
              <span>•</span>
              <span>Responsible Gaming</span>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setActiveRole('player')}
              className="desktop-footer-exit"
            >
              <LogOut size={13} aria-hidden="true" /> Exit staff station
            </button>
          )}
        </div>
      </footer>
      )}

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
