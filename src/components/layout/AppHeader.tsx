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

  return (
    <header className="app-header">
      <div className="app-header-inner">
        {/* Brand */}
        <div className="brand-wrap" onClick={() => setActiveRole('player')}>
          <div className="brand-icon">♠</div>
          <div>
            <div className="brand-title">CLUB RE STRADDLE</div>
            <div className="brand-sub">Poker Lounge & OS</div>
          </div>
        </div>

        {/* Responsive Role Switcher Tabs */}
        <nav className="role-nav-tabs" aria-label="Portal Selection">
          <button
            className={`role-nav-tab player-tab ${activeRole === 'player' ? 'active' : ''}`}
            onClick={() => setActiveRole('player')}
          >
            <User size={15} />
            <span>Player</span>
          </button>

          <button
            className={`role-nav-tab cashier-tab ${activeRole === 'cashier' ? 'active' : ''}`}
            onClick={() => setActiveRole('cashier')}
          >
            <DollarSign size={15} />
            <span>Cashier</span>
            {!currentStaffUser && <Lock size={11} style={{ opacity: 0.6 }} />}
          </button>

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

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Active Player Selector or Staff Badge */}
          {activeRole === 'player' ? (
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
                aria-label="Switch Active Player"
              >
                <optgroup label="Select Member Profile:">
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      👤 {p.fullName} ({p.membershipTier})
                    </option>
                  ))}
                </optgroup>
              </select>
            ) : null
          ) : currentStaffUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.76rem',
                background: '#16090d',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid rgba(225, 29, 72, 0.4)',
              }}
            >
              <CircleDot size={9} color="#ffffff" />
              <span style={{ fontWeight: 600, color: '#ffffff' }}>{currentStaffUser.fullName}</span>
              <button
                onClick={logoutStaff}
                title="Sign out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveRole('admin')}
              style={{ color: '#fda4af', padding: '5px 10px' }}
            >
              <Lock size={12} /> Staff Login
            </button>
          )}

          {/* Entrance QR Standee button */}
          <button className="btn btn-secondary btn-sm" onClick={onOpenQR} title="Club Registration QR Standee">
            <QrCode size={13} color="#ffffff" />
            <span style={{ display: 'inline' }}>QR</span>
          </button>
        </div>
      </div>
    </header>
  );
};
