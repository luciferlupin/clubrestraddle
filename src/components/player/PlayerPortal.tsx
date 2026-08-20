import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  UserCheck,
  QrCode,
  Shield,
  CheckCircle,
  User,
  History,
  Trophy,
  Receipt,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Flame,
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
import { TierBadge, KYCBadge, EntryBadge } from '../common/Badge';
import { formatCurrency, formatDateTime, formatDateOnly, formatINR } from '../../utils/formatters';

interface PlayerPortalProps {
  onOpenQR: () => void;
  showNewPlayerFormInitially?: boolean;
}

export const PlayerPortal: React.FC<PlayerPortalProps> = ({ onOpenQR, showNewPlayerFormInitially = false }) => {
  const {
    currentPlayer,
    setSelectedPlayerId,
    players,
    checkIns,
    tournaments,
    entries,
    chipRequests,
    hasPlayerCheckedInToday,
    lookupMemberByPhone,
  } = useClub();
  const [showKYCForm, setShowKYCForm] = useState(showNewPlayerFormInitially);
  const [isChipModalOpen, setIsChipModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [activeTab, setActiveTab] = useState<'pass' | 'chips' | 'tournaments' | 'billing' | 'profile' | 'history'>('pass');

  useEffect(() => {
    if (showNewPlayerFormInitially || !currentPlayer) {
      setShowKYCForm(true);
    }
  }, [showNewPlayerFormInitially, currentPlayer]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner with Quick Actions */}
      <div
        style={{
          background: 'linear-gradient(155deg, #130a0e 0%, #090608 100%)',
          border: '1px solid rgba(225, 29, 72, 0.35)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(225, 29, 72, 0.2)',
              border: '1px solid var(--border-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <QrCode size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>
              {currentPlayer ? `${currentPlayer.fullName}'s Member Portal` : 'Club Re Straddle • Member Registration'}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              {currentPlayer ? (
                <>Member ID: <strong style={{ color: '#ffffff' }}>{currentPlayer.id}</strong> • Total Visits: <strong style={{ color: '#ffffff' }}>{currentPlayer.totalVisits}</strong></>
              ) : (
                <>First-time guest? Complete KYC below to generate your Digital Pass.</>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {currentPlayer && (
            <button
              className="btn btn-primary"
              onClick={() => setIsChipModalOpen(true)}
              style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', boxShadow: '0 0 15px rgba(225, 29, 72, 0.4)' }}
            >
              <Coins size={16} /> Buy Chips (Table Reload)
            </button>
          )}

          {currentPlayer && (
            <button
              className={`btn ${showKYCForm ? 'btn-secondary' : 'btn-secondary'}`}
              onClick={() => setShowKYCForm(!showKYCForm)}
            >
              {showKYCForm ? (
                <>
                  <UserCheck size={16} /> View My Dashboard
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Register Another Member (KYC)
                </>
              )}
            </button>
          )}

          <button className="btn btn-secondary btn-sm" onClick={onOpenQR} title="Entrance QR Standee">
            <QrCode size={16} color="#ffffff" /> Entrance Standee QR
          </button>
        </div>
      </div>

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
            onSuccess={() => setShowKYCForm(false)}
            onCancel={currentPlayer ? () => setShowKYCForm(false) : undefined}
          />
        </div>
      ) : currentPlayer ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '20px' }}>
          {/* Left Column: Digital Pass & Daily Check-in */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <PlayerPass player={currentPlayer} todayCheckIn={todayCheckIn} />
            <DailyCheckInCard player={currentPlayer} />
          </div>

          {/* Right Column: Tabbed View for Dashboard, Tournaments, Billing, Profile, History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="sub-nav-tabs">
              <button
                className={`sub-tab-btn ${activeTab === 'pass' ? 'active' : ''}`}
                onClick={() => setActiveTab('pass')}
              >
                <CheckCircle size={15} /> Overview & Clearance
              </button>
              <button
                className={`sub-tab-btn ${activeTab === 'chips' ? 'active' : ''}`}
                onClick={() => setActiveTab('chips')}
              >
                <Coins size={15} /> Buy Chips at Table
              </button>
              <button
                className={`sub-tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`}
                onClick={() => setActiveTab('tournaments')}
              >
                <Trophy size={15} /> Tournaments ({tournaments.length})
              </button>
              <button
                className={`sub-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
                onClick={() => setActiveTab('billing')}
              >
                <Receipt size={15} /> Billing Receipts ({playerEntries.length})
              </button>
              <button
                className={`sub-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={15} /> KYC Credentials
              </button>
              <button
                className={`sub-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
              >
                <History size={15} /> Visits ({playerCheckIns.length})
              </button>
            </div>

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
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>
                      <Coins size={36} style={{ opacity: 0.3, marginBottom: '8px' }} />
                      <div style={{ color: '#ffffff', fontWeight: 600 }}>No Table Chip Orders Yet</div>
                      <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                        Click "Request Chips Now" when seated at a cash game or tournament table.
                      </p>
                    </div>
                  ) : (
                    <table className="data-table">
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
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
                            {t.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
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
                          <div style={{ fontWeight: 800, color: '#fb7185', fontSize: '0.95rem' }}>
                            {formatCurrency(t.guaranteedPrizePool)}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Starting Stack</span>
                          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem' }}>
                            {t.startingChips.toLocaleString()} Chips
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                                description: `${entry.tournamentName} - Tournament Buy-in Stack`,
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
                                {entry.tournamentName}
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
