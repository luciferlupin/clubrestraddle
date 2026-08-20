import React from 'react';
import { ShieldCheck, Award, Calendar, QrCode, Sparkles } from 'lucide-react';
import { Player, DailyCheckIn } from '../../types';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import { formatDateOnly } from '../../utils/formatters';

interface PlayerPassProps {
  player: Player;
  todayCheckIn?: DailyCheckIn;
}

export const PlayerPass: React.FC<PlayerPassProps> = ({ player, todayCheckIn }) => {
  return (
    <div className="club-pass">
      <div className="pass-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem', color: '#f59e0b' }}>♠</span>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff' }}>
              CLUB SHOWDOWN
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              DIGITAL MEMBERSHIP PASS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TierBadge tier={player.membershipTier} />
        </div>
      </div>

      <div className="pass-user-info">
        {player.kyc.photoUrl ? (
          <img src={player.kyc.photoUrl} alt={player.fullName} className="pass-avatar" />
        ) : (
          <div className="pass-avatar-fallback">
            {player.fullName.charAt(0)}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {player.fullName}
          </div>
          <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--gold-light)', margin: '2px 0 6px' }}>
            ID: {player.id}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <KYCBadge status={player.kycStatus} />
            {todayCheckIn && <EntryBadge status={todayCheckIn.verificationStatus} />}
          </div>
        </div>
      </div>

      {/* Mini QR and Scan Details */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Security & Cashier Scan Code
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#f8fafc', fontWeight: 600 }}>
            {player.id} • {player.phone}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Total Club Visits: <strong>{player.totalVisits}</strong> • Joined: {formatDateOnly(player.registeredAt)}
          </span>
        </div>

        {/* Scaled Mini SVG QR */}
        <div
          style={{
            background: '#ffffff',
            padding: '4px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" fill="white" />
            <rect x="10" y="10" width="26" height="26" rx="4" fill="#0f172a" />
            <rect x="16" y="16" width="14" height="14" rx="2" fill="white" />
            <rect x="20" y="20" width="6" height="6" fill="#0f172a" />
            <rect x="64" y="10" width="26" height="26" rx="4" fill="#0f172a" />
            <rect x="70" y="16" width="14" height="14" rx="2" fill="white" />
            <rect x="74" y="20" width="6" height="6" fill="#0f172a" />
            <rect x="10" y="64" width="26" height="26" rx="4" fill="#0f172a" />
            <rect x="16" y="70" width="14" height="14" rx="2" fill="white" />
            <rect x="20" y="74" width="6" height="6" fill="#0f172a" />
            <rect x="42" y="14" width="12" height="12" fill="#f59e0b" />
            <rect x="45" y="45" width="18" height="18" rx="4" fill="#0f172a" />
            <rect x="68" y="68" width="18" height="18" fill="#0f172a" />
          </svg>
        </div>
      </div>
    </div>
  );
};
