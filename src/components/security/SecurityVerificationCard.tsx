import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatDateOnly, formatDateTime, formatTimeOnly, maskGovtId } from '../../utils/formatters';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import confetti from 'canvas-confetti';

const SESSION_TODAY = new Date();

interface SecurityVerificationCardProps {
  player: Player;
  checkIn?: DailyCheckIn;
}

export const SecurityVerificationCard: React.FC<SecurityVerificationCardProps> = ({
  player,
  checkIn,
}) => {
  const { approvePlayerEntry, rejectPlayerEntry, reviewKYC } = useClub();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Govt ID details mismatch or expired identification.');

  // Calculate age from DOB
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const diff = SESSION_TODAY.getTime() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = calculateAge(player.kyc.dateOfBirth);
  const isOfLegalAge = age >= 21;

  const handleApprove = () => {
    if (checkIn) {
      approvePlayerEntry(checkIn.id);
    } else if (player.kycStatus === 'pending') {
      reviewKYC(player.id, 'verified');
    }

    setIsApproveModalOpen(false);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#be123c'],
      });
    } catch {
      // Fallback
    }
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    if (checkIn) {
      rejectPlayerEntry(checkIn.id, rejectReason);
    } else {
      reviewKYC(player.id, 'rejected', rejectReason);
    }

    setIsRejectModalOpen(false);
  };

  return (
    <div className="card" style={{ border: '1px solid var(--border-gold)' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <ShieldCheck size={18} color="#e11d48" />
            Security Verification Desk
          </h3>
          <p className="card-subtitle">
            Verify identity, KYC credentials, age (21+), and daily check-in status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <TierBadge tier={player.membershipTier} />
          <KYCBadge status={player.kycStatus} />
          {checkIn && <EntryBadge status={checkIn.verificationStatus} />}
        </div>
      </div>

      {/* Main Verification Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Photo with Age Clearance Stamp */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          {player.kyc.photoUrl ? (
            <img
              src={player.kyc.photoUrl}
              alt={player.fullName}
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '12px',
                objectFit: 'cover',
                border: '2px solid var(--gold-light)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              }}
            />
          ) : (
            <div
              style={{
                width: '110px',
                height: '110px',
                borderRadius: '12px',
                background: 'var(--bg-surface-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'var(--gold-light)',
              }}
            >
              {player.fullName.charAt(0)}
            </div>
          )}

          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              background: isOfLegalAge ? 'rgba(139, 0, 0, 0.35)' : 'rgba(102, 0, 0, 0.6)',
              color: '#ffffff',
              border: `1px solid ${isOfLegalAge ? 'rgba(255, 255, 255, 0.4)' : 'rgba(139, 0, 0, 0.9)'}`,
            }}
          >
            {isOfLegalAge ? `AGE: ${age} (21+ OK)` : `AGE: ${age} (UNDERAGE!)`}
          </div>
        </div>

        {/* Player Details Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              {player.fullName}
            </div>
            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--gold-light)' }}>
              Member ID: {player.id} • Contact: {player.phone}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              background: 'rgba(0,0,0,0.25)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Govt ID Type & Number
              </span>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc', marginTop: '2px' }}>
                {player.kyc.govtIdType}: {maskGovtId(player.kyc.govtIdNumber)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Date of Birth
              </span>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f8fafc', marginTop: '2px' }}>
                {formatDateOnly(player.kyc.dateOfBirth)}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Registration Status
              </span>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#ffffff', marginTop: '2px' }}>
                ✓ Completed ({formatDateOnly(player.registeredAt)})
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Emergency Contact
              </span>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#cbd5e1', marginTop: '2px' }}>
                {player.kyc.emergencyContactName || 'N/A'} ({player.kyc.emergencyContactPhone || 'N/A'})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Check-In & Game Preference Status */}
      <div
        style={{
          background: 'var(--bg-surface-elevated)',
          padding: '14px 18px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Today's Daily Check-in Status
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              {checkIn ? (
                <>
                  <Clock size={16} color="#e11d48" />
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>
                    Checked In at {formatTimeOnly(checkIn.checkInTime)}
                  </span>
                  <span style={{ color: 'var(--text-dim)' }}>•</span>
                  <span style={{ color: '#ffffff' }}>
                    Table Preference: {checkIn.tablePreference || 'General Seating'}
                  </span>
                </>
              ) : (
                <span style={{ color: '#fca5a5', fontWeight: 600 }}>
                  ⚠ Player has not checked in for today yet
                </span>
              )}
            </div>
          </div>

          <div>
            {checkIn && <EntryBadge status={checkIn.verificationStatus} />}
          </div>
        </div>

        {checkIn?.rejectionReason && (
          <div style={{ color: '#fca5a5', fontSize: '0.8rem', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <strong>Rejection Reason:</strong> {checkIn.rejectionReason}
          </div>
        )}

        {checkIn?.verifiedBy && (
          <div style={{ color: '#ffffff', fontSize: '0.78rem', marginTop: '8px' }}>
            ✓ Verified by <strong>{checkIn.verifiedBy}</strong> on {formatDateTime(checkIn.verifiedAt)}
          </div>
        )}
      </div>

      {/* Verification Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          <Lock size={12} color="#ffffff" />
          <span>Security access only. No financial or buy-in data visible.</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="btn btn-danger"
            onClick={() => setIsRejectModalOpen(true)}
            disabled={checkIn?.verificationStatus === 'rejected'}
          >
            <XCircle size={16} /> Reject Entry / Deny
          </button>

          <button
            className="btn btn-emerald btn-lg"
            onClick={() => setIsApproveModalOpen(true)}
            disabled={checkIn?.verificationStatus === 'approved' || !isOfLegalAge}
          >
            <CheckCircle size={18} />
            {checkIn?.verificationStatus === 'approved' ? 'Entry Already Approved' : 'Approve Entry Access'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve player entry?"
        subtitle={`Confirm identity and 21+ clearance for ${player.fullName}`}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsApproveModalOpen(false)}>
              Review again
            </button>
            <button type="button" className="btn btn-emerald" onClick={handleApprove}>
              <CheckCircle size={16} /> Confirm entry
            </button>
          </>
        }
      >
        <div className="security-confirm-summary">
          <div><span>Member</span><strong>{player.fullName}</strong></div>
          <div><span>Member ID</span><strong>{player.id}</strong></div>
          <div><span>Age check</span><strong>{age} years · 21+ cleared</strong></div>
          <div><span>KYC status</span><strong>{player.kycStatus}</strong></div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Player Entry"
        subtitle={`Select or specify rejection reason for ${player.fullName}`}
        size="md"
      >
        <form onSubmit={handleRejectConfirm}>
          <div className="form-group">
            <label className="form-label" htmlFor="security-reject-reason">Predefined Reason</label>
            <select
              id="security-reject-reason"
              className="form-select"
              onChange={e => setRejectReason(e.target.value)}
              value={rejectReason}
            >
              <option value="Govt ID details mismatch or expired identification.">
                Govt ID details mismatch or expired identification
              </option>
              <option value="Under legal club age requirement (21+).">
                Under legal club age requirement (21+)
              </option>
              <option value="Self-exclusion list or house security suspension.">
                Self-exclusion list or house security suspension
              </option>
              <option value="Dress code or club conduct violation at entrance.">
                Dress code or club conduct violation at entrance
              </option>
              <option value="Suspicious documentation requiring police verification.">
                Suspicious documentation requiring police verification
              </option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="security-reject-notes">Custom Reason / Notes *</label>
            <textarea
              id="security-reject-notes"
              className="form-textarea"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              <ShieldAlert size={16} /> Confirm Entry Denial
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
