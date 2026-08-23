import React, { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Clock3, QrCode, ShieldCheck, FileText, ShieldAlert, Eye } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Player, DailyCheckIn } from '../../types';
import { formatPlayerNumber, formatCurrency, formatTimeOnly } from '../../utils/formatters';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { generateEntryFeeInvoice } from '../../utils/invoiceGenerator';
import { useClub } from '../../context/ClubContext';

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
  const { staffName } = useClub();
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?portal=security&scan=${checkIn.id}&player=${player.id}`
    : `https://clubrestraddle.vercel.app/?portal=security&scan=${checkIn.id}&player=${player.id}`;

  const isApproved = checkIn.verificationStatus === 'approved';
  const isRejected = checkIn.verificationStatus === 'rejected';
  const entryInvoice: ClubInvoiceData | null = isApproved
    ? generateEntryFeeInvoice(player, checkIn, staffName || 'Club Front Desk')
    : null;

  return (
    <section className="registration-success-screen" aria-labelledby="registration-success-title">
      <header className="registration-success-heading">
        <span className="registration-success-icon" aria-hidden="true">
          {isRejected ? <ShieldAlert size={32} color="#f43f5e" /> : <CheckCircle2 size={32} />}
        </span>
        <span className="mobile-flow-eyebrow">KYC & Registration Complete</span>
        <h1 id="registration-success-title">
          {isApproved ? 'Your Player Pass & Gate Bill Are Ready' : isRejected ? 'Entry Not Approved' : 'Your Digital Player Pass Is Ready'}
        </h1>
        <p>
          {isApproved
            ? `Welcome, ${player.fullName}. Your door entry fee has been approved and digital pass is active.`
            : isRejected
            ? `Registration complete, but door access was not approved by security. No billing record generated.`
            : `Welcome, ${player.fullName}. Present your digital pass at the entrance for security verification.`}
        </p>
      </header>

      {/* Security Status Banner */}
      {!isApproved && !isRejected && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(180, 83, 9, 0.12) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '14px',
            padding: '14px 16px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 800, fontSize: '0.88rem' }}>
            <Clock3 size={18} />
            <span>Awaiting Door Security Approval</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: 0, lineHeight: 1.45 }}>
            Please present your QR code to the entrance security officer. Upon KYC verification and gate approval, your ₹500 entry fee will be processed and official tax invoice will be generated.
          </p>
        </div>
      )}

      {/* Official Entry Gate Fee Invoice Card (ONLY AFTER SECURITY APPROVAL) */}
      {isApproved && entryInvoice && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(24, 8, 12, 0.95) 0%, rgba(12, 4, 6, 0.98) 100%)',
            border: '1.5px solid rgba(225, 29, 72, 0.45)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#e11d48" />
              <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>Entry Gate Fee Tax Invoice</span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
              }}
            >
              ✓ Paid ₹500
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <span>Invoice No:</span>
            <strong style={{ color: 'var(--gold-light)', fontFamily: 'monospace' }}>{entryInvoice.invoiceNumber}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <span>Taxable Value (SAC 999691):</span>
            <span>{formatCurrency(entryInvoice.taxableAmount || 423.73)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1' }}>
            <span>GST @ 18% (CGST 9% + SGST 9%):</span>
            <span>{formatCurrency(Math.round(((entryInvoice.totalAmount || 500) - (entryInvoice.taxableAmount || 423.73)) * 100) / 100)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
            <span>Total Gate Entry Fee:</span>
            <span style={{ color: '#34d399' }}>{formatCurrency(entryInvoice.totalAmount || 500)}</span>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              border: 'none',
              color: '#ffffff',
              fontWeight: 800,
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
            onClick={() => setIsInvoiceModalOpen(true)}
          >
            <Eye size={15} /> View / Print Official Tax Invoice Bill
          </button>
        </div>
      )}

      {/* Digital Member QR Pass */}
      <div className="registration-pass-card">
        <div className="registration-pass-topline">
          <span><QrCode size={17} /> Door clearance pass</span>
          <span style={{ color: isApproved ? '#34d399' : isRejected ? '#f43f5e' : '#fbbf24', fontWeight: 700 }}>
            {isApproved ? '✓ Gate Approved' : isRejected ? '✕ Entry Denied' : '⏳ Awaiting Scan'}
          </span>
        </div>
        <div className="registration-pass-qr">
          <QRCodeSVG value={verificationUrl} size={190} bgColor="#ffffff" fgColor="#0f172a" level="H" />
        </div>
        <div className="registration-pass-identity">
          <div>
            <strong>{player.fullName}</strong>
            <span>Player ID {formatPlayerNumber(player)}</span>
          </div>
        </div>
      </div>

      <section className="registration-next-steps" aria-labelledby="registration-next-steps-title">
        <h2 id="registration-next-steps-title">What happens next</h2>
        <ol>
          <li>
            <span><ShieldCheck size={18} /></span>
            <div><strong>Show this QR at the entrance</strong><p>The security team will confirm your KYC and age status.</p></div>
          </li>
          <li>
            <span><Clock3 size={18} /></span>
            <div><strong>Wait for door clearance</strong><p>Upon approval, your entry fee payment is cleared and invoice issued.</p></div>
          </li>
          <li>
            <span><Check size={18} /></span>
            <div>
              <strong>Enjoy your visit</strong>
              <p>You checked in at {formatTimeOnly(checkIn.checkInTime)}.</p>
            </div>
          </li>
        </ol>
      </section>

      <button type="button" className="m-btn m-btn-primary registration-success-cta" onClick={onContinue}>
        Open my player home <ArrowRight size={18} />
      </button>

      {/* Club Tax Invoice Modal */}
      {entryInvoice && (
        <ClubTaxInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          invoice={entryInvoice}
        />
      )}
    </section>
  );
};
