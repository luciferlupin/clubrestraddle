import React, { useState } from 'react';
import { CheckCircle2, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { buildPlayerVerificationUrl } from '../../utils/qrPass';
import { useClub } from '../../context/ClubContext';
import { Player } from '../../types';
import { formatTimeOnly } from '../../utils/formatters';
import { EntryBadge } from '../common/Badge';
import confetti from 'canvas-confetti';

interface DailyCheckInCardProps {
  player: Player;
}

export const DailyCheckInCard: React.FC<DailyCheckInCardProps> = ({ player }) => {
  const { hasPlayerCheckedInToday, performDailyCheckIn } = useClub();
  const [checkingIn, setCheckingIn] = useState(false);

  const todayCheckIn = hasPlayerCheckedInToday(player.id);
  const isCheckedIn = !!todayCheckIn;

  const handleCheckIn = () => {
    setCheckingIn(true);
    setTimeout(() => {
      performDailyCheckIn(player.id);
      setCheckingIn(false);
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#e11d48', '#ffffff', '#f43f5e', '#ffffff', '#be123c'],
        });
      } catch {
        // Safe fallback
      }
    }, 300);
  };

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <CheckCircle2 size={18} color="#e11d48" />
            Daily Club Check-In
          </h3>
          <p className="card-subtitle">
            Rule: Registered players only require daily check-in (No new KYC needed).
          </p>
        </div>
        <div>
          {isCheckedIn ? (
            <EntryBadge status={todayCheckIn.verificationStatus} />
          ) : (
            <span className="badge badge-warning">
              <span className="badge-dot" /> Not Checked In Today
            </span>
          )}
        </div>
      </div>

      {isCheckedIn ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background:
                todayCheckIn.verificationStatus === 'approved'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : todayCheckIn.verificationStatus === 'rejected'
                  ? 'rgba(159, 18, 57, 0.2)'
                  : 'rgba(225, 29, 72, 0.12)',
              border: `1px solid ${
                todayCheckIn.verificationStatus === 'approved'
                  ? 'rgba(255, 255, 255, 0.4)'
                  : todayCheckIn.verificationStatus === 'rejected'
                  ? 'rgba(225, 29, 72, 0.5)'
                  : 'rgba(225, 29, 72, 0.4)'
              }`,
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#cbd5e1" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Check-in Timestamp:</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                Today at {formatTimeOnly(todayCheckIn.checkInTime)}
              </span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px', marginTop: '10px' }}>
              {todayCheckIn.verificationStatus === 'approved' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '0.86rem' }}>
                  <ShieldCheck size={18} color="#ffffff" />
                  <span>
                    <strong>Entry Approved</strong> by {todayCheckIn.verifiedBy || 'Security'}. Welcome to Club Re Straddle!
                  </span>
                </div>
              )}

              {todayCheckIn.verificationStatus === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', padding: '6px 0' }}>
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '12px',
                      borderRadius: '14px',
                      border: '3px solid #e11d48',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <QRCodeSVG
                      value={buildPlayerVerificationUrl(player, todayCheckIn)}
                      size={140}
                      bgColor="#ffffff"
                      fgColor="#0f172a"
                      level="H"
                      includeMargin={true}
                    />
                    <span style={{ color: '#0f172a', fontSize: '0.68rem', fontWeight: 800, marginTop: '6px', letterSpacing: '0.04em' }}>
                      DOOR CLEARANCE QR PASS
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontSize: '0.82rem' }}>
                    <Clock size={16} color="#e11d48" />
                    <span>
                      <strong>Awaiting Security Clearance:</strong> Hold this QR code in front of the door officer's scanner.
                    </span>
                  </div>
                </div>
              )}

              {todayCheckIn.verificationStatus === 'rejected' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontSize: '0.86rem' }}>
                  <ShieldAlert size={18} color="#ef4444" />
                  <span>
                    <strong>Entry Denied:</strong> {todayCheckIn.rejectionReason || 'Security clearance rejected.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Welcome back, <strong>{player.fullName}</strong>! Since your KYC registration is on file, simply submit your daily check-in to enter the club floor today.
          </p>

          <button
            className="btn btn-emerald btn-lg"
            onClick={handleCheckIn}
            disabled={checkingIn}
            style={{ width: '100%' }}
          >
            <CheckCircle2 size={18} />
            {checkingIn ? 'Checking In...' : 'Complete Today\'s Daily Check-in'}
          </button>
        </div>
      )}
    </div>
  );
};
