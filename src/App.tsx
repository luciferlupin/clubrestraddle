import React, { useState, useEffect } from 'react';
import { ClubProvider, useClub } from './context/ClubContext';
import { LaptopHeader } from './components/layout/LaptopHeader';
import { MobileHeader } from './components/common/MobileHeader';
import { RoleSwitcherDrawer } from './components/common/RoleSwitcherDrawer';
import { ClubQRModal } from './components/common/ClubQRModal';
import { PortalGuard } from './components/auth/PortalGuard';

// Laptop Full-Screen Portals
import { PlayerPortal } from './components/player/PlayerPortal';
import { CashierPortal } from './components/cashier/CashierPortal';
import { SecurityPortal } from './components/security/SecurityPortal';
import { AdminPortal } from './components/admin/AdminPortal';

// Mobile Phone Portals
import { MobilePlayerPortal } from './components/player/MobilePlayerPortal';
import { MobileCashierPortal } from './components/cashier/MobileCashierPortal';
import { MobileSecurityPortal } from './components/security/MobileSecurityPortal';
import { MobileAdminPortal } from './components/admin/MobileAdminPortal';

const MainApp: React.FC = () => {
  const { activeRole, setActiveRole } = useClub();
  
  // Default to laptop view on screens >= 768px, mobile on smaller screens
  const [viewMode, setViewMode] = useState<'laptop' | 'mobile'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'laptop';
  });

  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
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

  // Auto-adapt on window resize if needed
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode === 'laptop') {
        setViewMode('mobile');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  const handleOpenNewPlayerFromQR = () => {
    setActiveRole('player');
    setShowNewPlayerForm(true);
  };

  return (
    <div>
      {viewMode === 'laptop' ? (
        /* ---------------- LAPTOP FULLSCREEN VIEW ---------------- */
        <div className="laptop-shell">
          <LaptopHeader
            onOpenQR={() => setIsQRModalOpen(true)}
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
          />

          <main className="laptop-main-content">
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

          <footer
            style={{
              borderTop: '1px solid var(--border-subtle)',
              padding: '16px 24px',
              background: 'rgba(10, 13, 20, 0.95)',
              color: 'var(--text-dim)',
              fontSize: '0.78rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              maxWidth: '1400px',
              margin: '0 auto',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#f59e0b' }}>♠</span>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Club Showdown • Poker Club Management System</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
              <span>Authenticated Staff Access Enforced</span>
              <span>4 Portals: Player • Cashier • Security • Admin</span>
            </div>
          </footer>
        </div>
      ) : (
        /* ---------------- MOBILE PHONE VIEW ---------------- */
        <div className="mobile-simulator-wrapper">
          <div className="mobile-app-shell">
            {/* Top Switcher Bar on Mobile Preview */}
            <div
              style={{
                background: '#04070d',
                padding: '6px 14px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
              }}
            >
              <span>📱 Mobile Phone View</span>
              <button
                onClick={() => setViewMode('laptop')}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--gold-light)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                Switch to Laptop Fullscreen 💻
              </button>
            </div>

            <MobileHeader
              onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
              onOpenQR={() => setIsQRModalOpen(true)}
            />

            <main className="mobile-main">
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
            </main>

            <RoleSwitcherDrawer
              isOpen={isRoleSwitcherOpen}
              onClose={() => setIsRoleSwitcherOpen(false)}
              onOpenQR={() => setIsQRModalOpen(true)}
            />
          </div>
        </div>
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
