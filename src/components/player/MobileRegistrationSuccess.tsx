import React from 'react';
import { CheckCircle2, ShieldCheck, QrCode, ArrowRight, UserCheck } from 'lucide-react';
import { Player, DailyCheckIn } from '../../types';
import { formatDateOnly, formatTimeOnly } from '../../utils/formatters';

interface MobileRegistrationSuccessProps {
  player: Player;
  checkIn: DailyCheckIn;
  onContinue: () => void;
}

export const MobileRegistrationSuccess: React.FC<MobileRegistrationSuccessProps> = ({
  player,
  checkIn,
  onContinue,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
      {/* Success Animated Icon */}
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
          border: '2px solid #10b981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px rgba(16, 185, 129, 0.35)',
        }}
      >
        <CheckCircle2 size={40} color="#34d399" />
      </div>

      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
          Registration Submitted!
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Welcome to Club Showdown, <strong>{player.fullName}</strong>.
        </p>
      </div>

      {/* Instant Check-In & Member Pass Info */}
      <div
        className="m-card"
        style={{
          width: '100%',
          border: '1px solid var(--border-gold)',
          background: 'linear-gradient(135deg, #131a2a 0%, #0a0e17 100%)',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Member ID</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--gold-light)' }}>
              {player.id}
            </div>
          </div>
          <span className="badge badge-warning">
            <span className="badge-dot" /> KYC In Review
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Daily Check-In Status:</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>Today at {formatTimeOnly(checkIn.checkInTime)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Door Clearance:</span>
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>Awaiting Security</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Game Preference:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{checkIn.tablePreference}</span>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '10px', fontSize: '0.78rem', color: '#94a3b8' }}>
          👉 <strong>Next Step:</strong> Show your Digital Pass to the door security officer to approve your entry.
        </div>
      </div>

      <button className="m-btn m-btn-primary" onClick={onContinue} style={{ marginTop: '8px' }}>
        <span>View My Digital Pass & Dashboard</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
};
