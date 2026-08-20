import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  DollarSign,
  LayoutDashboard,
  QrCode,
  Sparkles,
  ChevronDown,
  RotateCcw,
  User,
  Shield,
  CircleDot,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { UserRole } from '../../types';

interface NavbarProps {
  onOpenQR: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQR }) => {
  const {
    activeRole,
    setActiveRole,
    players,
    selectedPlayerId,
    setSelectedPlayerId,
    staffName,
    todayCheckIns,
    resetToDemoData,
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
    <header className="header-bar">
      <div className="header-inner">
        {/* Brand Logo */}
        <div className="logo-brand">
          <div className="logo-icon-wrap">
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>♠</span>
          </div>
          <div>
            <div className="logo-title">CLUB RE STRADDLE</div>
            <div className="logo-subtitle">Poker Lounge & Club OS</div>
          </div>
        </div>

        {/* 4 Portals Switcher */}
        <nav className="portal-switcher" aria-label="Portal Selection">
          <button
            className={`portal-tab-btn player-theme ${activeRole === 'player' ? 'active' : ''}`}
            onClick={() => setActiveRole('player')}
          >
            <User size={16} />
            <span>1. Player Portal</span>
          </button>

          <button
            className={`portal-tab-btn cashier-theme ${activeRole === 'cashier' ? 'active' : ''}`}
            onClick={() => setActiveRole('cashier')}
          >
            <DollarSign size={16} />
            <span>2. Cashier Portal</span>
          </button>

          <button
            className={`portal-tab-btn security-theme ${activeRole === 'security' ? 'active' : ''}`}
            onClick={() => setActiveRole('security')}
          >
            <ShieldCheck size={16} />
            <span>3. Security Portal</span>
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
            className={`portal-tab-btn admin-theme ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveRole('admin')}
          >
            <LayoutDashboard size={16} />
            <span>4. Admin Portal</span>
          </button>
        </nav>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* If in player portal, show active player selector */}
          {activeRole === 'player' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                className="form-select"
                style={{ padding: '6px 10px', fontSize: '0.78rem', width: 'auto', background: 'var(--bg-surface-elevated)' }}
                value={selectedPlayerId}
                onChange={e => setSelectedPlayerId(e.target.value)}
                aria-label="Switch Active Player"
              >
                <optgroup label="Select Demo Player:">
                  {players.map(p => (
                    <option key={p.id} value={p.id}>
                      👤 {p.fullName} ({p.membershipTier})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-surface)',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <CircleDot size={10} color="#ffffff" />
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{staffName}</span>
            </div>
          )}

          {/* Club QR Code button */}
          <button className="action-btn-pill" onClick={onOpenQR} title="Open Physical Entrance QR Code">
            <QrCode size={14} color="#ffffff" />
            <span>Club QR</span>
          </button>

          {/* Live Clock */}
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-dim)',
              padding: '6px 10px',
              background: 'rgba(0,0,0,0.2)',
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
