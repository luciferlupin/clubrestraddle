import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle,
  XCircle,
  Lock,
  Eye,
  X,
  FileCheck2,
  FileX,
  Check,
  Image as ImageIcon,
  Printer,
  FileText,
  Copy,
  CreditCard,
  BadgeCheck,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn, PaymentMethod } from '../../types';
import { formatDateOnly, formatDateTime, formatTimeOnly, formatAadhaarNumber, formatPanNumber, formatPlayerNumber } from '../../utils/formatters';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { generateEntryFeeInvoice } from '../../utils/invoiceGenerator';
import confetti from 'canvas-confetti';

interface SecurityVerificationCardProps {
  player: Player;
  checkIn?: DailyCheckIn;
}

export const SecurityVerificationCard: React.FC<SecurityVerificationCardProps> = ({
  player,
  checkIn,
}) => {
  const { approvePlayerEntry, rejectPlayerEntry, reviewKYC, staffName, fetchPlayerKycDocs } = useClub();

  useEffect(() => {
    if (player?.id) {
      fetchPlayerKycDocs(player.id);
    }
  }, [player?.id, fetchPlayerKycDocs]);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectKycModalOpen, setIsRejectKycModalOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [entryInvoice, setEntryInvoice] = useState<ClubInvoiceData | null>(null);
  const [rejectReason, setRejectReason] = useState('Govt ID details mismatch or expired identification.');
  const [rejectKycReason, setRejectKycReason] = useState('Govt ID photo is unclear or name does not match Aadhaar/PAN record.');
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [entryPaymentMethod, setEntryPaymentMethod] = useState<PaymentMethod>('Cash');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    showToast(`Copied ${label}: ${text}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanAadhaar = formatAadhaarNumber(player.kyc.aadhaarNumber, player.kyc.govtIdNumber);
  const cleanPan = formatPanNumber(player.kyc.panNumber, player.kyc.govtIdNumber);

  const [printBillOnApproval, setPrintBillOnApproval] = useState(false);

  const handleApproveEntry = (shouldPrint = printBillOnApproval) => {
    approvePlayerEntry(checkIn?.id || player.id, entryPaymentMethod);
    setIsApproveModalOpen(false);
    showToast(`Entry cleared for ${player.fullName} (${entryPaymentMethod})!`);

    if (shouldPrint) {
      setEntryInvoice(generateEntryFeeInvoice(player, checkIn, staffName));
      setIsInvoiceOpen(true);
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#be123c', '#10b981'],
      });
    } catch {
      // Fallback
    }
  };

  const handleVerifyKYC = () => {
    reviewKYC(player.id, 'verified');
    showToast(`Aadhaar & PAN KYC verified for ${player.fullName}!`);
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#ffffff'],
      });
    } catch {}
  };

  const handleVerifyKycAndApproveEntry = (shouldPrint = printBillOnApproval) => {
    reviewKYC(player.id, 'verified');
    approvePlayerEntry(checkIn?.id || player.id, entryPaymentMethod);
    setIsApproveModalOpen(false);
    showToast(`KYC Verified & Entry Approved for ${player.fullName} (${entryPaymentMethod})!`);

    if (shouldPrint) {
      setEntryInvoice(generateEntryFeeInvoice(player, checkIn, staffName));
      setIsInvoiceOpen(true);
    }

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#ffffff', '#34d399', '#e11d48'],
      });
    } catch {}
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    rejectPlayerEntry(checkIn?.id || player.id, rejectReason.trim());
    setIsRejectModalOpen(false);
    showToast(`Entry denied for ${player.fullName}`);
  };

  const handleRejectKycConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectKycReason.trim()) return;

    reviewKYC(player.id, 'rejected', rejectKycReason.trim());
    setIsRejectKycModalOpen(false);
    showToast(`KYC rejected for ${player.fullName}`);
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
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={18} /> {toastMessage}
        </div>
      )}

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
              Entrance Clearance & KYC Desk
            </h3>
            <p style={{ margin: 0, fontSize: '0.76rem', color: '#94a3b8' }}>
              Inspect identity, UIDAI Aadhaar & PAN credentials, verify KYC & approve floor entry.
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

      {/* KYC Documents & Credentials Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Aadhaar Card Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 10, 14, 0.9) 0%, rgba(10, 5, 8, 0.95) 100%)',
            padding: '14px 16px',
            borderRadius: '14px',
            border: '1.5px solid rgba(225, 29, 72, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#fda4af', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CreditCard size={14} color="#e11d48" /> 1. Aadhaar Card (UIDAI)
            </span>
            <span style={{ fontSize: '0.66rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
              12 Digits
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              {cleanAadhaar || 'Aadhaar On File'}
            </div>
            {cleanAadhaar && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 6px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                onClick={() => handleCopy(cleanAadhaar, 'Aadhaar ID')}
                title="Copy Aadhaar Number"
              >
                {copiedField === 'Aadhaar ID' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              </button>
            )}
          </div>

          {/* Attached Document Buttons */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            {player.kyc.aadhaarPhotoUrl ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, padding: '5px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'rgba(225,29,72,0.15)', borderColor: 'rgba(225,29,72,0.45)', color: '#ffffff', fontWeight: 700 }}
                onClick={() => setViewingDoc({ title: `Aadhaar Front Photo - ${player.fullName}`, url: player.kyc.aadhaarPhotoUrl! })}
              >
                <Eye size={12} color="#fb7185" /> Front Photo
              </button>
            ) : (
              <div style={{ flex: 1, padding: '5px 8px', fontSize: '0.7rem', color: '#fca5a5', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
                No Front
              </div>
            )}
            {player.kyc.aadhaarBackPhotoUrl ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, padding: '5px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'rgba(225,29,72,0.15)', borderColor: 'rgba(225,29,72,0.45)', color: '#ffffff', fontWeight: 700 }}
                onClick={() => setViewingDoc({ title: `Aadhaar Back Photo - ${player.fullName}`, url: player.kyc.aadhaarBackPhotoUrl! })}
              >
                <Eye size={12} color="#fb7185" /> Back Photo
              </button>
            ) : (
              <div style={{ flex: 1, padding: '5px 8px', fontSize: '0.7rem', color: '#fca5a5', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
                No Back
              </div>
            )}
          </div>
        </div>

        {/* PAN Card Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 10, 14, 0.9) 0%, rgba(10, 5, 8, 0.95) 100%)',
            padding: '14px 16px',
            borderRadius: '14px',
            border: '1.5px solid rgba(56, 189, 248, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.74rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <BadgeCheck size={14} color="#38bdf8" /> 2. PAN Card (IT Dept)
            </span>
            <span style={{ fontSize: '0.66rem', color: '#cbd5e1', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
              10 Chars
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              {cleanPan || 'PAN On File'}
            </div>
            {cleanPan && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '3px 6px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                onClick={() => handleCopy(cleanPan, 'PAN ID')}
                title="Copy PAN Number"
              >
                {copiedField === 'PAN ID' ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
              </button>
            )}
          </div>

          {/* Attached PAN Document Button */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            {player.kyc.panPhotoUrl ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, padding: '5px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.45)', color: '#ffffff', fontWeight: 700 }}
                onClick={() => setViewingDoc({ title: `PAN Card Photo - ${player.fullName}`, url: player.kyc.panPhotoUrl! })}
              >
                <Eye size={12} color="#38bdf8" /> View PAN Photo
              </button>
            ) : (
              <div style={{ flex: 1, padding: '5px 8px', fontSize: '0.7rem', color: '#fca5a5', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
                No PAN Photo
              </div>
            )}
          </div>
        </div>

        {/* DOB / Age Verification */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 10, 14, 0.9) 0%, rgba(10, 5, 8, 0.95) 100%)',
            padding: '14px 16px',
            borderRadius: '14px',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          <span style={{ fontSize: '0.74rem', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800 }}>
            Date of Birth / Age
          </span>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#ffffff' }}>
              {formatDateOnly(player.kyc.dateOfBirth)}
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <CheckCircle size={13} /> 21+ Age Verified & Cleared
          </div>
        </div>
      </div>

      {/* KYC Clearance Panel with Security Controls */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 15, 20, 0.8) 0%, rgba(15, 8, 12, 0.9) 100%)',
          border: '1.5px solid rgba(225, 29, 72, 0.35)',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: player.kycStatus === 'verified' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              color: player.kycStatus === 'verified' ? '#34d399' : '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileCheck2 size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Aadhaar & PAN Member KYC:</span>
              <KYCBadge status={player.kycStatus} />
            </div>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
              {player.kycStatus === 'verified'
                ? `Verified by ${player.kyc.verifiedBy || 'Security'} on ${formatDateTime(player.kyc.verifiedAt || player.registeredAt)}`
                : player.kycStatus === 'rejected'
                ? `Rejected: ${player.kyc.rejectionReason || 'Details mismatch'}`
                : 'Credentials pending security officer approval.'}
            </div>
          </div>
        </div>

        {/* KYC Action Buttons for Security */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {player.kycStatus !== 'verified' ? (
            <button
              type="button"
              className="btn btn-success btn-sm"
              onClick={handleVerifyKYC}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', fontWeight: 800, padding: '6px 14px' }}
            >
              <Check size={14} /> Verify KYC
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => reviewKYC(player.id, 'pending')}
              style={{ fontSize: '0.74rem', padding: '6px 10px' }}
              title="Reset to Pending"
            >
              Reset KYC
            </button>
          )}

          {player.kycStatus !== 'rejected' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '6px 12px' }}
              onClick={() => setIsRejectKycModalOpen(true)}
            >
              <FileX size={14} /> Reject KYC
            </button>
          )}
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
                ? `Daily Entrance: ${checkIn.verificationStatus.toUpperCase()} at ${formatTimeOnly(checkIn.checkInTime)}`
                : 'Walk-in Entrance (Daily arrival created on approval)'}
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
            ✓ Entry verified by <strong>{checkIn.verifiedBy}</strong> on {formatDateTime(checkIn.verifiedAt)}
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
          <span>Security officer access only · Realtime Audit Logged</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {checkIn?.verificationStatus === 'approved' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setEntryInvoice(generateEntryFeeInvoice(player, checkIn, staffName));
                setIsInvoiceOpen(true);
              }}
              title="Print official ₹500 Door Entry Tax Invoice Bill for Player"
              style={{
                fontSize: '0.8rem',
                padding: '8px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(225, 29, 72, 0.15)',
                borderColor: 'rgba(225, 29, 72, 0.45)',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              <Printer size={14} color="#fb7185" />
              <span>Print / View Bill (₹500 · 5% Service Charge)</span>
            </button>
          )}

          {/* Payment Method Selector for Door Fee */}
          {checkIn?.verificationStatus !== 'approved' && (
            <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                type="button"
                className={`btn btn-sm ${entryPaymentMethod === 'Cash' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px' }}
                onClick={() => setEntryPaymentMethod('Cash')}
                title="Cash collected in Gate Till Drawer"
              >
                💵 Cash (Gate Till)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${entryPaymentMethod === 'UPI/Digital' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px', color: entryPaymentMethod === 'UPI/Digital' ? undefined : '#38bdf8' }}
                onClick={() => setEntryPaymentMethod('UPI/Digital')}
                title="UPI directly to Common Club Bank Account"
              >
                📱 UPI (Common Bank)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${entryPaymentMethod === 'Bank Transfer' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.72rem', padding: '4px 8px', borderRadius: '6px', color: entryPaymentMethod === 'Bank Transfer' ? undefined : '#c084fc' }}
                onClick={() => setEntryPaymentMethod('Bank Transfer')}
                title="Bank wire directly to Common Club Bank Account"
              >
                🏦 Bank (Common Bank)
              </button>
            </div>
          )}

          <button
            className="btn btn-danger btn-sm"
            onClick={() => setIsRejectModalOpen(true)}
            disabled={checkIn?.verificationStatus === 'rejected'}
            style={{ fontSize: '0.78rem', padding: '8px 14px' }}
          >
            <XCircle size={15} /> Deny Entry
          </button>

          {player.kycStatus === 'pending' && (
            <button
              type="button"
              className="btn btn-emerald btn-sm"
              onClick={() => setIsApproveModalOpen(true)}
              style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                padding: '8px 18px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
              }}
            >
              <CheckCircle size={16} /> Verify KYC & Clear Entry
            </button>
          )}

          {player.kycStatus === 'verified' && (
            <button
              type="button"
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
          )}
        </div>
      </div>

      {/* Modal: Document Lightbox Zoom */}
      {viewingDoc && (
        <Modal
          isOpen={true}
          onClose={() => setViewingDoc(null)}
          title={viewingDoc.title}
          subtitle={`Member: ${player.fullName} (${formatPlayerNumber(player)})`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '100%', maxHeight: '65vh', overflow: 'auto', textAlign: 'center', background: '#000', borderRadius: '12px', padding: '10px' }}>
              <img
                src={viewingDoc.url}
                alt={viewingDoc.title}
                style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>High-Resolution Document Preview</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setViewingDoc(null)}>
                  Close
                </button>
                {player.kycStatus !== 'verified' && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      handleVerifyKYC();
                      setViewingDoc(null);
                    }}
                  >
                    <Check size={15} /> Verify KYC
                  </button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Approve Entry */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Approve player entry?"
        subtitle={`Confirm Aadhaar & PAN KYC clearance for ${player.fullName}`}
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsApproveModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-emerald"
              onClick={() => handleApproveEntry(false)}
              title="Grant entry without opening printable bill"
            >
              <CheckCircle size={16} /> Approve (No Bill)
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #e11d48, #be123c)', borderColor: '#fda4af' }}
              onClick={() => handleApproveEntry(true)}
              title="Grant entry and immediately open printable ₹500 gate tax invoice bill"
            >
              <Printer size={15} /> Approve & Print Bill
            </button>
          </div>
        }
      >
        <div className="security-confirm-summary">
          <div><span>Member</span><strong>{player.fullName}</strong></div>
          <div><span>Player ID</span><strong>{formatPlayerNumber(player)}</strong></div>
          <div><span>Aadhaar</span><strong style={{ fontFamily: 'var(--font-mono)' }}>{formatAadhaarNumber(player.kyc.aadhaarNumber, player.kyc.govtIdNumber) || 'UIDAI Verified'}</strong></div>
          <div><span>PAN Card</span><strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{formatPanNumber(player.kyc.panNumber, player.kyc.govtIdNumber) || 'PAN Verified'}</strong></div>
          <div><span>KYC status</span><strong>{player.kycStatus}</strong></div>
          <div><span>Door Fee</span><strong>₹500 ({entryPaymentMethod})</strong></div>
        </div>

        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(225, 29, 72, 0.08)', borderRadius: '10px', border: '1px solid rgba(225, 29, 72, 0.25)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#f1f5f9', cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={printBillOnApproval}
              onChange={(e) => setPrintBillOnApproval(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#e11d48', cursor: 'pointer' }}
            />
            <span>Auto-open printable Tax Invoice Bill (₹500 · 5% Service Charge)</span>
          </label>
        </div>
      </Modal>

      {/* Modal: Reject Entry */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Deny Player Floor Entry"
        subtitle={`Select or specify reason for ${player.fullName}`}
        size="md"
      >
        <form onSubmit={handleRejectConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="security-reject-reason">Predefined Reason</label>
            <select
              id="security-reject-reason"
              className="form-select"
              onChange={e => setRejectReason(e.target.value)}
              value={rejectReason}
            >
              <option value="Govt ID details mismatch or expired identification.">Govt ID details mismatch or expired identification</option>
              <option value="Dress code violation (club rules).">Dress code violation (club rules)</option>
              <option value="Under 21 age restriction policy.">Under 21 age restriction policy</option>
              <option value="Club management restriction / blacklisted.">Club management restriction / blacklisted</option>
              <option value="Other / Security discretion.">Other / Security discretion</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Notes</label>
            <textarea
              className="form-input"
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Provide specific notes regarding entry denial..."
              required
            />
          </div>

          <div className="modal-footer" style={{ margin: '14px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRejectModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              <XCircle size={16} /> Confirm Denial
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reject KYC */}
      <Modal
        isOpen={isRejectKycModalOpen}
        onClose={() => setIsRejectKycModalOpen(false)}
        title="Reject Member KYC Documents"
        subtitle={`Specify why KYC is being rejected for ${player.fullName}`}
        size="md"
      >
        <form onSubmit={handleRejectKycConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Rejection Reason *</label>
            <select
              className="form-select"
              onChange={e => setRejectKycReason(e.target.value)}
              value={rejectKycReason}
            >
              <option value="Govt ID photo is unclear or blurred.">Govt ID photo is unclear or blurred</option>
              <option value="Aadhaar back photo is missing or unreadable.">Aadhaar back photo is missing or unreadable</option>
              <option value="Name on ID does not match registration details.">Name on ID does not match registration details</option>
              <option value="Invalid or mismatched PAN card.">Invalid or mismatched PAN card</option>
              <option value="Suspected fraudulent or duplicate document.">Suspected fraudulent or duplicate document</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Additional Officer Notes</label>
            <textarea
              className="form-input"
              rows={3}
              value={rejectKycReason}
              onChange={e => setRejectKycReason(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer" style={{ margin: '14px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRejectKycModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              <FileX size={16} /> Confirm KYC Rejection
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
      <ClubTaxInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={entryInvoice}
      />
    </div>
  );
};
