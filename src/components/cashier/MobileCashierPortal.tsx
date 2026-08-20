import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Wallet,
  Receipt,
  Plus,
  Minus,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Check,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { TournamentStatus, PaymentMethod, CashCategory, ExpenseCategory } from '../../types';
import { formatClubLabel, formatCurrency, formatShortDateTime, formatINR } from '../../utils/formatters';
import { TournamentStatusBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import confetti from 'canvas-confetti';

const DEFAULT_TOURNAMENT_START = new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16);

export const MobileCashierPortal: React.FC = () => {
  const {
    staffName,
    tournaments,
    entries,
    players,
    cashTransactions,
    currentCashBalance,
    totalCashInAmount,
    totalCashOutAmount,
    chipRequests,
    pendingChipOrdersCount,
    fulfillChipRequest,
    cancelChipRequest,
    createTournament,
    registerPlayerForTournament,
    addCashReceived,
    addCashGiven,
    addExpense,
    hasPlayerCheckedInToday,
  } = useClub();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'chips' | 'players' | 'tournaments' | 'cash' | 'records'>('dashboard');

  // Modals / Drawers State
  const [isCashInOpen, setIsCashInOpen] = useState(false);
  const [isCashOutOpen, setIsCashOutOpen] = useState(false);
  const [isCreateTrnOpen, setIsCreateTrnOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);

  // Forms
  const [trnFormData, setTrnFormData] = useState({
    name: '',
    buyInFee: 500,
    clubRake: 50,
    startingChips: 30000,
    guaranteedPrizePool: 25000,
    maxSeats: 60,
    blindLevelsMinutes: 20,
    startTime: DEFAULT_TOURNAMENT_START,
    status: 'Registering' as TournamentStatus,
  });

  const [entryFormData, setEntryFormData] = useState({
    tournamentId: tournaments[0]?.id || '',
    playerId: players[0]?.id || '',
    paymentMethod: 'Cash' as PaymentMethod,
    paymentRef: '',
    tableNum: 'Table 1',
    seatNum: 'Seat 3',
  });

  const [cashInData, setCashInData] = useState({
    category: 'Tournament Buy-in' as CashCategory,
    amount: 1000,
    description: '',
    paymentMethod: 'Cash' as PaymentMethod,
    playerName: '',
  });

  const [cashOutData, setCashOutData] = useState({
    category: 'Tournament Prize Payout' as CashCategory,
    amount: 500,
    description: '',
    paymentMethod: 'Cash' as PaymentMethod,
    playerName: '',
  });

  const [expenseData, setExpenseData] = useState({
    category: 'Dealer & Staff Wages' as ExpenseCategory,
    amount: 300,
    description: '',
    paidTo: '',
    paymentMethod: 'Cash' as PaymentMethod,
  });

  const activeTournaments = tournaments.filter(t => t.status === 'Registering' || t.status === 'Running');

  // Submit Handlers
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trnFormData.name.trim()) return;

    createTournament({
      name: trnFormData.name,
      buyInFee: Number(trnFormData.buyInFee),
      clubRake: Number(trnFormData.clubRake),
      startingChips: Number(trnFormData.startingChips),
      guaranteedPrizePool: Number(trnFormData.guaranteedPrizePool),
      maxSeats: Number(trnFormData.maxSeats),
      blindLevelsMinutes: Number(trnFormData.blindLevelsMinutes),
      startTime: new Date(trnFormData.startTime).toISOString(),
      status: trnFormData.status,
    });

    setIsCreateTrnOpen(false);
    setTrnFormData({
      name: '',
      buyInFee: 500,
      clubRake: 50,
      startingChips: 30000,
      guaranteedPrizePool: 25000,
      maxSeats: 60,
      blindLevelsMinutes: 20,
      startTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16),
      status: 'Registering',
    });
  };

  const handleRegisterPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryFormData.tournamentId || !entryFormData.playerId) return;

    const ref = entryFormData.paymentRef.trim() || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const entry = registerPlayerForTournament({
      tournamentId: entryFormData.tournamentId,
      playerId: entryFormData.playerId,
      paymentMethod: entryFormData.paymentMethod,
      paymentReference: ref,
      tableNumber: entryFormData.tableNum,
      seatNumber: entryFormData.seatNum,
    });

    const playerObj = players.find(p => p.id === entryFormData.playerId);
    const tournamentObj = tournaments.find(t => t.id === entryFormData.tournamentId);

    const invoiceData: ClubInvoiceData = {
      invoiceNumber: entry.receiptNumber,
      invoiceDate: entry.registeredAt,
      category: 'Tournament Entry & Rake',
      playerId: playerObj?.id,
      playerName: entry.playerName,
      playerPhone: playerObj?.phone,
      playerEmail: playerObj?.email,
      govtIdType: playerObj?.kyc.govtIdType,
      govtIdNumber: playerObj?.kyc.govtIdNumber,
      membershipTier: playerObj?.membershipTier,
      tableLocation: `${entry.tableNumber} • ${entry.seatNumber}`,
      items: [
        {
          description: `${formatClubLabel(entry.tournamentName)} - Tournament Buy-in Stack`,
          details: `${tournamentObj?.startingChips?.toLocaleString()} Starting Playing Chips`,
          chips: tournamentObj?.startingChips,
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
      cashierName: entry.cashierName || staffName,
    };

    setSelectedInvoice(invoiceData);
    setEntryFormData(prev => ({ ...prev, paymentRef: '' }));

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#f43f5e', '#be123c'],
      });
    } catch {
      // Fallback
    }
  };

  const handleCashInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashInData.amount || cashInData.amount <= 0) return;

    addCashReceived({
      category: cashInData.category,
      amount: Number(cashInData.amount),
      description: cashInData.description || `Cash In: ${cashInData.category}`,
      paymentMethod: cashInData.paymentMethod,
      playerName: cashInData.playerName,
    });

    setIsCashInOpen(false);
    setCashInData({
      category: 'Tournament Buy-in',
      amount: 1000,
      description: '',
      paymentMethod: 'Cash',
      playerName: '',
    });
  };

  const handleCashOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashOutData.amount || cashOutData.amount <= 0) return;

    addCashGiven({
      category: cashOutData.category,
      amount: Number(cashOutData.amount),
      description: cashOutData.description || `Cash Out: ${cashOutData.category}`,
      paymentMethod: cashOutData.paymentMethod,
      playerName: cashOutData.playerName,
    });

    setIsCashOutOpen(false);
    setCashOutData({
      category: 'Tournament Prize Payout',
      amount: 500,
      description: '',
      paymentMethod: 'Cash',
      playerName: '',
    });
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseData.amount || expenseData.amount <= 0) return;

    addExpense({
      category: expenseData.category,
      amount: Number(expenseData.amount),
      description: expenseData.description || `Expense: ${expenseData.category}`,
      paidTo: expenseData.paidTo || 'Club Supplier',
      paymentMethod: expenseData.paymentMethod,
      date: new Date().toISOString().slice(0, 10),
    });

    setIsExpenseOpen(false);
    setExpenseData({
      category: 'Dealer & Staff Wages',
      amount: 300,
      description: '',
      paidTo: '',
      paymentMethod: 'Cash',
    });
  };

  const selectedTournamentObj = tournaments.find(t => t.id === entryFormData.tournamentId);

  return (
    <div className="staff-mobile-portal">

      {/* ── Station Banner ─────────────────────────────────── */}
      <div className="staff-station-banner">
        <div className="staff-banner-left">
          <span className="staff-banner-role">♦ Cashier Station</span>
          <span className="staff-banner-name">{staffName}</span>
        </div>
        <div className="staff-banner-right">
          {pendingChipOrdersCount > 0 && (
            <span style={{
              background: 'rgba(225,29,72,0.18)',
              border: '1px solid rgba(225,29,72,0.5)',
              borderRadius: '999px',
              padding: '3px 8px',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#fca5a5',
            }}>
              {pendingChipOrdersCount} chip orders
            </span>
          )}
          <span className="staff-live-dot cashier">On Duty</span>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────── */}
      <div className="staff-scroll-area">

      {/* TAB 1: MAIN CASHIER DASHBOARD */}
      {activeTab === 'dashboard' && (
        <>
          {/* Top KPI Cards */}
          <div className="m-stats-grid">
            <div className="m-stat-card" style={{ borderColor: 'rgba(225, 29, 72, 0.4)' }}>
              <span className="m-stat-label">Active Tournaments</span>
              <span className="m-stat-val" style={{ color: '#ffffff' }}>
                {activeTournaments.length}
              </span>
              <span className="m-stat-sub">Live & Registering</span>
            </div>

            <div className="m-stat-card" style={{ borderColor: pendingChipOrdersCount > 0 ? 'var(--border-red)' : 'rgba(255, 255, 255, 0.2)' }}>
              <span className="m-stat-label">Table Chip Orders</span>
              <span className="m-stat-val" style={{ color: '#ffffff' }}>
                {chipRequests.length}
              </span>
              <span className="m-stat-sub">{pendingChipOrdersCount} Pending Dispatch</span>
            </div>
          </div>

          <div className="m-stats-grid">
            <div className="m-stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <span className="m-stat-label">Registered Members</span>
              <span className="m-stat-val" style={{ color: '#ffffff' }}>
                {players.length}
              </span>
              <span className="m-stat-sub">{players.filter(p => p.kycStatus === 'verified').length} KYC Verified</span>
            </div>

            <div className="m-stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
              <span className="m-stat-label">Today's Check-ins</span>
              <span className="m-stat-val" style={{ color: '#34d399' }}>
                {players.filter(p => hasPlayerCheckedInToday(p.id)).length}
              </span>
              <span className="m-stat-sub">Active in Club</span>
            </div>
          </div>

          {/* Real-Time Table Chip Orders Card */}
          <div
            className="m-card"
            style={{
              border: pendingChipOrdersCount > 0 ? '1.5px solid #e11d48' : '1px solid var(--border-subtle)',
              background: pendingChipOrdersCount > 0 ? 'linear-gradient(135deg, #18070b 0%, #0d0305 100%)' : undefined,
              boxShadow: pendingChipOrdersCount > 0 ? '0 4px 20px rgba(225, 29, 72, 0.25)' : undefined,
            }}
          >
            <div className="m-card-header">
              <span className="m-card-title" style={{ color: pendingChipOrdersCount > 0 ? '#ffffff' : undefined }}>
                <Coins size={18} color="#e11d48" />
                Live Table Chip Requests
              </span>
              {pendingChipOrdersCount > 0 ? (
                <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                  <span className="badge-dot" /> {pendingChipOrdersCount} Pending Dispatch
                </span>
              ) : (
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={12} /> All Clear
                </span>
              )}
            </div>

            {chipRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', padding: '6px 0' }}>
                No active table chip requests right now. When seated players order chips, they appear here for 1-tap dispatch.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chipRequests
                  .filter(r => r.status === 'pending')
                  .map(req => (
                    <div
                      key={req.id}
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        border: '1px solid rgba(225, 29, 72, 0.4)',
                        borderRadius: '12px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>
                            {req.playerName}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--gold-light)' }}>
                            {req.tableNumber} • {req.seatNumber}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#ffffff' }}>
                            ₹{formatINR(req.amount)}
                          </div>
                          <span className="badge badge-secondary" style={{ fontSize: '0.66rem' }}>
                            {req.paymentMethod}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <button
                          className="m-btn m-btn-primary m-btn-sm"
                          style={{ flex: 1, padding: '8px' }}
                          onClick={() => fulfillChipRequest(req.id)}
                        >
                          <Check size={14} /> Fulfill & Dispatch
                        </button>
                        <button
                          className="m-btn m-btn-secondary m-btn-sm"
                          style={{ width: 'auto', padding: '8px 12px', color: '#fca5a5' }}
                          onClick={() => cancelChipRequest(req.id, 'Cancelled on mobile')}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Quick Action Strip */}
          <div>
            <p className="staff-section-title">Cashier Operations</p>
            <div className="staff-quick-actions" style={{ marginTop: '8px' }}>
              <button type="button" className="staff-quick-btn entry" onClick={() => setActiveTab('players')}>
                <div className="staff-quick-icon"><Users size={20} /></div>
                Tourney Entry
              </button>
              <button type="button" className="staff-quick-btn tourney" onClick={() => setIsCreateTrnOpen(true)}>
                <div className="staff-quick-icon"><Trophy size={20} /></div>
                New Tournament
              </button>
              <button type="button" className="staff-quick-btn chips" onClick={() => setActiveTab('chips')}>
                <div className="staff-quick-icon"><Coins size={20} /></div>
                Chip Orders
              </button>
              <button type="button" className="staff-quick-btn records" onClick={() => setActiveTab('records')}>
                <div className="staff-quick-icon"><Receipt size={20} /></div>
                Vouchers
              </button>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: REGISTER PLAYER FOR TOURNAMENT */}
      {activeTab === 'players' && (
        <div className="m-card">
          <div className="m-card-header">
            <div>
              <h3 className="m-card-title">
                <Users size={18} color="#ffffff" />
                Tournament Player Entry & Billing
              </h3>
              <p className="m-card-subtitle">Collect buy-in & generate official entry voucher</p>
            </div>
          </div>

          <form onSubmit={handleRegisterPlayer} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="m-form-group">
              <label className="m-form-label" htmlFor="entry-tournament">Select Tournament *</label>
              <select
                id="entry-tournament"
                className="m-select"
                value={entryFormData.tournamentId}
                onChange={e => setEntryFormData({ ...entryFormData, tournamentId: e.target.value })}
              >
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>
                    {formatClubLabel(t.name)} ({formatCurrency(t.buyInFee + t.clubRake)})
                  </option>
                ))}
              </select>
            </div>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="entry-player">Select Registered Player *</label>
              <select
                id="entry-player"
                className="m-select"
                value={entryFormData.playerId}
                onChange={e => setEntryFormData({ ...entryFormData, playerId: e.target.value })}
              >
                {players.map(p => {
                  const isChecked = hasPlayerCheckedInToday(p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id}) {isChecked ? '— Checked in' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedTournamentObj && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '12px',
                  padding: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Buy-in + House Rake:</span>
                  <span style={{ fontWeight: 800, color: 'var(--gold-light)' }}>
                    {formatCurrency(selectedTournamentObj.buyInFee + selectedTournamentObj.clubRake)}
                  </span>
                </div>
              </div>
            )}

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="entry-payment-method">Payment Method</label>
              <select
                id="entry-payment-method"
                className="m-select"
                value={entryFormData.paymentMethod}
                onChange={e => setEntryFormData({ ...entryFormData, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="Cash">Cash at Counter</option>
                <option value="Bank Transfer">Bank Wire</option>
                <option value="Credit/Debit Card">Credit/Debit Card</option>
                <option value="Chips">Chips</option>
                <option value="UPI/Digital">UPI / Digital</option>
              </select>
            </div>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="entry-payment-reference">Payment Ref / Txn ID</label>
              <input
                id="entry-payment-reference"
                type="text"
                className="m-input"
                placeholder="e.g. CSH-9921 or UPI Ref"
                value={entryFormData.paymentRef}
                onChange={e => setEntryFormData({ ...entryFormData, paymentRef: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="m-form-group">
                <label className="m-form-label" htmlFor="entry-table">Table #</label>
                <input
                  id="entry-table"
                  type="text"
                  className="m-input"
                  value={entryFormData.tableNum}
                  onChange={e => setEntryFormData({ ...entryFormData, tableNum: e.target.value })}
                />
              </div>

              <div className="m-form-group">
                <label className="m-form-label" htmlFor="entry-seat">Seat #</label>
                <input
                  id="entry-seat"
                  type="text"
                  className="m-input"
                  value={entryFormData.seatNum}
                  onChange={e => setEntryFormData({ ...entryFormData, seatNum: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="m-btn m-btn-primary" style={{ marginTop: '6px' }}>
              <Receipt size={18} /> Confirm Entry & Generate Receipt
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: TOURNAMENTS */}
      {activeTab === 'tournaments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="m-card">
            <div className="m-card-header">
              <div>
                <h3 className="m-card-title">
                  <Trophy size={18} color="#ffffff" />
                  Tournaments & Events
                </h3>
                <p className="m-card-subtitle">{tournaments.length} Tournaments active</p>
              </div>
              <button
                className="m-btn m-btn-primary m-btn-sm"
                style={{ width: 'auto' }}
                onClick={() => setIsCreateTrnOpen(true)}
              >
                <Plus size={14} /> Create
              </button>
            </div>
          </div>

          {tournaments.map(trn => {
            const trnEntries = entries.filter(e => e.tournamentId === trn.id);
            return (
              <div key={trn.id} className="m-card">
                <div className="m-card-header">
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--gold-light)' }}>
                      {trn.id}
                    </span>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>{formatClubLabel(trn.name)}</h4>
                  </div>
                  <TournamentStatusBadge status={trn.status} />
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Buy-in + Rake:</span>
                    <span style={{ fontWeight: 700, color: 'var(--gold-light)' }}>
                      {formatCurrency(trn.buyInFee)} + {formatCurrency(trn.clubRake)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Guaranteed Pool:</span>
                    <span style={{ fontWeight: 800, color: '#ffffff' }}>{formatCurrency(trn.guaranteedPrizePool)} GTD</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Players Enrolled:</span>
                    <span>{trnEntries.length} / {trn.maxSeats} Seats</span>
                  </div>
                </div>

                <button
                  className="m-btn m-btn-emerald m-btn-sm"
                  onClick={() => {
                    setEntryFormData(prev => ({ ...prev, tournamentId: trn.id }));
                    setActiveTab('players');
                  }}
                >
                  <Plus size={14} /> Register Player for This Event
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: CHIP ORDERS & DISPATCH */}
      {activeTab === 'chips' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="m-card">
            <div className="m-card-header">
              <div>
                <h3 className="m-card-title">
                  <Coins size={18} color="#e11d48" />
                  Table Chip Requests ({chipRequests.length})
                </h3>
                <p className="m-card-subtitle">Real-time table chip orders dispatched to seated players</p>
              </div>
              {pendingChipOrdersCount > 0 ? (
                <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                  <span className="badge-dot" /> {pendingChipOrdersCount} Pending
                </span>
              ) : (
                <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={12} /> All Clear
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chipRequests.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', padding: '12px 0', textAlign: 'center' }}>
                  No table chip requests yet.
                </div>
              ) : (
                chipRequests.map(req => (
                  <div
                    key={req.id}
                    style={{
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: req.status === 'pending' ? '1.5px solid rgba(225, 29, 72, 0.6)' : '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                          {req.playerName}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--gold-light)' }}>
                          {req.tableNumber} • {req.seatNumber}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#ffffff' }}>
                          ₹{formatINR(req.amount)}
                        </div>
                        <span className={`badge ${req.status === 'pending' ? 'badge-warning' : req.status === 'delivered' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.66rem' }}>
                          {req.status === 'pending' ? 'Pending' : req.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                        </span>
                      </div>
                    </div>

                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button
                          className="m-btn m-btn-primary m-btn-sm"
                          style={{ flex: 1, padding: '8px' }}
                          onClick={() => fulfillChipRequest(req.id)}
                        >
                          <Check size={14} /> Fulfill & Dispatch
                        </button>
                        <button
                          className="m-btn m-btn-secondary m-btn-sm"
                          style={{ width: 'auto', padding: '8px 12px', color: '#fca5a5' }}
                          onClick={() => cancelChipRequest(req.id, 'Cancelled on mobile')}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BILLING RECORDS & VOUCHERS */}
      {activeTab === 'records' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-card">
            <h3 className="m-card-title">
              <Receipt size={18} color="#ffffff" />
              Issued Payment Receipts ({entries.length})
            </h3>
            <p className="m-card-subtitle">Tap any voucher to preview or print</p>
          </div>

          {entries.map(e => {
            const playerObj = players.find(p => p.id === e.playerId);
            const tournamentObj = tournaments.find(t => t.name === e.tournamentName);

            const invoiceData: ClubInvoiceData = {
              invoiceNumber: e.receiptNumber,
              invoiceDate: e.registeredAt,
              category: 'Tournament Entry & Rake',
              playerId: e.playerId,
              playerName: e.playerName,
              playerPhone: e.playerPhone || playerObj?.phone,
              playerEmail: playerObj?.email,
              govtIdType: playerObj?.kyc.govtIdType,
              govtIdNumber: playerObj?.kyc.govtIdNumber,
              membershipTier: playerObj?.membershipTier,
              tableLocation: `${e.tableNumber} • ${e.seatNumber}`,
              items: [
                {
                  description: `${formatClubLabel(e.tournamentName)} - Tournament Buy-in Stack`,
                  details: `${tournamentObj?.startingChips?.toLocaleString() || '50,000'} Starting Playing Chips`,
                  chips: tournamentObj?.startingChips || 50000,
                  amount: e.buyInAmount,
                },
                {
                  description: 'House Operating Rake & Registration Fee',
                  details: 'Club tournament organization & dealer rake fee',
                  amount: e.rakeAmount,
                },
              ],
              subtotal: e.buyInAmount,
              rakeOrFee: e.rakeAmount,
              totalAmount: e.buyInAmount + e.rakeAmount,
              paymentMethod: e.paymentMethod,
              paymentReference: e.paymentReference,
              cashierName: e.cashierName || staffName,
            };

            return (
              <button
                key={e.id}
                type="button"
                className="m-list-card m-list-button"
                onClick={() => setSelectedInvoice(invoiceData)}
              >
                <div className="m-list-row">
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--gold-light)', fontSize: '0.8rem' }}>
                    {e.receiptNumber}
                  </span>
                  <span className="tabular-num" style={{ fontWeight: 800, color: '#ffffff' }}>
                    {formatCurrency(e.buyInAmount + e.rakeAmount)}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{e.playerName}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{formatClubLabel(e.tournamentName)}</div>
                <div className="m-list-row" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  <span>{e.tableNumber} • {e.seatNumber}</span>
                  <span className="staff-inline-link">View invoice <ChevronRight size={14} /></span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* DRAWERS / MODALS */}

      {/* 1. Cash In Drawer */}
      <MobileBottomDrawer
        isOpen={isCashInOpen}
        onClose={() => setIsCashInOpen(false)}
        title="Record cash received"
        subtitle="Record money coming into the cashier drawer"
      >
        <form onSubmit={handleCashInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-form-group">
            <label className="m-form-label">Category</label>
            <select
              className="m-select"
              value={cashInData.category}
              onChange={e => setCashInData({ ...cashInData, category: e.target.value as CashCategory })}
            >
              <option value="Tournament Buy-in">Tournament Buy-in</option>
              <option value="Cash Game Buy-in">Cash Game Buy-in</option>
              <option value="Chip Purchase">Chip Purchase</option>
              <option value="Float Deposit">Vault Float Deposit</option>
              <option value="Table Rake">Table Rake</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="cash-in-amount">Amount (₹) *</label>
            <input
              id="cash-in-amount"
              type="number"
              className="m-input"
              value={cashInData.amount}
              onChange={e => setCashInData({ ...cashInData, amount: Number(e.target.value) })}
              required
              min="1"
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Payment Method</label>
            <select
              className="m-select"
              value={cashInData.paymentMethod}
              onChange={e => setCashInData({ ...cashInData, paymentMethod: e.target.value as PaymentMethod })}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit/Debit Card">Credit/Debit Card</option>
              <option value="Chips">Chips</option>
              <option value="UPI/Digital">UPI / Digital</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="cash-in-description">Description</label>
            <textarea
              id="cash-in-description"
              className="m-textarea"
              rows={2}
              placeholder="Optional note for the ledger"
              value={cashInData.description}
              onChange={e => setCashInData({ ...cashInData, description: e.target.value })}
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Player Name (Optional)</label>
            <input
              type="text"
              className="m-input"
              placeholder="e.g. Vikram Malhotra"
              value={cashInData.playerName}
              onChange={e => setCashInData({ ...cashInData, playerName: e.target.value })}
            />
          </div>

          <button type="submit" className="m-btn m-btn-emerald" style={{ marginTop: '8px' }}>
            <Plus size={18} /> Record Cash Received
          </button>
        </form>
      </MobileBottomDrawer>

      {/* 2. Cash Out Drawer */}
      <MobileBottomDrawer
        isOpen={isCashOutOpen}
        onClose={() => setIsCashOutOpen(false)}
        title="Record cash payout"
        subtitle="Record money going out from cashier drawer"
      >
        <form onSubmit={handleCashOutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-form-group">
            <label className="m-form-label">Category</label>
            <select
              className="m-select"
              value={cashOutData.category}
              onChange={e => setCashOutData({ ...cashOutData, category: e.target.value as CashCategory })}
            >
              <option value="Tournament Prize Payout">Tournament Prize Payout</option>
              <option value="Cash Game Cash-out">Cash Game Cash-out</option>
              <option value="Player Cash Withdrawal">Player Cash Withdrawal</option>
              <option value="Float Withdrawal">Float Withdrawal</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="cash-out-amount">Amount (₹) *</label>
            <input
              id="cash-out-amount"
              type="number"
              className="m-input"
              value={cashOutData.amount}
              onChange={e => setCashOutData({ ...cashOutData, amount: Number(e.target.value) })}
              required
              min="1"
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="cash-out-method">Payment Method</label>
            <select
              id="cash-out-method"
              className="m-select"
              value={cashOutData.paymentMethod}
              onChange={e => setCashOutData({ ...cashOutData, paymentMethod: e.target.value as PaymentMethod })}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit/Debit Card">Credit / Debit Card</option>
              <option value="UPI/Digital">UPI / Digital</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="cash-out-description">Description</label>
            <textarea
              id="cash-out-description"
              className="m-textarea"
              rows={2}
              placeholder="Optional payout note"
              value={cashOutData.description}
              onChange={e => setCashOutData({ ...cashOutData, description: e.target.value })}
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Recipient Player</label>
            <input
              type="text"
              className="m-input"
              placeholder="e.g. Sophia Chen"
              value={cashOutData.playerName}
              onChange={e => setCashOutData({ ...cashOutData, playerName: e.target.value })}
            />
          </div>

          <button type="submit" className="m-btn m-btn-danger" style={{ marginTop: '8px' }}>
            <Minus size={18} /> Record Cash Out Payout
          </button>
        </form>
      </MobileBottomDrawer>

      {/* 3. Create Tournament Drawer */}
      <MobileBottomDrawer
        isOpen={isCreateTrnOpen}
        onClose={() => setIsCreateTrnOpen(false)}
        title="Create New Tournament"
        subtitle="Configure event structure"
      >
        <form onSubmit={handleCreateTournament} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-form-group">
            <label className="m-form-label" htmlFor="tournament-name">Tournament Name *</label>
            <input
              id="tournament-name"
              type="text"
              className="m-input"
              placeholder="e.g. Saturday Night Bounty"
              value={trnFormData.name}
              onChange={e => setTrnFormData({ ...trnFormData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="m-form-group">
              <label className="m-form-label" htmlFor="tournament-buyin">Buy-in (₹) *</label>
              <input
                id="tournament-buyin"
                type="number"
                className="m-input"
                value={trnFormData.buyInFee}
                onChange={e => setTrnFormData({ ...trnFormData, buyInFee: Number(e.target.value) })}
                required
              />
            </div>
            <div className="m-form-group">
              <label className="m-form-label" htmlFor="tournament-rake">Rake (₹) *</label>
              <input
                id="tournament-rake"
                type="number"
                className="m-input"
                value={trnFormData.clubRake}
                onChange={e => setTrnFormData({ ...trnFormData, clubRake: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="m-form-group">
              <label className="m-form-label" htmlFor="tournament-pool">Guaranteed Pool (₹)</label>
              <input
                id="tournament-pool"
                type="number"
                className="m-input"
                value={trnFormData.guaranteedPrizePool}
                onChange={e => setTrnFormData({ ...trnFormData, guaranteedPrizePool: Number(e.target.value) })}
              />
            </div>
            <div className="m-form-group">
              <label className="m-form-label" htmlFor="tournament-stack">Starting Stack</label>
              <input
                id="tournament-stack"
                type="number"
                className="m-input"
                value={trnFormData.startingChips}
                onChange={e => setTrnFormData({ ...trnFormData, startingChips: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div className="m-form-group">
              <label className="m-form-label" htmlFor="tournament-seats">Maximum Seats</label>
              <input id="tournament-seats" type="number" className="m-input" min="2" value={trnFormData.maxSeats} onChange={e => setTrnFormData({ ...trnFormData, maxSeats: Number(e.target.value) })} />
            </div>
            <div className="m-form-group">
              <label className="m-form-label" htmlFor="tournament-blinds">Blind Level (min)</label>
              <input id="tournament-blinds" type="number" className="m-input" min="1" value={trnFormData.blindLevelsMinutes} onChange={e => setTrnFormData({ ...trnFormData, blindLevelsMinutes: Number(e.target.value) })} />
            </div>
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="tournament-start">Start Time</label>
            <input id="tournament-start" type="datetime-local" className="m-input" value={trnFormData.startTime} onChange={e => setTrnFormData({ ...trnFormData, startTime: e.target.value })} />
          </div>

          <button type="submit" className="m-btn m-btn-primary" style={{ marginTop: '8px' }}>
            <Plus size={18} /> Create Tournament
          </button>
        </form>
      </MobileBottomDrawer>

      {/* 4. Add Expense Drawer */}
      <MobileBottomDrawer
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        title="Record Club Expense"
        subtitle="Record dealer wages, rent, refreshments, supplies"
      >
        <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-form-group">
            <label className="m-form-label">Category</label>
            <select
              className="m-select"
              value={expenseData.category}
              onChange={e => setExpenseData({ ...expenseData, category: e.target.value as ExpenseCategory })}
            >
              <option value="Dealer & Staff Wages">Dealer & Staff Wages</option>
              <option value="Rent & Utilities">Rent & Utilities</option>
              <option value="Cards, Chips & Tables">Cards, Chips & Tables</option>
              <option value="Refreshments & F&B">Refreshments & F&B</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="cashier-expense-amount">Amount (₹) *</label>
            <input
              id="cashier-expense-amount"
              type="number"
              className="m-input"
              value={expenseData.amount}
              onChange={e => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="cashier-expense-description">Description</label>
            <textarea
              id="cashier-expense-description"
              className="m-textarea"
              rows={2}
              placeholder="What was this payment for?"
              value={expenseData.description}
              onChange={e => setExpenseData({ ...expenseData, description: e.target.value })}
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="cashier-expense-method">Payment Method</label>
            <select id="cashier-expense-method" className="m-select" value={expenseData.paymentMethod} onChange={e => setExpenseData({ ...expenseData, paymentMethod: e.target.value as PaymentMethod })}>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit/Debit Card">Credit / Debit Card</option>
              <option value="UPI/Digital">UPI / Digital</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Paid To</label>
            <input
              type="text"
              className="m-input"
              placeholder="e.g. Floor Crew"
              value={expenseData.paidTo}
              onChange={e => setExpenseData({ ...expenseData, paidTo: e.target.value })}
            />
          </div>

          <button type="submit" className="m-btn m-btn-primary" style={{ marginTop: '8px' }}>
            <Receipt size={18} /> Record Expense
          </button>
        </form>
      </MobileBottomDrawer>

      {/* Official Tax / Billing Invoice Modal */}
      <ClubTaxInvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Cashier portal sections">
        <button
          className={`nav-tab-item cashier-color ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span className="nav-tab-label">Dashboard</span>
        </button>

        <button
          className={`nav-tab-item cashier-color ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          <Users size={20} />
          <span className="nav-tab-label">Entries</span>
        </button>

        <button
          className={`nav-tab-item cashier-color ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          <Trophy size={20} />
          <span className="nav-tab-label">Tourneys</span>
        </button>

        <button
          className={`nav-tab-item cashier-color ${activeTab === 'chips' ? 'active' : ''}`}
          onClick={() => setActiveTab('chips')}
        >
          <Coins size={20} />
          {pendingChipOrdersCount > 0 && <span className="nav-badge">{pendingChipOrdersCount}</span>}
          <span className="nav-tab-label">Chips</span>
        </button>

        <button
          className={`nav-tab-item cashier-color ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <Receipt size={20} />
          <span className="nav-tab-label">Vouchers</span>
        </button>
      </nav>

      </div>{/* end staff-scroll-area */}
    </div>
  );
};
