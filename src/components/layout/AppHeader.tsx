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
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';

interface AppHeaderProps {
  onOpenQR: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onOpenQR }) => {
  const {
    activeRole,
    setActiveRole,
    players,
    selectedPlayerId,
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
        {/* Brand */}
        <div className="brand-wrap" onClick={() => setActiveRole('player')}>
          <div className="brand-icon">♠</div>
          <div>
            <div className="brand-title">CLUB RE STRADDLE</div>
            <div className="brand-sub">
              {isPlayerMode ? 'Member Lounge & Passes' : 'Staff Operations OS'}
            </div>
          </div>
        </div>

        {/* Staff Only Role Navigation Tabs (Hidden for Players) */}
        {!isPlayerMode ? (
          <nav className="role-nav-tabs" aria-label="Staff Portal Selection">
            <button
              className={`role-nav-tab cashier-tab ${activeRole === 'cashier' ? 'active' : ''}`}
              onClick={() => setActiveRole('cashier')}
            >
              <DollarSign size={15} />
              <span>Cashier Desk</span>
              {!currentStaffUser && <Lock size={11} style={{ opacity: 0.6 }} />}
            </button>

            <button
              className={`role-nav-tab security-tab ${activeRole === 'security' ? 'active' : ''}`}
              onClick={() => setActiveRole('security')}
            >
              <ShieldCheck size={15} />
              <span>Security Desk</span>
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
              <span>Admin Center</span>
              {!currentStaffUser && <Lock size={11} style={{ opacity: 0.6 }} />}
            </button>
          </nav>
        ) : (
          /* Player Live Clock & Club Status */
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#13060a',
                padding: '6px 14px',
                borderRadius: '999px',
                border: '1px solid rgba(225, 29, 72, 0.35)',
                fontSize: '0.78rem',
                color: '#ffffff',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#e11d48',
                  boxShadow: '0 0 8px #e11d48',
                }}
              />
              <span style={{ color: '#fda4af', fontWeight: 700 }}>Club Open</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{currentTime}</span>
            </div>
          </div>
        )}

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isPlayerMode ? (
            /* Player Profile Selector */
            players.length > 0 ? (
              <select
                className="form-select"
                style={{
                  padding: '7px 34px 7px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  width: 'auto',
                  background: '#16080d',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(225, 29, 72, 0.45)',
                  color: '#ffffff',
                  minHeight: '36px',
                }}
                value={selectedPlayerId}
                onChange={e => setSelectedPlayerId(e.target.value)}
                aria-label="Switch Active Member"
              >
                <optgroup label="Member Profile:">
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      👤 {p.fullName} ({p.membershipTier})
                    </option>
                  ))}
                </optgroup>
              </select>
            ) : null
          ) : currentStaffUser ? (
            /* Staff Session Info */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.76rem',
                background: '#16090d',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(225, 29, 72, 0.4)',
              }}
            >
              <CircleDot size={9} color="#e11d48" />
              <span style={{ fontWeight: 700, color: '#ffffff' }}>{currentStaffUser.fullName}</span>
              <span style={{ fontSize: '0.65rem', color: '#fda4af', textTransform: 'uppercase', background: 'rgba(225,29,72,0.2)', padding: '1px 6px', borderRadius: '4px' }}>
                {currentStaffUser.role}
              </span>
              <button
                onClick={logoutStaff}
                title="Sign out and return to player app"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: '4px',
                }}
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : null}

          {/* Exit to Player App Button for Staff */}
          {!isPlayerMode && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveRole('player')}
              style={{ fontSize: '0.74rem', padding: '6px 12px' }}
            >
              <User size={13} /> Exit to Player App
            </button>
          )}

          {/* Entrance QR Standee button */}
          <button className="btn btn-secondary btn-sm" onClick={onOpenQR} title="Club Registration QR Standee">
            <QrCode size={13} color="#ffffff" />
            <span style={{ display: 'inline' }}>Standee QR</span>
          </button>
        </div>
      </div>
    </header>
  );
};
