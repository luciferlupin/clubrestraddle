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
  Edit3,
  Trash2,
  AlertTriangle,
  LogOut,
  FileText,
  Eye,
  ArrowRight,
  Sparkles,
  Smartphone,
  Landmark,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { CashCategory, PaymentMethod, ExpenseCategory, Expense, CashTransaction, Player } from '../../types';
import { formatCurrency, formatShortDateTime, formatINR, formatPlayerNumber } from '../../utils/formatters';
import { CashFlowBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { Modal } from '../common/Modal';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { Pagination } from '../common/Pagination';
import { InvoiceRepositoryView } from './InvoiceRepositoryView';
import { generateCashTransactionInvoice } from '../../utils/invoiceGenerator';
import confetti from 'canvas-confetti';

const QUICK_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

export const MobileCashPortal: React.FC = () => {
  const {
    staffName,
    logoutStaff,
    players,
    cashTransactions,
    currentCashBalance,
    physicalCashBalance,
    upiBalance,
    bankBalance,
    cardBalance,
    totalLiquidityBalance,
    physicalCashIn,
    physicalCashOut,
    physicalCashExpenses,
    upiIn,
    upiOut,
    upiExpenses,
    bankIn,
    bankOut,
    bankExpenses,
    cardIn,
    cardOut,
    cardExpenses,
    totalCashInAmount,
    totalCashOutAmount,
    expenses,
    totalExpensesAmount,
    netTreasuryBalance,
    addCashReceived,
    addCashGiven,
    deleteCashTransaction,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useClub();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'invoices' | 'ledger' | 'expenses'>('dashboard');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const pageSize = 12;

  // Drawers & Modals State
  const [isCashInOpen, setIsCashInOpen] = useState(false);
  const [isCashOutOpen, setIsCashOutOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [isDeleteExpenseOpen, setIsDeleteExpenseOpen] = useState(false);
  const [isVoidTxnOpen, setIsVoidTxnOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<CashTransaction | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'all' | PaymentMethod>('all');

  const getChannelBalance = (method: PaymentMethod) => {
    switch (method) {
      case 'Cash':
        return { name: 'Physical Cash Vault', balance: physicalCashBalance, color: '#fbbf24' };
      case 'UPI/Digital':
        return { name: 'UPI & QR Account', balance: upiBalance, color: '#38bdf8' };
      case 'Bank Transfer':
        return { name: 'Direct Bank Account', balance: bankBalance, color: '#c084fc' };
      case 'Credit/Debit Card':
        return { name: 'Card POS Terminal', balance: cardBalance, color: '#34d399' };
      default:
        return { name: 'Physical Cash Vault', balance: physicalCashBalance, color: '#fbbf24' };
    }
  };

  // Form State for Cash In
  const [cashInData, setCashInData] = useState({
    category: 'Tournament Buy-in' as CashCategory,
    amount: 1000,
    description: '',
    paymentMethod: 'Cash' as PaymentMethod,
    playerName: '',
    playerId: '',
    referenceId: '',
  });

  // Form State for Cash Out
  const [cashOutData, setCashOutData] = useState({
    category: 'Tournament Prize Payout' as CashCategory,
    amount: 500,
    description: '',
    paymentMethod: 'Cash' as PaymentMethod,
    playerName: '',
    playerId: '',
    referenceId: '',
  });

  // Form State for Expense
  const [expenseData, setExpenseData] = useState({
    category: 'Dealer & Staff Wages' as ExpenseCategory,
    amount: 500,
    description: '',
    paidTo: '',
    paymentMethod: 'Cash' as PaymentMethod,
  });

  const [editExpenseData, setEditExpenseData] = useState({
    category: 'Dealer & Staff Wages' as ExpenseCategory,
    amount: 500,
    description: '',
    paidTo: '',
    paymentMethod: 'Cash' as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
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
      referenceId: cashInData.referenceId,
    });

    try {
      confetti({
        particleCount: 40,
        spread: 50,
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
      playerId: '',
      referenceId: '',
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
      referenceId: cashOutData.referenceId,
    });

    setIsCashOutOpen(false);
    setCashOutData({
      category: 'Tournament Prize Payout',
      amount: 500,
      description: '',
      paymentMethod: 'Cash',
      playerName: '',
      playerId: '',
      referenceId: '',
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
      amount: 500,
      description: '',
      paidTo: '',
      paymentMethod: 'Cash',
    });
  };

  const handleOpenEditExpense = (exp: Expense) => {
    setSelectedExpense(exp);
    setEditExpenseData({
      category: exp.category,
      amount: exp.amount,
      description: exp.description,
      paidTo: exp.paidTo,
      paymentMethod: exp.paymentMethod,
      date: exp.date,
    });
    setIsEditExpenseOpen(true);
  };

  const handleEditExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense || !editExpenseData.amount || editExpenseData.amount <= 0) return;

    updateExpense(selectedExpense.id, {
      category: editExpenseData.category,
      amount: Number(editExpenseData.amount),
      description: editExpenseData.description,
      paidTo: editExpenseData.paidTo,
      paymentMethod: editExpenseData.paymentMethod,
      date: editExpenseData.date,
    });

    setIsEditExpenseOpen(false);
    setSelectedExpense(null);
  };

  const handleDeleteExpense = () => {
    if (!selectedExpense) return;
    deleteExpense(selectedExpense.id);
    setIsDeleteExpenseOpen(false);
    setSelectedExpense(null);
  };

  const handleVoidTxn = () => {
    if (!selectedTxn) return;
    deleteCashTransaction(selectedTxn.id);
    setIsVoidTxnOpen(false);
    setSelectedTxn(null);
  };

  const handleViewTxnInvoice = (txn: CashTransaction) => {
    const matchedPlayer = players.find(p => p.fullName.toLowerCase() === (txn.playerName || '').toLowerCase() || p.id === txn.playerName);
    const invoice = generateCashTransactionInvoice(txn, matchedPlayer, staffName);
    setSelectedInvoice(invoice);
  };

  const filteredTransactions = cashTransactions.filter(t => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      (t.playerName && t.playerName.toLowerCase().includes(search.toLowerCase())) ||
      (t.referenceId && t.referenceId.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'in' && t.type !== 'in') return false;
    if (filterType === 'out' && t.type !== 'out') return false;
    if (filterPaymentMethod !== 'all' && t.paymentMethod !== filterPaymentMethod) return false;
    return true;
  });

  return (
    <div className="mobile-staff-container">
      {/* ── Fixed Top Header ───────────────────────────────── */}
      <div className="staff-header-banner">
        <div className="staff-banner-left">
          <div className="staff-badge cashier" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
            <Wallet size={12} />
            <span>Vault Terminal</span>
          </div>
          <span className="staff-user-name">{staffName}</span>
        </div>
        <div className="staff-banner-right">
          <span className="staff-live-dot cashier">Live Vault</span>
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
        {/* TAB 1: DASHBOARD & QUICK ACTIONS */}
        {activeTab === 'dashboard' && (
          <>
            {/* Top KPI Cards - Separated Liquidity Channels */}
            <div className="m-stats-grid">
              <div className="m-stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.45)', background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.6) 0%, rgba(15, 8, 4, 0.9) 100%)' }}>
                <span className="m-stat-label">💵 Physical Cash</span>
                <span className="m-stat-val" style={{ color: 'var(--gold-light)' }}>
                  {formatCurrency(physicalCashBalance)}
                </span>
                <span className="m-stat-sub">In-Hand Vault Float</span>
              </div>

              <div className="m-stat-card" style={{ borderColor: 'rgba(56, 189, 248, 0.45)', background: 'linear-gradient(135deg, rgba(8, 28, 38, 0.6) 0%, rgba(4, 14, 20, 0.9) 100%)' }}>
                <span className="m-stat-label">📱 UPI / QR Balance</span>
                <span className="m-stat-val" style={{ color: '#38bdf8' }}>
                  {formatCurrency(upiBalance)}
                </span>
                <span className="m-stat-sub">Digital Payments In</span>
              </div>
            </div>

            <div className="m-stats-grid">
              <div className="m-stat-card" style={{ borderColor: 'rgba(168, 85, 247, 0.45)', background: 'linear-gradient(135deg, rgba(28, 12, 38, 0.6) 0%, rgba(14, 6, 20, 0.9) 100%)' }}>
                <span className="m-stat-label">🏦 Bank Transfer</span>
                <span className="m-stat-val" style={{ color: '#c084fc' }}>
                  {formatCurrency(bankBalance)}
                </span>
                <span className="m-stat-sub">IMPS / NEFT Received</span>
              </div>

              <div className="m-stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.45)', background: 'linear-gradient(135deg, rgba(8, 30, 20, 0.6) 0%, rgba(4, 15, 10, 0.9) 100%)' }}>
                <span className="m-stat-label">💎 Total Treasury</span>
                <span className="m-stat-val" style={{ color: '#34d399' }}>
                  {formatCurrency(totalLiquidityBalance)}
                </span>
                <span className="m-stat-sub">Combined Net Liquidity</span>
              </div>
            </div>

            {/* Quick Action Strip */}
            <div>
              <p className="staff-section-title">Vault Operations</p>
              <div className="staff-quick-actions" style={{ marginTop: '8px' }}>
                <button type="button" className="staff-quick-btn cash-in" onClick={() => setIsCashInOpen(true)}>
                  <div className="staff-quick-icon"><ArrowDownLeft size={20} /></div>
                  Cash In
                </button>
                <button type="button" className="staff-quick-btn cash-out" onClick={() => setIsCashOutOpen(true)}>
                  <div className="staff-quick-icon"><ArrowUpRight size={20} /></div>
                  Cash Out
                </button>
                <button type="button" className="staff-quick-btn kyc" onClick={() => setActiveTab('invoices')}>
                  <div className="staff-quick-icon"><FileText size={20} /></div>
                  Tax Invoices
                </button>
                <button type="button" className="staff-quick-btn records" onClick={() => setIsExpenseOpen(true)}>
                  <div className="staff-quick-icon"><Receipt size={20} /></div>
                  Add Expense
                </button>
              </div>
            </div>

            {/* Recent Cash Flow Records */}
            <div className="m-card">
              <div className="m-card-header">
                <span className="m-card-title">
                  <Coins size={16} color="#fbbf24" />
                  Recent Ledger Activity
                </span>
                <button
                  type="button"
                  className="m-card-action"
                  onClick={() => setActiveTab('ledger')}
                >
                  View All ({cashTransactions.length}) →
                </button>
              </div>

              <div className="m-list" style={{ marginTop: '10px' }}>
                {cashTransactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.84rem' }}>
                    No cash transactions recorded yet.
                  </div>
                ) : (
                  cashTransactions.slice(0, 6).map(txn => (
                    <div key={txn.id} className="m-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
                      <div className="m-list-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CashFlowBadge type={txn.type} />
                          <strong style={{ fontSize: '0.84rem' }}>{txn.category}</strong>
                        </div>
                        <span
                          style={{
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: txn.type === 'in' ? '#34d399' : '#f87171',
                            fontSize: '0.9rem',
                          }}
                        >
                          {txn.type === 'in' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </span>
                      </div>
                      <div className="m-list-row" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: txn.paymentMethod === 'Cash' ? 'rgba(251, 191, 36, 0.15)' : txn.paymentMethod === 'UPI/Digital' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                              color: txn.paymentMethod === 'Cash' ? '#fbbf24' : txn.paymentMethod === 'UPI/Digital' ? '#38bdf8' : '#c084fc',
                            }}
                          >
                            {txn.paymentMethod === 'Cash' ? '💵 Cash' : txn.paymentMethod === 'UPI/Digital' ? '📱 UPI' : '🏦 Bank'}
                          </span>
                          <span>{txn.playerName || txn.description}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{formatShortDateTime(txn.timestamp)}</span>
                          {txn.type === 'in' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '1px 5px', fontSize: '0.68rem' }}
                              onClick={() => handleViewTxnInvoice(txn)}
                            >
                              <Eye size={10} /> Inv
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: CENTRAL TAX INVOICES HUB */}
        {activeTab === 'invoices' && (
          <InvoiceRepositoryView />
        )}

        {/* TAB 3: MASTER CASH LEDGER */}
        {activeTab === 'ledger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="m-card">
              <div className="m-card-header">
                <div>
                  <h3 className="m-card-title">
                    <DollarSign size={18} color="#fbbf24" />
                    Cash Flow Ledger ({cashTransactions.length})
                  </h3>
                  <p className="m-card-subtitle">Complete chronological record with channel separation</p>
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

              {/* Filter Flow Pills */}
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

              {/* Payment Channel Pills */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button
                  type="button"
                  className={`m-btn m-btn-sm ${filterPaymentMethod === 'all' ? 'm-btn-primary' : 'm-btn-secondary'}`}
                  style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', padding: '4px 8px' }}
                  onClick={() => { setFilterPaymentMethod('all'); setLedgerPage(1); }}
                >
                  All Accounts
                </button>
                <button
                  type="button"
                  className={`m-btn m-btn-sm ${filterPaymentMethod === 'Cash' ? 'm-btn-primary' : 'm-btn-secondary'}`}
                  style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', padding: '4px 8px', color: filterPaymentMethod === 'Cash' ? undefined : '#fbbf24' }}
                  onClick={() => { setFilterPaymentMethod('Cash'); setLedgerPage(1); }}
                >
                  💵 Cash ({formatCurrency(physicalCashBalance)})
                </button>
                <button
                  type="button"
                  className={`m-btn m-btn-sm ${filterPaymentMethod === 'UPI/Digital' ? 'm-btn-primary' : 'm-btn-secondary'}`}
                  style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', padding: '4px 8px', color: filterPaymentMethod === 'UPI/Digital' ? undefined : '#38bdf8' }}
                  onClick={() => { setFilterPaymentMethod('UPI/Digital'); setLedgerPage(1); }}
                >
                  📱 UPI ({formatCurrency(upiBalance)})
                </button>
                <button
                  type="button"
                  className={`m-btn m-btn-sm ${filterPaymentMethod === 'Bank Transfer' ? 'm-btn-primary' : 'm-btn-secondary'}`}
                  style={{ whiteSpace: 'nowrap', fontSize: '0.72rem', padding: '4px 8px', color: filterPaymentMethod === 'Bank Transfer' ? undefined : '#c084fc' }}
                  onClick={() => { setFilterPaymentMethod('Bank Transfer'); setLedgerPage(1); }}
                >
                  🏦 Bank ({formatCurrency(bankBalance)})
                </button>
              </div>
            </div>

            {/* List */}
            {filteredTransactions.length === 0 ? (
              <div className="m-card" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                No cash transactions found.
              </div>
            ) : (
              filteredTransactions.slice((ledgerPage - 1) * pageSize, ledgerPage * pageSize).map(txn => (
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
                  <div className="m-list-row" style={{ fontSize: '0.74rem', color: 'var(--text-dim)', alignItems: 'center' }}>
                    <span>{txn.playerName || txn.paymentMethod} · After: {formatCurrency(txn.balanceAfter)}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {txn.type === 'in' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                          onClick={() => handleViewTxnInvoice(txn)}
                        >
                          <Eye size={11} /> Invoice
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 5px', color: '#ef4444' }}
                        title="Void / Delete Transaction"
                        onClick={() => {
                          setSelectedTxn(txn);
                          setIsVoidTxnOpen(true);
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            <Pagination
              currentPage={ledgerPage}
              totalItems={filteredTransactions.length}
              pageSize={pageSize}
              onPageChange={setLedgerPage}
              itemLabel="entries"
            />
          </div>
        )}

        {/* TAB 4: OPERATING EXPENSES */}
        {activeTab === 'expenses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="m-card">
              <div className="m-card-header">
                <div>
                  <h3 className="m-card-title">
                    <Receipt size={18} color="#e11d48" />
                    Operating Expenses
                  </h3>
                  <p className="m-card-subtitle">Total Recorded Costs: {formatCurrency(totalExpensesAmount)}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: 'auto', padding: '6px 10px', fontSize: '0.76rem' }}
                  onClick={() => setIsExpenseOpen(true)}
                >
                  <Plus size={14} /> Add Expense
                </button>
              </div>
            </div>

            {expenses.length === 0 ? (
              <div className="m-card" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                No expenses recorded yet.
              </div>
            ) : (
              expenses.slice((expensePage - 1) * pageSize, expensePage * pageSize).map(exp => (
                <div key={exp.id} className="m-list-card">
                  <div className="m-list-row">
                    <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>{exp.category}</span>
                    <span className="tabular-num" style={{ fontWeight: 800, color: '#f87171' }}>
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{exp.description}</div>
                  <div className="m-list-row" style={{ fontSize: '0.74rem', color: 'var(--text-dim)', alignItems: 'center' }}>
                    <span>Paid to: {exp.paidTo} ({exp.paymentMethod})</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 6px' }}
                        onClick={() => handleOpenEditExpense(exp)}
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '2px 6px', color: '#ef4444' }}
                        onClick={() => {
                          setSelectedExpense(exp);
                          setIsDeleteExpenseOpen(true);
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            <Pagination
              currentPage={expensePage}
              totalItems={expenses.length}
              pageSize={pageSize}
              onPageChange={setExpensePage}
              itemLabel="expenses"
            />
          </div>
        )}
      </div>

      {/* ── DRAWERS ────────────────────────────────────────── */}

      {/* 1. Cash In Drawer */}
      <MobileBottomDrawer
        isOpen={isCashInOpen}
        onClose={() => setIsCashInOpen(false)}
        title="Record Cash In (Deposit / Entry)"
        subtitle="Money received into the cashier vault drawer"
      >
        <form onSubmit={handleCashInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              <option value="Float Deposit">Vault Float Refill / Deposit</option>
              <option value="Table Rake">Table Service Charge Collection</option>
            </select>
          </div>

          <div className="m-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="m-form-label" style={{ margin: 0 }}>Amount (₹) *</label>
              <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.84rem' }}>
                +{formatCurrency(Number(cashInData.amount || 0))}
              </span>
            </div>
            <input
              type="number"
              className="m-input"
              style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace' }}
              value={cashInData.amount || ''}
              onChange={e => setCashInData({ ...cashInData, amount: Number(e.target.value) })}
              min="1"
              required
              placeholder="e.g. 5000"
            />

            {/* Quick Amount Chips */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCashInData(prev => ({ ...prev, amount: amt }))}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    background: cashInData.amount === amt ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: cashInData.amount === amt ? '#34d399' : '#cbd5e1',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  +{amt >= 100000 ? `${amt / 100000}L` : amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Running Balance Preview */}
          {(() => {
            const chan = getChannelBalance(cashInData.paymentMethod);
            return (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.76rem',
                }}
              >
                <span>{chan.name}: <strong>{formatCurrency(chan.balance)}</strong></span>
                <ArrowRight size={12} color="#34d399" />
                <span style={{ color: '#34d399', fontWeight: 800 }}>
                  After: {formatCurrency(chan.balance + (Number(cashInData.amount) || 0))}
                </span>
              </div>
            );
          })()}

          <div className="m-form-group">
            <label className="m-form-label">Payment Mode</label>
            <select
              className="m-select"
              value={cashInData.paymentMethod}
              onChange={e => setCashInData({ ...cashInData, paymentMethod: e.target.value as PaymentMethod })}
            >
              <option value="Cash">💵 Cash at Counter</option>
              <option value="UPI/Digital">📱 UPI / QR Payment</option>
              <option value="Bank Transfer">🏦 Bank Wire Transfer</option>
              <option value="Credit/Debit Card">💳 POS Card Swiped</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Member / Player (Optional)</label>
            <select
              className="m-select"
              value={cashInData.playerId}
              onChange={e => {
                const selId = e.target.value;
                const pl = players.find(p => p.id === selId);
                setCashInData({
                  ...cashInData,
                  playerId: selId,
                  playerName: pl ? pl.fullName : '',
                });
              }}
            >
              <option value="">— Select Member or Walk-in —</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({formatPlayerNumber(p)})
                </option>
              ))}
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Notes / Reference</label>
            <input
              type="text"
              className="m-input"
              placeholder="e.g. Table 3 buy-in or UTR ref"
              value={cashInData.description}
              onChange={e => setCashInData({ ...cashInData, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="m-btn m-btn-primary"
            style={{ marginTop: '8px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none' }}
          >
            <Plus size={16} /> Confirm Cash In
          </button>
        </form>
      </MobileBottomDrawer>

      {/* 2. Cash Out Drawer */}
      <MobileBottomDrawer
        isOpen={isCashOutOpen}
        onClose={() => setIsCashOutOpen(false)}
        title="Record Cash Out (Payout / Withdrawal)"
        subtitle="Money disbursed from the cashier vault drawer or online channels"
      >
        <form onSubmit={handleCashOutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="m-form-group">
            <label className="m-form-label">Category</label>
            <select
              className="m-select"
              value={cashOutData.category}
              onChange={e => setCashOutData({ ...cashOutData, category: e.target.value as CashCategory })}
            >
              <option value="Tournament Prize Payout">Tournament Prize Payout</option>
              <option value="Cash Game Cash-out">Cash Game Chip Cash-out</option>
              <option value="Float Withdrawal">Vault Float Drop / Bank Deposit</option>
              <option value="Player Rakeback Payout">Player Reward / Rakeback</option>
            </select>
          </div>

          <div className="m-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="m-form-label" style={{ margin: 0 }}>Amount (₹) *</label>
              <span style={{ color: '#f87171', fontWeight: 800, fontSize: '0.84rem' }}>
                -{formatCurrency(Number(cashOutData.amount || 0))}
              </span>
            </div>
            <input
              type="number"
              className="m-input"
              style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'monospace' }}
              value={cashOutData.amount || ''}
              onChange={e => setCashOutData({ ...cashOutData, amount: Number(e.target.value) })}
              min="1"
              required
              placeholder="e.g. 5000"
            />

            {/* Quick Amount Chips */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '6px' }}>
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCashOutData(prev => ({ ...prev, amount: amt }))}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    background: cashOutData.amount === amt ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    color: cashOutData.amount === amt ? '#f87171' : '#cbd5e1',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {amt >= 100000 ? `${amt / 100000}L` : amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Running Balance Preview */}
          {(() => {
            const chan = getChannelBalance(cashOutData.paymentMethod);
            return (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.76rem',
                }}
              >
                <span>{chan.name}: <strong>{formatCurrency(chan.balance)}</strong></span>
                <ArrowRight size={12} color="#f87171" />
                <span style={{ color: '#f87171', fontWeight: 800 }}>
                  After: {formatCurrency(chan.balance - (Number(cashOutData.amount) || 0))}
                </span>
              </div>
            );
          })()}

          <div className="m-form-group">
            <label className="m-form-label">Payout Mode</label>
            <select
              className="m-select"
              value={cashOutData.paymentMethod}
              onChange={e => setCashOutData({ ...cashOutData, paymentMethod: e.target.value as PaymentMethod })}
            >
              <option value="Cash">Cash Handed Over</option>
              <option value="UPI/Digital">Instant UPI Transfer</option>
              <option value="Bank Transfer">NEFT / RTGS Bank Wire</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Recipient Member (Optional)</label>
            <select
              className="m-select"
              value={cashOutData.playerId}
              onChange={e => {
                const selId = e.target.value;
                const pl = players.find(p => p.id === selId);
                setCashOutData({
                  ...cashOutData,
                  playerId: selId,
                  playerName: pl ? pl.fullName : '',
                });
              }}
            >
              <option value="">— Select Member —</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({formatPlayerNumber(p)})
                </option>
              ))}
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Notes / Remarks</label>
            <input
              type="text"
              className="m-input"
              placeholder="e.g. 1st Place prize or chip cash-out"
              value={cashOutData.description}
              onChange={e => setCashOutData({ ...cashOutData, description: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="m-btn m-btn-danger"
            style={{ marginTop: '8px', background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', color: '#ffffff', border: 'none' }}
          >
            <Minus size={16} /> Confirm Cash Out
          </button>
        </form>
      </MobileBottomDrawer>

      {/* 3. Expense Drawer */}
      <MobileBottomDrawer
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        title="Record Operating Expense"
        subtitle="Club operating costs, wages, utilities and refreshments"
      >
        <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              <option value="Security & Surveillance">Security & Surveillance</option>
              <option value="Licensing & Compliance">Licensing & Compliance</option>
              <option value="Maintenance & Repairs">Maintenance & Repairs</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Amount (₹) *</label>
            <input
              type="number"
              className="m-input"
              value={expenseData.amount || ''}
              onChange={e => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
              min="1"
              required
              placeholder="e.g. 1500"
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Payment Mode</label>
            <select
              className="m-select"
              value={expenseData.paymentMethod}
              onChange={e => setExpenseData({ ...expenseData, paymentMethod: e.target.value as PaymentMethod })}
            >
              <option value="Cash">Cash</option>
              <option value="UPI/Digital">UPI / Digital</option>
              <option value="Bank Transfer">Bank Wire Transfer</option>
              <option value="Credit/Debit Card">Card Payment</option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Paid To (Vendor / Staff) *</label>
            <input
              type="text"
              className="m-input"
              placeholder="e.g. Master Cards, Night Shift Dealers"
              value={expenseData.paidTo}
              onChange={e => setExpenseData({ ...expenseData, paidTo: e.target.value })}
              required
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Description / Remarks</label>
            <input
              type="text"
              className="m-input"
              placeholder="e.g. 4 Dealers night shift payout"
              value={expenseData.description}
              onChange={e => setExpenseData({ ...expenseData, description: e.target.value })}
            />
          </div>

          <button type="submit" className="m-btn m-btn-primary" style={{ marginTop: '8px' }}>
            <Plus size={16} /> Save Expense Record
          </button>
        </form>
      </MobileBottomDrawer>

      {/* 4. Edit Expense Drawer */}
      <MobileBottomDrawer
        isOpen={isEditExpenseOpen}
        onClose={() => setIsEditExpenseOpen(false)}
        title="Edit Expense Record"
        subtitle={selectedExpense ? `ID: ${selectedExpense.id}` : ''}
      >
        <form onSubmit={handleEditExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="m-form-group">
            <label className="m-form-label">Category</label>
            <select
              className="m-select"
              value={editExpenseData.category}
              onChange={e => setEditExpenseData({ ...editExpenseData, category: e.target.value as ExpenseCategory })}
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
            <label className="m-form-label">Amount (₹) *</label>
            <input
              type="number"
              className="m-input"
              value={editExpenseData.amount || ''}
              onChange={e => setEditExpenseData({ ...editExpenseData, amount: Number(e.target.value) })}
              min="1"
              required
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Paid To *</label>
            <input
              type="text"
              className="m-input"
              value={editExpenseData.paidTo}
              onChange={e => setEditExpenseData({ ...editExpenseData, paidTo: e.target.value })}
              required
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Description</label>
            <input
              type="text"
              className="m-input"
              value={editExpenseData.description}
              onChange={e => setEditExpenseData({ ...editExpenseData, description: e.target.value })}
            />
          </div>

          <button type="submit" className="m-btn m-btn-primary" style={{ marginTop: '8px' }}>
            Save Changes
          </button>
        </form>
      </MobileBottomDrawer>

      {/* Delete Expense Modal */}
      {selectedExpense && (
        <Modal
          isOpen={isDeleteExpenseOpen}
          onClose={() => {
            setIsDeleteExpenseOpen(false);
            setSelectedExpense(null);
          }}
          title="Delete Expense Record"
          subtitle="Irreversible financial action"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0 }}>
              Are you sure you want to delete expense <strong>{selectedExpense.id}</strong> (₹{selectedExpense.amount.toLocaleString('en-IN')} for {selectedExpense.category})?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setIsDeleteExpenseOpen(false);
                  setSelectedExpense(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDeleteExpense}>
                Delete Expense
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Void Transaction Modal */}
      {selectedTxn && (
        <Modal
          isOpen={isVoidTxnOpen}
          onClose={() => {
            setIsVoidTxnOpen(false);
            setSelectedTxn(null);
          }}
          title="Void / Delete Transaction"
          subtitle="Audit ledger removal"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0 }}>
              Are you sure you want to void transaction <strong>{selectedTxn.id}</strong> ({selectedTxn.type === 'in' ? '+' : '-'}₹{selectedTxn.amount.toLocaleString('en-IN')} for {selectedTxn.category})?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setIsVoidTxnOpen(false);
                  setSelectedTxn(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleVoidTxn}>
                Void Transaction
              </button>
            </div>
          </div>
        </Modal>
      )}

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
          className={`nav-tab-item cashier-color ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <FileText size={20} />
          <span className="nav-tab-label">Invoices</span>
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
