import React, { useState, useEffect } from 'react';
import {
  User,
  DollarSign,
  ShieldCheck,
  LayoutDashboard,
  QrCode,
  CircleDot,
  LogOut,
  Lock,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { QuadSuits, CardSuit, AnimatedSuitsRow } from '../common/PokerGraphics';
import { useClub } from '../../context/ClubContext';

interface AppHeaderProps {
  onOpenQR: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenQR }) => {
  const {
    activeRole,
    setActiveRole,
    currentPlayer,
    setSelectedPlayerId,
    currentStaffUser,
    logoutStaff,
    todayCheckIns,
  } = useClub();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pendingSecurityCount = todayCheckIns.filter(c => c.verificationStatus === 'pending').length;

  const isPlayerMode = activeRole === 'player';

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <button
          type="button"
          className="brand-wrap"
          onClick={() => setActiveRole('player')}
          aria-label="Open the player portal"
        >
          <span className="brand-icon" aria-hidden="true">
            <QuadSuits size={34} />
          </span>
          <div>
            <div className="brand-title">CLUB RE STRADDLE</div>
            <div className="brand-sub">
              {isPlayerMode ? 'Member Lounge & Passes' : 'Staff Operations OS'}
            </div>
          </div>
        </button>

        {/* Staff Only Role Navigation Tabs (Hidden for Players) */}
        {!isPlayerMode ? (
          <nav className="role-nav-tabs" aria-label="Staff Portal Selection">
            <button
              className={`role-nav-tab cashier-tab ${activeRole === 'cashier' ? 'active' : ''}`}
              onClick={() => setActiveRole('cashier')}
            >
              <DollarSign size={15} />
              <span>Cashier</span>
              {!currentStaffUser && <Lock size={11} style={{ opacity: 0.6 }} />}
            </button>

            {activeRole === 'cash' && (
              <button
                className="role-nav-tab cashier-tab active"
                style={{ borderColor: 'rgba(245, 158, 11, 0.6)', background: 'rgba(245, 158, 11, 0.15)' }}
                onClick={() => setActiveRole('cash')}
              >
                <DollarSign size={15} color="#fbbf24" />
                <span style={{ color: '#fbbf24', fontWeight: 800 }}>Cash Vault</span>
              </button>
            )}

            <button
              className={`role-nav-tab security-tab ${activeRole === 'security' ? 'active' : ''}`}
              onClick={() => setActiveRole('security')}
            >
              <ShieldCheck size={15} />
              <span>Security</span>
              {!currentStaffUser && <Lock size={11} style={{ opacity: 0.6 }} />}
              {pendingSecurityCount > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    padding: '1px 5px',
                    borderRadius: '999px',
                    fontWeight: 800,
                    marginLeft: '2px',
                  }}
                >
                  {pendingSecurityCount}
                </span>
              )}
            </button>

            <button
              className={`role-nav-tab admin-tab ${activeRole === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveRole('admin')}
            >
              <LayoutDashboard size={15} />
              <span>Admin</span>
              {!currentStaffUser && <Lock size={11} style={{ opacity: 0.6 }} />}
            </button>
          </nav>
        ) : (
          /* Player Live Clock & Club Status */
          <div className="player-club-status" aria-label={`Club open, current time ${currentTime}`}>
            <div className="player-club-status-pill">
              <AnimatedSuitsRow size={12} gap={4} />
              <span style={{ opacity: 0.4, margin: '0 2px' }}>•</span>
              <span style={{ color: '#fda4af', fontWeight: 700 }}>Club Open</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{currentTime}</span>
            </div>
          </div>
        )}

        {/* Header Right Actions */}
        <div className="app-header-actions">
          {isPlayerMode ? (
            /* Active Member Profile Badge (Only when registered / loaded) */
            currentPlayer ? (
              <div className="header-member-chip">
                <span className="header-member-name">
                  <UserRound size={14} aria-hidden="true" /> {currentPlayer.fullName}
                </span>
                <span className="header-member-tier">
                  {currentPlayer.membershipTier}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPlayerId('')}
                  className="header-switch-member"
                  aria-label="Switch to another member"
                >
                  <UsersRound size={13} aria-hidden="true" /> <span>Switch</span>
                </button>
              </div>
            ) : null
          ) : currentStaffUser ? (
            /* Staff Session Info */
            <div className="header-staff-chip">
              <CircleDot size={9} color="#e11d48" />
              <span className="header-staff-name">{currentStaffUser.fullName}</span>
              <span className="header-staff-role">
                {currentStaffUser.role}
              </span>
              <button
                type="button"
                onClick={logoutStaff}
                className="header-signout-button"
                aria-label="Sign out of the staff portal"
              >
                <LogOut size={13} aria-hidden="true" />
              </button>
            </div>
          ) : null}

          {/* Exit to Player App Button for Staff */}
          {!isPlayerMode && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveRole('player')}
              aria-label="Exit staff tools and open the player portal"
            >
              <User size={13} /> <span className="header-action-label">Player portal</span>
            </button>
          )}

          {/* Staff-only entrance registration standee */}
          {!isPlayerMode && (
            <button className="btn btn-secondary btn-sm" onClick={onOpenQR} aria-label="Open club registration standee QR">
              <QrCode size={13} color="#ffffff" />
              <span className="header-action-label">Standee QR</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
