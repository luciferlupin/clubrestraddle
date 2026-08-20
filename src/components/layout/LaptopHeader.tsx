import React, { useState, useEffect } from 'react';
import {
  User,
  DollarSign,
  ShieldCheck,
  LayoutDashboard,
  QrCode,
  Smartphone,
  Laptop,
  CircleDot,
  LogOut,
  Lock,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';

interface LaptopHeaderProps {
  onOpenQR: () => void;
  viewMode: 'laptop' | 'mobile';
  onToggleViewMode: (mode: 'laptop' | 'mobile') => void;
}

export const LaptopHeader: React.FC<LaptopHeaderProps> = ({
  onOpenQR,
  viewMode,
  onToggleViewMode,
}) => {
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
          second: '2-digit',
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
    <header className="laptop-header">
      <div className="laptop-header-inner">
        {/* Brand Logo */}
        <div className="brand-wrap">
          <div className="brand-icon">♠</div>
          <div>
            <div className="brand-title">CLUB SHOWDOWN</div>
            <div className="brand-sub">Poker Lounge & Club OS</div>
          </div>
        </div>

        {/* 4 Portals Switcher Tabs */}
        <nav className="laptop-role-tabs" aria-label="Portal Selection">
          <button
            className={`laptop-role-tab player-tab ${activeRole === 'player' ? 'active' : ''}`}
            onClick={() => setActiveRole('player')}
          >
            <User size={16} />
            <span>1. Player Portal</span>
          </button>

          <button
            className={`laptop-role-tab cashier-tab ${activeRole === 'cashier' ? 'active' : ''}`}
            onClick={() => setActiveRole('cashier')}
          >
            <DollarSign size={16} />
            <span>2. Cashier Terminal</span>
            {!currentStaffUser && <Lock size={12} style={{ opacity: 0.6 }} />}
          </button>

          <button
            className={`laptop-role-tab security-tab ${activeRole === 'security' ? 'active' : ''}`}
            onClick={() => setActiveRole('security')}
          >
            <ShieldCheck size={16} />
            <span>3. Security Door</span>
            {!currentStaffUser && <Lock size={12} style={{ opacity: 0.6 }} />}
            {pendingSecurityCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  padding: '1px 6px',
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
            className={`laptop-role-tab admin-tab ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveRole('admin')}
          >
            <LayoutDashboard size={16} />
            <span>4. Admin Portal</span>
            {!currentStaffUser && <Lock size={12} style={{ opacity: 0.6 }} />}
          </button>
        </nav>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Laptop vs Mobile Preview Mode Toggle */}
          <div className="device-toggle-pill" title="Switch between Laptop Dashboard and Mobile View">
            <button
              className={`device-toggle-btn ${viewMode === 'laptop' ? 'active' : ''}`}
              onClick={() => onToggleViewMode('laptop')}
            >
              <Laptop size={13} />
              <span>Laptop</span>
            </button>
            <button
              className={`device-toggle-btn ${viewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => onToggleViewMode('mobile')}
            >
              <Smartphone size={13} />
              <span>Mobile</span>
            </button>
          </div>

          {/* Active Player Selector or Staff Badge */}
          {activeRole === 'player' ? (
            players.length > 0 ? (
              <select
                className="form-select"
                style={{ padding: '6px 10px', fontSize: '0.78rem', width: 'auto', background: 'var(--bg-surface-elevated)' }}
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
            ) : (
              <div
                style={{
                  fontSize: '0.75rem',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                👤 Guest / New Member
              </div>
            )
          ) : currentStaffUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                background: 'var(--bg-surface)',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <CircleDot size={10} color="#10b981" />
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentStaffUser.fullName}</span>
              <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--gold-light)' }}>
                ({currentStaffUser.role})
              </span>
              <button
                onClick={logoutStaff}
                title="Logout"
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
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveRole('admin')}
              style={{ color: '#c084fc' }}
            >
              <Lock size={12} /> Staff Login
            </button>
          )}

          {/* Entrance QR Standee button */}
          <button className="btn btn-secondary btn-sm" onClick={onOpenQR} title="Open Physical Entrance QR Standee">
            <QrCode size={14} color="#f59e0b" />
            <span>Club QR</span>
          </button>

          {/* Live Clock */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-dim)',
              padding: '6px 10px',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '6px',
            }}
          >
            {currentTime}
          </div>
        </div>
      </div>
    </header>
  );
};
