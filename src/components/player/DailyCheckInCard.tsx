import React, { useState } from 'react';
import { CheckCircle2, Clock, ShieldCheck, MapPin, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player } from '../../types';
import { formatDateOnly, formatTimeOnly } from '../../utils/formatters';
import { EntryBadge } from '../common/Badge';
import confetti from 'canvas-confetti';

interface DailyCheckInCardProps {
  player: Player;
}

export const DailyCheckInCard: React.FC<DailyCheckInCardProps> = ({ player }) => {
  const { hasPlayerCheckedInToday, performDailyCheckIn } = useClub();
  const [tablePref, setTablePref] = useState('NLH Cash Game ($2/$5)');
  const [checkingIn, setCheckingIn] = useState(false);

  const todayCheckIn = hasPlayerCheckedInToday(player.id);
  const isCheckedIn = !!todayCheckIn;

  const handleCheckIn = () => {
    setCheckingIn(true);
    setTimeout(() => {
      performDailyCheckIn(player.id, tablePref);
      setCheckingIn(false);
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#f59e0b', '#38bdf8'],
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
            <CheckCircle2 size={18} color="#10b981" />
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
                  ? 'rgba(16, 185, 129, 0.08)'
                  : todayCheckIn.verificationStatus === 'rejected'
                  ? 'rgba(239, 68, 68, 0.08)'
                  : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${
                todayCheckIn.verificationStatus === 'approved'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : todayCheckIn.verificationStatus === 'rejected'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(245, 158, 11, 0.3)'
              }`,
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#94a3b8" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Check-in Timestamp:</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-main)' }}>
                Today at {formatTimeOnly(todayCheckIn.checkInTime)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#94a3b8" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Table Preference:</span>
              </div>
              <span style={{ fontWeight: 600, color: 'var(--gold-light)' }}>
                {todayCheckIn.tablePreference || 'General Seating'}
              </span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '10px' }}>
              {todayCheckIn.verificationStatus === 'approved' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.86rem' }}>
                  <ShieldCheck size={18} />
                  <span>
                    <strong>Entry Approved</strong> by {todayCheckIn.verifiedBy || 'Security'}. Welcome to Club Showdown!
                  </span>
                </div>
              )}

              {todayCheckIn.verificationStatus === 'pending' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '0.86rem' }}>
                  <Clock size={18} />
                  <span>
                    <strong>Awaiting Security Clearance:</strong> Present your Digital Pass QR to the security officer at the door.
                  </span>
                </div>
              )}

              {todayCheckIn.verificationStatus === 'rejected' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '0.86rem' }}>
                  <ShieldAlert size={18} />
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

          <div className="form-group" style={{ marginBottom: '4px' }}>
            <label className="form-label">Select Preferred Game / Table Today:</label>
            <select
              className="form-select"
              value={tablePref}
              onChange={e => setTablePref(e.target.value)}
            >
              <option value="NLH Cash Game ($1/$3)">No-Limit Holdem ($1/$3 Cash)</option>
              <option value="NLH Cash Game ($2/$5)">No-Limit Holdem ($2/$5 Cash)</option>
              <option value="High Stakes NLH ($5/$10+)">High Stakes NLH ($5/$10+)</option>
              <option value="Pot-Limit Omaha (PLO)">Pot-Limit Omaha (PLO)</option>
              <option value="Showdown High Roller Tournament">Showdown High Roller Tournament</option>
              <option value="Midnight Turbo Bounty Tournament">Midnight Turbo Bounty Tournament</option>
            </select>
          </div>

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
