import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Coins,
  CreditCard,
  History,
  MapPin,
  QrCode,
  ReceiptText,
  ShieldAlert,
  Trophy,
  UserRound,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ChipRequest, DailyCheckIn, Player, Tournament, TournamentEntry } from '../../types';
import { formatClubLabel, formatCurrency, formatDateTime, formatShortDateTime, formatTimeOnly } from '../../utils/formatters';
import { EntryBadge, KYCBadge, TierBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { GameTypeBadge, SuitWatermark, PokerChipStack, CardSuit } from '../common/PokerGraphics';

interface MobilePlayerHomeProps {
  player: Player;
  todayCheckIn?: DailyCheckIn;
  tournaments: Tournament[];
  entries: TournamentEntry[];
  chipRequests: ChipRequest[];
  tablePreference: string;
  checkingIn: boolean;
  isPassOpen: boolean;
  onTablePreferenceChange: (value: string) => void;
  onCheckIn: () => void;
  onOpenChipRequest: () => void;
  onOpenVisits: () => void;
  onOpenProfile: () => void;
  onOpenPass: () => void;
  onClosePass: () => void;
}

export const MobilePlayerHome: React.FC<MobilePlayerHomeProps> = ({
  player,
  todayCheckIn,
  tournaments,
  entries,
  chipRequests,
  tablePreference,
  checkingIn,
  isPassOpen,
  onTablePreferenceChange,
  onCheckIn,
  onOpenChipRequest,
  onOpenVisits,
  onOpenProfile,
  onOpenPass,
  onClosePass,
}) => {
  const isCheckedIn = Boolean(todayCheckIn);
  const verificationStatus = todayCheckIn?.verificationStatus;
  const playerEntries = entries.filter((entry) => entry.playerId === player.id);
  const activeChipRequest = chipRequests
    .filter((request) => request.playerId === player.id && request.status === 'pending')
    .at(-1);

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?portal=security&scan=${todayCheckIn?.id || player.id}&player=${player.id}`
    : `https://clubrestraddle.vercel.app/?portal=security&scan=${todayCheckIn?.id || player.id}&player=${player.id}`;

  const statusTitle = !isCheckedIn
    ? 'Ready for today’s game?'
    : verificationStatus === 'approved'
      ? 'You’re cleared for entry'
      : verificationStatus === 'rejected'
        ? 'Your entry needs attention'
        : 'Security check in progress';

  const statusDescription = !isCheckedIn
    ? 'Choose your game and check in before heading to the door.'
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
        <button type="button" className="player-avatar-button" onClick={onOpenProfile} aria-label="Open my profile">
          {player.kyc.photoUrl ? (
            <img src={player.kyc.photoUrl} alt="" />
          ) : (
            <span>{player.fullName.charAt(0)}</span>
          )}
        </button>
      </header>

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
          <button type="button" className="player-pass-preview" onClick={onOpenPass} aria-label="Open my full entrance pass">
            <span className="player-pass-copy">
              <span className="player-pass-label"><CreditCard size={15} /> Digital member pass</span>
              <strong>{player.fullName}</strong>
              <small>{player.id} · Checked in {formatTimeOnly(todayCheckIn?.checkInTime)}</small>
              <span className="player-pass-action">Tap to enlarge <ArrowRight size={15} /></span>
            </span>
            <span className="player-pass-qr" aria-hidden="true">
              <QRCodeSVG value={verificationUrl} size={72} bgColor="#ffffff" fgColor="#0f172a" level="M" />
            </span>
          </button>
        ) : (
          <div className="player-checkin-form">
            <label htmlFor="player-table-preference">Game or table</label>
            <select
              id="player-table-preference"
              className="m-select"
              value={tablePreference}
              onChange={(event) => onTablePreferenceChange(event.target.value)}
            >
              <option value="NLH Cash Game (₹100/₹200)">No-Limit Holdem (₹100/₹200)</option>
              <option value="NLH Cash Game (₹250/₹500)">No-Limit Holdem (₹250/₹500)</option>
              <option value="High Stakes NLH (₹500/₹1000+)">High Stakes NLH (₹500/₹1000+)</option>
              <option value="Re Straddle High Roller Championship">Re Straddle High Roller</option>
              <option value="Pot-Limit Omaha (PLO ₹250/₹500)">Pot-Limit Omaha (₹250/₹500)</option>
            </select>
            <button type="button" className="m-btn m-btn-primary" onClick={onCheckIn} disabled={checkingIn}>
              <CheckCircle2 size={19} /> {checkingIn ? 'Checking you in…' : 'Check in now'}
            </button>
          </div>
        )}

        {todayCheckIn && (
          <div className="player-status-meta">
            <span><MapPin size={15} /> {todayCheckIn.tablePreference || 'General floor'}</span>
            <EntryBadge status={todayCheckIn.verificationStatus} />
          </div>
        )}
      </section>

      <section aria-labelledby="player-actions-title">
        <div className="player-section-heading">
          <div>
            <span className="mobile-flow-eyebrow">Quick actions</span>
            <h2 id="player-actions-title">What do you need?</h2>
          </div>
        </div>
        <div className="player-action-grid">
          <button type="button" onClick={onOpenChipRequest}>
            <span className="player-action-icon"><Coins size={22} /></span>
            <span><strong>Request chips</strong><small>Delivered to your table</small></span>
            {activeChipRequest && <em>Pending</em>}
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

      {activeChipRequest && (
        <section className="player-activity-banner" aria-label="Pending chip request">
          <span className="player-activity-icon"><Coins size={19} /></span>
          <div>
            <strong>Chip request is with the cashier</strong>
            <span>{formatCurrency(activeChipRequest.amount)} · {activeChipRequest.tableNumber}, {activeChipRequest.seatNumber}</span>
          </div>
          <span className="badge badge-warning">Pending</span>
        </section>
      )}

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
                  <div><dt>Buy-in</dt><dd>{formatCurrency(tournament.buyInFee + tournament.clubRake)}</dd></div>
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
              <span>{player.id}</span>
            </div>
            <TierBadge tier={player.membershipTier} />
          </div>
          <div className="expanded-player-badges">
            <KYCBadge status={player.kycStatus} />
            {todayCheckIn && <EntryBadge status={todayCheckIn.verificationStatus} />}
          </div>
          <p>{todayCheckIn ? `${todayCheckIn.tablePreference} · Checked in ${formatTimeOnly(todayCheckIn.checkInTime)}` : 'Member pass ready. Complete today’s check-in for door clearance.'}</p>
          <button type="button" className="m-btn m-btn-primary" onClick={onClosePass}>Done</button>
        </div>
      </MobileBottomDrawer>
    </div>
  );
};
