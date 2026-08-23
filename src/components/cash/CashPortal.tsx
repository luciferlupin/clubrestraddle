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
  Edit3,
  Trash2,
  AlertTriangle,
  FileText,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  User,
  Building2,
  RefreshCw,
  Smartphone,
  Landmark,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { CashCategory, PaymentMethod, ExpenseCategory, Expense, CashTransaction, Player } from '../../types';
import { formatCurrency, formatDateTime, formatPlayerNumber } from '../../utils/formatters';
import { CashFlowBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { DesktopPortalHeader } from '../common/DesktopPortalHeader';
import { DesktopSectionNav, DesktopSectionNavItem } from '../common/DesktopSectionNav';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { Pagination } from '../common/Pagination';
import { AppBreadcrumbs } from '../common/AppBreadcrumbs';
import { InvoiceRepositoryView } from './InvoiceRepositoryView';
import { generateCashTransactionInvoice } from '../../utils/invoiceGenerator';
import confetti from 'canvas-confetti';

type CashPortalTab = 'overview' | 'invoices' | 'ledger' | 'expenses';

const QUICK_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

export const CashPortal: React.FC = () => {
  const {
    staffName,
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

    setIsCashOutModalOpen(false);
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
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterPaymentMethod !== 'all' && t.paymentMethod !== filterPaymentMethod) return false;
    return true;
  });

  const sections: DesktopSectionNavItem<CashPortalTab>[] = [
    { id: 'overview', label: 'Treasury & Payments', icon: <Wallet size={16} /> },
    { id: 'invoices', label: 'Tax Invoices Hub', icon: <FileText size={16} /> },
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
                : activeTab === 'invoices'
                ? 'Central Tax Invoices Hub'
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
        subtitle={<>Dedicated workspace for <strong>Cash In, Cash Out, Float & Vault Ledger</strong> · Operator: <strong>{staffName}</strong></>}
        notice={<><Lock size={14} aria-hidden="true" /> Confidential financial records · Direct /cash URL</>}
        actions={
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-success btn-sm"
              onClick={() => setIsCashInModalOpen(true)}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Plus size={15} /> Record Cash In
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setIsCashOutModalOpen(true)}
              style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Minus size={15} /> Record Cash Out
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsExpenseModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
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
          {/* Channel-Separated Liquidity & Balances Grid */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {/* 1. PHYSICAL CASH IN HAND */}
            <div
              className="stat-card"
              style={{ '--stat-glow': 'rgba(245, 158, 11, 0.25)', '--stat-color': '#fbbf24', border: '1.5px solid rgba(245, 158, 11, 0.45)', background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.6) 0%, rgba(15, 8, 4, 0.9) 100%)' } as React.CSSProperties}
            >
              <div className="stat-info">
                <span className="stat-label">💵 Physical Cash in Hand</span>
                <span className="stat-value" style={{ color: 'var(--gold-light)' }}>
                  {formatCurrency(physicalCashBalance)}
                </span>
                <span className="stat-helper">
                  +{formatCurrency(physicalCashIn)} in · -{formatCurrency(physicalCashOut + physicalCashExpenses)} out
                </span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <Wallet size={24} />
              </div>
            </div>

            {/* 2. UPI & DIGITAL (QR / ONLINE) */}
            <div
              className="stat-card"
              style={{ '--stat-glow': 'rgba(56, 189, 248, 0.25)', '--stat-color': '#38bdf8', border: '1.5px solid rgba(56, 189, 248, 0.45)', background: 'linear-gradient(135deg, rgba(8, 28, 38, 0.6) 0%, rgba(4, 14, 20, 0.9) 100%)' } as React.CSSProperties}
            >
              <div className="stat-info">
                <span className="stat-label">📱 UPI & QR Payments</span>
                <span className="stat-value" style={{ color: '#38bdf8' }}>
                  {formatCurrency(upiBalance)}
                </span>
                <span className="stat-helper">
                  +{formatCurrency(upiIn)} in · -{formatCurrency(upiOut + upiExpenses)} out
                </span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                <Smartphone size={24} />
              </div>
            </div>

            {/* 3. DIRECT BANK TRANSFER (IMPS / NEFT) */}
            <div
              className="stat-card"
              style={{ '--stat-glow': 'rgba(168, 85, 247, 0.25)', '--stat-color': '#c084fc', border: '1.5px solid rgba(168, 85, 247, 0.45)', background: 'linear-gradient(135deg, rgba(28, 12, 38, 0.6) 0%, rgba(14, 6, 20, 0.9) 100%)' } as React.CSSProperties}
            >
              <div className="stat-info">
                <span className="stat-label">🏦 Bank Transfer (IMPS/NEFT)</span>
                <span className="stat-value" style={{ color: '#c084fc' }}>
                  {formatCurrency(bankBalance)}
                </span>
                <span className="stat-helper">
                  +{formatCurrency(bankIn)} in · -{formatCurrency(bankOut + bankExpenses)} out
                </span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                <Landmark size={24} />
              </div>
            </div>

            {/* 4. TOTAL COMBINED LIQUID TREASURY */}
            <div
              className="stat-card"
              style={{ '--stat-glow': 'rgba(16, 185, 129, 0.25)', '--stat-color': '#34d399', border: '1.5px solid rgba(16, 185, 129, 0.45)', background: 'linear-gradient(135deg, rgba(8, 30, 20, 0.6) 0%, rgba(4, 15, 10, 0.9) 100%)' } as React.CSSProperties}
            >
              <div className="stat-info">
                <span className="stat-label">💎 Total Liquid Treasury</span>
                <span className="stat-value" style={{ color: '#34d399' }}>
                  {formatCurrency(totalLiquidityBalance)}
                </span>
                <span className="stat-helper">
                  Gross In: {formatCurrency(totalCashInAmount)} · Exp: {formatCurrency(totalExpensesAmount)}
                </span>
              </div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          {/* Quick Payment Action Strip */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, rgba(24, 7, 11, 0.95) 0%, rgba(12, 4, 7, 0.98) 100%)',
              border: '1.5px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            <div className="card-header">
              <div>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={20} color="#fbbf24" />
                  1-Tap Cash Operations Dispatch
                </h3>
                <p className="card-subtitle">Quickly record member transactions, prize payouts, and float adjustments.</p>
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
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => {
                  setCashInData(prev => ({ ...prev, category: 'Tournament Buy-in' }));
                  setIsCashInModalOpen(true);
                }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                  <ArrowDownLeft size={22} />
                </div>
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>Receive Entry Charge / Deposit</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cash In to drawer vault</span>
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
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => {
                  setCashOutData(prev => ({ ...prev, category: 'Tournament Prize Payout' }));
                  setIsCashOutModalOpen(true);
                }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
                  <ArrowUpRight size={22} />
                </div>
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>Pay Out Prize / Cash-out</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Cash Out from drawer vault</span>
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
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => {
                  setCashInData(prev => ({ ...prev, category: 'Float Deposit' }));
                  setIsCashInModalOpen(true);
                }}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                  <Wallet size={22} />
                </div>
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>Float Deposit / Refill</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Refill register cash</span>
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
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setIsExpenseModalOpen(true)}
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c4b5fd' }}>
                  <Receipt size={22} />
                </div>
                <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.92rem' }}>Record Club Expense</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Wages, supplies, F&B</span>
              </button>
            </div>
          </div>

          {/* Recent Cash Activity Preview */}
          <div className="card">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
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
                    <th style={{ textAlign: 'right' }}>Invoice</th>
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
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleViewTxnInvoice(txn)}
                        >
                          <Eye size={12} /> Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CENTRAL TAX INVOICE REPOSITORY */}
      {activeTab === 'invoices' && (
        <InvoiceRepositoryView />
      )}

      {/* TAB 2: MASTER CASH LEDGER */}
      {activeTab === 'ledger' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} color="#fbbf24" />
                Master Cash Flow Ledger & Reconciliation
              </h3>
              <p className="card-subtitle">Complete chronological record with running vault balance.</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                style={{ width: '170px', fontSize: '0.82rem' }}
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Tournament Buy-in">Tournament Entry Charge</option>
                <option value="Cash Game Buy-in">Cash Game Entry Charge</option>
                <option value="Chip Purchase">Chip Purchase</option>
                <option value="Tournament Prize Payout">Prize Payout</option>
                <option value="Cash Game Cash-out">Cash-out</option>
                <option value="Float Deposit">Float Deposit</option>
                <option value="Float Withdrawal">Float Withdrawal</option>
              </select>

              {/* Payment Channel Filter Strip */}
              <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', background: 'rgba(0, 0, 0, 0.35)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', flexWrap: 'wrap', alignItems: 'center', margin: '14px 0 6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Filter Channel:</span>
                <button
                  type="button"
                  className={`btn btn-sm ${filterPaymentMethod === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setFilterPaymentMethod('all'); setLedgerPage(1); }}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  All Accounts ({formatCurrency(totalLiquidityBalance)})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterPaymentMethod === 'Cash' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setFilterPaymentMethod('Cash'); setLedgerPage(1); }}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', color: filterPaymentMethod === 'Cash' ? undefined : '#fbbf24' }}
                >
                  💵 Cash ({formatCurrency(physicalCashBalance)})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterPaymentMethod === 'UPI/Digital' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setFilterPaymentMethod('UPI/Digital'); setLedgerPage(1); }}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', color: filterPaymentMethod === 'UPI/Digital' ? undefined : '#38bdf8' }}
                >
                  📱 UPI ({formatCurrency(upiBalance)})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterPaymentMethod === 'Bank Transfer' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setFilterPaymentMethod('Bank Transfer'); setLedgerPage(1); }}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', color: filterPaymentMethod === 'Bank Transfer' ? undefined : '#c084fc' }}
                >
                  🏦 Bank Wire ({formatCurrency(bankBalance)})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${filterPaymentMethod === 'Credit/Debit Card' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setFilterPaymentMethod('Credit/Debit Card'); setLedgerPage(1); }}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', color: filterPaymentMethod === 'Credit/Debit Card' ? undefined : '#34d399' }}
                >
                  💳 Cards ({formatCurrency(cardBalance)})
                </button>
              </div>
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
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No cash transactions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.slice((ledgerPage - 1) * ledgerPageSize, ledgerPage * ledgerPageSize).map(txn => (
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
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: txn.paymentMethod === 'Cash' ? 'rgba(251, 191, 36, 0.15)' : txn.paymentMethod === 'UPI/Digital' ? 'rgba(56, 189, 248, 0.15)' : txn.paymentMethod === 'Bank Transfer' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                            color: txn.paymentMethod === 'Cash' ? '#fbbf24' : txn.paymentMethod === 'UPI/Digital' ? '#38bdf8' : txn.paymentMethod === 'Bank Transfer' ? '#c084fc' : '#34d399',
                            border: `1px solid ${txn.paymentMethod === 'Cash' ? 'rgba(251, 191, 36, 0.3)' : txn.paymentMethod === 'UPI/Digital' ? 'rgba(56, 189, 248, 0.3)' : txn.paymentMethod === 'Bank Transfer' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                          }}
                        >
                          {txn.paymentMethod === 'Cash' ? '💵 Cash' : txn.paymentMethod === 'UPI/Digital' ? '📱 UPI' : txn.paymentMethod === 'Bank Transfer' ? '🏦 Bank' : '💳 Card'}
                        </span>
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
                        <div style={{ display: 'inline-flex', gap: '5px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 7px', fontSize: '0.74rem' }}
                            title="View Tax Invoice"
                            onClick={() => handleViewTxnInvoice(txn)}
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#ef4444', padding: '3px 7px' }}
                            title="Void Transaction"
                            onClick={() => {
                              setSelectedTxn(txn);
                              setIsVoidTxnModalOpen(true);
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={ledgerPage}
            pageSize={ledgerPageSize}
            totalItems={filteredTransactions.length}
            onPageChange={setLedgerPage}
            onPageSizeChange={setLedgerPageSize}
            itemLabel="transactions"
          />
        </div>
      )}

      {/* TAB 4: OPERATING EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="#e11d48" />
                Operating Expenses Register
              </h3>
              <p className="card-subtitle">
                Total Expenses: <strong style={{ color: '#f87171' }}>{formatCurrency(totalExpensesAmount)}</strong> across {expenses.length} records.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsExpenseModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Record Expense
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Paid To</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Recorded By</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                      No expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  expenses.slice((expensePage - 1) * expensePageSize, expensePage * expensePageSize).map(exp => (
                    <tr key={exp.id}>
                      <td style={{ fontSize: '0.82rem' }}>{exp.date}</td>
                      <td>
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>{exp.category}</span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#ffffff', fontWeight: 600 }}>{exp.description}</td>
                      <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{exp.paidTo}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exp.paymentMethod}</span>
                      </td>
                      <td className="tabular-num" style={{ fontWeight: 800, color: '#f87171' }}>
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{exp.recordedBy}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '5px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 7px' }}
                            title="Edit Expense"
                            onClick={() => {
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
                            }}
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#ef4444', padding: '3px 7px' }}
                            title="Delete Expense"
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
                  ))
                )}
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

      {/* ── MODALS & DRAWERS ───────────────────────────────── */}

      {/* 1. RECORD CASH IN MODAL */}
      <Modal
        isOpen={isCashInModalOpen}
        onClose={() => setIsCashInModalOpen(false)}
        title="Record Cash In (Deposit / Receipt)"
        subtitle="Money received into the cashier vault drawer or online accounts"
        size="md"
      >
        <form onSubmit={handleCashInSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-select"
              value={cashInData.category}
              onChange={e => setCashInData({ ...cashInData, category: e.target.value as CashCategory })}
            >
              <option value="Tournament Buy-in">Tournament Entry Charge</option>
              <option value="Cash Game Buy-in">Cash Game Buy-in</option>
              <option value="Chip Purchase">Chip Purchase</option>
              <option value="Float Deposit">Vault Float Top-up / Opening Float</option>
              <option value="Table Rake">Table Service Charge Deposit</option>
              <option value="Membership Fee">Membership Fee</option>
            </select>
          </div>

          {/* Amount & Quick Presets */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Amount (₹) *</label>
              <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700 }}>
                +{formatCurrency(Number(cashInData.amount || 0))}
              </span>
            </div>
            <input
              type="number"
              className="form-input"
              style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}
              value={cashInData.amount || ''}
              onChange={e => setCashInData({ ...cashInData, amount: Number(e.target.value) })}
              min="1"
              required
              placeholder="e.g. 5000"
            />

            {/* Quick Amount Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
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
                    cursor: 'pointer',
                  }}
                >
                  {amt >= 100000 ? `${amt / 100000}L` : amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Running Balance Preview Banner */}
          {(() => {
            const chan = getChannelBalance(cashInData.paymentMethod);
            return (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ color: '#cbd5e1' }}>Current {chan.name}: <strong>{formatCurrency(chan.balance)}</strong></span>
                <ArrowRight size={14} color="#34d399" />
                <span style={{ color: '#34d399', fontWeight: 800 }}>
                  Projected: {formatCurrency(chan.balance + (Number(cashInData.amount) || 0))}
                </span>
              </div>
            );
          })()}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Payment Mode *</label>
              <select
                className="form-select"
                value={cashInData.paymentMethod}
                onChange={e => setCashInData({ ...cashInData, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="Cash">💵 Physical Cash at Counter</option>
                <option value="UPI/Digital">📱 UPI / QR Payment</option>
                <option value="Bank Transfer">🏦 Direct Bank Wire Transfer</option>
                <option value="Credit/Debit Card">💳 POS Card Swiped</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Member / Player (Optional)</label>
              <select
                className="form-select"
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
          </div>

          <div className="form-group">
            <label className="form-label">Reference / Receipt / Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Table 3 buy-in or Bank UTR Ref"
              value={cashInData.description}
              onChange={e => setCashInData({ ...cashInData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '14px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCashInModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none' }}>
              <Plus size={16} /> Confirm Cash In
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. RECORD CASH OUT MODAL */}
      <Modal
        isOpen={isCashOutModalOpen}
        onClose={() => setIsCashOutModalOpen(false)}
        title="Record Cash Out (Payout / Withdrawal)"
        subtitle="Money disbursed from cashier vault or online channels"
        size="md"
      >
        <form onSubmit={handleCashOutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-select"
              value={cashOutData.category}
              onChange={e => setCashOutData({ ...cashOutData, category: e.target.value as CashCategory })}
            >
              <option value="Tournament Prize Payout">Tournament Prize Payout</option>
              <option value="Cash Game Cash-out">Cash Game Chip Cash-out</option>
              <option value="Float Withdrawal">Vault Float Drop / Bank Deposit</option>
              <option value="Player Rakeback Payout">Player Reward / Rakeback</option>
            </select>
          </div>

          {/* Amount & Quick Presets */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Amount (₹) *</label>
              <span style={{ fontSize: '0.74rem', color: '#f87171', fontWeight: 700 }}>
                -{formatCurrency(Number(cashOutData.amount || 0))}
              </span>
            </div>
            <input
              type="number"
              className="form-input"
              style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}
              value={cashOutData.amount || ''}
              onChange={e => setCashOutData({ ...cashOutData, amount: Number(e.target.value) })}
              min="1"
              required
              placeholder="e.g. 5000"
            />

            {/* Quick Amount Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
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
                    cursor: 'pointer',
                  }}
                >
                  {amt >= 100000 ? `${amt / 100000}L` : amt >= 1000 ? `${amt / 1000}k` : amt}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Running Balance Preview Banner */}
          {(() => {
            const chan = getChannelBalance(cashOutData.paymentMethod);
            return (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                }}
              >
                <span style={{ color: '#cbd5e1' }}>Current {chan.name}: <strong>{formatCurrency(chan.balance)}</strong></span>
                <ArrowRight size={14} color="#f87171" />
                <span style={{ color: '#f87171', fontWeight: 800 }}>
                  Projected: {formatCurrency(chan.balance - (Number(cashOutData.amount) || 0))}
                </span>
              </div>
            );
          })()}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Payout Mode *</label>
              <select
                className="form-select"
                value={cashOutData.paymentMethod}
                onChange={e => setCashOutData({ ...cashOutData, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="Cash">💵 Physical Cash Handed Over</option>
                <option value="UPI/Digital">📱 Instant UPI Transfer</option>
                <option value="Bank Transfer">🏦 NEFT / RTGS Bank Wire</option>
                <option value="Credit/Debit Card">💳 POS Card Reversal</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Recipient Player (Optional)</label>
              <select
                className="form-select"
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
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Payout Reference</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 1st Place Winner - Deepstack Sunday or Chip surrender"
              value={cashOutData.description}
              onChange={e => setCashOutData({ ...cashOutData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '14px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCashOutModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', color: '#ffffff', border: 'none' }}>
              <Minus size={16} /> Confirm Cash Out
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. RECORD EXPENSE MODAL */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record Operating Expense"
        subtitle="Club operating costs, wages, utilities and refreshments"
        size="md"
      >
        <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-select"
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

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Amount (₹) *</label>
              <input
                type="number"
                className="form-input"
                value={expenseData.amount || ''}
                onChange={e => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
                min="1"
                required
                placeholder="e.g. 1500"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode *</label>
              <select
                className="form-select"
                value={expenseData.paymentMethod}
                onChange={e => setExpenseData({ ...expenseData, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="Cash">Cash</option>
                <option value="UPI/Digital">UPI / Digital</option>
                <option value="Bank Transfer">Bank Wire Transfer</option>
                <option value="Credit/Debit Card">Card Payment</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Paid To (Vendor / Person) *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Dealer Shift Wages, Copag Card Importers, Coffee Bar"
              value={expenseData.paidTo}
              onChange={e => setExpenseData({ ...expenseData, paidTo: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Remarks</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 4 Dealers night shift payout (₹2,500 each)"
              value={expenseData.description}
              onChange={e => setExpenseData({ ...expenseData, description: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '14px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Save Expense Record
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. EDIT EXPENSE MODAL */}
      {selectedExpense && (
        <Modal
          isOpen={isEditExpenseModalOpen}
          onClose={() => {
            setIsEditExpenseModalOpen(false);
            setSelectedExpense(null);
          }}
          title={`Edit Expense Record: ${selectedExpense.id}`}
          subtitle={`Paid To: ${selectedExpense.paidTo}`}
          size="md"
        >
          <form onSubmit={handleEditExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Expense Category *</label>
              <select
                className="form-select"
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

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={editExpenseData.amount || ''}
                  onChange={e => setEditExpenseData({ ...editExpenseData, amount: Number(e.target.value) })}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  value={editExpenseData.paymentMethod}
                  onChange={e => setEditExpenseData({ ...editExpenseData, paymentMethod: e.target.value as PaymentMethod })}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI/Digital">UPI / Digital</option>
                  <option value="Bank Transfer">Bank Wire Transfer</option>
                  <option value="Credit/Debit Card">Card</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Paid To *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editExpenseData.paidTo}
                  onChange={e => setEditExpenseData({ ...editExpenseData, paidTo: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editExpenseData.date}
                  onChange={e => setEditExpenseData({ ...editExpenseData, date: e.target.value })}
                />
              </div>
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

            <div className="modal-footer" style={{ margin: '14px -24px -24px', padding: '16px 24px' }}>
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
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. DELETE EXPENSE MODAL */}
      {selectedExpense && (
        <Modal
          isOpen={isDeleteExpenseModalOpen}
          onClose={() => {
            setIsDeleteExpenseModalOpen(false);
            setSelectedExpense(null);
          }}
          title="Delete Expense Record"
          subtitle="Irreversible financial audit action"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertTriangle size={24} color="#ef4444" />
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                Are you sure you want to permanently delete expense record <strong>{selectedExpense.id}</strong> (₹{selectedExpense.amount.toLocaleString('en-IN')} for {selectedExpense.category})?
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsDeleteExpenseModalOpen(false);
                  setSelectedExpense(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteExpense}>
                <Trash2 size={15} /> Delete Record
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. VOID TRANSACTION MODAL */}
      {selectedTxn && (
        <Modal
          isOpen={isVoidTxnModalOpen}
          onClose={() => {
            setIsVoidTxnModalOpen(false);
            setSelectedTxn(null);
          }}
          title="Void / Delete Cash Transaction"
          subtitle="Audit ledger removal"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertTriangle size={24} color="#ef4444" />
              <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                Are you sure you want to void transaction <strong>{selectedTxn.id}</strong> ({selectedTxn.type === 'in' ? '+' : '-'}₹{selectedTxn.amount.toLocaleString('en-IN')} - {selectedTxn.category})?
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsVoidTxnModalOpen(false);
                  setSelectedTxn(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleVoidTxn}>
                <Trash2 size={15} /> Confirm Void
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. CLUB TAX INVOICE MODAL */}
      <ClubTaxInvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};
