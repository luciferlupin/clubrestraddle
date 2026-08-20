import React, { useState } from 'react';
import {
  Wallet,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  Calendar,
  Lock,
  Coins,
  History,
  LayoutDashboard,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { CashCategory, PaymentMethod, ExpenseCategory } from '../../types';
import { formatCurrency, formatShortDateTime, formatINR } from '../../utils/formatters';
import { CashFlowBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import confetti from 'canvas-confetti';

export const MobileCashPortal: React.FC = () => {
  const {
    staffName,
    cashTransactions,
    currentCashBalance,
    totalCashInAmount,
    totalCashOutAmount,
    expenses,
    totalExpensesAmount,
    netTreasuryBalance,
    addCashReceived,
    addCashGiven,
    addExpense,
  } = useClub();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'expenses'>('dashboard');

  // Drawers State
  const [isCashInOpen, setIsCashInOpen] = useState(false);
  const [isCashOutOpen, setIsCashOutOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');

  // Form State for Cash In
  const [cashInData, setCashInData] = useState({
    category: 'Tournament Buy-in' as CashCategory,
    amount: 1000,
    description: '',
    paymentMethod: 'Cash' as PaymentMethod,
    playerName: '',
  });

  // Form State for Cash Out
  const [cashOutData, setCashOutData] = useState({
    category: 'Tournament Prize Payout' as CashCategory,
    amount: 500,
    description: '',
    paymentMethod: 'Cash' as PaymentMethod,
    playerName: '',
  });

  // Form State for Expense
  const [expenseData, setExpenseData] = useState({
    category: 'Dealer & Staff Wages' as ExpenseCategory,
    amount: 300,
    description: '',
    paidTo: '',
    paymentMethod: 'Cash' as PaymentMethod,
  });

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

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#ffffff'],
      });
    } catch {
      // Fallback
    }

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

  const filteredTransactions = cashTransactions.filter(t => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      (t.playerName && t.playerName.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'in' && t.type !== 'in') return false;
    if (filterType === 'out' && t.type !== 'out') return false;
    return true;
  });

  return (
    <div className="staff-mobile-portal">
      {/* ── Station Banner ─────────────────────────────────── */}
      <div className="staff-station-banner">
        <div className="staff-banner-left">
          <span className="staff-banner-role">💰 Cash & Vault Desk</span>
          <span className="staff-banner-name">{staffName}</span>
        </div>
        <div className="staff-banner-right">
          <span className="staff-live-dot cashier">Live Vault</span>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────── */}
      <div className="staff-scroll-area">
        {/* TAB 1: DASHBOARD & QUICK ACTIONS */}
        {activeTab === 'dashboard' && (
          <>
            {/* Top KPI Cards */}
            <div className="m-stats-grid">
              <div className="m-stat-card" style={{ borderColor: 'var(--border-gold)' }}>
                <span className="m-stat-label">Current Cash Balance</span>
                <span className="m-stat-val" style={{ color: 'var(--gold-light)' }}>
                  {formatCurrency(currentCashBalance)}
                </span>
                <span className="m-stat-sub">Physical Drawer Vault Float</span>
              </div>

              <div className="m-stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                <span className="m-stat-label">Today's Collection</span>
                <span className="m-stat-val" style={{ color: '#34d399' }}>
                  +{formatCurrency(totalCashInAmount)}
                </span>
                <span className="m-stat-sub">Total Cash In Received</span>
              </div>
            </div>

            <div className="m-stats-grid">
              <div className="m-stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>
                <span className="m-stat-label">Total Payouts (Out)</span>
                <span className="m-stat-val" style={{ color: '#fca5a5' }}>
                  -{formatCurrency(totalCashOutAmount)}
                </span>
                <span className="m-stat-sub">Prizes & Cash-outs</span>
              </div>

              <div className="m-stat-card" style={{ borderColor: 'rgba(225, 29, 72, 0.4)' }}>
                <span className="m-stat-label">Net Treasury</span>
                <span className="m-stat-val" style={{ color: '#ffffff' }}>
                  {formatCurrency(netTreasuryBalance)}
                </span>
                <span className="m-stat-sub">Float − Expenses</span>
              </div>
            </div>

            {/* Quick Action Strip */}
            <div>
              <p className="staff-section-title">Cash Operations</p>
              <div className="staff-quick-actions" style={{ marginTop: '8px' }}>
                <button type="button" className="staff-quick-btn cash-in" onClick={() => setIsCashInOpen(true)}>
                  <div className="staff-quick-icon"><ArrowDownLeft size={20} /></div>
                  Cash Received
                </button>
                <button type="button" className="staff-quick-btn cash-out" onClick={() => setIsCashOutOpen(true)}>
                  <div className="staff-quick-icon"><ArrowUpRight size={20} /></div>
                  Cash Paid Out
                </button>
                <button type="button" className="staff-quick-btn expense" onClick={() => setIsExpenseOpen(true)}>
                  <div className="staff-quick-icon"><Receipt size={20} /></div>
                  Record Expense
                </button>
                <button type="button" className="staff-quick-btn records" onClick={() => setActiveTab('ledger')}>
                  <div className="staff-quick-icon"><History size={20} /></div>
                  View Ledger
                </button>
              </div>
            </div>

            {/* Recent Cash Flow Records */}
            <div className="m-card">
              <div className="m-card-header">
                <span className="m-card-title">
                  <Wallet size={16} color="#fbbf24" />
                  Recent Cash Movements
                </span>
                <button className="m-btn m-btn-ghost m-btn-sm" style={{ width: 'auto' }} onClick={() => setActiveTab('ledger')}>
                  View All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cashTransactions.slice(0, 5).map(txn => (
                  <div key={txn.id} className="m-list-card">
                    <div className="m-list-row">
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{txn.category}</span>
                      <span
                        className="tabular-num"
                        style={{ fontWeight: 800, color: txn.type === 'in' ? '#34d399' : '#fca5a5' }}
                      >
                        {txn.type === 'in' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </span>
                    </div>
                    <div className="m-list-row" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      <span>{txn.playerName || txn.paymentMethod}</span>
                      <span>{formatShortDateTime(txn.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: MASTER CASH LEDGER */}
        {activeTab === 'ledger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="m-card">
              <div className="m-card-header">
                <div>
                  <h3 className="m-card-title">
                    <DollarSign size={18} color="#fbbf24" />
                    Cash Flow Ledger ({cashTransactions.length})
                  </h3>
                  <p className="m-card-subtitle">Complete chronological record of all cash receipts and payouts</p>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="m-input"
                  style={{ paddingLeft: '38px', fontSize: '0.88rem' }}
                  placeholder="Search player, ID, category..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                <button
                  type="button"
                  className={`m-btn m-btn-sm ${filterType === 'all' ? 'm-btn-primary' : 'm-btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setFilterType('all')}
                >
                  All ({cashTransactions.length})
                </button>
                <button
                  type="button"
                  className={`m-btn m-btn-sm ${filterType === 'in' ? 'm-btn-primary' : 'm-btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setFilterType('in')}
                >
                  Cash In
                </button>
                <button
                  type="button"
                  className={`m-btn m-btn-sm ${filterType === 'out' ? 'm-btn-primary' : 'm-btn-secondary'}`}
                  style={{ flex: 1 }}
                  onClick={() => setFilterType('out')}
                >
                  Cash Out
                </button>
              </div>
            </div>

            {/* List */}
            {filteredTransactions.map(txn => (
              <div key={txn.id} className="m-list-card">
                <div className="m-list-row">
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{txn.category}</span>
                  <span
                    className="tabular-num"
                    style={{ fontWeight: 800, color: txn.type === 'in' ? '#34d399' : '#fca5a5' }}
                  >
                    {txn.type === 'in' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </span>
                </div>
                {txn.description && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{txn.description}</div>
                )}
                <div className="m-list-row" style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  <span>{txn.playerName || txn.paymentMethod} · After: {formatCurrency(txn.balanceAfter)}</span>
                  <span>{formatShortDateTime(txn.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: EXPENSES */}
        {activeTab === 'expenses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="m-card">
              <div className="m-card-header">
                <div>
                  <h3 className="m-card-title">
                    <Receipt size={18} color="#e11d48" />
                    Operating Expenses
                  </h3>
                  <p className="m-card-subtitle">Total Recorded: {formatCurrency(totalExpensesAmount)}</p>
                </div>
                <button className="m-btn m-btn-primary m-btn-sm" style={{ width: 'auto' }} onClick={() => setIsExpenseOpen(true)}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            {expenses.map(exp => (
              <div key={exp.id} className="m-list-card">
                <div className="m-list-row">
                  <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{exp.category}</span>
                  <span className="tabular-num" style={{ fontWeight: 800, color: '#fca5a5' }}>
                    -{formatCurrency(exp.amount)}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {exp.description} · Paid to: {exp.paidTo}
                </div>
                <div className="m-list-row" style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  <span>{exp.paymentMethod}</span>
                  <span>{exp.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DRAWER: CASH IN */}
      <MobileBottomDrawer
        isOpen={isCashInOpen}
        onClose={() => setIsCashInOpen(false)}
        title="Record Cash Received (In)"
        subtitle="Collect buy-in, chip purchase or float deposit"
      >
        <form onSubmit={handleCashInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-cashin-cat">Category *</label>
            <select
              id="m-cashin-cat"
              className="m-select"
              value={cashInData.category}
              onChange={e => setCashInData({ ...cashInData, category: e.target.value as CashCategory })}
            >
              <option value="Tournament Buy-in">Tournament Buy-in</option>
              <option value="Cash Game Buy-in">Cash Game Buy-in</option>
              <option value="Chip Purchase">Chip Purchase</option>
              <option value="Float Deposit">Float Deposit</option>
              <option value="Table Rake">Table Rake</option>
              <option value="Membership Fee">Membership Fee</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-cashin-amt">Amount (₹) *</label>
            <input
              id="m-cashin-amt"
              type="number"
              className="m-input"
              placeholder="e.g. 5000"
              value={cashInData.amount || ''}
              onChange={e => setCashInData({ ...cashInData, amount: Number(e.target.value) })}
              min={1}
              required
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-cashin-player">Player Name</label>
            <input
              id="m-cashin-player"
              type="text"
              className="m-input"
              placeholder="e.g. Rahul Sharma"
              value={cashInData.playerName}
              onChange={e => setCashInData({ ...cashInData, playerName: e.target.value })}
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-cashin-method">Payment Method</label>
            <select
              id="m-cashin-method"
              className="m-select"
              value={cashInData.paymentMethod}
              onChange={e => setCashInData({ ...cashInData, paymentMethod: e.target.value as PaymentMethod })}
            >
              <option value="Cash">Cash (Currency)</option>
              <option value="UPI/Digital">UPI / QR Code</option>
              <option value="Credit/Debit Card">Credit/Debit Card</option>
              <option value="Bank Transfer">Bank Transfer / IMPS</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-cashin-desc">Memo / Notes</label>
            <input
              id="m-cashin-desc"
              type="text"
              className="m-input"
              placeholder="e.g. Table 2 Buy-in"
              value={cashInData.description}
              onChange={e => setCashInData({ ...cashInData, description: e.target.value })}
            />
          </div>

          <button type="submit" className="m-btn m-btn-primary" style={{ marginTop: '8px', background: '#10b981', borderColor: '#059669' }}>
            <Plus size={18} /> Confirm Cash In
          </button>
        </form>
      </MobileBottomDrawer>

      {/* DRAWER: CASH OUT */}
      <MobileBottomDrawer
        isOpen={isCashOutOpen}
        onClose={() => setIsCashOutOpen(false)}
        title="Record Cash Paid Out"
        subtitle="Disburse prize payout, cash-out or float withdrawal"
      >
        <form onSubmit={handleCashOutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-cashout-cat">Category *</label>
            <select
              id="m-cashout-cat"
              className="m-select"
              value={cashOutData.category}
              onChange={e => setCashOutData({ ...cashOutData, category: e.target.value as CashCategory })}
            >
              <option value="Tournament Prize Payout">Tournament Prize Payout</option>
              <option value="Cash Game Cash-out">Cash Game Cash-out</option>
              <option value="Player Cash Withdrawal">Player Cash Withdrawal</option>
              <option value="Float Withdrawal">Float Withdrawal / Drop</option>
              <option value="Player Refund">Player Refund</option>
              <option value="Cashier Settlement">Cashier Settlement</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-cashout-amt">Amount (₹) *</label>
            <input
              id="m-cashout-amt"
              type="number"
              className="m-input"
              placeholder="e.g. 2500"
              value={cashOutData.amount || ''}
              onChange={e => setCashOutData({ ...cashOutData, amount: Number(e.target.value) })}
              min={1}
              required
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-cashout-player">Recipient / Player Name</label>
            <input
              id="m-cashout-player"
              type="text"
              className="m-input"
              placeholder="e.g. Vikram Malhotra"
              value={cashOutData.playerName}
              onChange={e => setCashOutData({ ...cashOutData, playerName: e.target.value })}
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-cashout-method">Disbursement Method</label>
            <select
              id="m-cashout-method"
              className="m-select"
              value={cashOutData.paymentMethod}
              onChange={e => setCashOutData({ ...cashOutData, paymentMethod: e.target.value as PaymentMethod })}
            >
              <option value="Cash">Cash (Physical)</option>
              <option value="Bank Transfer">Bank Transfer / IMPS</option>
              <option value="UPI/Digital">UPI / Digital</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-cashout-desc">Authorization Notes</label>
            <input
              id="m-cashout-desc"
              type="text"
              className="m-input"
              placeholder="e.g. Prize distribution verified"
              value={cashOutData.description}
              onChange={e => setCashOutData({ ...cashOutData, description: e.target.value })}
            />
          </div>

          <button type="submit" className="m-btn m-btn-danger" style={{ marginTop: '8px' }}>
            <Minus size={18} /> Confirm Cash Out
          </button>
        </form>
      </MobileBottomDrawer>

      {/* DRAWER: EXPENSE */}
      <MobileBottomDrawer
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        title="Record Operating Expense"
        subtitle="Staff wages, rent, F&B and table supplies"
      >
        <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-exp-cat">Category *</label>
            <select
              id="m-exp-cat"
              className="m-select"
              value={expenseData.category}
              onChange={e => setExpenseData({ ...expenseData, category: e.target.value as ExpenseCategory })}
            >
              <option value="Dealer & Staff Wages">Dealer & Staff Wages</option>
              <option value="Rent & Utilities">Rent & Utilities</option>
              <option value="Cards, Chips & Tables">Cards, Chips & Tables</option>
              <option value="Refreshments & F&B">Refreshments & F&B</option>
              <option value="Security & Surveillance">Security & Surveillance</option>
              <option value="Licensing & Compliance">Licensing & Compliance</option>
              <option value="Maintenance & Repairs">Maintenance & Repairs</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-exp-amt">Amount (₹) *</label>
            <input
              id="m-exp-amt"
              type="number"
              className="m-input"
              placeholder="e.g. 1500"
              value={expenseData.amount || ''}
              onChange={e => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
              min={1}
              required
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-exp-paidto">Paid To *</label>
            <input
              id="m-exp-paidto"
              type="text"
              className="m-input"
              placeholder="e.g. Floor Crew"
              value={expenseData.paidTo}
              onChange={e => setExpenseData({ ...expenseData, paidTo: e.target.value })}
              required
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="m-exp-desc">Description</label>
            <input
              id="m-exp-desc"
              type="text"
              className="m-input"
              placeholder="e.g. Food & Beverage supplies"
              value={expenseData.description}
              onChange={e => setExpenseData({ ...expenseData, description: e.target.value })}
            />
          </div>

          <button type="submit" className="m-btn m-btn-primary" style={{ marginTop: '8px' }}>
            <Receipt size={18} /> Record Expense
          </button>
        </form>
      </MobileBottomDrawer>

      {/* Tax / Billing Invoice Modal */}
      <ClubTaxInvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Cash desk sections">
        <button
          className={`nav-tab-item cashier-color ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span className="nav-tab-label">Dashboard</span>
        </button>

        <button
          className={`nav-tab-item cashier-color ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
        >
          <DollarSign size={20} />
          <span className="nav-tab-label">Ledger</span>
        </button>

        <button
          className={`nav-tab-item cashier-color ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <Receipt size={20} />
          <span className="nav-tab-label">Expenses</span>
        </button>
      </nav>
    </div>
  );
};
