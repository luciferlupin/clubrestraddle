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
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { KYCRegistrationForm } from './KYCRegistrationForm';
import { DailyCheckInCard } from './DailyCheckInCard';
import { PlayerPass } from './PlayerPass';
import { CheckInHistory } from './CheckInHistory';
import { PlayerProfile } from './PlayerProfile';
import { TableChipRequestModal } from './TableChipRequestModal';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { formatClubLabel, formatCurrency, formatDateTime, formatINR } from '../../utils/formatters';
import { DesktopPortalHeader } from '../common/DesktopPortalHeader';
import { DesktopSectionNav, DesktopSectionNavItem } from '../common/DesktopSectionNav';
import { PokerChipStack, GameTypeBadge, CardSuit, SuitWatermark } from '../common/PokerGraphics';

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
  } = useClub();
  const [showKYCForm, setShowKYCForm] = useState(showNewPlayerFormInitially || !currentPlayer);
  const [isChipModalOpen, setIsChipModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [activeTab, setActiveTab] = useState<PlayerTab>('pass');

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
    const matched = await lookupMemberByPhone(cleanPhone);
    setIsLookingUp(false);

    if (matched) {
      setShowKYCForm(false);
      setLookupPhone('');
    } else {
      setLookupError('No registered member found with this mobile number or ID. Please complete KYC registration below.');
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
      <DesktopPortalHeader
        icon={<QrCode size={23} />}
        eyebrow={currentPlayer ? 'Player portal' : 'Member registration'}
        title={currentPlayer ? `${currentPlayer.fullName}'s member portal` : 'Create your Club Re Straddle profile'}
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
              onClick={() => setShowKYCForm(!showKYCForm)}
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

          <button className="btn btn-secondary btn-sm" onClick={onOpenQR} title="Entrance QR Standee">
            <QrCode size={16} color="#ffffff" /> Standee QR
          </button>
          </>
        }
      />

      {/* If New Player or showKYCForm is active */}
      {(!currentPlayer || showKYCForm) ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Returning Member Lookup Bar */}
          <div
            style={{
              background: '#13080c',
              border: '1px solid rgba(225, 29, 72, 0.3)',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff' }}>
                Already a registered club member?
              </span>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>
                Enter your mobile number to load your Digital Membership Pass onto this device.
              </p>
            </div>

            <form onSubmit={handleLookupMember} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                style={{ minWidth: '220px', padding: '6px 12px', fontSize: '0.82rem' }}
                placeholder="Mobile number (e.g. 9810234891)"
                value={lookupPhone}
                onChange={e => setLookupPhone(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary btn-sm" style={{ padding: '6px 14px' }} disabled={isLookingUp}>
                <UserCheck size={14} /> {isLookingUp ? 'Searching...' : 'Find Pass'}
              </button>
            </form>
          </div>

          {lookupError && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 14px', borderRadius: '8px', color: '#fca5a5', fontSize: '0.8rem' }}>
              {lookupError}
            </div>
          )}

          <KYCRegistrationForm
            onSuccess={() => {
              setShowKYCForm(false);
              onRegistrationFlowComplete?.();
            }}
            onCancel={currentPlayer ? () => setShowKYCForm(false) : undefined}
          />
        </div>
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
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Buy-In + Rake</span>
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
                          <th>Buy-In & Rake</th>
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
                            category: 'Tournament Entry & Rake',
                            playerId: currentPlayer.id,
                            playerName: currentPlayer.fullName,
                            playerPhone: currentPlayer.phone,
                            playerEmail: currentPlayer.email,
                            govtIdType: currentPlayer.kyc.govtIdType,
                            govtIdNumber: currentPlayer.kyc.govtIdNumber,
                            membershipTier: currentPlayer.membershipTier,
                            tableLocation: `${entry.tableNumber || 'Table 1'} • ${entry.seatNumber || 'Seat 1'}`,
                            items: [
                              {
                                description: `${formatClubLabel(entry.tournamentName)} - Tournament Buy-in Stack`,
                                details: `${tournamentObj?.startingChips?.toLocaleString() || '50,000'} Starting Tournament Chips`,
                                chips: tournamentObj?.startingChips || 50000,
                                amount: entry.buyInAmount,
                              },
                              {
                                description: 'House Operating Rake & Registration Fee',
                                details: 'Club tournament organization & dealer rake',
                                amount: entry.rakeAmount,
                              },
                            ],
                            subtotal: entry.buyInAmount,
                            rakeOrFee: entry.rakeAmount,
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
    </div>
  );
};
