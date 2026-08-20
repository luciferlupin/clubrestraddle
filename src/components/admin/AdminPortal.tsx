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

type AdminTab = 'dashboard' | 'chip-orders' | 'staff' | 'players' | 'attendance' | 'tournaments' | 'cash' | 'expenses' | 'audit';

export const AdminPortal: React.FC = () => {
  const { currentStaffUser, resetToDemoData, pendingChipOrdersCount } = useClub();
  
  // Read initial tab from URL query params or path (e.g. ?tab=cash or ?portal=admin&tab=cash)
  const [activeTab, setActiveTabState] = useState<AdminTab>(() => {
    if (typeof window === 'undefined') return 'dashboard';
    const params = new URLSearchParams(window.location.search);
    const tabParam = (params.get('tab') || params.get('view') || '').toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    if (tabParam === 'cash' || tabParam === 'treasury' || pathname.includes('/cash') || pathname.includes('/treasury')) {
      return 'cash';
    }
    if (tabParam === 'expenses' || pathname.includes('/expenses')) {
      return 'expenses';
    }
    if (tabParam === 'chip-orders' || tabParam === 'chips') {
      return 'chip-orders';
    }
    if (tabParam === 'staff') return 'staff';
    if (tabParam === 'players' || tabParam === 'kyc') return 'players';
    if (tabParam === 'attendance') return 'attendance';
    if (tabParam === 'tournaments' || tabParam === 'events') return 'tournaments';
    if (tabParam === 'audit') return 'audit';
    
    return 'dashboard';
  });

  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('portal', 'admin');
      if (tab === 'dashboard') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = () => {
    resetToDemoData();
    setResetConfirm(false);
  };

  const sections: DesktopSectionNavItem<AdminTab>[] = [
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'chip-orders', label: 'Chip orders', icon: <Coins size={16} />, badge: pendingChipOrdersCount },
    { id: 'staff', label: 'Staff', icon: <Shield size={16} /> },
    { id: 'players', label: 'Players & KYC', icon: <Users size={16} /> },
    { id: 'attendance', label: 'Attendance', icon: <CheckCircle2 size={16} /> },
    { id: 'tournaments', label: 'Events', icon: <Trophy size={16} /> },
    { id: 'cash', label: 'Treasury', icon: <DollarSign size={16} /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt size={16} /> },
    { id: 'audit', label: 'Audit log', icon: <History size={16} /> },
  ];

  return (
    <div className="desktop-portal desktop-admin-portal">
      <DesktopPortalHeader
        icon={<ShieldCheck size={24} />}
        eyebrow="Admin center"
        title="Club operations control room"
        subtitle={<>Signed in as <strong>{currentStaffUser ? currentStaffUser.fullName : 'Super Admin'}</strong> · Full operational access</>}
        actions={
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
        }
      />

      <DesktopSectionNav
        ariaLabel="Admin sections"
        activeId={activeTab}
        items={sections}
        onChange={setActiveTab}
        className="desktop-section-nav-admin"
      />

      {/* Tab Views */}
      {activeTab === 'dashboard' && (
        <AdminDashboard onNavigateTab={tab => setActiveTab(tab as AdminTab)} />
      )}

      {activeTab === 'chip-orders' && <ChipOrderManager />}

      {activeTab === 'staff' && <StaffManager />}

      {activeTab === 'players' && <AdminPlayersView />}

      {activeTab === 'attendance' && <AdminAttendanceView />}

      {activeTab === 'tournaments' && <AdminTournamentsView />}

      {activeTab === 'cash' && <AdminCashView />}

      {activeTab === 'expenses' && <AdminExpensesView />}

      {activeTab === 'audit' && <AdminAuditLogsView />}
    </div>
  );
};
