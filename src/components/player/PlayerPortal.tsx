import React, { useState } from 'react';
import {
  UserPlus,
  UserCheck,
  QrCode,
  CheckCircle,
  User,
  History,
  Trophy,
  Receipt,
  Coins,
  CreditCard,
  ChevronRight,
  ArrowLeft,
  Phone,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { KYCRegistrationForm } from './KYCRegistrationForm';
import { DailyCheckInCard } from './DailyCheckInCard';
import { PlayerPass } from './PlayerPass';
import { CheckInHistory } from './CheckInHistory';
import { PlayerProfile } from './PlayerProfile';
import { TableChipRequestModal } from './TableChipRequestModal';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { formatClubLabel, formatCurrency, formatDateTime, formatDateOnly, formatTimeOnly, formatINR } from '../../utils/formatters';
import { DesktopPortalHeader } from '../common/DesktopPortalHeader';
import { DesktopSectionNav, DesktopSectionNavItem } from '../common/DesktopSectionNav';
import { PokerChipStack, GameTypeBadge, CardSuit, SuitWatermark, CardDeckFan, AnimatedSuitsRow } from '../common/PokerGraphics';
import { AppBreadcrumbs } from '../common/AppBreadcrumbs';
import { Pagination } from '../common/Pagination';
import { OtpVerificationModal } from '../common/OtpVerificationModal';
import { Player } from '../../types';

type PlayerTab = 'pass' | 'chips' | 'tournaments' | 'billing' | 'profile' | 'history';

interface PlayerPortalProps {
  onOpenQR: () => void;
  showNewPlayerFormInitially?: boolean;
  onRegistrationFlowComplete?: () => void;
}

export const PlayerPortal: React.FC<PlayerPortalProps> = ({
  onOpenQR,
  showNewPlayerFormInitially = false,
  onRegistrationFlowComplete,
}) => {
  const {
    currentPlayer,
    checkIns,
    tournaments,
    entries,
    chipRequests,
    hasPlayerCheckedInToday,
    lookupMemberByPhone,
    findMemberByPhone,
    setSelectedPlayerId,
  } = useClub();
  const [showKYCForm, setShowKYCForm] = useState(showNewPlayerFormInitially || !currentPlayer);
  const [entryView, setEntryView] = useState<'welcome' | 'lookup' | 'register'>(
    showNewPlayerFormInitially ? 'register' : 'welcome'
  );
  const [isChipModalOpen, setIsChipModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [activeTab, setActiveTab] = useState<PlayerTab>('pass');
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null);

  const playerCheckIns = currentPlayer
    ? checkIns.filter(c => c.playerId === currentPlayer.id)
    : [];

  const playerEntries = currentPlayer
    ? entries.filter(e => e.playerId === currentPlayer.id)
    : [];

  const todayCheckIn = currentPlayer ? hasPlayerCheckedInToday(currentPlayer.id) : undefined;

  const handleLookupMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const cleanPhone = lookupPhone.trim();
    if (!cleanPhone) return;

    setIsLookingUp(true);
    const matched = await findMemberByPhone(cleanPhone);
    setIsLookingUp(false);

    if (matched) {
      setPendingPlayer(matched);
      setIsOtpModalOpen(true);
    } else {
      setLookupError('No registered member found with this mobile number. Register below or try again.');
    }
  };

  const handleOtpSuccess = () => {
    if (pendingPlayer) {
      setSelectedPlayerId(pendingPlayer.id);
      setShowKYCForm(false);
      setEntryView('welcome');
      setLookupPhone('');
      setIsOtpModalOpen(false);
      setPendingPlayer(null);
    }
  };

  const playerSections: DesktopSectionNavItem<PlayerTab>[] = [
    { id: 'pass', label: 'Overview', icon: <CheckCircle size={16} /> },
    { id: 'chips', label: 'Buy chips', icon: <Coins size={16} /> },
    { id: 'tournaments', label: `Events (${tournaments.length})`, icon: <Trophy size={16} /> },
    { id: 'billing', label: `Receipts (${playerEntries.length})`, icon: <Receipt size={16} /> },
    { id: 'profile', label: 'My profile', icon: <User size={16} /> },
    { id: 'history', label: `Visits (${playerCheckIns.length})`, icon: <History size={16} /> },
  ];

  return (
    <div className="desktop-portal desktop-player-portal">
      {/* Breadcrumb navigation bar */}
      <AppBreadcrumbs
        items={[
          { label: 'Club Re Straddle', onClick: () => { if (currentPlayer) setActiveTab('pass'); else setEntryView('welcome'); } },
          { label: 'Player Lounge', onClick: () => { if (currentPlayer) setActiveTab('pass'); else setEntryView('welcome'); } },
          {
            label: currentPlayer
              ? showKYCForm
                ? 'Member Registration'
                : activeTab === 'pass'
                ? 'Member Dashboard'
                : activeTab === 'chips'
                ? 'Buy Chips'
                : activeTab === 'tournaments'
                ? 'Tournaments & Events'
                : activeTab === 'billing'
                ? 'Receipts & Billing'
                : activeTab === 'profile'
                ? 'Member Profile'
                : 'Visit History'
              : entryView === 'lookup'
              ? 'Find My Pass'
              : entryView === 'register'
              ? 'KYC Registration'
              : 'Welcome',
          },
        ]}
        activeRole="player"
        onBack={
          showKYCForm
            ? () => { setShowKYCForm(false); setEntryView('welcome'); }
            : entryView !== 'welcome'
            ? () => setEntryView('welcome')
            : activeTab !== 'pass' && currentPlayer
            ? () => setActiveTab('pass')
            : undefined
        }
        backLabel={
          showKYCForm
            ? 'Back to Dashboard'
            : entryView !== 'welcome'
            ? 'Back to Welcome'
            : 'Back to Overview'
        }
      />

      {/* Portal header — hide on hero welcome to avoid double branding */}
      {(currentPlayer || (!currentPlayer && entryView !== 'welcome')) && (
      <DesktopPortalHeader
        icon={<QrCode size={23} />}
        eyebrow={currentPlayer ? 'Player portal' : entryView === 'lookup' ? 'Existing member' : 'New registration'}
        title={currentPlayer ? `${currentPlayer.fullName}'s member portal` : entryView === 'lookup' ? 'Open your player pass' : 'Create your Club Re Straddle profile'}
        subtitle={currentPlayer ? (
          <>Member <strong>{currentPlayer.id}</strong> · {currentPlayer.totalVisits} club visits</>
        ) : (
          <>Complete KYC once to receive your digital pass and use club services.</>
        )}
        actions={
          <>
          {currentPlayer && (
            <button
              className="btn btn-primary"
              onClick={() => setIsChipModalOpen(true)}
            >
              <Coins size={16} /> Buy chips
            </button>
          )}

          {currentPlayer && (
            <button
              className="btn btn-secondary"
              onClick={() => { setShowKYCForm(!showKYCForm); setEntryView('register'); }}
            >
              {showKYCForm ? (
                <>
                  <UserCheck size={16} /> View My Dashboard
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Register member
                </>
              )}
            </button>
          )}
          </>
        }
      />
      )}

      {/* ── WELCOME / ENTRY STATE (no player yet, or re-register) ── */}
      {(!currentPlayer || showKYCForm) ? (

        entryView === 'welcome' ? (
          /* ─────────────────────────────────────────────────
             HERO WELCOME SCREEN  (mirrors mobile first page)
             ───────────────────────────────────────────────── */
          <div style={{
            minHeight: '72vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0',
            position: 'relative',
          }}>
            {/* Hero card */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0',
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              padding: '0 16px',
            }}>
              {/* Card fan hero */}
              <div className="welcome-card-fan-hero" aria-hidden="true" style={{ marginBottom: '6px' }}>
                <CardDeckFan size={200} />
              </div>

              {/* Animated suit strip */}
              <div className="mobile-welcome-suits" aria-hidden="true" style={{ gap: '18px', marginBottom: '18px' }}>
                <CardSuit suit="spade" size={26} color="#ffffff" className="suit-hover-anim" />
                <CardSuit suit="heart" size={26} color="#e11d48" className="suit-hover-anim suit-delay-1" />
                <CardSuit suit="diamond" size={26} color="#e11d48" className="suit-hover-anim suit-delay-2" />
                <CardSuit suit="club" size={26} color="#ffffff" className="suit-hover-anim suit-delay-3" />
              </div>

              <span className="mobile-flow-eyebrow" style={{ marginBottom: '10px', fontSize: '0.78rem' }}>
                Player access
              </span>
              <h1 style={{
                fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                margin: '0 0 12px',
              }}>
                Welcome to the club
              </h1>
              <p style={{ fontSize: '1rem', color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.55 }}>
                Load your member pass or register for your first visit.
              </p>

              {/* Trust badges */}
              <div className="mobile-trust-row" style={{ justifyContent: 'center', gap: '20px', marginBottom: '36px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  <CardSuit suit="spade" size={14} color="#ffffff" /> Members only
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#cbd5e1' }}>
                  <CardSuit suit="club" size={14} color="#ffffff" /> Secure KYC
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#e11d48' }}>
                  <CardSuit suit="diamond" size={14} color="#e11d48" /> Under 2 min
                </span>
              </div>

              {/* CTA buttons */}
              <div className="mobile-start-options" style={{ width: '100%', maxWidth: '400px', gap: '12px' }}>
                <button
                  type="button"
                  className="mobile-start-option primary"
                  onClick={() => setEntryView('lookup')}
                >
                  <span className="mobile-start-icon"><CreditCard size={24} /></span>
                  <span>
                    <strong>I&apos;m already a member</strong>
                    <small>Open my digital pass</small>
                  </span>
                  <ChevronRight size={22} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className="mobile-start-option"
                  onClick={() => setEntryView('register')}
                >
                  <span className="mobile-start-icon"><UserPlus size={24} /></span>
                  <span>
                    <strong>I&apos;m new here</strong>
                    <small>Create a pass and check in</small>
                  </span>
                  <ChevronRight size={22} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

        ) : entryView === 'lookup' ? (
          /* ─────────────────────────────────────────────────
             MEMBER LOOKUP (phone input)
             ───────────────────────────────────────────────── */
          <div style={{
            maxWidth: '480px',
            margin: '48px auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0',
          }}>
            <div className="mobile-flow-heading">
              <button
                type="button"
                className="mobile-icon-button"
                onClick={() => { setEntryView('welcome'); setLookupError(null); }}
                aria-label="Back to welcome"
              >
                <ArrowLeft size={21} />
              </button>
              <div>
                <span className="mobile-flow-eyebrow">Existing member</span>
                <h1>Open your player pass</h1>
                <p>Use the mobile number linked to your membership.</p>
              </div>
            </div>

            <form className="m-card mobile-lookup-card" onSubmit={handleLookupMember} noValidate>
              <div className="m-form-group">
                <label className="m-form-label" htmlFor="desktop-lookup-phone">Mobile number</label>
                <div className="mobile-phone-field">
                  <span aria-hidden="true">+91</span>
                  <input
                    id="desktop-lookup-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    className="m-input"
                    placeholder="98765 43210"
                    value={lookupPhone}
                    aria-invalid={Boolean(lookupError)}
                    aria-describedby={lookupError ? 'desktop-lookup-error' : undefined}
                    onChange={(e) => { setLookupPhone(e.target.value); setLookupError(null); }}
                  />
                </div>
                {lookupError && (
                  <span id="desktop-lookup-error" className="m-field-error" role="alert">
                    {lookupError}
                  </span>
                )}
              </div>
              <button type="submit" className="m-btn m-btn-primary" disabled={isLookingUp}>
                <Phone size={18} /> {isLookingUp ? 'Finding your pass…' : 'Find my pass'}
              </button>
            </form>

            <button
              type="button"
              className="mobile-secondary-link"
              style={{ marginTop: '16px', textAlign: 'center' }}
              onClick={() => { setEntryView('register'); setLookupError(null); }}
            >
              New to the club? Create a member pass <ChevronRight size={17} />
            </button>
          </div>

        ) : (
          /* ─────────────────────────────────────────────────
             KYC REGISTRATION FORM
             ───────────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              className="mobile-icon-button"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setEntryView(currentPlayer ? 'welcome' : 'welcome')}
              aria-label="Back"
            >
              <ArrowLeft size={21} /> <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '4px' }}>Back</span>
            </button>
            <KYCRegistrationForm
              onSuccess={() => {
                setShowKYCForm(false);
                setEntryView('welcome');
                onRegistrationFlowComplete?.();
              }}
              onCancel={currentPlayer ? () => { setShowKYCForm(false); setEntryView('welcome'); } : undefined}
            />
          </div>
        )
      ) : currentPlayer ? (
        <div className="desktop-player-layout">
          {/* Left Column: Digital Pass & Daily Check-in */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <PlayerPass player={currentPlayer} todayCheckIn={todayCheckIn} />
            <DailyCheckInCard player={currentPlayer} />
          </div>

          {/* Right Column: Tabbed View for Dashboard, Tournaments, Billing, Profile, History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <DesktopSectionNav
              ariaLabel="Player portal sections"
              activeId={activeTab}
              items={playerSections}
              onChange={(id) => setActiveTab(id as PlayerTab)}
              className="desktop-section-nav-player"
            />

            {/* TAB 1: OVERVIEW & CLEARANCE */}
            {activeTab === 'pass' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <PlayerProfile player={currentPlayer} />
                <CheckInHistory checkIns={playerCheckIns} />
              </div>
            )}

            {/* TAB: BUY CHIPS AT TABLE */}
            {activeTab === 'chips' && (
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 className="card-title">
                      <Coins size={18} color="#e11d48" />
                      Table Chip Purchase & Reload Orders
                    </h3>
                    <p className="card-subtitle">
                      Order chips straight to your table seat. Cashier vault dispatches in real-time.
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => setIsChipModalOpen(true)}>
                    <Coins size={16} /> Request Chips Now
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chipRequests.filter(r => r.playerId === currentPlayer.id).length === 0 ? (
                    <div className="chip-empty-state">
                      <PokerChipStack count={4} size={72} color="#e11d48" />
                      <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem' }}>No Table Chip Orders Yet</div>
                      <p style={{ fontSize: '0.8rem', marginTop: '2px', color: '#94a3b8', maxWidth: '280px' }}>
                        Click <strong style={{ color: '#fb7185' }}>"Request Chips Now"</strong> when seated at a cash game or tournament table.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.5, marginTop: '4px' }}>
                        <CardSuit suit="spade" size={14} color="#ffffff" />
                        <CardSuit suit="heart" size={14} color="#e11d48" />
                        <CardSuit suit="diamond" size={14} color="#e11d48" />
                        <CardSuit suit="club" size={14} color="#ffffff" />
                      </div>
                    </div>
                  ) : (
                    <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Table & Seat</th>
                          <th>Chip Amount</th>
                          <th>Payment Method</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chipRequests
                          .filter(r => r.playerId === currentPlayer.id)
                          .map(order => (
                            <tr key={order.id}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff' }}>
                                {order.id}
                              </td>
                              <td style={{ fontWeight: 600, color: '#ffffff' }}>
                                {order.tableNumber}, {order.seatNumber}
                              </td>
                              <td style={{ fontWeight: 800, color: '#ffffff' }}>
                                ₹{formatINR(order.amount)}
                              </td>
                              <td>
                                <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                                  {order.paymentMethod}
                                </span>
                              </td>
                              <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                                {formatDateTime(order.requestedAt)}
                              </td>
                              <td>
                                {order.status === 'pending' && (
                                  <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                                    <span className="badge-dot" /> Dispatching to Table...
                                  </span>
                                )}
                                {order.status === 'delivered' && (
                                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                                    <CheckCircle size={12} /> Delivered ({order.receiptNumber})
                                  </span>
                                )}
                                {order.status === 'cancelled' && (
                                  <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                                    Cancelled
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: TOURNAMENTS & EVENTS */}
            {activeTab === 'tournaments' && (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">
                      <Trophy size={18} color="#e11d48" />
                      Club Tournaments & Events Schedule
                    </h3>
                    <p className="card-subtitle">
                      Live tournament fixtures, guaranteed prize pools, and entry details.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tournaments.map(t => (
                    <div
                      key={t.id}
                      style={{
                        background: '#14060a',
                        border: '1px solid rgba(225, 29, 72, 0.4)',
                        borderRadius: '14px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      className="tournament-felt-bg"
                    >
                      {/* Ghost watermark suit per game type */}
                      <SuitWatermark
                        suit={t.name.toUpperCase().includes('PLO') || t.name.toUpperCase().includes('OMAHA') ? 'diamond' : t.name.toUpperCase().includes('HIGH') ? 'heart' : t.name.toUpperCase().includes('STRADDLE') ? 'club' : 'spade'}
                        size={90}
                        opacity={0.05}
                        color="#ffffff"
                        style={{ position: 'absolute', right: 10, bottom: -10 }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                            <GameTypeBadge gameType={t.name} size={17} />
                            {formatClubLabel(t.name)}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
                            Starts: {formatDateTime(t.startTime)} • Blinds: {t.blindLevelsMinutes} mins
                          </div>
                        </div>
                        <span className={`badge ${t.status === 'Running' ? 'badge-danger' : t.status === 'Registering' ? 'badge-success' : 'badge-warning'}`}>
                          <span className="badge-dot" /> {t.status}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', background: '#0e0407', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Buy-In + Service Charge</span>
                          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem' }}>
                            {formatCurrency(t.buyInFee)} + {formatCurrency(t.clubRake)}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Guaranteed Prize</span>
                          <div style={{ fontWeight: 800, color: '#fb7185', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CardSuit suit="heart" size={12} color="#e11d48" />
                            {formatCurrency(t.guaranteedPrizePool)}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Starting Stack</span>
                          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CardSuit suit="spade" size={12} color="#ffffff" />
                            {t.startingChips.toLocaleString()} Chips
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}                </div>
              </div>
            )}

            {/* TAB 3: BILLING & TOURNAMENT RECEIPTS */}
            {activeTab === 'billing' && (
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">
                      <Receipt size={18} color="#e11d48" />
                      My Tournament Entries & Official Receipts
                    </h3>
                    <p className="card-subtitle">
                      Official digital receipts, table allocations, and seat assignments.
                    </p>
                  </div>
                  <span className="badge badge-default">{playerEntries.length} Total Entries</span>
                </div>

                {playerEntries.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-dim)' }}>
                    <Receipt size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.9rem' }}>No tournament registrations recorded yet.</p>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>Visit the Cashier Station to register for upcoming tournaments or cash tables.</p>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Receipt #</th>
                          <th>Tournament</th>
                          <th>Buy-In & Service Charge</th>
                          <th>Seating</th>
                          <th>Payment Method</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Invoice</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerEntries.map(entry => {
                          const tournamentObj = tournaments.find(t => t.name === entry.tournamentName);

                          const invoiceData: ClubInvoiceData = {
                            invoiceNumber: entry.receiptNumber,
                            invoiceDate: entry.registeredAt,
                            category: 'Tournament Entry & Service Charge',
                            playerId: currentPlayer.id,
                            playerName: currentPlayer.fullName,
                            playerPhone: currentPlayer.phone,
                            playerEmail: currentPlayer.email,
                            govtIdType: currentPlayer.kyc.govtIdType,
                            govtIdNumber: currentPlayer.kyc.govtIdNumber,
                            membershipTier: currentPlayer.membershipTier,
                            tableLocation: `${entry.tableNumber || 'Table 1'} • ${entry.seatNumber || 'Seat 1'}`,
                            eventName: `${formatClubLabel(entry.tournamentName)}`,
                            eventDate: `Texas • ${formatDateOnly(entry.registeredAt)} • ${formatTimeOnly(entry.registeredAt)}`,
                            eventDetails: `Texas • MTC • Table ${entry.tableNumber || 'Table 1'} • Seat ${entry.seatNumber || '1'}`,
                            items: [
                              {
                                description: `${formatClubLabel(entry.tournamentName)} - Tournament Buy-in Stack`,
                                details: `${tournamentObj?.startingChips?.toLocaleString() || '50,000'} Starting Tournament Chips`,
                                chips: tournamentObj?.startingChips || 50000,
                                amount: entry.buyInAmount,
                              },
                              {
                                description: 'Club Service Charges & Tournament Organization',
                                details: 'Club tournament organization & dealer service fee',
                                amount: entry.rakeAmount,
                              },
                            ],
                            subtotal: entry.buyInAmount,
                            serviceCharge: entry.rakeAmount,
                            totalAmount: entry.buyInAmount + entry.rakeAmount,
                            paymentMethod: entry.paymentMethod,
                            paymentReference: entry.paymentReference,
                            cashierName: entry.cashierName,
                          };

                          return (
                            <tr key={entry.id}>
                              <td className="tabular-num" style={{ color: '#ffffff', fontWeight: 700 }}>
                                {entry.receiptNumber}
                              </td>
                              <td style={{ fontWeight: 600, color: '#ffffff' }}>
                                {formatClubLabel(entry.tournamentName)}
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: '#ffffff' }}>
                                  {formatCurrency(entry.buyInAmount + entry.rakeAmount)}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                  ({formatCurrency(entry.buyInAmount)} + {formatCurrency(entry.rakeAmount)})
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-default" style={{ fontSize: '0.74rem' }}>
                                  {entry.tableNumber || 'Table 1'} • {entry.seatNumber || 'Seat 1'}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                                  {entry.paymentMethod} ({entry.paymentReference})
                                </span>
                              </td>
                              <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                {formatDateTime(entry.registeredAt)}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                  onClick={() => setSelectedInvoice(invoiceData)}
                                >
                                  <Receipt size={12} /> Tax Invoice
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PROFILE & KYC DETAILS */}
            {activeTab === 'profile' && <PlayerProfile player={currentPlayer} />}

            {/* TAB 5: VISIT HISTORY */}
            {activeTab === 'history' && <CheckInHistory checkIns={playerCheckIns} />}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No player selected.</p>
          <button className="btn btn-primary" onClick={() => setShowKYCForm(true)}>
            <UserPlus size={16} /> Start New Player KYC Registration
          </button>
        </div>
      )}

      {/* Table Chip Request Modal */}
      <TableChipRequestModal
        isOpen={isChipModalOpen}
        onClose={() => setIsChipModalOpen(false)}
      />

      {/* Official Tax / Billing Invoice Modal */}
      <ClubTaxInvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* Member Login OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        phone={pendingPlayer?.phone || lookupPhone}
        purpose="login"
        onSuccess={handleOtpSuccess}
        onClose={() => {
          setIsOtpModalOpen(false);
          setPendingPlayer(null);
        }}
      />
    </div>
  );
};
