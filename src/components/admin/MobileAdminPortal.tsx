import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
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
  Search,
  ChevronRight,
  Coins,
  Sparkles,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatCurrency, formatShortDateTime, formatDateOnly, formatTimeOnly, maskGovtId, formatINR, formatFullAadhaar, formatPlayerNumber } from '../../utils/formatters';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { Player, ExpenseCategory, PaymentMethod } from '../../types';
import { StaffManager } from './StaffManager';
import { PlayerLedger } from '../player/PlayerLedger';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { AdminKycDocumentPhotos } from './AdminKycDocumentPhotos';

export const MobileAdminPortal: React.FC = () => {
  const {
    players,
    tournaments,
    entries,
    todayCheckIns,
    checkIns,
    chipRequests,
    pendingChipOrdersCount,
    expenses,
    auditLogs,
    totalExpensesAmount,
    reviewKYC,
    updatePlayer,
    deletePlayer,
    addExpense,
    fulfillChipRequest,
    cancelChipRequest,
    resetToDemoData,
  } = useClub();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'players' | 'attendance' | 'finance' | 'staff' | 'audit'>('dashboard');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerDrawerTab, setPlayerDrawerTab] = useState<'info' | 'ledger'>('info');
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isChipsDrawerOpen, setIsChipsDrawerOpen] = useState(false);
  const [isTournamentsDrawerOpen, setIsTournamentsDrawerOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [kycAction, setKycAction] = useState<'verified' | 'rejected' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [playerView, setPlayerView] = useState<'all' | 'pending'>('all');

  const [expenseData, setExpenseData] = useState({
    category: 'Dealer & Staff Wages' as ExpenseCategory,
    amount: 500,
    description: '',
    paidTo: '',
    paymentMethod: 'Cash' as PaymentMethod,
  });

  const approvedTodayCount = todayCheckIns.filter(c => c.verificationStatus === 'approved').length;
  const pendingKYCCount = players.filter(p => p.kycStatus === 'pending').length;
  const totalChipVolume = chipRequests.reduce((sum, r) => sum + r.amount, 0);
  const pendingEntryCount = checkIns.filter(c => c.verificationStatus === 'pending').length;
  const pageMeta = {
    dashboard: { eyebrow: 'Command centre', title: 'Club overview', description: 'Priority work and live operating signals.' },
    players: { eyebrow: 'Member operations', title: 'Members', description: 'Search profiles, review KYC and inspect ledgers.' },
    attendance: { eyebrow: 'Door operations', title: 'Attendance', description: 'Track arrivals and entry decisions.' },
    finance: { eyebrow: 'Finance controls', title: 'Expenses', description: 'Record and review operating spend.' },
    staff: { eyebrow: 'Access control', title: 'Staff accounts', description: 'Manage authorised club operators.' },
    audit: { eyebrow: 'Governance', title: 'Audit trail', description: 'Review actions across every staff station.' },
  }[activeTab];

  const scopedPlayers = playerView === 'pending'
    ? players.filter(p => p.kycStatus === 'pending')
    : players;
  const exactPlayerNumberMatch = /^\d+$/.test(searchQuery.trim())
    ? scopedPlayers.find(p => formatPlayerNumber(p) === searchQuery.trim())
    : undefined;
  const filteredPlayers = (exactPlayerNumberMatch
    ? [exactPlayerNumberMatch]
    : scopedPlayers.filter(p =>
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      ))
    .sort((a, b) => Number(formatPlayerNumber(a)) - Number(formatPlayerNumber(b)));

  const filteredCheckIns = checkIns.filter(c =>
    c.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.playerPhone.includes(searchQuery) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <div className="mobile-admin-command-centre" style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100dvh',
      width: '100%',
      backgroundColor: '#0c0a0e',
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
      boxSizing: 'border-box'
    }}>

      {/* ── Scrollable Content Area ────────────────────────────────── */}
      <main style={{
        flex: 1,
        padding: '14px 14px calc(82px + env(safe-area-inset-bottom)) 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box',
        overflowY: 'auto'
      }}>
        <section className="admin-mobile-page-heading" aria-labelledby="admin-mobile-page-title">
          <div>
            <span>{pageMeta.eyebrow}</span>
            <h1 id="admin-mobile-page-title">{pageMeta.title}</h1>
            <p>{pageMeta.description}</p>
          </div>
          {pendingChipOrdersCount > 0 && (
            <button type="button" onClick={() => setIsChipsDrawerOpen(true)} aria-label={`Open ${pendingChipOrdersCount} pending chip orders`}>
              <Coins size={17} />
              <span>{pendingChipOrdersCount}<small>chip order</small></span>
            </button>
          )}
        </section>

        {/* ── TAB 1: EXECUTIVE OVERVIEW ────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <>
            <section className="admin-mobile-priority" aria-labelledby="admin-priority-title">
              <div className="admin-mobile-section-heading">
                <div>
                  <span>Needs attention</span>
                  <h2 id="admin-priority-title">Priority queue</h2>
                </div>
                <strong>{pendingKYCCount + pendingEntryCount + pendingChipOrdersCount}</strong>
              </div>

              <div className="admin-mobile-priority-list">
                <button type="button" onClick={() => { setPlayerView('pending'); setActiveTab('players'); setSearchQuery(''); }}>
                  <span className="admin-mobile-priority-icon violet"><ShieldCheck size={18} /></span>
                  <span><strong>KYC reviews</strong><small>{pendingKYCCount ? `${pendingKYCCount} member profiles waiting` : 'No profiles waiting'}</small></span>
                  <b>{pendingKYCCount}</b><ChevronRight size={17} />
                </button>
                <button type="button" onClick={() => { setActiveTab('attendance'); setSearchQuery(''); }}>
                  <span className="admin-mobile-priority-icon green"><CheckCircle2 size={18} /></span>
                  <span><strong>Entry decisions</strong><small>{pendingEntryCount ? `${pendingEntryCount} arrivals need clearance` : 'Door queue is clear'}</small></span>
                  <b>{pendingEntryCount}</b><ChevronRight size={17} />
                </button>
                <button type="button" onClick={() => setIsChipsDrawerOpen(true)}>
                  <span className="admin-mobile-priority-icon amber"><Coins size={18} /></span>
                  <span><strong>Chip orders</strong><small>{pendingChipOrdersCount ? `${pendingChipOrdersCount} order awaiting delivery` : 'All orders completed'}</small></span>
                  <b>{pendingChipOrdersCount}</b><ChevronRight size={17} />
                </button>
              </div>
            </section>

            {/* Apple Style 2x2 Tapable Metric Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              
              {/* Widget 1: Total Members (Tapable -> Opens Members Directory) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('players');
                  setPlayerView('all');
                  setSearchQuery('');
                }}
                style={{
                  background: 'linear-gradient(145deg, rgba(30, 24, 34, 0.95) 0%, rgba(18, 14, 20, 0.95) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                  padding: '15px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'transform 0.1s, border-color 0.2s',
                  position: 'relative'
                }}
                title="Tap to view Member Directory"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Members
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(225, 29, 72, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={15} color="#f43f5e" />
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {players.length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{players.filter(p => p.kycStatus === 'verified').length} Verified</span>
                    <ChevronRight size={12} color="#94a3b8" />
                  </div>
                </div>
              </button>

              {/* Widget 2: Today's Check-ins (Tapable -> Opens Attendance) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('attendance');
                  setSearchQuery('');
                }}
                style={{
                  background: 'linear-gradient(145deg, rgba(30, 24, 34, 0.95) 0%, rgba(18, 14, 20, 0.95) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                  padding: '15px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'transform 0.1s, border-color 0.2s',
                  position: 'relative'
                }}
                title="Tap to view Today's Attendance Log"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Check-ins
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={15} color="#34d399" />
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {todayCheckIns.length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 500, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{approvedTodayCount} Cleared</span>
                    <ChevronRight size={12} color="#94a3b8" />
                  </div>
                </div>
              </button>

              {/* Widget 3: Chip Orders (Tapable -> Opens Chip Orders Drawer) */}
              <button
                type="button"
                onClick={() => setIsChipsDrawerOpen(true)}
                style={{
                  background: 'linear-gradient(145deg, rgba(30, 24, 34, 0.95) 0%, rgba(18, 14, 20, 0.95) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                  padding: '15px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'transform 0.1s, border-color 0.2s',
                  position: 'relative'
                }}
                title="Tap to view Table Chip Orders"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Chip Orders
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coins size={15} color="#fbbf24" />
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {chipRequests.length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: pendingChipOrdersCount > 0 ? '#fb7185' : '#fbbf24', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{pendingChipOrdersCount > 0 ? `${pendingChipOrdersCount} Pending` : `₹${formatINR(totalChipVolume)}`}</span>
                    <ChevronRight size={12} color="#94a3b8" />
                  </div>
                </div>
              </button>

              {/* Widget 4: Tournaments (Tapable -> Opens Tournaments Drawer) */}
              <button
                type="button"
                onClick={() => setIsTournamentsDrawerOpen(true)}
                style={{
                  background: 'linear-gradient(145deg, rgba(30, 24, 34, 0.95) 0%, rgba(18, 14, 20, 0.95) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '18px',
                  padding: '15px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'transform 0.1s, border-color 0.2s',
                  position: 'relative'
                }}
                title="Tap to view Active Tournaments"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Tournaments
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={15} color="#c084fc" />
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                    {tournaments.length}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#c084fc', fontWeight: 500, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{entries.length} Registered</span>
                    <ChevronRight size={12} color="#94a3b8" />
                  </div>
                </div>
              </button>
            </div>

            {/* Apple iOS Quick Action Tiles */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Quick Actions
              </div>
              <div className="admin-mobile-action-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* 1. Record Expense */}
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.1s'
                  }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(244, 63, 94, 0.35)'
                  }}>
                    <Plus size={20} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ffffff', textAlign: 'center' }}>
                    New Expense
                  </span>
                </button>

                {/* 2. Verify KYC */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('players');
                    setPlayerView('pending');
                    setSearchQuery('');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.1s'
                  }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
                  }}>
                    <ShieldCheck size={20} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ffffff', textAlign: 'center' }}>
                    Verify KYC
                  </span>
                </button>

                {/* 3. Members Directory */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('players');
                    setPlayerView('all');
                    setSearchQuery('');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.1s'
                  }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
                  }}>
                    <Users size={20} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ffffff', textAlign: 'center' }}>
                    Members
                  </span>
                </button>

                {/* 4. Attendance */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('attendance');
                    setSearchQuery('');
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '14px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.1s'
                  }}
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                  }}>
                    <CheckCircle2 size={20} color="#ffffff" />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#ffffff', textAlign: 'center' }}>
                    Attendance
                  </span>
                </button>
              </div>
            </div>

            {/* Apple Inset Group: Live Club Activity Timeline */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={17} color="#f43f5e" />
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff' }}>
                    Live Activity Timeline
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f43f5e',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  See All <ChevronRight size={14} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {auditLogs.slice(0, 4).map(log => (
                  <div
                    key={log.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      padding: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                        {log.action}
                      </span>
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: log.portal === 'Admin' ? 'rgba(225, 29, 72, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                        color: log.portal === 'Admin' ? '#fda4af' : '#cbd5e1',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}>
                        {log.portal}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.35 }}>
                      {log.details}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                      <span>By: {log.user}</span>
                      <span>{formatShortDateTime(log.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── TAB 2: MEMBERS DIRECTORY ─────────────────────────────── */}
        {activeTab === 'players' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className={`m-btn m-btn-sm ${playerView === 'all' ? 'm-btn-primary' : 'm-btn-secondary'}`}
                onClick={() => { setPlayerView('all'); setSearchQuery(''); }}
              >
                All members ({players.length})
              </button>
              <button
                type="button"
                className={`m-btn m-btn-sm ${playerView === 'pending' ? 'm-btn-primary' : 'm-btn-secondary'}`}
                onClick={() => { setPlayerView('pending'); setSearchQuery(''); }}
              >
                Pending KYC ({pendingKYCCount})
              </button>
            </div>

            {/* Search Input Bar */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search member name, phone or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>
                {playerView === 'pending'
                  ? `Showing ${filteredPlayers.length} pending KYC review${filteredPlayers.length === 1 ? '' : 's'}`
                  : `Showing ${filteredPlayers.length} of ${players.length} members`}
              </span>
            </div>

            {/* Players Inset Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredPlayers.length === 0 && (
                <div className="m-card" style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 16px' }}>
                  <ShieldCheck size={26} color="#10b981" style={{ marginBottom: '8px' }} />
                  <div style={{ color: '#ffffff', fontWeight: 800 }}>No pending KYC reviews</div>
                  <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Every member profile has been reviewed.</div>
                </div>
              )}
              {filteredPlayers.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlayer(p);
                    setPlayerDrawerTab('info');
                    setKycAction(null);
                    setIsPlayerModalOpen(true);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.3) 0%, rgba(225, 29, 72, 0.1) 100%)',
                      border: '1px solid rgba(225, 29, 72, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: '#f43f5e',
                      flexShrink: 0
                    }}>
                      {p.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.fullName}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                        Player ID {formatPlayerNumber(p)} • {p.phone}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <KYCBadge status={p.kycStatus} />
                    <ChevronRight size={16} color="#64748b" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: ATTENDANCE & ARRIVALS ─────────────────────────── */}
        {activeTab === 'attendance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search check-in records..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px 11px 38px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredCheckIns.map(c => {
                const player = players.find(p => p.id === c.playerId);
                return (
                <div
                  key={c.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ffffff' }}>
                      {c.playerName}
                    </span>
                    <EntryBadge status={c.verificationStatus} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: '#94a3b8' }}>
                    <span>{formatDateOnly(c.checkInDate)} at {formatTimeOnly(c.checkInTime)}</span>
                    <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                      {player ? `Player ID ${formatPlayerNumber(player)}` : 'Player ID unavailable'}
                    </span>
                  </div>
                  {c.verifiedBy && (
                    <div style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <CheckCircle2 size={13} /> Verified by {c.verifiedBy}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 4: OPERATING EXPENSES & TREASURY ─────────────────── */}
        {activeTab === 'finance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Total Expense Hero Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.25) 0%, rgba(136, 19, 55, 0.15) 100%)',
              border: '1px solid rgba(225, 29, 72, 0.4)',
              borderRadius: '20px',
              padding: '18px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fda4af', textTransform: 'uppercase' }}>
                  Total Recorded Expenses
                </span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '4px' }}>
                  {formatCurrency(totalExpensesAmount)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(true)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '12px',
                  background: '#f43f5e',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(244, 63, 94, 0.4)'
                }}
              >
                <Plus size={15} /> Add Expense
              </button>
            </div>

            {/* Expenses List */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff', marginBottom: '12px' }}>
                Expense Log ({expenses.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {expenses.map(exp => (
                  <div
                    key={exp.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                        {exp.category}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fca5a5' }}>
                        -{formatCurrency(exp.amount)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {exp.description}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                      <span>Paid to: {exp.paidTo}</span>
                      <span>{formatDateOnly(exp.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: STAFF ACCESS MANAGER ─────────────────────────── */}
        {activeTab === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <StaffManager />
          </div>
        )}

        {/* ── TAB 6: AUDIT TRAIL ──────────────────────────────────── */}
        {activeTab === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#ffffff', padding: '0 4px' }}>
              Chronological Audit Trail ({auditLogs.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {auditLogs.map(log => (
                <div
                  key={log.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '14px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>
                      {log.action}
                    </span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '6px',
                      background: 'rgba(225, 29, 72, 0.15)',
                      color: '#fda4af'
                    }}>
                      {log.portal}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {log.details}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                    <span>User: {log.user}</span>
                    <span>{formatShortDateTime(log.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ── Apple Style Floating Bottom Tab Bar ────────────────────── */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        height: '66px',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: 'rgba(18, 14, 20, 0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxSizing: 'content-box'
      }}>
        {[
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'players', label: 'Members', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: CheckCircle2 },
          { id: 'finance', label: 'Expenses', icon: Receipt },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Open ${item.label}`}
              onClick={() => {
                setActiveTab(item.id as typeof activeTab);
                if (item.id === 'players') setPlayerView('all');
                setSearchQuery('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: isActive ? '#f43f5e' : '#94a3b8',
                cursor: 'pointer',
                padding: '7px 10px',
                minWidth: '60px',
                minHeight: '48px',
                position: 'relative',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={20} color={isActive ? '#f43f5e' : '#94a3b8'} />
              {item.id === 'players' && pendingKYCCount > 0 && <span className="nav-badge">{pendingKYCCount}</span>}
              {item.id === 'attendance' && pendingEntryCount > 0 && <span className="nav-badge">{pendingEntryCount}</span>}
              <span style={{ fontSize: '0.68rem', fontWeight: isActive ? 700 : 500 }}>
                {item.label}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          aria-label="Open admin tools"
          aria-current={activeTab === 'staff' || activeTab === 'audit' ? 'page' : undefined}
          onClick={() => setIsMoreOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'staff' || activeTab === 'audit' ? '#f43f5e' : '#94a3b8',
            cursor: 'pointer',
            padding: '7px 10px',
            minWidth: '60px',
            minHeight: '48px'
          }}
        >
          <MoreHorizontal size={20} color={activeTab === 'staff' || activeTab === 'audit' ? '#f43f5e' : '#94a3b8'} />
          <span style={{ fontSize: '0.68rem', fontWeight: 500 }}>
            Tools
          </span>
        </button>
      </nav>

      {/* ── DRAWER 1: Table Chip Orders (Live Software Data) ────────── */}
      <MobileBottomDrawer
        isOpen={isChipsDrawerOpen}
        onClose={() => setIsChipsDrawerOpen(false)}
        title="Table Chip Orders"
        subtitle={`${chipRequests.length} total orders · ${pendingChipOrdersCount} awaiting cashier delivery`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {chipRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '0.86rem' }}>
              No chip orders recorded yet.
            </div>
          ) : (
            chipRequests.map(req => (
              <div
                key={req.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: req.status === 'pending' ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>
                    {req.playerName}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: req.status === 'delivered' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(244, 63, 94, 0.2)',
                    color: req.status === 'delivered' ? '#34d399' : '#fda4af',
                    border: req.status === 'delivered' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.4)'
                  }}>
                    {req.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#94a3b8' }}>Table & Seat:</span>
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>{req.tableNumber} • {req.seatNumber}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ color: '#94a3b8' }}>Order Amount:</span>
                  <span style={{ fontWeight: 800, color: '#fbbf24' }}>{formatCurrency(req.amount)} ({req.chipsQuantity.toLocaleString()} Chips)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px' }}>
                  <span>Requested: {formatTimeOnly(req.requestedAt)}</span>
                  <span>Payment: {req.paymentMethod}</span>
                </div>

                {req.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="m-btn m-btn-emerald m-btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => fulfillChipRequest(req.id)}
                    >
                      <CheckCircle size={14} /> Fulfill & Deliver
                    </button>
                    <button
                      type="button"
                      className="m-btn m-btn-secondary m-btn-sm"
                      onClick={() => cancelChipRequest(req.id)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </MobileBottomDrawer>

      {/* ── DRAWER 2: Active Tournaments (Live Software Data) ──────── */}
      <MobileBottomDrawer
        isOpen={isTournamentsDrawerOpen}
        onClose={() => setIsTournamentsDrawerOpen(false)}
        title="Tournament Schedule"
        subtitle={`${tournaments.length} tournament events · ${entries.length} total players registered`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tournaments.map(trn => {
            const trnEntries = entries.filter(e => e.tournamentId === trn.id);
            return (
              <div
                key={trn.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                    {trn.name}
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    border: '1px solid rgba(168, 85, 247, 0.4)'
                  }}>
                    {trn.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Entry Charge:</span>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>
                      {formatCurrency(trn.buyInFee)} + {formatCurrency(trn.clubRake)} (Fee)
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Guaranteed Pool:</span>
                    <div style={{ fontWeight: 800, color: '#fbbf24' }}>
                      {formatCurrency(trn.guaranteedPrizePool)} GTD
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Starting Chips:</span>
                    <div style={{ fontWeight: 600, color: '#cbd5e1' }}>
                      {trn.startingChips.toLocaleString()} Chips
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Enrolled:</span>
                    <div style={{ fontWeight: 700, color: '#34d399' }}>
                      {trnEntries.length} Players
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '6px' }}>
                  <Calendar size={12} />
                  <span>Start: {formatDateOnly(trn.startTime)} at {formatTimeOnly(trn.startTime)} ({trn.blindLevelsMinutes}m Blinds)</span>
                </div>
              </div>
            );
          })}
        </div>
      </MobileBottomDrawer>

      {/* ── DRAWER 3: Player Inspection & Financial Ledger ──────────── */}
      {selectedPlayer && (
        <MobileBottomDrawer
          isOpen={isPlayerModalOpen}
          onClose={() => setIsPlayerModalOpen(false)}
          title={selectedPlayer.fullName}
          subtitle={`Player ID: ${formatPlayerNumber(selectedPlayer)}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Drawer Tabs (Details vs Financial Ledger) */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
              <button
                type="button"
                className={`btn btn-sm ${playerDrawerTab === 'info' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPlayerDrawerTab('info')}
                style={{ flex: 1 }}
              >
                Member Details & KYC
              </button>
              <button
                type="button"
                className={`btn btn-sm ${playerDrawerTab === 'ledger' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPlayerDrawerTab('ledger')}
                style={{ flex: 1 }}
              >
                Financial Ledger
              </button>
            </div>

            {playerDrawerTab === 'info' ? (
              <>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: '#94a3b8' }}>Contact Phone</span>
                    <span style={{ fontWeight: 600, color: '#ffffff' }}>{selectedPlayer.phone}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: '#94a3b8' }}>1. Aadhaar Card</span>
                    <span style={{ fontWeight: 600, color: '#ffffff', fontFamily: 'monospace' }}>
                      {formatFullAadhaar(selectedPlayer.kyc.aadhaarNumber, selectedPlayer.kyc.govtIdNumber)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: '#94a3b8' }}>2. PAN Card</span>
                    <span style={{ fontWeight: 700, color: '#fb7185', fontFamily: 'monospace' }}>
                      {selectedPlayer.kyc.panNumber || (selectedPlayer.kyc.govtIdNumber ? maskGovtId(selectedPlayer.kyc.govtIdNumber) : 'PAN Verified')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: '#94a3b8' }}>Membership Tier</span>
                    <TierBadge tier={selectedPlayer.membershipTier} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: '#94a3b8' }}>KYC Status</span>
                    <KYCBadge status={selectedPlayer.kycStatus} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: '#94a3b8' }}>Total Club Visits</span>
                    <span style={{ fontWeight: 700, color: '#34d399' }}>{selectedPlayer.totalVisits} Visits</span>
                  </div>

                  <AdminKycDocumentPhotos
                    aadhaarPhotoUrl={selectedPlayer.kyc.aadhaarPhotoUrl}
                    aadhaarBackPhotoUrl={selectedPlayer.kyc.aadhaarBackPhotoUrl}
                    panPhotoUrl={selectedPlayer.kyc.panPhotoUrl}
                    onAadhaarChange={(url) => {
                      const updated = { ...selectedPlayer, kyc: { ...selectedPlayer.kyc, aadhaarPhotoUrl: url || '' } };
                      setSelectedPlayer(updated);
                      updatePlayer(selectedPlayer.id, { kyc: updated.kyc });
                    }}
                    onAadhaarBackChange={(url) => {
                      const updated = { ...selectedPlayer, kyc: { ...selectedPlayer.kyc, aadhaarBackPhotoUrl: url || '' } };
                      setSelectedPlayer(updated);
                      updatePlayer(selectedPlayer.id, { kyc: updated.kyc });
                    }}
                    onPanChange={(url) => {
                      const updated = { ...selectedPlayer, kyc: { ...selectedPlayer.kyc, panPhotoUrl: url || '' } };
                      setSelectedPlayer(updated);
                      updatePlayer(selectedPlayer.id, { kyc: updated.kyc });
                    }}
                  />
                </div>

                {/* Admin Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                    Admin Controls
                  </span>

                  {kycAction ? (
                    <div style={{ background: 'rgba(225, 29, 72, 0.12)', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <strong style={{ fontSize: '0.84rem', color: '#ffffff' }}>
                        {kycAction === 'verified' ? 'Verify this member?' : 'Reject this member’s KYC?'}
                      </strong>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className={`m-btn m-btn-sm ${kycAction === 'verified' ? 'm-btn-emerald' : 'm-btn-danger'}`}
                          style={{ flex: 1 }}
                          onClick={() => {
                            reviewKYC(selectedPlayer.id, kycAction, kycAction === 'rejected' ? 'Admin override' : undefined);
                            setKycAction(null);
                            setIsPlayerModalOpen(false);
                          }}
                        >
                          Confirm {kycAction === 'verified' ? 'verification' : 'rejection'}
                        </button>
                        <button type="button" className="m-btn m-btn-secondary m-btn-sm" onClick={() => setKycAction(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="m-btn m-btn-emerald m-btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => setKycAction('verified')}
                        disabled={selectedPlayer.kycStatus === 'verified'}
                      >
                        <Check size={14} /> Mark Verified
                      </button>
                      <button
                        type="button"
                        className="m-btn m-btn-danger m-btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => setKycAction('rejected')}
                      >
                        <XCircle size={14} /> Reject KYC
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="m-btn m-btn-secondary m-btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => {
                        const newTier = window.prompt(`Update Tier for ${selectedPlayer.fullName} (Standard, Silver, Gold, VIP):`, selectedPlayer.membershipTier);
                        if (newTier) {
                          updatePlayer(selectedPlayer.id, { membershipTier: newTier as any });
                          setSelectedPlayer({ ...selectedPlayer, membershipTier: newTier as any });
                        }
                      }}
                    >
                      <Edit3 size={14} /> Change Tier
                    </button>
                    <button
                      type="button"
                      className="m-btn m-btn-danger m-btn-sm"
                      style={{ width: 'auto' }}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete member ${selectedPlayer.fullName} (Player ID ${formatPlayerNumber(selectedPlayer)})?`)) {
                          deletePlayer(selectedPlayer.id);
                          setIsPlayerModalOpen(false);
                          setSelectedPlayer(null);
                        }
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <PlayerLedger player={selectedPlayer} />
            )}
          </div>
        </MobileBottomDrawer>
      )}

      {/* ── DRAWER 4: Add Expense Drawer ───────────────────────────── */}
      <MobileBottomDrawer
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Record Operating Expense"
        subtitle="Staff wages, rent, table supplies, refreshments"
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

      {/* ── DRAWER 5: More Tools Drawer ────────────────────────────── */}
      <MobileBottomDrawer
        isOpen={isMoreOpen}
        onClose={() => {
          setIsMoreOpen(false);
          setResetConfirm(false);
        }}
        title="Admin Management Tools"
        subtitle="Staff accounts, audit trail and database controls"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('staff'); setIsMoreOpen(false); }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <ShieldCheck size={20} color="#f43f5e" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Staff Accounts</div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Create, suspend or modify staff logins</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('audit'); setIsMoreOpen(false); }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#ffffff',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <History size={20} color="#38bdf8" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Full Audit Trail</div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Review activity across all club stations</div>
            </div>
          </button>

          {!isSupabaseConfigured && <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '14px',
            padding: '14px',
            marginTop: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 700, fontSize: '0.88rem' }}>
              <RotateCcw size={16} /> Reset Demo Data
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 10px' }}>
              Restores initial seed members and tournament records.
            </div>

            {!resetConfirm ? (
              <button
                type="button"
                className="m-btn m-btn-secondary m-btn-sm"
                onClick={() => setResetConfirm(true)}
              >
                Reset Controls
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="m-btn m-btn-danger m-btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => {
                    resetToDemoData();
                    setResetConfirm(false);
                    setIsMoreOpen(false);
                  }}
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  className="m-btn m-btn-secondary m-btn-sm"
                  onClick={() => setResetConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>}
        </div>
      </MobileBottomDrawer>

    </div>
  );
};
