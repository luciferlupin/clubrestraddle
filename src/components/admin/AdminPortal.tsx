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
  Shield,
  Coins,
  RefreshCw,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { AdminDashboard } from './AdminDashboard';
import { AdminPlayersView } from './AdminPlayersView';
import { AdminAttendanceView } from './AdminAttendanceView';
import { AdminTournamentsView } from './AdminTournamentsView';
import { AdminCashView } from './AdminCashView';
import { AdminExpensesView } from './AdminExpensesView';
import { AdminAuditLogsView } from './AdminAuditLogsView';
import { StaffManager } from './StaffManager';
import { ChipOrderManager } from '../cashier/ChipOrderManager';
import { DesktopPortalHeader } from '../common/DesktopPortalHeader';
import { DesktopSectionNav, DesktopSectionNavItem } from '../common/DesktopSectionNav';
import { AppBreadcrumbs } from '../common/AppBreadcrumbs';
import { isSupabaseConfigured } from '../../services/supabaseClient';

type AdminTab = 'dashboard' | 'cash' | 'chip-orders' | 'staff' | 'players' | 'attendance' | 'tournaments' | 'expenses' | 'audit';

export const AdminPortal: React.FC = () => {
  const {
    currentStaffUser,
    resetToDemoData,
    pendingChipOrdersCount,
    players,
    todayCheckIns,
    tournaments,
    staffUsers,
    expenses,
    auditLogs,
    currentCashBalance,
    syncNow,
  } = useClub();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleReset = () => {
    resetToDemoData();
    setResetConfirm(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const pendingKYCCount = players.filter(p => p.kycStatus === 'pending').length;
  const activeTournamentsCount = tournaments.filter(t => t.status === 'Registering' || t.status === 'Running').length;

  const sections: DesktopSectionNavItem<AdminTab>[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'cash', label: 'Cash ledger', icon: <DollarSign size={16} /> },
    { id: 'chip-orders', label: 'Chip orders', icon: <Coins size={16} />, badge: pendingChipOrdersCount || undefined },
    { id: 'staff', label: 'Staff', icon: <Shield size={16} />, badge: staffUsers.length },
    { id: 'players', label: 'Players & KYC', icon: <Users size={16} />, badge: pendingKYCCount > 0 ? `${pendingKYCCount} KYC` : players.length },
    { id: 'attendance', label: 'Attendance', icon: <CheckCircle2 size={16} />, badge: todayCheckIns.length },
    { id: 'tournaments', label: 'Events', icon: <Trophy size={16} />, badge: activeTournamentsCount > 0 ? `${activeTournamentsCount} live` : tournaments.length },
    { id: 'expenses', label: 'Expenses', icon: <Receipt size={16} />, badge: expenses.length },
    { id: 'audit', label: 'Audit log', icon: <History size={16} />, badge: auditLogs.length },
  ];

  const getActiveTabLabel = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'chip-orders':
        return 'Table Chip Orders';
      case 'cash':
        return 'Cash Flow Ledger';
      case 'staff':
        return 'Staff Accounts';
      case 'players':
        return 'Member Directory';
      case 'attendance':
        return 'Attendance Logs';
      case 'tournaments':
        return 'Tournament Management';
      case 'expenses':
        return 'Operating Expenses';
      case 'audit':
        return 'Audit Logs';
      default:
        return 'Admin Center';
    }
  };

  return (
    <div className="desktop-portal desktop-admin-portal">
      {/* Contextual Breadcrumbs */}
      <AppBreadcrumbs
        items={[
          { label: 'Club Re Straddle', onClick: () => setActiveTab('dashboard') },
          { label: 'Management', onClick: () => setActiveTab('dashboard') },
          { label: 'Admin Command', onClick: () => setActiveTab('dashboard') },
          { label: getActiveTabLabel() },
        ]}
        activeRole="admin"
        onBack={activeTab !== 'dashboard' ? () => setActiveTab('dashboard') : undefined}
        backLabel="Back to Dashboard"
      />

      <DesktopPortalHeader
        icon={<ShieldCheck size={24} />}
        eyebrow="Admin center"
        title="Club operations control room"
        subtitle={<>Signed in as <strong>{currentStaffUser ? currentStaffUser.fullName : 'Super Admin'}</strong> · Full operational access</>}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleSync}
              disabled={isSyncing}
              title="Refresh all club data from database"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isSyncing ? 'Syncing…' : 'Sync Data'}</span>
            </button>

            {!isSupabaseConfigured && (
              !resetConfirm ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setResetConfirm(true)}
                  style={{ fontSize: '0.78rem', padding: '6px 12px', color: '#fca5a5' }}
                >
                  <RotateCcw size={14} /> Reset Demo Data
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={handleReset}
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    Confirm Reset
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setResetConfirm(false)}>
                    Cancel
                  </button>
                </div>
              )
            )}
          </div>
        }
      />

      <DesktopSectionNav<AdminTab>
        ariaLabel="Admin sections"
        activeId={activeTab}
        items={sections}
        onChange={tab => setActiveTab(tab)}
        className="desktop-section-nav-admin"
      />

      {/* Tab Views */}
      {activeTab === 'dashboard' && (
        <AdminDashboard onNavigateTab={tab => setActiveTab(tab as AdminTab)} />
      )}

      {activeTab === 'chip-orders' && <ChipOrderManager />}

      {activeTab === 'cash' && <AdminCashView />}

      {activeTab === 'staff' && <StaffManager />}

      {activeTab === 'players' && <AdminPlayersView />}

      {activeTab === 'attendance' && <AdminAttendanceView />}

      {activeTab === 'tournaments' && <AdminTournamentsView />}

      {activeTab === 'expenses' && <AdminExpensesView />}

      {activeTab === 'audit' && <AdminAuditLogsView />}
    </div>
  );
};
