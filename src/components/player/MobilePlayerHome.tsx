import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  QrCode,
  ReceiptText,
  ShieldAlert,
  Trophy,
  UserRound,
  FileText,
  Eye,
  X,
  LogOut,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { DailyCheckIn, Player, Tournament, TournamentEntry } from '../../types';
import { formatClubLabel, formatCurrency, formatDateTime, formatShortDateTime, formatTimeOnly, formatPlayerNumber } from '../../utils/formatters';
import { EntryBadge, KYCBadge, TierBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { GameTypeBadge, SuitWatermark, PokerChipStack, CardSuit } from '../common/PokerGraphics';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { generateEntryFeeInvoice } from '../../utils/invoiceGenerator';
import { PlayerWalletView } from './PlayerWalletView';
import { useClub } from '../../context/ClubContext';

interface MobilePlayerHomeProps {
  player: Player;
  todayCheckIn?: DailyCheckIn;
  tournaments: Tournament[];
  entries: TournamentEntry[];
  checkingIn: boolean;
  isPassOpen: boolean;
  onCheckIn: () => void;
  onOpenVisits: () => void;
  onOpenProfile: () => void;
  onOpenPass: () => void;
  onClosePass: () => void;
  onLogout?: () => void;
}

export const MobilePlayerHome: React.FC<MobilePlayerHomeProps> = ({
  player,
  todayCheckIn,
  tournaments,
  entries,
  checkingIn,
  isPassOpen,
  onCheckIn,
  onOpenVisits,
  onOpenProfile,
  onOpenPass,
  onClosePass,
  onLogout,
}) => {
  const { staffName } = useClub();
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const isCheckedIn = Boolean(todayCheckIn);
  const verificationStatus = todayCheckIn?.verificationStatus;
  const playerEntries = entries.filter((entry) => entry.playerId === player.id);
  const walletBalance = player.walletBalance ?? 0;

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?portal=security&scan=${todayCheckIn?.id || player.id}&player=${player.id}`
    : `https://clubrestraddle.vercel.app/?portal=security&scan=${todayCheckIn?.id || player.id}&player=${player.id}`;

  const statusTitle = !isCheckedIn
    ? 'Ready for today’s visit?'
    : verificationStatus === 'approved'
      ? 'You’re cleared for entry'
      : verificationStatus === 'rejected'
        ? 'Your entry needs attention'
        : 'Security check in progress';

  const statusDescription = !isCheckedIn
    ? 'Check in before heading to the door.'
    : verificationStatus === 'approved'
      ? 'Show your pass at the entrance or cashier whenever asked.'
      : verificationStatus === 'rejected'
        ? todayCheckIn?.rejectionReason || 'Please speak with the security desk for help.'
        : 'Keep your pass ready for the security team to scan.';

  return (
    <div className="player-home-screen">
      <header className="player-home-greeting" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Ghost suit watermark behind greeting */}
        <SuitWatermark suit="spade" size={110} opacity={0.05} color="#ffffff"
          style={{ position: 'absolute', right: 48, top: -16, pointerEvents: 'none' }} />
        <div>
          <span className="mobile-flow-eyebrow">Welcome back</span>
          <h1>{player.fullName.split(' ')[0]}</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CardSuit suit="heart" size={12} color="#e11d48" />
            {player.membershipTier} member · {player.totalVisits} club visits
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onLogout && (
            <button
              type="button"
              className="mobile-icon-button"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(225, 29, 72, 0.12)',
                border: '1px solid rgba(225, 29, 72, 0.35)',
                color: '#fda4af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={onLogout}
              aria-label="Log out of pass"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          )}
          <button type="button" className="player-avatar-button" onClick={onOpenProfile} aria-label="Open my profile">
            {player.kyc.photoUrl ? (
              <img src={player.kyc.photoUrl} alt="" />
            ) : (
              <span>{player.fullName.charAt(0)}</span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Player Wallet Card */}
      <section
        style={{
          background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.9) 0%, rgba(15, 8, 4, 0.98) 100%)',
          border: '1.5px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--gold-light)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Wallet size={13} /> Vault Wallet & Prizes
          </span>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '2px' }}>
            {formatCurrency(walletBalance)}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Winnings, buy-ins & instant cashouts
          </span>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{
            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
            fontSize: '0.78rem',
            padding: '7px 12px',
            fontWeight: 700,
          }}
          onClick={() => setIsWalletOpen(true)}
        >
          Manage Wallet
        </button>
      </section>

      <section className={`player-status-card ${verificationStatus || 'not-checked-in'}`} aria-labelledby="player-status-title">
        <div className="player-status-heading">
          <span className="player-status-icon" aria-hidden="true">
            {verificationStatus === 'rejected' ? <ShieldAlert size={24} /> : verificationStatus === 'approved' ? <CheckCircle2 size={24} /> : <Clock3 size={24} />}
          </span>
          <div>
            <span className="player-status-kicker">Today’s entry</span>
            <h2 id="player-status-title">{statusTitle}</h2>
            <p>{statusDescription}</p>
          </div>
        </div>

        {isCheckedIn ? (
          <>
            <button type="button" className="player-pass-preview" onClick={onOpenPass} aria-label="Open my full entrance pass">
              <span className="player-pass-copy">
                <span className="player-pass-label"><CreditCard size={15} /> Digital member pass</span>
                <strong>{player.fullName}</strong>
                <small>Player ID {formatPlayerNumber(player)} · Checked in {formatTimeOnly(todayCheckIn?.checkInTime)}</small>
                <span className="player-pass-action">Tap to enlarge <ArrowRight size={15} /></span>
              </span>
              <span className="player-pass-qr" aria-hidden="true">
                <QRCodeSVG value={verificationUrl} size={72} bgColor="#ffffff" fgColor="#0f172a" level="M" />
              </span>
            </button>

            {todayCheckIn?.verificationStatus === 'approved' ? (
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(225, 29, 72, 0.1)', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: '10px', padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#ffffff' }}>
                  <FileText size={14} color="#e11d48" />
                  <span>Gate Entry Fee: <strong style={{ color: '#34d399' }}>₹500 Paid (incl. 5% Service Charge)</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsInvoiceOpen(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  <Eye size={12} /> View Bill
                </button>
              </div>
            ) : todayCheckIn?.verificationStatus === 'rejected' ? (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.76rem', color: '#fca5a5' }}>
                <span>✕ Entry Denied by Security • No entrance bill issued</span>
              </div>
            ) : todayCheckIn ? (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '8px 12px', fontSize: '0.76rem', color: '#fcd34d' }}>
                <span>⏳ Awaiting Security Approval • Bill will generate upon door clearance</span>
              </div>
            ) : null}
          </>
        ) : (
          <div className="player-checkin-form">
            <button type="button" className="m-btn m-btn-primary" onClick={onCheckIn} disabled={checkingIn} style={{ width: '100%' }}>
              <CheckCircle2 size={19} /> {checkingIn ? 'Checking you in…' : 'Check in now'}
            </button>
          </div>
        )}

        {todayCheckIn && <div className="player-status-meta"><EntryBadge status={todayCheckIn.verificationStatus} /></div>}
      </section>

      {/* Entry Fee Invoice Modal (Only if approved) */}
      {todayCheckIn?.verificationStatus === 'approved' && (
        <ClubTaxInvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          invoice={generateEntryFeeInvoice(player, todayCheckIn, staffName || 'Club Front Desk')}
        />
      )}

      <section aria-labelledby="player-actions-title">
        <div className="player-section-heading">
          <div>
            <span className="mobile-flow-eyebrow">Quick actions</span>
            <h2 id="player-actions-title">What do you need?</h2>
          </div>
        </div>
        <div className="player-action-grid">
          <button type="button" onClick={() => setIsWalletOpen(true)}>
            <span className="player-action-icon" style={{ color: '#fbbf24' }}><Wallet size={22} /></span>
            <span><strong>My Wallet</strong><small>{formatCurrency(walletBalance)}</small></span>
          </button>
          <button type="button" onClick={onOpenPass}>
            <span className="player-action-icon"><QrCode size={22} /></span>
            <span><strong>Show pass</strong><small>Entrance and cashier QR</small></span>
          </button>
          <button type="button" onClick={onOpenVisits}>
            <span className="player-action-icon"><History size={22} /></span>
            <span><strong>My visits</strong><small>Check-in history</small></span>
          </button>
          <button type="button" onClick={onOpenProfile}>
            <span className="player-action-icon"><UserRound size={22} /></span>
            <span><strong>My profile</strong><small>KYC and membership</small></span>
          </button>
        </div>
      </section>

      {tournaments.length > 0 && (
        <section className="player-events-section" aria-labelledby="player-events-title">
          <div className="player-section-heading">
            <div>
              <span className="mobile-flow-eyebrow">At the club</span>
              <h2 id="player-events-title">Tournaments</h2>
            </div>
            <span>{tournaments.length} events</span>
          </div>
          <div className="player-event-scroller">
            {tournaments.map((tournament) => (
              <article key={tournament.id} className="player-event-card tournament-felt-bg">
                <div className="player-event-topline">
                  <span className="player-event-icon" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <GameTypeBadge gameType={tournament.name} size={15} />
                    <Trophy size={14} />
                  </span>
                  <span className={`badge ${tournament.status === 'Registering' ? 'badge-success' : tournament.status === 'Running' ? 'badge-danger' : 'badge-warning'}`}>
                    {tournament.status}
                  </span>
                </div>
                <h3>{formatClubLabel(tournament.name)}</h3>
                <dl>
                  <div><dt>Starts</dt><dd>{formatShortDateTime(tournament.startTime)}</dd></div>
                  <div><dt>Entry charge</dt><dd>{formatCurrency(tournament.buyInFee + tournament.clubRake)}</dd></div>
                  <div><dt>Guaranteed</dt><dd style={{ color: '#fb7185' }}>{formatCurrency(tournament.guaranteedPrizePool)}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}

      {playerEntries.length > 0 && (
        <section className="player-receipts-section" aria-labelledby="player-receipts-title">
          <div className="player-section-heading">
            <div>
              <span className="mobile-flow-eyebrow">My activity</span>
              <h2 id="player-receipts-title">Tournament receipts</h2>
            </div>
            <span>{playerEntries.length}</span>
          </div>
          {playerEntries.map((entry) => (
            <article key={entry.id} className="player-receipt-card">
              <span className="player-action-icon"><ReceiptText size={19} /></span>
              <div>
                <strong>{formatClubLabel(entry.tournamentName)}</strong>
                <span>{entry.receiptNumber} · {formatDateTime(entry.registeredAt)}</span>
              </div>
              <span>{formatCurrency(entry.buyInAmount + entry.rakeAmount)}</span>
            </article>
          ))}
        </section>
      )}

      <MobileBottomDrawer
        isOpen={isPassOpen}
        onClose={onClosePass}
        title="Your entrance pass"
        subtitle="Keep this QR visible for the door or cashier team"
      >
        <div className="expanded-player-pass">
          <div className="expanded-player-qr">
            <QRCodeSVG value={verificationUrl} size={210} bgColor="#ffffff" fgColor="#0f172a" level="H" />
          </div>
          <div className="expanded-player-identity">
            {player.kyc.photoUrl && <img src={player.kyc.photoUrl} alt="" />}
            <div>
              <strong>{player.fullName}</strong>
              <span>Player ID {formatPlayerNumber(player)}</span>
            </div>
            <TierBadge tier={player.membershipTier} />
          </div>
          <div className="expanded-player-badges">
            <KYCBadge status={player.kycStatus} />
            {todayCheckIn && <EntryBadge status={todayCheckIn.verificationStatus} />}
          </div>
          <p>{todayCheckIn ? `Checked in ${formatTimeOnly(todayCheckIn.checkInTime)}` : 'Member pass ready. Complete today’s check-in for door clearance.'}</p>
          <button type="button" className="m-btn m-btn-primary" onClick={onClosePass}>Done</button>
        </div>
      </MobileBottomDrawer>

      {/* Mobile Player Wallet Drawer */}
      <MobileBottomDrawer
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
        title="Player Digital Vault Wallet"
        subtitle={`Available Balance: ${formatCurrency(walletBalance)}`}
      >
        <div style={{ padding: '4px 0 20px' }}>
          <PlayerWalletView player={player} />
        </div>
      </MobileBottomDrawer>
    </div>
  );
};
