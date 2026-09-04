import React, { useState } from 'react';
import { Spade, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Player, DailyCheckIn } from '../../types';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import { formatDateOnly, formatTimeOnly, formatPlayerNumber } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { SuitWatermark, PassCornerPip, CardSuit } from '../common/PokerGraphics';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { generateEntryFeeInvoice } from '../../utils/invoiceGenerator';
import { buildPlayerVerificationUrl } from '../../utils/qrPass';

interface PlayerPassProps {
  player: Player;
  todayCheckIn?: DailyCheckIn;
}

export const PlayerPass: React.FC<PlayerPassProps> = ({ player, todayCheckIn }) => {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [entryInvoice, setEntryInvoice] = useState<ClubInvoiceData | null>(null);

  const verificationUrl = buildPlayerVerificationUrl(player, todayCheckIn);

  return (
    <>
      <div className="club-pass poker-pass-wrap">
        {/* Suit watermark background */}
        <SuitWatermark suit="spade" size={180} opacity={0.07} color="#ffffff" className="poker-pass-watermark" />
        {/* Corner pips — top-left */}
        <PassCornerPip rank="A" suit="spade" size={26} style={{ position: 'absolute', top: 10, left: 12 }} />
        {/* Corner pips — bottom-right (flipped) */}
        <PassCornerPip rank="A" suit="spade" size={26} flipped style={{ position: 'absolute', bottom: 10, right: 12 }} />

        <div className="pass-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/logo-transparent.png"
              alt="Club Re Straddle Logo"
              style={{ width: '32px', height: '32px', objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.08em', color: '#ffffff' }}>
                CLUB RE STRADDLE
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                DIGITAL MEMBERSHIP PASS
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CardSuit suit="heart" size={14} color="#e11d48" />
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
            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: '#ffffff', margin: '2px 0 6px', fontWeight: 600 }}>
              Player ID: {formatPlayerNumber(player)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <KYCBadge status={player.kycStatus} />
              {todayCheckIn && <EntryBadge status={todayCheckIn.verificationStatus} />}
            </div>
          </div>
        </div>

        {/* Mini QR and Scan Details */}
        <button
          type="button"
          className="pass-qr-trigger"
          onClick={() => setIsQRModalOpen(true)}
          style={{
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1.5px solid rgba(225, 29, 72, 0.45)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Click to expand QR Code for security scanning"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.72rem', color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800 }}>
              Door Scanner QR • Tap to Enlarge
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: '#ffffff', fontWeight: 700 }}>
              {formatPlayerNumber(player)} • {player.phone}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>
              {todayCheckIn ? (
                <>Status: <strong style={{ color: '#ffffff' }}>{todayCheckIn.verificationStatus.toUpperCase()}</strong> ({formatTimeOnly(todayCheckIn.checkInTime)})</>
              ) : (
                <>Visits: <strong style={{ color: '#ffffff' }}>{player.totalVisits}</strong> • Member since {formatDateOnly(player.registeredAt)}</>
              )}
            </span>
          </div>

          {/* Real Mini Scannable QR */}
          <div
            style={{
              background: '#ffffff',
              padding: '5px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <QRCodeSVG
              value={verificationUrl}
              size={48}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="M"
              includeMargin={true}
            />
          </div>
        </button>
      </div>

      {/* Expanded QR Modal for Security Door Check */}
      <Modal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        title="Door Clearance Pass QR"
        subtitle="Show this screen to the security officer at the entrance"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
          <div
            style={{
              background: '#ffffff',
              padding: '16px',
              borderRadius: '18px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              border: '3px solid #e11d48',
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <QRCodeSVG
              value={verificationUrl}
              size={200}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
              includeMargin={true}
            />
            <span style={{ color: '#0f172a', fontSize: '0.76rem', fontWeight: 800, marginTop: '10px', letterSpacing: '0.04em' }}>
              {formatPlayerNumber(player)} • {player.fullName}
            </span>
          </div>

          <div style={{ width: '100%', background: '#16080d', border: '1px solid rgba(225, 29, 72, 0.4)', borderRadius: '12px', padding: '12px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
              <span>Player Name:</span>
              <strong style={{ color: '#ffffff' }}>{player.fullName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px' }}>
              <span>Verification Status:</span>
              <strong style={{ color: todayCheckIn?.verificationStatus === 'approved' ? '#ffffff' : '#fb7185' }}>
                {todayCheckIn?.verificationStatus.toUpperCase() || 'NOT CHECKED IN'}
              </strong>
            </div>
          </div>

          <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: 0 }}>
            {todayCheckIn?.verificationStatus === 'approved'
              ? 'Your entrance pass is verified and ₹500 entry fee invoice (inclusive of 5% Service Charge) is active.'
              : todayCheckIn?.verificationStatus === 'rejected'
              ? 'Access was denied by door security. No gate billing entry or invoice has been generated.'
              : 'The security officer will scan this QR to verify Aadhaar & PAN credentials and grant door entrance.'}
          </p>

          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {todayCheckIn?.verificationStatus === 'approved' && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => {
                  setEntryInvoice(generateEntryFeeInvoice(player, todayCheckIn));
                  setIsInvoiceOpen(true);
                }}
              >
                <FileText size={15} color="#e11d48" />
                <span>₹500 Bill (5% Service Charge)</span>
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setIsQRModalOpen(false)} style={{ flex: 1 }}>
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* Tax Invoice Modal for ₹500 Door Entry */}
      <ClubTaxInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={entryInvoice}
      />
    </>
  );
};
