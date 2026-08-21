import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  DollarSign,
  Receipt,
  History,
  RotateCcw,
  ShieldCheck,
  Check,
  XCircle,
  Plus,
  MoreHorizontal,
  Edit3,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatCurrency, formatShortDateTime, formatDateOnly, formatTimeOnly, maskGovtId, formatINR } from '../../utils/formatters';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { Player, ExpenseCategory, PaymentMethod } from '../../types';
import { StaffManager } from './StaffManager';

export const MobileAdminPortal: React.FC = () => {
  const {
    staffName,
    players,
    tournaments,
    todayCheckIns,
    checkIns,
    chipRequests,
    pendingChipOrdersCount,
    expenses,
    auditLogs,
    currentCashBalance,
    totalExpensesAmount,
    netTreasuryBalance,
    reviewKYC,
    updatePlayer,
    deletePlayer,
    addExpense,
    resetToDemoData,
  } = useClub();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'players' | 'attendance' | 'finance' | 'audit'>('dashboard');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [kycAction, setKycAction] = useState<'verified' | 'rejected' | null>(null);

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
    <div className="staff-mobile-portal">

      {/* ── Station Banner ─────────────────────────────────── */}
      <div className="staff-station-banner">
        <div className="staff-banner-left">
          <span className="staff-banner-role">♥ Admin Command Centre</span>
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
          <span className="staff-live-dot admin">Command</span>
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
            {activeTab === 'players' ? 'Member Directory' : activeTab === 'attendance' ? 'Attendance' : activeTab === 'finance' ? 'Treasury & Expenses' : activeTab === 'staff' ? 'Staff Accounts' : 'Audit Logs'}
          </span>
        </div>
      )}

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
              <span className="m-stat-sub">{pendingChipOrdersCount} Pending · ₹{formatINR(totalChipVolume)}</span>
            </div>

            <div className="m-stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
              <span className="m-stat-label">Active Events</span>
              <span className="m-stat-val" style={{ color: '#ffffff' }}>
                {tournaments.length}
              </span>
              <span className="m-stat-sub">Tournaments & Games</span>
            </div>
          </div>

          {/* Quick Admin Actions */}
          <div>
            <p className="staff-section-title">Quick Actions</p>
            <div className="staff-quick-actions" style={{ marginTop: '8px' }}>
              <button type="button" className="staff-quick-btn expense" onClick={() => setIsAddExpenseOpen(true)}>
                <div className="staff-quick-icon"><Plus size={20} /></div>
                Add Expense
              </button>
              <button type="button" className="staff-quick-btn kyc" onClick={() => setActiveTab('players')}>
                <div className="staff-quick-icon"><ShieldCheck size={20} /></div>
                Verify KYC
              </button>
              <button type="button" className="staff-quick-btn entry" onClick={() => setActiveTab('players')}>
                <div className="staff-quick-icon"><Users size={20} /></div>
                Players
              </button>
              <button type="button" className="staff-quick-btn records" onClick={() => setActiveTab('attendance')}>
                <div className="staff-quick-icon"><CheckCircle2 size={20} /></div>
                Attendance
              </button>
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
                    <span>{formatShortDateTime(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
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
            <button
              key={p.id}
              type="button"
              className="m-list-card m-list-button"
              onClick={() => {
                setSelectedPlayer(p);
                setKycAction(null);
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
            </button>
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
                <span>{formatDateOnly(c.checkInDate)} at {formatTimeOnly(c.checkInTime)}</span>
                <span style={{ color: 'var(--gold-light)' }}>{c.tablePreference}</span>
              </div>
              {c.verifiedBy && (
                <div className="staff-inline-status">
                  <CheckCircle2 size={14} /> Clearance verified by {c.verifiedBy}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: OPERATING EXPENSES */}
      {activeTab === 'finance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="m-card" style={{ border: '1.5px solid rgba(225, 29, 72, 0.4)' }}>
            <div className="m-card-header">
              <div>
                <span className="m-stat-label">Total Recorded Expenses</span>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fca5a5', fontFamily: 'var(--font-mono)' }}>
                  {formatCurrency(totalExpensesAmount)}
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
                <span>{formatShortDateTime(log.timestamp)}</span>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Admin Member Management:</span>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="m-btn m-btn-secondary m-btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    const newTier = window.prompt(`Update Tier for ${selectedPlayer.fullName} (Bronze, Silver, Gold, Diamond):`, selectedPlayer.membershipTier);
                    if (newTier) {
                      updatePlayer(selectedPlayer.id, { membershipTier: newTier as any });
                      setSelectedPlayer({ ...selectedPlayer, membershipTier: newTier as any });
                    }
                  }}
                >
                  <Edit3 size={14} /> Edit Tier / Details
                </button>

                <button
                  type="button"
                  className="m-btn m-btn-danger m-btn-sm"
                  style={{ width: 'auto' }}
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete member ${selectedPlayer.fullName} (${selectedPlayer.id})?`)) {
                      deletePlayer(selectedPlayer.id);
                      setIsPlayerModalOpen(false);
                      setSelectedPlayer(null);
                    }
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>

              {kycAction ? (
                <div className="staff-confirm-panel" style={{ marginTop: '8px' }}>
                  <strong>{kycAction === 'verified' ? 'Verify this member?' : 'Reject this member’s KYC?'}</strong>
                  <p>This change is recorded in the audit log.</p>
                  <div>
                    <button
                      type="button"
                      className={`m-btn m-btn-sm ${kycAction === 'verified' ? 'm-btn-emerald' : 'm-btn-danger'}`}
                      onClick={() => {
                        reviewKYC(selectedPlayer.id, kycAction, kycAction === 'rejected' ? 'Admin override' : undefined);
                        setKycAction(null);
                        setIsPlayerModalOpen(false);
                      }}
                    >
                      Confirm {kycAction === 'verified' ? 'verification' : 'rejection'}
                    </button>
                    <button type="button" className="m-btn m-btn-secondary m-btn-sm" onClick={() => setKycAction(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button type="button" className="m-btn m-btn-emerald m-btn-sm" style={{ flex: 1 }} onClick={() => setKycAction('verified')}>
                    <Check size={14} /> Mark Verified
                  </button>
                  <button type="button" className="m-btn m-btn-danger m-btn-sm" style={{ flex: 1 }} onClick={() => setKycAction('rejected')}>
                    <XCircle size={14} /> Mark Rejected
                  </button>
                </div>
              )}
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
            <label className="m-form-label" htmlFor="admin-expense-amount">Amount (₹) *</label>
            <input
              id="admin-expense-amount"
              type="number"
              className="m-input"
              value={expenseData.amount}
              onChange={e => setExpenseData({ ...expenseData, amount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="admin-expense-description">Description</label>
            <textarea
              id="admin-expense-description"
              className="m-textarea"
              rows={2}
              placeholder="What was this payment for?"
              value={expenseData.description}
              onChange={e => setExpenseData({ ...expenseData, description: e.target.value })}
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

          <div className="m-form-group">
            <label className="m-form-label" htmlFor="admin-expense-method">Payment Method</label>
            <select
              id="admin-expense-method"
              className="m-select"
              value={expenseData.paymentMethod}
              onChange={e => setExpenseData({ ...expenseData, paymentMethod: e.target.value as PaymentMethod })}
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Credit/Debit Card">Credit / Debit Card</option>
              <option value="UPI/Digital">UPI / Digital</option>
            </select>
          </div>

          <button type="submit" className="m-btn m-btn-primary" style={{ marginTop: '8px' }}>
            <Plus size={18} /> Record Expense
          </button>
        </form>
      </MobileBottomDrawer>

      <MobileBottomDrawer
        isOpen={isMoreOpen}
        onClose={() => {
          setIsMoreOpen(false);
          setResetConfirm(false);
        }}
        title="Admin tools"
        subtitle="Staff access, audit history and demo controls"
      >
        <div className="staff-more-menu">
          <button type="button" onClick={() => { setActiveTab('staff'); setIsMoreOpen(false); }}>
            <ShieldCheck size={19} />
            <span><strong>Staff accounts</strong><small>Create, suspend or remove access</small></span>
          </button>
          <button type="button" onClick={() => { setActiveTab('audit'); setIsMoreOpen(false); }}>
            <History size={19} />
            <span><strong>Audit log</strong><small>Review activity across every desk</small></span>
          </button>
          <div className="staff-reset-tool">
            <span><RotateCcw size={18} /><strong>Reset demo data</strong></span>
            {!resetConfirm ? (
              <button type="button" className="m-btn m-btn-secondary m-btn-sm" onClick={() => setResetConfirm(true)}>Review reset</button>
            ) : (
              <div className="staff-reset-confirm">
                <p>This restores all demo records and cannot be undone.</p>
                <div>
                  <button type="button" className="m-btn m-btn-danger m-btn-sm" onClick={() => { resetToDemoData(); setResetConfirm(false); setIsMoreOpen(false); }}>Confirm reset</button>
                  <button type="button" className="m-btn m-btn-secondary m-btn-sm" onClick={() => setResetConfirm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </MobileBottomDrawer>

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Admin portal sections">
        <button
          className={`nav-tab-item admin-color ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span className="nav-tab-label">Dashboard</span>
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
          <Receipt size={20} />
          <span className="nav-tab-label">Expenses</span>
        </button>

        <button
          className={`nav-tab-item admin-color ${activeTab === 'staff' || activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setIsMoreOpen(true)}
        >
          <MoreHorizontal size={20} />
          <span className="nav-tab-label">More</span>
        </button>
      </nav>

      </div>{/* end staff-scroll-area */}
    </div>
  );
};
