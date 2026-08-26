import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Receipt,
  Plus,
  Minus,
  Coins,
  Check,
  ChevronRight,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Wallet,
  Smartphone,
  Landmark,
  DollarSign,
  Eye,
  Calendar,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { TournamentStatus, PaymentMethod, CashCategory, ExpenseCategory, TournamentEntry, CashTransaction, Expense } from '../../types';
import { formatClubLabel, formatCurrency, formatINR, formatPlayerNumber, formatDateOnly, formatTimeOnly, getTodayDateString, formatSessionLabel, isTimestampInCurrentSession } from '../../utils/formatters';
import { TournamentStatusBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { generateCashTransactionInvoice } from '../../utils/invoiceGenerator';
import confetti from 'canvas-confetti';

const DEFAULT_TOURNAMENT_START = new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16);

export const MobileCashierPortal: React.FC = () => {
  const {
    staffName,
    logoutStaff,
    tournaments,
    entries,
    players,
    chipRequests,
    pendingChipOrdersCount,
    fulfillChipRequest,
    cancelChipRequest,
    createTournament,
    registerPlayerForTournament,
    deleteTournamentEntry,
    deleteCashTransaction,
    deleteExpense,
    addCashReceived,
    addCashGiven,
    addExpense,
    hasPlayerCheckedInToday,
    isRealtimeConnected,
    syncNow,
    todayEntries,
    todayCashTransactions,
    todayExpenses,
    todayPhysicalCashBalance,
    todayUpiBalance,
    todayBankBalance,
    todayCardBalance,
    todayTotalBalance,
    todayPhysicalCashIn,
    todayPhysicalCashOut,
    todayUpiIn,
    todayUpiOut,
    todayBankIn,
    todayBankOut,
  } = useClub();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'chips' | 'players' | 'tournaments' | 'today-ledger'>('dashboard');
  const [chipFilter, setChipFilter] = useState<'pending' | 'all' | 'delivered' | 'cancelled'>('pending');
  const [ledgerChannelFilter, setLedgerChannelFilter] = useState<'all' | PaymentMethod>('all');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'tournament' | 'cash_in' | 'cash_out' | 'expense'>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals / Drawers State
  const [isCashInOpen, setIsCashInOpen] = useState(false);
  const [isCashOutOpen, setIsCashOutOpen] = useState(false);
  const [isCreateTrnOpen, setIsCreateTrnOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

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
  });
  const [quickPlayerId, setQuickPlayerId] = useState('');

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
  const todayStr = getTodayDateString();

  // Combine all today's items into a single unified stream for the cashier
  const unifiedTodayItems = useMemo(() => {
    const list: Array<{
      id: string;
      sourceType: 'tournament_entry' | 'cash_in' | 'cash_out' | 'expense';
      title: string;
      category: string;
      description: string;
      amount: number;
      paymentMethod: PaymentMethod;
      playerName?: string;
      reference?: string;
      timestamp: string;
      entryObj?: TournamentEntry;
      cashTxnObj?: CashTransaction;
      expenseObj?: Expense;
    }> = [];

    todayEntries.forEach(entry => {
      list.push({
        id: entry.id,
        sourceType: 'tournament_entry',
        title: `Tournament Entry: ${formatClubLabel(entry.tournamentName)}`,
        category: 'Tournament Entry',
        description: `Receipt #${entry.receiptNumber} · Seat ${entry.seatNumber || 'Assigned'}`,
        amount: entry.buyInAmount + entry.rakeAmount,
        paymentMethod: entry.paymentMethod,
        playerName: entry.playerName,
        reference: entry.paymentReference,
        timestamp: entry.registeredAt,
        entryObj: entry,
      });
    });

    todayCashTransactions.forEach(txn => {
      list.push({
        id: txn.id,
        sourceType: txn.type === 'in' ? 'cash_in' : 'cash_out',
        title: txn.category,
        category: txn.type === 'in' ? 'Cash In / Gate Fee' : 'Cash Out / Payout',
        description: txn.description || `${txn.category} transaction`,
        amount: txn.amount,
        paymentMethod: txn.paymentMethod,
        playerName: txn.playerName,
        reference: txn.referenceId,
        timestamp: txn.timestamp,
        cashTxnObj: txn,
      });
    });

    todayExpenses.forEach(exp => {
      list.push({
        id: exp.id,
        sourceType: 'expense',
        title: `Expense: ${exp.category}`,
        category: 'Club Expense',
        description: `${exp.description} (Paid to: ${exp.paidTo || 'N/A'})`,
        amount: exp.amount,
        paymentMethod: exp.paymentMethod,
        reference: `EXP-${exp.id}`,
        timestamp: `${exp.date}T12:00:00.000Z`,
        expenseObj: exp,
      });
    });

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [todayEntries, todayCashTransactions, todayExpenses]);

  const filteredTodayItems = useMemo(() => {
    return unifiedTodayItems.filter(item => {
      if (ledgerChannelFilter !== 'all' && item.paymentMethod !== ledgerChannelFilter) return false;
      if (ledgerTypeFilter === 'tournament' && item.sourceType !== 'tournament_entry') return false;
      if (ledgerTypeFilter === 'cash_in' && item.sourceType !== 'cash_in') return false;
      if (ledgerTypeFilter === 'cash_out' && item.sourceType !== 'cash_out') return false;
      if (ledgerTypeFilter === 'expense' && item.sourceType !== 'expense') return false;
      return true;
    });
  }, [unifiedTodayItems, ledgerChannelFilter, ledgerTypeFilter]);

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
    });

    const playerObj = players.find(p => p.id === entryFormData.playerId);
    const tournamentObj = tournaments.find(t => t.id === entryFormData.tournamentId);

    const invoiceData: ClubInvoiceData = {
      invoiceNumber: entry.receiptNumber,
      invoiceDate: entry.registeredAt,
      category: 'Tournament Entry & Service Charge',
      playerId: playerObj ? formatPlayerNumber(playerObj) : undefined,
      playerName: entry.playerName,
      playerPhone: playerObj?.phone,
      playerEmail: playerObj?.email,
      govtIdType: playerObj?.kyc.govtIdType,
      govtIdNumber: playerObj?.kyc.govtIdNumber,
      membershipTier: playerObj?.membershipTier,
      tableLocation: 'Tournament entry',
      items: [
        {
          description: `${formatClubLabel(entry.tournamentName)} - Tournament Entry Charge`,
          details: `${tournamentObj?.startingChips?.toLocaleString()} Starting Playing Chips`,
          chips: tournamentObj?.startingChips,
          amount: entry.buyInAmount,
        },
        {
          description: 'Tournament Service Charge',
          details: 'Club tournament organization and dealer service',
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
    <div className="staff-mobile-portal cashier-mobile-theme">

      <div className="cashier-session-strip">
        <div className="cashier-session-person">
          <span className="cashier-session-avatar" aria-hidden="true">{staffName.charAt(0)}</span>
          <span><strong>{staffName}</strong><small><span /> Cashier on duty</small></span>
        </div>
        <div className="cashier-session-actions">
          {pendingChipOrdersCount > 0 && (
            <button type="button" onClick={() => setActiveTab('chips')}>
              <Coins size={14} /> {pendingChipOrdersCount} waiting
            </button>
          )}
          <button
            type="button"
            className="staff-header-signout"
            onClick={logoutStaff}
            aria-label="Sign out of staff portal"
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────── */}
      <div className="staff-scroll-area">

      {activeTab !== 'dashboard' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', background: 'rgba(225, 29, 72, 0.12)', padding: '8px 12px', borderRadius: '10px', border: '1px solid rgba(225, 29, 72, 0.3)' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}
            onClick={() => setActiveTab('dashboard')}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fda4af', textTransform: 'capitalize' }}>
            {activeTab === 'chips' ? 'Chip Dispatch' : activeTab === 'players' ? 'Tournament Entry' : activeTab === 'tournaments' ? 'Events' : 'Cash Desk'}
          </span>
        </div>
      )}

      {/* TAB 1: MAIN CASHIER DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="cashier-dashboard-clean">
          <section className="cashier-dashboard-intro">
            <span>Cashier workspace</span>
            <h1>What do you need to do?</h1>
            <p>Create events, register players and run the cash desk.</p>
          </section>

          {/* Today's Shift Balances (Physical Cash, UPI, Bank, Total) */}
          <section className="m-card" style={{ padding: '14px', background: 'linear-gradient(135deg, rgba(24, 10, 15, 0.95) 0%, rgba(12, 4, 8, 0.98) 100%)', border: '1.5px solid rgba(225, 29, 72, 0.45)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: '#fda4af' }}>
                <Calendar size={14} />
                <span>Session: {formatSessionLabel(todayStr)}</span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                onClick={() => setActiveTab('today-ledger')}
              >
                View Log ({unifiedTodayItems.length})
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {/* 1. Physical Cash */}
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700 }}>
                  <Wallet size={12} /> 💵 Cash in Hand
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--gold-light)', marginTop: '2px' }}>
                  {formatCurrency(todayPhysicalCashBalance)}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  +{formatCurrency(todayPhysicalCashIn)} / -{formatCurrency(todayPhysicalCashOut)}
                </div>
              </div>

              {/* 2. UPI / Digital */}
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
                  <Smartphone size={12} /> 📱 UPI / QR
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
                  {formatCurrency(todayUpiBalance)}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  +{formatCurrency(todayUpiIn)} / -{formatCurrency(todayUpiOut)}
                </div>
              </div>

              {/* 3. Bank Wire */}
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#c084fc', fontWeight: 700 }}>
                  <Landmark size={12} /> 🏦 Bank Wire
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#c084fc', marginTop: '2px' }}>
                  {formatCurrency(todayBankBalance)}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  +{formatCurrency(todayBankIn)} / -{formatCurrency(todayBankOut)}
                </div>
              </div>

              {/* 4. Total Shift Liquidity */}
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
                  <DollarSign size={12} /> 💎 Shift Total
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#34d399', marginTop: '2px' }}>
                  {formatCurrency(todayTotalBalance)}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  Net shift collection
                </div>
              </div>
            </div>
          </section>

          <section className="cashier-core-actions" aria-label="Main cashier jobs">
            <span>Main jobs</span>
            <button type="button" className="cashier-primary-action" onClick={() => setIsCreateTrnOpen(true)}>
              <span className="cashier-primary-icon"><Trophy size={24} /></span>
              <span><small>Core job</small><strong>Create tournament</strong><em>Set entry charge, service charge, structure and start time</em></span>
              <ChevronRight size={21} />
            </button>
            <button type="button" className="cashier-primary-action" onClick={() => setActiveTab('players')}>
              <span className="cashier-primary-icon"><Users size={24} /></span>
              <span><small>Core job</small><strong>Register tournament player</strong><em>Collect the entry charge and create the receipt</em></span>
              <ChevronRight size={21} />
            </button>
            <button type="button" className="cashier-primary-action" onClick={() => setActiveTab('today-ledger')}>
              <span className="cashier-primary-icon"><Receipt size={24} /></span>
              <span><small>Daily log</small><strong>Today's transactions ({unifiedTodayItems.length})</strong><em>Entries, fees, payouts and invoices recorded today</em></span>
              <ChevronRight size={21} />
            </button>
          </section>

          <section className="cashier-dashboard-actions" aria-labelledby="cashier-quick-actions-title">
            <div className="cashier-clean-section-title">
              <h2 id="cashier-quick-actions-title">Quick actions</h2>
              <span>Everything else</span>
            </div>
            <div className="cashier-action-list">
              <button type="button" onClick={() => setActiveTab('chips')}>
                <span className="cashier-action-icon amber"><Coins size={19} /></span>
                <span><strong>Chip orders</strong><small>Review and dispatch table requests</small></span>
                {pendingChipOrdersCount > 0 && <b>{pendingChipOrdersCount}</b>}
                <ChevronRight size={18} />
              </button>
              <button type="button" onClick={() => setIsCashInOpen(true)}>
                <span className="cashier-action-icon green"><Plus size={19} /></span>
                <span><strong>Cash received</strong><small>Add money coming into the drawer</small></span>
                <ChevronRight size={18} />
              </button>
              <button type="button" onClick={() => setIsCashOutOpen(true)}>
                <span className="cashier-action-icon red"><Minus size={19} /></span>
                <span><strong>Cash payout</strong><small>Record prizes and player cash-outs</small></span>
                <ChevronRight size={18} />
              </button>
              <button type="button" onClick={() => setIsExpenseOpen(true)}>
                <span className="cashier-action-icon slate"><Receipt size={19} /></span>
                <span><strong>Club expense</strong><small>Record wages, supplies or refreshments</small></span>
                <ChevronRight size={18} />
              </button>
            </div>
          </section>

          {pendingChipOrdersCount > 0 && (
            <section className="cashier-pending-card" aria-labelledby="cashier-pending-title">
              <div className="cashier-clean-section-title">
                <div><span>Live queue</span><h2 id="cashier-pending-title">Ready to dispatch</h2></div>
                <button type="button" onClick={() => setActiveTab('chips')}>View all</button>
              </div>
              {chipRequests.filter(r => r.status === 'pending').slice(0, 1).map(req => (
                <article key={req.id}>
                  <div><strong>{req.playerName}</strong><small>{req.tableNumber} · {req.seatNumber}</small></div>
                  <div><strong>₹{formatINR(req.amount)}</strong><small>{req.paymentMethod}</small></div>
                  <button type="button" onClick={() => fulfillChipRequest(req.id)}><Check size={16} /> Dispatch chips</button>
                </article>
              ))}
            </section>
          )}

          <section className="cashier-quiet-summary" aria-label="Today's cashier summary">
            <div><span>Events</span><strong>{activeTournaments.length}</strong><small>active</small></div>
            <div><span>Members</span><strong>{players.length}</strong><small>{players.filter(p => p.kycStatus === 'verified').length} verified</small></div>
            <div><span>In club</span><strong>{players.filter(p => hasPlayerCheckedInToday(p.id)).length}</strong><small>today</small></div>
          </section>
        </div>
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
              <p className="m-card-subtitle">Collect the entry charge and register tournament entry</p>
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
              <label className="m-form-label" htmlFor="entry-player-id">Search by Player ID, Name, or Phone</label>
              <input
                id="entry-player-id"
                type="text"
                className="m-input"
                placeholder="Type Player ID (e.g. 7 or MEM-001), phone, or name..."
                value={quickPlayerId}
                onChange={e => {
                  const raw = e.target.value;
                  setQuickPlayerId(raw);
                  const val = raw.trim().toLowerCase();
                  if (!val) return;
                  const cleanDigits = val.replace(/\D/g, '');
                  const match = players.find(p =>
                    p.id.toLowerCase() === val ||
                    formatPlayerNumber(p).toLowerCase() === val ||
                    (cleanDigits && formatPlayerNumber(p) === cleanDigits) ||
                    (cleanDigits.length >= 4 && p.phone.replace(/\D/g, '').includes(cleanDigits)) ||
                    p.fullName.toLowerCase().includes(val)
                  );
                  if (match) setEntryFormData(current => ({ ...current, playerId: match.id }));
                }}
              />
              {quickPlayerId && (
                <div style={{ marginTop: '4px', fontSize: '0.76rem' }}>
                  {(() => {
                    const val = quickPlayerId.trim().toLowerCase();
                    const cleanDigits = val.replace(/\D/g, '');
                    const match = players.find(p =>
                      p.id.toLowerCase() === val ||
                      formatPlayerNumber(p).toLowerCase() === val ||
                      (cleanDigits && formatPlayerNumber(p) === cleanDigits) ||
                      (cleanDigits.length >= 4 && p.phone.replace(/\D/g, '').includes(cleanDigits)) ||
                      p.fullName.toLowerCase().includes(val)
                    );
                    return match ? (
                      <span style={{ color: '#86efac', fontWeight: 600 }}>
                        ✓ Found: {match.fullName} (Player ID {formatPlayerNumber(match)})
                      </span>
                    ) : (
                      <span style={{ color: '#fca5a5' }}>
                        No player found matching "{quickPlayerId}"
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="m-form-group">
              <label className="m-form-label" htmlFor="entry-player">Select Registered Player *</label>
              <select
                id="entry-player"
                className="m-select"
                value={entryFormData.playerId}
                onChange={e => {
                  const playerId = e.target.value;
                  const player = players.find(candidate => candidate.id === playerId);
                  setEntryFormData({ ...entryFormData, playerId });
                  setQuickPlayerId(player ? formatPlayerNumber(player) : '');
                }}
              >
                {players.map(p => {
                  const isChecked = hasPlayerCheckedInToday(p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (Player ID {formatPlayerNumber(p)}) {isChecked ? '— Checked in' : ''}
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
                  <span style={{ color: 'var(--text-muted)' }}>Entry Charge + Service Charge:</span>
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
                    <span style={{ color: 'var(--text-muted)' }}>Entry Charge + Service Charge:</span>
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
                    <span style={{ fontWeight: 700, color: trnEntries.length > 0 ? '#6ee7b7' : 'var(--text-muted)' }}>
                      {trnEntries.length} Players
                    </span>
                  </div>
                </div>

                {trnEntries.length > 0 && (
                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>ENROLLED PLAYERS ({trnEntries.length})</span>
                      <span style={{ fontSize: '0.68rem', color: '#34d399' }}>Live Registered</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {trnEntries.map(e => (
                        <div
                          key={e.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            gap: '8px',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {e.playerName}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                              Receipt #{e.receiptNumber || e.id} · {e.paymentMethod}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#34d399' }}>
                              {formatCurrency(e.buyInAmount + e.rakeAmount)}
                            </span>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              style={{ padding: '4px 7px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              title="Void / Remove Player Entry"
                              onClick={() => setItemToDelete({
                                id: e.id,
                                sourceType: 'tournament_entry',
                                title: `Tournament Entry: ${e.tournamentName}`,
                                description: `Player: ${e.playerName} · Receipt #${e.receiptNumber || e.id}`,
                                amount: e.buyInAmount + e.rakeAmount,
                                paymentMethod: e.paymentMethod,
                                entryObj: e,
                              })}
                            >
                              <Trash2 size={11} /> Void
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
          {/* Live Sync Status Banner */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'linear-gradient(135deg, rgba(20, 8, 12, 0.95) 0%, rgba(10, 4, 6, 0.95) 100%)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isRealtimeConnected ? '#10b981' : '#f59e0b',
                  boxShadow: isRealtimeConnected ? '0 0 8px #10b981' : 'none',
                }}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>
                {isRealtimeConnected ? 'Live Real-time Active' : 'Connecting Stream...'}
              </span>
            </div>
            <button
              className="m-btn m-btn-secondary m-btn-sm"
              style={{ padding: '4px 10px', fontSize: '0.72rem' }}
              disabled={isSyncing}
              onClick={async () => {
                setIsSyncing(true);
                try {
                  await syncNow();
                } finally {
                  setTimeout(() => setIsSyncing(false), 400);
                }
              }}
            >
              <RefreshCw size={11} className={isSyncing ? 'spin-animation' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>

          {/* Queue Filter Segment */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              onClick={() => setChipFilter('pending')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                border: chipFilter === 'pending' ? '1px solid #e11d48' : '1px solid var(--border-subtle)',
                background: chipFilter === 'pending' ? 'rgba(225, 29, 72, 0.25)' : 'rgba(255,255,255,0.03)',
                color: chipFilter === 'pending' ? '#ffffff' : '#94a3b8',
                whiteSpace: 'nowrap',
              }}
            >
              Pending ({pendingChipOrdersCount})
            </button>
            <button
              onClick={() => setChipFilter('all')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                border: chipFilter === 'all' ? '1px solid #e11d48' : '1px solid var(--border-subtle)',
                background: chipFilter === 'all' ? 'rgba(225, 29, 72, 0.25)' : 'rgba(255,255,255,0.03)',
                color: chipFilter === 'all' ? '#ffffff' : '#94a3b8',
                whiteSpace: 'nowrap',
              }}
            >
              All ({chipRequests.length})
            </button>
            <button
              onClick={() => setChipFilter('delivered')}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                border: chipFilter === 'delivered' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                background: chipFilter === 'delivered' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.03)',
                color: chipFilter === 'delivered' ? '#34d399' : '#94a3b8',
                whiteSpace: 'nowrap',
              }}
            >
              Delivered ({chipRequests.filter(r => r.status === 'delivered').length})
            </button>
          </div>

          <div className="m-card">
            <div className="m-card-header">
              <div>
                <h3 className="m-card-title">
                  <Coins size={18} color="#e11d48" />
                  Table Chip Queue
                </h3>
                <p className="m-card-subtitle">Real-time table chip orders dispatched to seated players</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chipRequests.filter(r => chipFilter === 'all' || r.status === chipFilter).length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', padding: '16px 0', textAlign: 'center' }}>
                  {chipFilter === 'pending' ? 'Active dispatch queue is clear.' : 'No orders found.'}
                </div>
              ) : (
                chipRequests
                  .filter(r => chipFilter === 'all' || r.status === chipFilter)
                  .map(req => (
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



      {/* TAB 5: TODAY'S ACTIVITY & DESK LEDGER */}
      {activeTab === 'today-ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header Card */}
          <div className="m-card">
            <div className="m-card-header">
              <div>
                <h3 className="m-card-title">
                  <Receipt size={18} color="#fbbf24" />
                  Today's Desk Transactions
                </h3>
                <p className="m-card-subtitle">
                  Session: {formatSessionLabel(todayStr)} (10:00 AM – 10:00 AM)
                </p>
              </div>
            </div>

            {/* Separated Balance Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '8px' }}>
                <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700 }}>💵 Cash in Hand</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--gold-light)' }}>{formatCurrency(todayPhysicalCashBalance)}</div>
              </div>
              <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', padding: '8px' }}>
                <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700 }}>📱 UPI / Digital</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>{formatCurrency(todayUpiBalance)}</div>
              </div>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', padding: '8px' }}>
                <span style={{ fontSize: '0.68rem', color: '#c084fc', fontWeight: 700 }}>🏦 Bank Wire</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#c084fc' }}>{formatCurrency(todayBankBalance)}</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '8px' }}>
                <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 700 }}>💎 Total Shift</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399' }}>{formatCurrency(todayTotalBalance)}</div>
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '3px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              <button
                type="button"
                className={`btn btn-sm ${ledgerTypeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLedgerTypeFilter('all')}
                style={{ fontSize: '0.72rem', padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                All ({unifiedTodayItems.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${ledgerTypeFilter === 'tournament' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLedgerTypeFilter('tournament')}
                style={{ fontSize: '0.72rem', padding: '4px 10px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                🏆 Entries ({todayEntries.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${ledgerTypeFilter === 'cash_in' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLedgerTypeFilter('cash_in')}
                style={{ fontSize: '0.72rem', padding: '4px 10px', whiteSpace: 'nowrap', color: '#34d399', flexShrink: 0 }}
              >
                + Cash In
              </button>
              <button
                type="button"
                className={`btn btn-sm ${ledgerTypeFilter === 'cash_out' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLedgerTypeFilter('cash_out')}
                style={{ fontSize: '0.72rem', padding: '4px 10px', whiteSpace: 'nowrap', color: '#f87171', flexShrink: 0 }}
              >
                - Payouts
              </button>
              <button
                type="button"
                className={`btn btn-sm ${ledgerTypeFilter === 'expense' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLedgerTypeFilter('expense')}
                style={{ fontSize: '0.72rem', padding: '4px 10px', whiteSpace: 'nowrap', color: '#fda4af', flexShrink: 0 }}
              >
                🧾 Expenses
              </button>
            </div>

            {/* Channel Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '3px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              <button
                type="button"
                className={`btn btn-sm ${ledgerChannelFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLedgerChannelFilter('all')}
                style={{ fontSize: '0.7rem', padding: '4px 9px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                All Modes
              </button>
              <button
                type="button"
                className={`btn btn-sm ${ledgerChannelFilter === 'Cash' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLedgerChannelFilter('Cash')}
                style={{ fontSize: '0.7rem', padding: '4px 9px', whiteSpace: 'nowrap', flexShrink: 0, color: ledgerChannelFilter === 'Cash' ? undefined : '#fbbf24' }}
              >
                💵 Cash ({formatCurrency(todayPhysicalCashBalance)})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${ledgerChannelFilter === 'UPI/Digital' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLedgerChannelFilter('UPI/Digital')}
                style={{ fontSize: '0.7rem', padding: '4px 9px', whiteSpace: 'nowrap', flexShrink: 0, color: ledgerChannelFilter === 'UPI/Digital' ? undefined : '#38bdf8' }}
              >
                📱 UPI ({formatCurrency(todayUpiBalance)})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${ledgerChannelFilter === 'Bank Transfer' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLedgerChannelFilter('Bank Transfer')}
                style={{ fontSize: '0.7rem', padding: '4px 9px', whiteSpace: 'nowrap', flexShrink: 0, color: ledgerChannelFilter === 'Bank Transfer' ? undefined : '#c084fc' }}
              >
                🏦 Bank ({formatCurrency(todayBankBalance)})
              </button>
            </div>
          </div>

          {/* Today's Transactions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredTodayItems.length === 0 ? (
              <div className="m-card" style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                <Receipt size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: '0.84rem' }}>No transactions recorded for today matching criteria.</p>
              </div>
            ) : (
              filteredTodayItems.map(item => (
                <div
                  key={`${item.sourceType}-${item.id}`}
                  className="m-card"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    borderLeft: `4px solid ${
                      item.sourceType === 'tournament_entry'
                        ? '#c084fc'
                        : item.sourceType === 'cash_in'
                        ? '#34d399'
                        : item.sourceType === 'cash_out'
                        ? '#f87171'
                        : '#fda4af'
                    }`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff', wordBreak: 'break-word', lineHeight: 1.3 }}>{item.title}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-word', lineHeight: 1.35 }}>{item.description}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        style={{
                          fontWeight: 900,
                          fontSize: '1rem',
                          color: (item.sourceType === 'tournament_entry' || item.sourceType === 'cash_in') ? '#34d399' : '#f87171',
                          lineHeight: 1.2,
                        }}
                      >
                        {(item.sourceType === 'tournament_entry' || item.sourceType === 'cash_in') ? '+' : '-'}
                        {formatCurrency(item.amount)}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', marginTop: '2px' }}>
                        {formatTimeOnly(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                          background: item.paymentMethod === 'Cash' ? 'rgba(251, 191, 36, 0.15)' : item.paymentMethod === 'UPI/Digital' ? 'rgba(56, 189, 248, 0.15)' : item.paymentMethod === 'Bank Transfer' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                          color: item.paymentMethod === 'Cash' ? '#fbbf24' : item.paymentMethod === 'UPI/Digital' ? '#38bdf8' : item.paymentMethod === 'Bank Transfer' ? '#c084fc' : '#34d399',
                        }}
                      >
                        {item.paymentMethod === 'Cash' ? '💵 Cash' : item.paymentMethod === 'UPI/Digital' ? '📱 UPI' : item.paymentMethod === 'Bank Transfer' ? '🏦 Bank' : '💳 Card'}
                      </span>
                      {item.playerName && (
                        <span style={{ fontSize: '0.74rem', color: '#cbd5e1', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.playerName}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      {(item.entryObj || (item.cashTxnObj && item.cashTxnObj.type === 'in')) && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.70rem', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            if (item.entryObj) {
                              const entry = item.entryObj;
                              const playerObj = players.find(p => p.id === entry.playerId);
                              const tournamentObj = tournaments.find(t => t.name === entry.tournamentName);
                              setSelectedInvoice({
                                invoiceNumber: entry.receiptNumber,
                                invoiceDate: entry.registeredAt,
                                category: 'Tournament Entry & Service Charge',
                                playerId: playerObj ? formatPlayerNumber(playerObj) : entry.playerId,
                                playerName: entry.playerName,
                                playerPhone: entry.playerPhone || playerObj?.phone,
                                playerEmail: playerObj?.email,
                                govtIdType: playerObj?.kyc.govtIdType,
                                govtIdNumber: playerObj?.kyc.govtIdNumber,
                                membershipTier: playerObj?.membershipTier,
                                tableLocation: `${entry.tableNumber || 'Assigned'} • ${entry.seatNumber || 'Assigned'}`,
                                eventName: `${formatClubLabel(entry.tournamentName)}`,
                                eventDate: `Texas • ${formatDateOnly(entry.registeredAt)} • ${formatTimeOnly(entry.registeredAt)}`,
                                eventDetails: `Texas • MTC • Table ${entry.tableNumber || 'Assigned'} • Seat ${entry.seatNumber || 'Assigned'}`,
                                items: [
                                  {
                                    description: `${formatClubLabel(entry.tournamentName)} - Player Entry Charge`,
                                    details: `${tournamentObj?.startingChips?.toLocaleString() || '50,000'} Starting Chips`,
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
                              });
                            } else if (item.cashTxnObj) {
                              const matchedPlayer = players.find(p => p.fullName.toLowerCase() === (item.cashTxnObj?.playerName || '').toLowerCase());
                              const inv = generateCashTransactionInvoice(item.cashTxnObj, matchedPlayer, staffName);
                              setSelectedInvoice(inv);
                            }
                          }}
                        >
                          <Eye size={12} /> View Bill
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '3px 8px', fontSize: '0.70rem', display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                        onClick={() => setItemToDelete(item)}
                        title="Void or delete transaction"
                      >
                        <Trash2 size={12} /> Void / Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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
              <option value="Tournament Buy-in">Tournament Entry Charge</option>
              <option value="Cash Game Buy-in">Cash Game Entry Charge</option>
              <option value="Chip Purchase">Chip Purchase</option>
              <option value="Float Deposit">Vault Float Deposit</option>
              <option value="Table Rake">Table Service Charge</option>
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
              <label className="m-form-label" htmlFor="tournament-buyin">Entry Charge (₹) *</label>
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
              <label className="m-form-label" htmlFor="tournament-rake">Service Charge (₹) *</label>
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

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="tournament-blinds">Blind Level (min)</label>
            <input id="tournament-blinds" type="number" className="m-input" min="1" value={trnFormData.blindLevelsMinutes} onChange={e => setTrnFormData({ ...trnFormData, blindLevelsMinutes: Number(e.target.value) })} />
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

      {/* Void / Delete Confirmation Drawer */}
      <MobileBottomDrawer
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Void / Delete Transaction"
        subtitle="Remove this record and reconcile shift balances"
      >
        {itemToDelete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '12px', padding: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>{itemToDelete.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#fda4af', marginTop: '2px' }}>{itemToDelete.description}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f43f5e', marginTop: '8px', fontFamily: 'var(--font-number)' }}>
                {formatCurrency(itemToDelete.amount)} • {itemToDelete.paymentMethod}
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
              Are you sure you want to void and permanently delete this entry? This will update shift cash balances and audit logs across all terminals immediately.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button type="button" className="m-btn m-btn-secondary" style={{ flex: 1 }} onClick={() => setItemToDelete(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="m-btn m-btn-primary"
                style={{ flex: 1, background: '#e11d48', borderColor: '#f43f5e' }}
                onClick={() => {
                  if (itemToDelete.sourceType === 'tournament_entry' || itemToDelete.entryObj) {
                    deleteTournamentEntry(itemToDelete.entryObj?.id || itemToDelete.id);
                  } else if (itemToDelete.sourceType === 'expense' || itemToDelete.expenseObj) {
                    deleteExpense(itemToDelete.expenseObj?.id || itemToDelete.id);
                  } else {
                    deleteCashTransaction(itemToDelete.cashTxnObj?.id || itemToDelete.id);
                  }
                  setItemToDelete(null);
                }}
              >
                <Trash2 size={16} /> Confirm Void
              </button>
            </div>
          </div>
        )}
      </MobileBottomDrawer>

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
          className={`nav-tab-item cashier-color ${activeTab === 'today-ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('today-ledger')}
        >
          <Receipt size={20} />
          {unifiedTodayItems.length > 0 && <span className="nav-badge">{unifiedTodayItems.length}</span>}
          <span className="nav-tab-label">Today's Log</span>
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
          <span className="nav-tab-label">Events</span>
        </button>

        <button
          className={`nav-tab-item cashier-color ${activeTab === 'chips' ? 'active' : ''}`}
          onClick={() => setActiveTab('chips')}
        >
          <Coins size={20} />
          {pendingChipOrdersCount > 0 && <span className="nav-badge">{pendingChipOrdersCount}</span>}
          <span className="nav-tab-label">Chips</span>
        </button>
      </nav>

      </div>{/* end staff-scroll-area */}
    </div>
  );
};
