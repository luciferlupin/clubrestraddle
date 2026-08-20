import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Trophy,
  DollarSign,
  Receipt,
  History,
  RotateCcw,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Eye,
  Check,
  XCircle,
  Plus,
  Coins,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatCurrency, formatDateTime, formatDateOnly, maskGovtId, formatINR } from '../../utils/formatters';
import { KYCBadge, EntryBadge, TierBadge, CashFlowBadge, TournamentStatusBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { Player, ExpenseCategory, PaymentMethod } from '../../types';
import { StaffManager } from './StaffManager';

export const MobileAdminPortal: React.FC = () => {
  const {
    staffName,
    players,
    todayCheckIns,
    checkIns,
    tournaments,
    entries,
    cashTransactions,
    chipRequests,
    pendingChipOrdersCount,
    expenses,
    auditLogs,
    currentCashBalance,
    totalExpensesAmount,
    netTreasuryBalance,
    reviewKYC,
    addExpense,
    resetToDemoData,
  } = useClub();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'players' | 'attendance' | 'finance' | 'audit'>('dashboard');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const [expenseData, setExpenseData] = useState({
    category: 'Dealer & Staff Wages' as ExpenseCategory,
    amount: 500,
    description: '',
    paidTo: '',
    paymentMethod: 'Cash' as PaymentMethod,
  });

  const approvedTodayCount = todayCheckIns.filter(c => c.verificationStatus === 'approved').length;
  const deliveredChipOrders = chipRequests.filter(r => r.status === 'delivered');
  const totalChipVolume = deliveredChipOrders.reduce((sum, r) => sum + r.amount, 0);

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

    setIsAddExpenseOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* TAB 1: EXECUTIVE DASHBOARD & TIMELINE */}
      {activeTab === 'dashboard' && (
        <>
          {/* Top KPI Cards */}
          <div className="m-stats-grid">
            <div className="m-stat-card" style={{ borderColor: 'rgba(255, 255, 255, 0.25)' }}>
              <span className="m-stat-label">Total Players</span>
              <span className="m-stat-val" style={{ color: '#ffffff' }}>
                {players.length}
              </span>
              <span className="m-stat-sub">{players.filter(p => p.kycStatus === 'verified').length} KYC Verified</span>
            </div>

            <div className="m-stat-card" style={{ borderColor: 'rgba(225, 29, 72, 0.4)' }}>
              <span className="m-stat-label">Today's Check-ins</span>
              <span className="m-stat-val" style={{ color: '#ffffff' }}>
                {todayCheckIns.length}
              </span>
              <span className="m-stat-sub">{approvedTodayCount} Inside Club</span>
            </div>
          </div>

          <div className="m-stats-grid">
            <div className="m-stat-card" style={{ borderColor: 'var(--border-red)' }}>
              <span className="m-stat-label">Table Chip Orders</span>
              <span className="m-stat-val" style={{ color: '#ffffff' }}>
                {chipRequests.length}
              </span>
              <span className="m-stat-sub">{pendingChipOrdersCount} Pending | ₹{formatINR(totalChipVolume)}</span>
            </div>

            <div className="m-stat-card" style={{ borderColor: 'var(--border-gold)' }}>
              <span className="m-stat-label">Cash Balance</span>
              <span className="m-stat-val" style={{ color: 'var(--gold-light)' }}>
                {formatCurrency(currentCashBalance)}
              </span>
              <span className="m-stat-sub">Live Drawer Float</span>
            </div>
          </div>

          {/* Business Net Vault Balance Card */}
          <div
            className="m-card"
            style={{
              background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.18), rgba(15, 23, 42, 0.95))',
              border: '1.5px solid var(--border-red)',
            }}
          >
            <span className="m-stat-label">Net Business Treasury Balance</span>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
              {formatCurrency(netTreasuryBalance)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Formula: Float ({formatCurrency(currentCashBalance)}) − Expenses ({formatCurrency(totalExpensesAmount)})
            </div>
          </div>

          {/* Activity Monitoring: Live Timeline */}
          <div className="m-card">
            <div className="m-card-header">
              <span className="m-card-title">
                <History size={16} color="#ffffff" />
                Live Club Activity Timeline
              </span>
              <button className="m-btn m-btn-ghost m-btn-sm" style={{ width: 'auto' }} onClick={() => setActiveTab('audit')}>
                Full Audit Log
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {auditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="m-list-card">
                  <div className="m-list-row">
                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{log.action}</span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '999px',
                        background: 'rgba(139, 0, 0, 0.35)',
                        color: '#ffffff',
                        border: '1px solid rgba(139, 0, 0, 0.6)',
                      }}
                    >
                      {log.portal}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.details}</div>
                  <div className="m-list-row" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    <span>By: {log.user}</span>
                    <span>{formatDateTime(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reset Demo Data Touch Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
            {!resetConfirm ? (
              <button
                className="m-btn m-btn-secondary m-btn-sm"
                style={{ width: 'auto' }}
                onClick={() => setResetConfirm(true)}
              >
                <RotateCcw size={14} /> Reset Demo Data
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="m-btn m-btn-danger m-btn-sm"
                  onClick={() => {
                    resetToDemoData();
                    setResetConfirm(false);
                  }}
                >
                  Confirm Reset Data
                </button>
                <button
                  className="m-btn m-btn-secondary m-btn-sm"
                  onClick={() => setResetConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* TAB 2: STAFF ACCOUNTS */}
      {activeTab === 'staff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <StaffManager />
        </div>
      )}

      {/* TAB 3: PLAYERS DIRECTORY & OVERRIDE */}
      {activeTab === 'players' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-card">
            <h3 className="m-card-title">
              <Users size={18} color="#e11d48" />
              Member Directory ({players.length})
            </h3>
            <p className="m-card-subtitle">Tap any player to inspect credentials or override KYC</p>
          </div>

          {players.map(p => (
            <div
              key={p.id}
              className="m-list-card"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setSelectedPlayer(p);
                setIsPlayerModalOpen(true);
              }}
            >
              <div className="m-list-row">
                <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{p.fullName}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <TierBadge tier={p.membershipTier} />
                  <KYCBadge status={p.kycStatus} />
                </div>
              </div>
              <div className="m-list-row" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>{p.id} • {p.phone}</span>
                <span>{p.totalVisits} Visits</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ATTENDANCE RECORDS */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-card">
            <h3 className="m-card-title">
              <CheckCircle2 size={18} color="#e11d48" />
              Attendance Records ({checkIns.length})
            </h3>
            <p className="m-card-subtitle">Log of check-ins and entrance approvals</p>
          </div>

          {checkIns.map(c => (
            <div key={c.id} className="m-list-card">
              <div className="m-list-row">
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.playerName}</span>
                <EntryBadge status={c.verificationStatus} />
              </div>
              <div className="m-list-row" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>{formatDateOnly(c.checkInDate)} at {c.checkInTime}</span>
                <span style={{ color: 'var(--gold-light)' }}>{c.tablePreference}</span>
              </div>
              {c.verifiedBy && (
                <div style={{ fontSize: '0.72rem', color: '#ffffff' }}>
                  ✓ Clearance verified by {c.verifiedBy}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: FINANCE & EXPENSES */}
      {activeTab === 'finance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="m-card" style={{ border: '1.5px solid var(--border-gold)' }}>
            <div className="m-card-header">
              <div>
                <span className="m-stat-label">Vault Float Balance</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold-light)', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(currentCashBalance)}
                </div>
              </div>
              <button
                className="m-btn m-btn-primary m-btn-sm"
                style={{ width: 'auto' }}
                onClick={() => setIsAddExpenseOpen(true)}
              >
                <Plus size={14} /> Add Expense
              </button>
            </div>
          </div>

          {/* Expenses List */}
          <div className="m-card">
            <h4 className="m-card-title">
              <Receipt size={16} color="#e11d48" />
              Club Operating Expenses ({expenses.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {expenses.map(exp => (
                <div key={exp.id} className="m-list-card">
                  <div className="m-list-row">
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{exp.category}</span>
                    <span className="tabular-num" style={{ fontWeight: 800, color: '#fca5a5' }}>
                      -{formatCurrency(exp.amount)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{exp.description}</div>
                  <div className="m-list-row" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    <span>Paid to: {exp.paidTo}</span>
                    <span>{formatDateOnly(exp.date)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-card">
            <h3 className="m-card-title">
              <History size={18} color="#e11d48" />
              Team Activity Audit Trail ({auditLogs.length})
            </h3>
            <p className="m-card-subtitle">Chronological actions across all 4 portals</p>
          </div>

          {auditLogs.map(log => (
            <div key={log.id} className="m-list-card">
              <div className="m-list-row">
                <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{log.action}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--gold-light)' }}>{log.portal}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.details}</div>
              <div className="m-list-row" style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                <span>User: {log.user}</span>
                <span>{formatDateTime(log.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Player KYC Inspection & Override Drawer */}
      {selectedPlayer && (
        <MobileBottomDrawer
          isOpen={isPlayerModalOpen}
          onClose={() => setIsPlayerModalOpen(false)}
          title={`Member: ${selectedPlayer.fullName}`}
          subtitle={`ID: ${selectedPlayer.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Phone</span>
              <span>{selectedPlayer.phone}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Govt ID</span>
              <span>{selectedPlayer.kyc.govtIdType}: {maskGovtId(selectedPlayer.kyc.govtIdNumber)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>DOB</span>
              <span>{formatDateOnly(selectedPlayer.kyc.dateOfBirth)}</span>
            </div>

            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Admin KYC Override:</span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  className="m-btn m-btn-emerald m-btn-sm"
                  onClick={() => {
                    reviewKYC(selectedPlayer.id, 'verified');
                    setIsPlayerModalOpen(false);
                  }}
                >
                  <Check size={14} /> Mark Verified
                </button>

                <button
                  className="m-btn m-btn-danger m-btn-sm"
                  onClick={() => {
                    reviewKYC(selectedPlayer.id, 'rejected', 'Admin override');
                    setIsPlayerModalOpen(false);
                  }}
                >
                  <XCircle size={14} /> Mark Rejected
                </button>
              </div>
            </div>
          </div>
        </MobileBottomDrawer>
      )}

      {/* Add Expense Drawer */}
      <MobileBottomDrawer
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Record Operating Expense"
        subtitle="Staff wages, rent, table equipment, F&B"
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
            <label className="m-form-label">Amount ($) *</label>
            <input
              type="number"
              className="m-input"
              value={expenseData.amount}
              onChange={e => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Paid To</label>
            <input
              type="text"
              className="m-input"
              placeholder="e.g. Floor Dealers"
              value={expenseData.paidTo}
              onChange={e => setExpenseData({ ...expenseData, paidTo: e.target.value })}
            />
          </div>

          <button type="submit" className="m-btn m-btn-primary" style={{ marginTop: '8px' }}>
            <Plus size={18} /> Record Expense
          </button>
        </form>
      </MobileBottomDrawer>

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button
          className={`nav-tab-item admin-color ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span className="nav-tab-label">Dashboard</span>
        </button>

        <button
          className={`nav-tab-item admin-color ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <ShieldCheck size={20} />
          <span className="nav-tab-label">Staff</span>
        </button>

        <button
          className={`nav-tab-item admin-color ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          <Users size={20} />
          <span className="nav-tab-label">Players</span>
        </button>

        <button
          className={`nav-tab-item admin-color ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <CheckCircle2 size={20} />
          <span className="nav-tab-label">Attendance</span>
        </button>

        <button
          className={`nav-tab-item admin-color ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          <DollarSign size={20} />
          <span className="nav-tab-label">Finance</span>
        </button>

        <button
          className={`nav-tab-item admin-color ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <History size={20} />
          <span className="nav-tab-label">Audit</span>
        </button>
      </nav>
    </div>
  );
};
