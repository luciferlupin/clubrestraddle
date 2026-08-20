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

export const AdminPortal: React.FC = () => {
  const { currentStaffUser, resetToDemoData } = useClub();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = () => {
    resetToDemoData();
    setResetConfirm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Admin Station Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
            }}
          >
            <LayoutDashboard size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
              Master Admin & Club Operations Center
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Logged in as: <strong style={{ color: '#c084fc' }}>{currentStaffUser?.fullName || 'Jai Goel (Super Admin)'}</strong> • Full Access
            </div>
          </div>
        </div>

        {/* Demo Reset Utility */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!resetConfirm ? (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setResetConfirm(true)}
              title="Reset system to clean initial state"
            >
              <RotateCcw size={14} /> Reset Data
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-danger btn-sm" onClick={handleReset}>
                Confirm Reset
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setResetConfirm(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="sub-nav-tabs">
        <button
          className={`sub-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={15} /> Dashboard & Feeds
        </button>

        <button
          className={`sub-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <Shield size={15} color="#c084fc" /> Staff Accounts
        </button>

        <button
          className={`sub-tab-btn ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          <Users size={15} /> Players & KYC
        </button>

        <button
          className={`sub-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <CheckCircle2 size={15} /> Daily Attendance
        </button>

        <button
          className={`sub-tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          <Trophy size={15} /> Tournaments
        </button>

        <button
          className={`sub-tab-btn ${activeTab === 'cash' ? 'active' : ''}`}
          onClick={() => setActiveTab('cash')}
        >
          <DollarSign size={15} /> Cash & Treasury
        </button>

        <button
          className={`sub-tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <Receipt size={15} /> Expenses
        </button>

        <button
          className={`sub-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <History size={15} /> Team Audit Logs
        </button>
      </div>

      {/* Tab Views */}
      {activeTab === 'dashboard' && (
        <AdminDashboard onNavigateTab={tab => setActiveTab(tab)} />
      )}

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
