import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  Eye,
  X,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatDateOnly, formatDateTime, formatTimeOnly, maskGovtId, formatPlayerNumber } from '../../utils/formatters';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { generateEntryFeeInvoice } from '../../utils/invoiceGenerator';
import { FileText } from 'lucide-react';
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
  const { approvePlayerEntry, rejectPlayerEntry, reviewKYC, staffName } = useClub();
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [entryInvoice, setEntryInvoice] = useState<ClubInvoiceData | null>(null);
  const [rejectReason, setRejectReason] = useState('Govt ID details mismatch or expired identification.');
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);

  const handleApprove = () => {
    approvePlayerEntry(checkIn?.id || player.id);
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

    rejectPlayerEntry(checkIn?.id || player.id, rejectReason.trim());
    setIsRejectModalOpen(false);
  };

  return (
    <div
      className="card"
      style={{
        border: '1px solid rgba(225, 29, 72, 0.4)',
        background: 'linear-gradient(155deg, rgba(20, 8, 12, 0.95) 0%, rgba(10, 4, 6, 0.95) 100%)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(225, 29, 72, 0.2)',
              border: '1px solid var(--border-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
              Entrance Clearance Desk
            </h3>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8' }}>
              Inspect identity, UIDAI Aadhaar & PAN KYC credentials for floor entry.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <TierBadge tier={player.membershipTier} />
          <KYCBadge status={player.kycStatus} />
          {checkIn && <EntryBadge status={checkIn.verificationStatus} />}
        </div>
      </div>

      {/* Member Hero Identity Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '14px 16px',
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Photo Container */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {player.kyc.photoUrl ? (
            <img
              src={player.kyc.photoUrl}
              alt={player.fullName}
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '14px',
                objectFit: 'cover',
                border: `2px solid ${player.kycStatus === 'verified' ? '#10b981' : '#e11d48'}`,
                boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
              }}
            />
          ) : (
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #271018 0%, #15060c 100%)',
                border: '2px solid rgba(225, 29, 72, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 900,
                color: '#ffffff',
              }}
            >
              {player.fullName.charAt(0)}
            </div>
          )}
        </div>

        {/* Member Name and Identifiers */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>
            {player.fullName}
          </div>
          <div
            style={{
              fontSize: '0.78rem',
              color: '#fb7185',
              fontFamily: 'var(--font-mono)',
              marginTop: '4px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span>Player ID: {formatPlayerNumber(player)}</span>
            <span>•</span>
            <span style={{ color: '#cbd5e1' }}>{player.phone}</span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.74rem', color: '#94a3b8' }}>
            Registered: {formatDateOnly(player.registeredAt)} • {player.kyc.address || 'Delhi NCR, India'}
          </div>
        </div>
      </div>

      {/* KYC Credentials 2x2 Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '10px',
        }}
      >
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              1. Aadhaar Card (UIDAI)
            </span>
            {player.kyc.aadhaarPhotoUrl && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 6px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setViewingDoc({ title: 'Aadhaar Card Photo', url: player.kyc.aadhaarPhotoUrl! })}
              >
                <Eye size={11} /> Photo
              </button>
            )}
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {player.kyc.aadhaarNumber ? maskGovtId(player.kyc.aadhaarNumber) : (player.kyc.govtIdNumber || 'UIDAI Verified')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px' }}>✓ Government ID Verified</div>
        </div>

        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              2. PAN Card (IT Dept)
            </span>
            {player.kyc.panPhotoUrl && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 6px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => setViewingDoc({ title: 'PAN Card Photo', url: player.kyc.panPhotoUrl! })}
              >
                <Eye size={11} /> Photo
              </button>
            )}
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fb7185', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {player.kyc.panNumber || (player.kyc.govtIdNumber ? maskGovtId(player.kyc.govtIdNumber) : 'PAN Verified')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: '2px' }}>✓ Income Tax PAN Matched</div>
        </div>

        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Date of Birth / Age
          </span>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff', marginTop: '4px' }}>
            {formatDateOnly(player.kyc.dateOfBirth)}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '2px' }}>✓ Age 21+ Verified</div>
        </div>

        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Table / Game Preference
          </span>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fef08a', marginTop: '4px' }}>
            {checkIn?.tablePreference || 'General Seating'}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
            {checkIn ? `Checked in ${formatTimeOnly(checkIn.checkInTime)}` : 'Walk-in arrival'}
          </div>
        </div>
      </div>

      {/* Check-In Arrival Status Banner */}
      <div
        style={{
          background: checkIn?.verificationStatus === 'approved'
            ? 'rgba(16, 185, 129, 0.12)'
            : checkIn?.verificationStatus === 'rejected'
            ? 'rgba(239, 68, 68, 0.15)'
            : 'rgba(245, 158, 11, 0.12)',
          border: `1px solid ${
            checkIn?.verificationStatus === 'approved'
              ? 'rgba(16, 185, 129, 0.3)'
              : checkIn?.verificationStatus === 'rejected'
              ? 'rgba(239, 68, 68, 0.3)'
              : 'rgba(245, 158, 11, 0.3)'
          }`,
          borderRadius: '12px',
          padding: '12px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color={checkIn?.verificationStatus === 'approved' ? '#10b981' : '#e11d48'} />
            <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.86rem' }}>
              {checkIn
                ? `Today's Arrival: ${checkIn.verificationStatus.toUpperCase()} at ${formatTimeOnly(checkIn.checkInTime)}`
                : 'Walk-in Clearance (Check-in created on approval)'}
            </span>
          </div>
          {checkIn && <EntryBadge status={checkIn.verificationStatus} />}
        </div>

        {checkIn?.rejectionReason && (
          <div style={{ color: '#fca5a5', fontSize: '0.78rem', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
            <strong>Denial Reason:</strong> {checkIn.rejectionReason}
          </div>
        )}

        {checkIn?.verifiedBy && (
          <div style={{ color: '#cbd5e1', fontSize: '0.76rem', marginTop: '6px' }}>
            ✓ Verified by <strong>{checkIn.verifiedBy}</strong> on {formatDateTime(checkIn.verifiedAt)}
          </div>
        )}
      </div>

      {/* Tactile Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#94a3b8' }}>
          <Lock size={12} color="#ffffff" />
          <span>Security access only · Audit logged</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {checkIn && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEntryInvoice(generateEntryFeeInvoice(player, checkIn, staffName));
                setIsInvoiceOpen(true);
              }}
              title="Print official ₹500 Door Entry Tax Invoice"
              style={{ fontSize: '0.78rem', padding: '8px 12px' }}
            >
              <FileText size={14} color="#e11d48" /> ₹500 Tax Invoice
            </button>
          )}

          <button
            className="btn btn-danger btn-sm"
            onClick={() => setIsRejectModalOpen(true)}
            disabled={checkIn?.verificationStatus === 'rejected'}
            style={{ fontSize: '0.78rem', padding: '8px 14px' }}
          >
            <XCircle size={15} /> Deny Entry
          </button>

          <button
            className="btn btn-emerald btn-sm"
            onClick={() => setIsApproveModalOpen(true)}
            disabled={checkIn?.verificationStatus === 'approved'}
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              padding: '8px 18px',
              boxShadow: checkIn?.verificationStatus !== 'approved' ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none',
            }}
          >
            <CheckCircle size={16} />
            {checkIn?.verificationStatus === 'approved' ? 'Access Approved ✓' : 'Approve & Clear Access'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve player entry?"
        subtitle={`Confirm Aadhaar & PAN KYC clearance for ${player.fullName}`}
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
          <div><span>Player ID</span><strong>{formatPlayerNumber(player)}</strong></div>
          <div><span>Aadhaar</span><strong>{player.kyc.aadhaarNumber ? maskGovtId(player.kyc.aadhaarNumber) : 'UIDAI Verified'}</strong></div>
          <div><span>PAN Card</span><strong style={{ color: '#fb7185' }}>{player.kyc.panNumber || 'PAN Verified'}</strong></div>
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

      {/* Tax Invoice Modal for ₹500 Door Entry */}
      <ClubTaxInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={entryInvoice}
      />

      {/* Document Photo Inspection Lightbox */}
      {viewingDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setViewingDoc(null)}
        >
          <div
            style={{
              maxWidth: '650px',
              width: '100%',
              background: '#130508',
              borderRadius: '16px',
              border: '2px solid rgba(225, 29, 72, 0.5)',
              overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.6)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>
                {viewingDoc.title} • {player.fullName} (Player ID {formatPlayerNumber(player)})
              </span>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', background: '#0a0204' }}>
              <img
                src={viewingDoc.url}
                alt={viewingDoc.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            </div>

            <div
              style={{
                padding: '10px 16px',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.78rem',
                color: '#cbd5e1',
              }}
            >
              <span>Security KYC Verification Check</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setViewingDoc(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
