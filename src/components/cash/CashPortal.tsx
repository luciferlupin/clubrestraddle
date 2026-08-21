import React, { useState } from 'react';
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Receipt,
  Search,
  Filter,
  Plus,
  Minus,
  Download,
  Calendar,
  Lock,
  Coins,
  FileSpreadsheet,
  CheckCircle2,
  Edit3,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { CashCategory, PaymentMethod, ExpenseCategory, Expense, CashTransaction } from '../../types';
import { formatCurrency, formatDateTime, formatINR } from '../../utils/formatters';
import { CashFlowBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { DesktopPortalHeader } from '../common/DesktopPortalHeader';
import { DesktopSectionNav, DesktopSectionNavItem } from '../common/DesktopSectionNav';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { Pagination } from '../common/Pagination';
import { AppBreadcrumbs } from '../common/AppBreadcrumbs';
import confetti from 'canvas-confetti';

type CashPortalTab = 'overview' | 'ledger' | 'expenses';

export const CashPortal: React.FC = () => {
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
    deleteCashTransaction,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useClub();

  const [activeTab, setActiveTab] = useState<CashPortalTab>('overview');
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(15);
  const [expensePage, setExpensePage] = useState(1);
  const [expensePageSize, setExpensePageSize] = useState(15);

  const [isCashInModalOpen, setIsCashInModalOpen] = useState(false);
  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
  const [isVoidTxnModalOpen, setIsVoidTxnModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<CashTransaction | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);

  const [editExpenseData, setEditExpenseData] = useState({
    category: 'Dealer & Staff Wages' as ExpenseCategory,
    amount: 500,
    description: '',
    paidTo: '',
    paymentMethod: 'Cash' as PaymentMethod,
    date: new Date().toISOString().slice(0, 10),
  });

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form State for Cash In
  const [cashInData, setCashInData] = useState({
    category: 'Tournament Buy-in' as CashCategory,
    amount: 1000,
    description: '',
    paymentMethod: 'Cash' as PaymentMethod,
    playerName: '',
    referenceId: '',
  });

  // Form State for Cash Out
  const [cashOutData, setCashOutData] = useState({
    category: 'Tournament Prize Payout' as CashCategory,
    amount: 500,
    description: '',
    paymentMethod: 'Cash' as PaymentMethod,
    playerName: '',
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

    setIsCashInModalOpen(false);
    setCashInData({
      category: 'Tournament Buy-in',
      amount: 1000,
      description: '',
      paymentMethod: 'Cash',
      playerName: '',
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

    setIsCashOutModalOpen(false);
    setCashOutData({
      category: 'Tournament Prize Payout',
      amount: 500,
      description: '',
      paymentMethod: 'Cash',
      playerName: '',
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

    setIsExpenseModalOpen(false);
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
    setIsEditExpenseModalOpen(true);
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

    setIsEditExpenseModalOpen(false);
    setSelectedExpense(null);
  };

  const handleDeleteExpense = () => {
    if (!selectedExpense) return;
    deleteExpense(selectedExpense.id);
    setIsDeleteExpenseModalOpen(false);
    setSelectedExpense(null);
  };

  const handleVoidTxn = () => {
    if (!selectedTxn) return;
    deleteCashTransaction(selectedTxn.id);
    setIsVoidTxnModalOpen(false);
    setSelectedTxn(null);
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
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  const sections: DesktopSectionNavItem<CashPortalTab>[] = [
    { id: 'overview', label: 'Treasury & Payments', icon: <Wallet size={16} /> },
    { id: 'ledger', label: `Master Ledger (${cashTransactions.length})`, icon: <DollarSign size={16} /> },
    { id: 'expenses', label: `Expenses (${expenses.length})`, icon: <Receipt size={16} /> },
  ];

  return (
    <div className="desktop-portal desktop-cash-portal">
      <AppBreadcrumbs
        items={[
          { label: 'Club Re Straddle', onClick: () => setActiveTab('overview') },
          { label: 'Staff Operations', onClick: () => setActiveTab('overview') },
          {
            label:
              activeTab === 'overview'
                ? 'Cash Desk Overview'
                : activeTab === 'ledger'
                ? 'Master Cash Ledger'
                : 'Operating Expenses',
          },
        ]}
        activeRole="cash"
        onBack={activeTab !== 'overview' ? () => setActiveTab('overview') : undefined}
        backLabel="Back to Overview"
      />

      <DesktopPortalHeader
        icon={<DollarSign size={24} color="#fbbf24" />}
        eyebrow="Exclusive Cash Desk"
        title="Cash Payments & Treasury Vault"
        subtitle={<>Dedicated portal for all <strong>Cash In, Cash Out, Float & Vault Ledger</strong> · Operator: <strong>{staffName}</strong></>}
        notice={<><Lock size={14} aria-hidden="true" /> Confidential financial records · Restricted direct link</>}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-success btn-sm"
              onClick={() => setIsCashInModalOpen(true)}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none' }}
            >
              <Plus size={15} /> Record Cash In
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setIsCashOutModalOpen(true)}
              style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', color: '#ffffff', border: 'none' }}
            >
              <Minus size={15} /> Record Cash Out
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsExpenseModalOpen(true)}
            >
              <Receipt size={15} /> Add Expense
            </button>
          </div>
        }
      />

      <DesktopSectionNav<CashPortalTab>
        ariaLabel="Cash Desk sections"
        activeId={activeTab}
        items={sections}
        onChange={tab => setActiveTab(tab)}
      />

      {/* TAB 1: OVERVIEW & QUICK ACTIONS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Top KPI Cards */}
          <div className="stats-grid">
            <div
              className="stat-card"
              style={{ '--stat-glow': 'rgba(245, 158, 11, 0.2)', '--stat-color': '#fbbf24', border: '1.5px solid rgba(245, 158, 11, 0.4)' } as React.CSSProperties}
            >
              <div className="stat-info">
                <span className="stat-label">Current Cash Drawer Float</span>
                <span className="stat-value" style={{ color: 'var(--gold-light)' }}>
                  {formatCurrency(currentCashBalance)}
                </span>
                <span className="stat-helper">Physical Cash in Drawer Vault</span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <Wallet size={24} />
              </div>
            </div>

            <div
              className="stat-card"
              style={{ '--stat-glow': 'rgba(16, 185, 129, 0.2)', '--stat-color': '#34d399' } as React.CSSProperties}
            >
              <div className="stat-info">
                <span className="stat-label">Total Cash In Received</span>
                <span className="stat-value" style={{ color: '#34d399' }}>
                  +{formatCurrency(totalCashInAmount)}
                </span>
                <span className="stat-helper">Buy-ins, Deposits & Fees</span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <ArrowDownLeft size={24} />
              </div>
            </div>

            <div
              className="stat-card"
              style={{ '--stat-glow': 'rgba(239, 68, 68, 0.2)', '--stat-color': '#f87171' } as React.CSSProperties}
            >
              <div className="stat-info">
                <span className="stat-label">Total Cash Paid Out</span>
                <span className="stat-value" style={{ color: '#f87171' }}>
                  -{formatCurrency(totalCashOutAmount)}
                </span>
                <span className="stat-helper">Prize Payouts & Cash-outs</span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
                <ArrowUpRight size={24} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Net Club Treasury</span>
                <span className="stat-value" style={{ color: '#ffffff' }}>
                  {formatCurrency(netTreasuryBalance)}
                </span>
                <span className="stat-helper">Float − {formatCurrency(totalExpensesAmount)} Expenses</span>
              </div>
              <div className="stat-icon-wrapper">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          {/* Quick Payment Action Strip */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(24, 7, 11, 0.95) 0%, rgba(12, 4, 7, 0.98) 100%)',
              border: '1px solid rgba(225, 29, 72, 0.35)',
            }}
          >
            <div className="card-header">
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={20} color="#fbbf24" />
                  1-Tap Cash Payment Dispatch
                </h3>
                <p className="card-subtitle">Quickly record member transactions, prize distributions, and float entries.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)',
                  background: 'rgba(16, 185, 129, 0.08)',
                }}
                onClick={() => {
                  setCashInData(prev => ({ ...prev, category: 'Tournament Buy-in' }));
                  setIsCashInModalOpen(true);
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                  <ArrowDownLeft size={20} />
                </div>
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>Receive Buy-in / Deposit</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cash In to drawer</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(239, 68, 68, 0.4)',
                  background: 'rgba(239, 68, 68, 0.08)',
                }}
                onClick={() => {
                  setCashOutData(prev => ({ ...prev, category: 'Tournament Prize Payout' }));
                  setIsCashOutModalOpen(true);
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                  <ArrowUpRight size={20} />
                </div>
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>Pay Out Prize / Cash-out</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cash Out from drawer</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(245, 158, 11, 0.4)',
                  background: 'rgba(245, 158, 11, 0.08)',
                }}
                onClick={() => {
                  setCashInData(prev => ({ ...prev, category: 'Float Deposit' }));
                  setIsCashInModalOpen(true);
                }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                  <Wallet size={20} />
                </div>
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>Float Deposit / Refill</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Increase register cash</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: '14px',
                  border: '1.5px solid rgba(139, 92, 246, 0.4)',
                  background: 'rgba(139, 92, 246, 0.08)',
                }}
                onClick={() => setIsExpenseModalOpen(true)}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4b5fd' }}>
                  <Receipt size={20} />
                </div>
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>Record Club Expense</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Staff, utilities, F&B</span>
              </button>
            </div>
          </div>

          {/* Recent Cash Activity Preview */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Recent Cash Transactions</h3>
                <p className="card-subtitle">Last 8 cash entries across all cashier terminals</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('ledger')}>
                View Full Ledger ({cashTransactions.length})
              </button>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Txn ID</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Player / Ref</th>
                    <th>Cashier</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {cashTransactions.slice(0, 8).map(txn => (
                    <tr key={txn.id}>
                      <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                        {txn.id}
                      </td>
                      <td>
                        <CashFlowBadge type={txn.type} />
                      </td>
                      <td style={{ fontWeight: 700 }}>{txn.category}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{txn.description}</td>
                      <td
                        className="tabular-num"
                        style={{
                          fontWeight: 800,
                          color: txn.type === 'in' ? '#34d399' : '#f87171',
                        }}
                      >
                        {txn.type === 'in' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{txn.paymentMethod}</td>
                      <td style={{ fontSize: '0.8rem' }}>{txn.playerName || txn.referenceId || '—'}</td>
                      <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{txn.cashierName}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {formatDateTime(txn.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER CASH LEDGER */}
      {activeTab === 'ledger' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <DollarSign size={18} color="#fbbf24" />
                Master Cash Flow Ledger & Reconciliation
              </h3>
              <p className="card-subtitle">Complete chronological record with running vault balance.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px', width: '220px', fontSize: '0.82rem' }}
                  placeholder="Search player, ID, memo..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-input"
                style={{ width: '130px', fontSize: '0.82rem' }}
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
              >
                <option value="all">All Flows</option>
                <option value="in">Cash In (+)</option>
                <option value="out">Cash Out (-)</option>
              </select>

              <select
                className="form-input"
                style={{ width: '160px', fontSize: '0.82rem' }}
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Tournament Buy-in">Tournament Buy-in</option>
                <option value="Cash Game Buy-in">Cash Game Buy-in</option>
                <option value="Chip Purchase">Chip Purchase</option>
                <option value="Tournament Prize Payout">Prize Payout</option>
                <option value="Cash Game Cash-out">Cash-out</option>
                <option value="Float Deposit">Float Deposit</option>
                <option value="Float Withdrawal">Float Withdrawal</option>
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Txn ID</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Player / Reference</th>
                  <th>Cashier</th>
                  <th>Balance After</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.slice((ledgerPage - 1) * ledgerPageSize, ledgerPage * ledgerPageSize).map(txn => (
                  <tr key={txn.id}>
                    <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                      {txn.id}
                    </td>
                    <td>
                      <CashFlowBadge type={txn.type} />
                    </td>
                    <td style={{ fontWeight: 700 }}>{txn.category}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                      {txn.description}
                    </td>
                    <td
                      className="tabular-num"
                      style={{
                        fontWeight: 800,
                        color: txn.type === 'in' ? '#34d399' : '#f87171',
                      }}
                    >
                      {txn.type === 'in' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{txn.paymentMethod}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {txn.playerName || txn.referenceId || '—'}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {txn.cashierName}
                    </td>
                    <td className="tabular-num" style={{ fontWeight: 700, color: 'var(--gold-light)' }}>
                      {formatCurrency(txn.balanceAfter)}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {formatDateTime(txn.timestamp)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#ef4444', padding: '3px 6px' }}
                        title="Void Transaction"
                        onClick={() => {
                          setSelectedTxn(txn);
                          setIsVoidTxnModalOpen(true);
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={ledgerPage}
            totalItems={filteredTransactions.length}
            pageSize={ledgerPageSize}
            onPageChange={setLedgerPage}
            onPageSizeChange={setLedgerPageSize}
            itemLabel="transactions"
          />
        </div>
      )}

      {/* TAB 3: EXPENSES LEDGER */}
      {activeTab === 'expenses' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Receipt size={18} color="#e11d48" />
                Operating Expenses Ledger
              </h3>
              <p className="card-subtitle">Total Recorded Operating Costs: {formatCurrency(totalExpensesAmount)}</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setIsExpenseModalOpen(true)}>
              <Plus size={14} /> Record Expense
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Expense ID</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Paid To</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.slice((expensePage - 1) * expensePageSize, expensePage * expensePageSize).map(exp => (
                  <tr key={exp.id}>
                    <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                      {exp.id}
                    </td>
                    <td style={{ fontWeight: 700 }}>{exp.category}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{exp.description}</td>
                    <td className="tabular-num" style={{ fontWeight: 800, color: '#fca5a5' }}>
                      -{formatCurrency(exp.amount)}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{exp.paidTo}</td>
                    <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{exp.paymentMethod}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{exp.date}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 6px' }}
                          title="Edit"
                          onClick={() => handleOpenEditExpense(exp)}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#ef4444', padding: '3px 6px' }}
                          title="Delete"
                          onClick={() => {
                            setSelectedExpense(exp);
                            setIsDeleteExpenseModalOpen(true);
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={expensePage}
            totalItems={expenses.length}
            pageSize={expensePageSize}
            onPageChange={setExpensePage}
            onPageSizeChange={setExpensePageSize}
            itemLabel="expenses"
          />
        </div>
      )}

      {/* MODAL: RECORD CASH IN */}
      <Modal
        isOpen={isCashInModalOpen}
        onClose={() => setIsCashInModalOpen(false)}
        title="Record Cash In (Cash Received)"
      >
        <form onSubmit={handleCashInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="cashin-category">Category *</label>
            <select
              id="cashin-category"
              className="form-input"
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

          <div className="form-group">
            <label className="form-label" htmlFor="cashin-amount">Amount (₹) *</label>
            <input
              id="cashin-amount"
              type="number"
              className="form-input"
              placeholder="e.g. 5000"
              value={cashInData.amount || ''}
              onChange={e => setCashInData({ ...cashInData, amount: Number(e.target.value) })}
              min={1}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cashin-player">Player Name / Member Ref</label>
            <input
              id="cashin-player"
              type="text"
              className="form-input"
              placeholder="e.g. Vikram Malhotra"
              value={cashInData.playerName}
              onChange={e => setCashInData({ ...cashInData, playerName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cashin-method">Payment Method *</label>
            <select
              id="cashin-method"
              className="form-input"
              value={cashInData.paymentMethod}
              onChange={e => setCashInData({ ...cashInData, paymentMethod: e.target.value as PaymentMethod })}
            >
              <option value="Cash">Cash (Physical Currency)</option>
              <option value="UPI/Digital">UPI / QR Code</option>
              <option value="Credit/Debit Card">Credit / Debit Card</option>
              <option value="Bank Transfer">Bank Transfer / IMPS</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cashin-desc">Memo / Notes</label>
            <input
              id="cashin-desc"
              type="text"
              className="form-input"
              placeholder="e.g. Table 2 Top-up"
              value={cashInData.description}
              onChange={e => setCashInData({ ...cashInData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCashInModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: '#10b981', borderColor: '#059669' }}>
              <Plus size={16} /> Confirm Cash In
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECORD CASH OUT */}
      <Modal
        isOpen={isCashOutModalOpen}
        onClose={() => setIsCashOutModalOpen(false)}
        title="Record Cash Out (Cash Paid Out)"
      >
        <form onSubmit={handleCashOutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="cashout-category">Category *</label>
            <select
              id="cashout-category"
              className="form-input"
              value={cashOutData.category}
              onChange={e => setCashOutData({ ...cashOutData, category: e.target.value as CashCategory })}
            >
              <option value="Tournament Prize Payout">Tournament Prize Payout</option>
              <option value="Cash Game Cash-out">Cash Game Cash-out</option>
              <option value="Player Cash Withdrawal">Player Cash Withdrawal</option>
              <option value="Float Withdrawal">Float Withdrawal / Vault Drop</option>
              <option value="Player Refund">Player Refund</option>
              <option value="Cashier Settlement">Cashier Settlement</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cashout-amount">Amount (₹) *</label>
            <input
              id="cashout-amount"
              type="number"
              className="form-input"
              placeholder="e.g. 2500"
              value={cashOutData.amount || ''}
              onChange={e => setCashOutData({ ...cashOutData, amount: Number(e.target.value) })}
              min={1}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cashout-player">Recipient / Player Name</label>
            <input
              id="cashout-player"
              type="text"
              className="form-input"
              placeholder="e.g. Rohan Mehra"
              value={cashOutData.playerName}
              onChange={e => setCashOutData({ ...cashOutData, playerName: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cashout-method">Disbursement Method *</label>
            <select
              id="cashout-method"
              className="form-input"
              value={cashOutData.paymentMethod}
              onChange={e => setCashOutData({ ...cashOutData, paymentMethod: e.target.value as PaymentMethod })}
            >
              <option value="Cash">Cash (From Drawer)</option>
              <option value="Bank Transfer">Bank Transfer / IMPS</option>
              <option value="UPI/Digital">UPI / Instant Pay</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cashout-desc">Authorization / Notes</label>
            <input
              id="cashout-desc"
              type="text"
              className="form-input"
              placeholder="e.g. 1st Place Main Event Winner"
              value={cashOutData.description}
              onChange={e => setCashOutData({ ...cashOutData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCashOutModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              <Minus size={16} /> Confirm Cash Out
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECORD EXPENSE */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record Operating Expense"
      >
        <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="exp-category">Expense Category *</label>
            <select
              id="exp-category"
              className="form-input"
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

          <div className="form-group">
            <label className="form-label" htmlFor="exp-amount">Amount (₹) *</label>
            <input
              id="exp-amount"
              type="number"
              className="form-input"
              placeholder="e.g. 1500"
              value={expenseData.amount || ''}
              onChange={e => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
              min={1}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="exp-paidto">Paid To / Supplier *</label>
            <input
              id="exp-paidto"
              type="text"
              className="form-input"
              placeholder="e.g. Table Supplies Co."
              value={expenseData.paidTo}
              onChange={e => setExpenseData({ ...expenseData, paidTo: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="exp-desc">Description</label>
            <input
              id="exp-desc"
              type="text"
              className="form-input"
              placeholder="e.g. 10x Copag Plastic Playing Cards Decks"
              value={expenseData.description}
              onChange={e => setExpenseData({ ...expenseData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Receipt size={16} /> Save Expense
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT EXPENSE */}
      {selectedExpense && (
        <Modal
          isOpen={isEditExpenseModalOpen}
          onClose={() => {
            setIsEditExpenseModalOpen(false);
            setSelectedExpense(null);
          }}
          title={`Edit Expense Voucher: ${selectedExpense.id}`}
          subtitle={`Paid To: ${selectedExpense.paidTo}`}
          size="md"
        >
          <form onSubmit={handleEditExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Expense Category *</label>
              <select
                className="form-input"
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

            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                className="form-input"
                value={editExpenseData.amount}
                onChange={e => setEditExpenseData({ ...editExpenseData, amount: Number(e.target.value) })}
                min={1}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Paid To / Supplier *</label>
              <input
                type="text"
                className="form-input"
                value={editExpenseData.paidTo}
                onChange={e => setEditExpenseData({ ...editExpenseData, paidTo: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                value={editExpenseData.description}
                onChange={e => setEditExpenseData({ ...editExpenseData, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditExpenseModalOpen(false);
                  setSelectedExpense(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Expense Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: DELETE EXPENSE CONFIRMATION */}
      {selectedExpense && (
        <Modal
          isOpen={isDeleteExpenseModalOpen}
          onClose={() => {
            setIsDeleteExpenseModalOpen(false);
            setSelectedExpense(null);
          }}
          title="Delete Expense Record"
          subtitle="Irreversible financial action"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1.5px solid #ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0 }}>
              Are you sure you want to delete expense <strong>{selectedExpense.id}</strong> (₹{selectedExpense.amount.toLocaleString('en-IN')} for {selectedExpense.category})?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setIsDeleteExpenseModalOpen(false);
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

      {/* MODAL: VOID / DELETE CASH TRANSACTION CONFIRMATION */}
      {selectedTxn && (
        <Modal
          isOpen={isVoidTxnModalOpen}
          onClose={() => {
            setIsVoidTxnModalOpen(false);
            setSelectedTxn(null);
          }}
          title="Void / Delete Transaction"
          subtitle="Audit ledger deletion"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1.5px solid #ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0 }}>
              Are you sure you want to void transaction <strong>{selectedTxn.id}</strong> ({selectedTxn.type === 'in' ? '+' : '-'}₹{selectedTxn.amount.toLocaleString('en-IN')} for {selectedTxn.category})?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setIsVoidTxnModalOpen(false);
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

      {/* Official Tax Invoice Modal */}
      <ClubTaxInvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};
