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
import { CashPortal } from './components/cash/CashPortal';

// Portals (Dedicated Mobile Viewport)
import { MobilePlayerPortal } from './components/player/MobilePlayerPortal';
import { MobileCashierPortal } from './components/cashier/MobileCashierPortal';
import { MobileSecurityPortal } from './components/security/MobileSecurityPortal';
import { MobileAdminPortal } from './components/admin/MobileAdminPortal';
import { MobileCashPortal } from './components/cash/MobileCashPortal';
import { MobileHeader } from './components/common/MobileHeader';
import { RoleSwitcherDrawer } from './components/common/RoleSwitcherDrawer';
import { LogOut } from 'lucide-react';
import { AnimatedSuitsRow, FloatingChipsBackground } from './components/common/PokerGraphics';

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
      return new URLSearchParams(window.location.search).get('mobile') === '1' || window.innerWidth <= 768;
    }
    return false;
  });

  // Track screen size changes for fixed mobile viewport vs desktop
  useEffect(() => {
    const handleResize = () => {
      const forceMobile = new URLSearchParams(window.location.search).get('mobile') === '1';
      setIsMobile(forceMobile || window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Read URL pathname and query parameters on initial page load and route changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleRouteChange = () => {
      const pathname = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const portalParam = params.get('portal')?.toLowerCase();
      const actionParam = params.get('action')?.toLowerCase();
      const scanParam = params.get('scan');
      const playerParam = params.get('player') || params.get('playerId');

      // 1. Check Cashier Portal: /cashier, /cashier/... or ?portal=cashier
      const isCashier =
        pathname === '/cashier' ||
        pathname === '/cashier/' ||
        pathname.startsWith('/cashier/') ||
        portalParam === 'cashier';

      // 2. Check Cash Vault / Treasury Portal: /cash, /cash/..., /treasury or ?portal=cash / ?portal=treasury
      const isCash =
        pathname === '/cash' ||
        pathname === '/cash/' ||
        pathname.startsWith('/cash/') ||
        pathname === '/treasury' ||
        pathname === '/treasury/' ||
        pathname.startsWith('/treasury/') ||
        portalParam === 'cash' ||
        portalParam === 'treasury';

      // 3. Check Security Desk: /security, /security/... or ?portal=security
      const isSecurity =
        pathname === '/security' ||
        pathname === '/security/' ||
        pathname.startsWith('/security/') ||
        portalParam === 'security' ||
        Boolean(scanParam) ||
        Boolean(playerParam);

      // 4. Check Admin Portal: /admin, /admin/..., /staff, /staff/... or ?portal=admin
      const isAdmin =
        pathname === '/admin' ||
        pathname === '/admin/' ||
        pathname.startsWith('/admin/') ||
        pathname === '/staff' ||
        pathname === '/staff/' ||
        pathname.startsWith('/staff/') ||
        portalParam === 'admin' ||
        portalParam === 'staff';

      // 5. Check Player Portal
      const isPlayer =
        pathname === '/player' ||
        pathname === '/player/' ||
        pathname.startsWith('/player/') ||
        portalParam === 'player' ||
        actionParam === 'kyc' ||
        actionParam === 'qr_scan' ||
        actionParam === 'register';

      if (isCashier) {
        setActiveRole('cashier');
      } else if (isCash) {
        setActiveRole('cash');
      } else if (isSecurity) {
        setActiveRole('security');
      } else if (isAdmin) {
        setActiveRole('admin');
      } else if (isPlayer) {
        setActiveRole('player');
      }
    };

    handleRouteChange();
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [setActiveRole]);

  // Sync activeRole changes with browser address bar path for distinct shareable links
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname.toLowerCase();
    const targetPath =
      activeRole === 'cashier'
        ? '/cashier'
        : activeRole === 'cash'
        ? '/cash'
        : activeRole === 'security'
        ? '/security'
        : activeRole === 'admin'
        ? '/admin'
        : '/player';

    // Update address bar if path differs and not on root with params
    if (pathname !== targetPath && pathname !== '/' && !window.location.search.includes('portal=')) {
      window.history.replaceState(null, '', targetPath + window.location.search);
    }
  }, [activeRole]);

  const handleOpenNewPlayerFromQR = () => {
    setActiveRole('player');
    setShowNewPlayerForm(true);
  };

  const isPlayerMode = activeRole === 'player';

  return (
    <div className={`app-container ${isMobile ? 'is-mobile-device' : 'is-desktop-device'}`}>
      {/* ── Global floating 3D chips — page background decoration ───────────
           position:absolute fills the full app-container (min-height:100dvh).
           isolation:isolate on app-container + z-index:-1 on chip layer means
           chips paint BELOW all normal-flow card content, above transparent bg.
           pointer-events:none — zero interaction impact on anything.
           ──────────────────────────────────────────────────────────────────── */}
      <FloatingChipsBackground mode="absolute" opacity={0.13} chipCount={14} />

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
                showNewPlayerFormInitially={showNewPlayerForm}
              />
            )}

            {activeRole === 'cashier' && (
              <PortalGuard requiredRole="cashier">
                <MobileCashierPortal />
              </PortalGuard>
            )}

            {activeRole === 'cash' && (
              <PortalGuard requiredRole="cash">
                <MobileCashPortal />
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
                showNewPlayerFormInitially={showNewPlayerForm}
                onRegistrationFlowComplete={() => setShowNewPlayerForm(false)}
              />
            )}

            {activeRole === 'cashier' && (
              <PortalGuard requiredRole="cashier">
                <CashierPortal />
              </PortalGuard>
            )}

            {activeRole === 'cash' && (
              <PortalGuard requiredRole="cash">
                <CashPortal />
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
          <span className="footer-suits-row">
            <AnimatedSuitsRow size={15} gap={6} />
          </span>
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
