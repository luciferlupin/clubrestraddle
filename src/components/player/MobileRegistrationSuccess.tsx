import React from 'react';
import { CheckCircle2, ShieldCheck, QrCode, ArrowRight, UserCheck, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?portal=security&scan=${checkIn.id}&player=${player.id}`
    : `https://clubrestraddle.vercel.app/?portal=security&scan=${checkIn.id}&player=${player.id}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '12px 0' }}>
      {/* Success Animated Icon */}
      <div
        style={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.35), rgba(159, 18, 57, 0.5))',
          border: '2px solid #e11d48',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px var(--red-glow-strong)',
        }}
      >
        <CheckCircle2 size={38} color="#ffffff" />
      </div>

      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>
          KYC Registration Submitted!
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '4px' }}>
          Welcome to Club Re Straddle, <strong>{player.fullName}</strong>.
        </p>
      </div>

      {/* Real Door Pass QR Code Card */}
      <div
        style={{
          background: '#ffffff',
          padding: '14px',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          border: '3px solid #e11d48',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <QRCodeSVG
          value={verificationUrl}
          size={160}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="H"
        />
        <span style={{ color: '#0f172a', fontSize: '0.72rem', fontWeight: 800, marginTop: '8px', letterSpacing: '0.04em' }}>
          DOOR CLEARANCE QR PASS • {player.id}
        </span>
      </div>

      {/* Instant Check-In & Member Pass Info */}
      <div
        className="m-card"
        style={{
          width: '100%',
          border: '1px solid var(--border-red)',
          background: 'linear-gradient(135deg, #19070a 0%, #0d0305 100%)',
          textAlign: 'left',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Member ID</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff' }}>
              {player.id}
            </div>
          </div>
          <span className="badge badge-warning">
            <span className="badge-dot" /> Awaiting Clearance
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: '#cbd5e1' }}>Check-In Time:</span>
            <span style={{ color: '#ffffff', fontWeight: 700 }}>Today at {formatTimeOnly(checkIn.checkInTime)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <span style={{ color: '#cbd5e1' }}>Game Preference:</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{checkIn.tablePreference}</span>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 12px', borderRadius: '10px', fontSize: '0.78rem', color: '#cbd5e1', border: '1px solid var(--border-subtle)' }}>
          👉 <strong>Next Step:</strong> Present the QR code above to the door security officer for instant door clearance and entrance approval.
        </div>
      </div>

      <button className="m-btn m-btn-primary" onClick={onContinue} style={{ marginTop: '4px' }}>
        <span>View My Digital Pass & Floor Status</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
};
