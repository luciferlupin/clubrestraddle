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

export const AdminPortal: React.FC = () => {
  const { currentStaffUser, resetToDemoData, pendingChipOrdersCount } = useClub();
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
          background: 'linear-gradient(155deg, #130a0e 0%, #090608 100%)',
          border: '1px solid rgba(225, 29, 72, 0.35)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(225, 29, 72, 0.2)',
              border: '1px solid var(--border-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
              Club Operations • Executive Control Room
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Logged in as: <strong style={{ color: 'var(--gold-light)' }}>{currentStaffUser ? currentStaffUser.fullName : 'Super Admin'}</strong> (Admin Station)
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!resetConfirm ? (
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
          className={`sub-tab-btn ${activeTab === 'chip-orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('chip-orders')}
        >
          <Coins size={15} color="#e11d48" /> Live Table Chip Orders
          {pendingChipOrdersCount > 0 && (
            <span
              style={{
                background: '#e11d48',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '10px',
                marginLeft: '6px',
              }}
            >
              {pendingChipOrdersCount}
            </span>
          )}
        </button>

        <button
          className={`sub-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          <Shield size={15} color="#8B0000" /> Staff Accounts
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
