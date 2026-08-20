import React, { useState } from 'react';
import {
  DollarSign,
  Trophy,
  UserPlus,
  Receipt,
  Wallet,
  ShieldAlert,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { TournamentManager } from './TournamentManager';
import { PlayerTournamentEntry } from './PlayerTournamentEntry';
import { CashManagement } from './CashManagement';
import { BillingHistory } from './BillingHistory';

export const CashierPortal: React.FC = () => {
  const { staffName, tournaments, currentCashBalance } = useClub();
  const [activeTab, setActiveTab] = useState<'tournaments' | 'register' | 'cash' | 'billing'>('tournaments');
  const [selectedTournamentForReg, setSelectedTournamentForReg] = useState<string | undefined>(undefined);

  const handleStartRegister = (tournamentId: string) => {
    setSelectedTournamentForReg(tournamentId);
    setActiveTab('register');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Cashier Bar */}
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
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
              Cashier & Treasury Portal
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Logged in as: <strong style={{ color: 'var(--gold-light)' }}>{staffName}</strong> • Desk Terminal #1
            </div>
          </div>
        </div>

        {/* Access Control Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: '#94a3b8',
            background: 'rgba(0,0,0,0.3)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Lock size={13} color="#ffffff" />
          <span>Access Control: Financial & tournament privileges active. Sensitive player KYC documents restricted.</span>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="sub-nav-tabs">
        <button
          className={`sub-tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`}
          onClick={() => setActiveTab('tournaments')}
        >
          <Trophy size={16} /> Tournaments & Events ({tournaments.length})
        </button>

        <button
          className={`sub-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => setActiveTab('register')}
        >
          <UserPlus size={16} /> Register Player & Billing
        </button>

        <button
          className={`sub-tab-btn ${activeTab === 'cash' ? 'active' : ''}`}
          onClick={() => setActiveTab('cash')}
        >
          <Wallet size={16} /> Cash Management & Float
        </button>

        <button
          className={`sub-tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
          onClick={() => setActiveTab('billing')}
        >
          <Receipt size={16} /> Payment & Billing Records
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tournaments' && (
        <TournamentManager onRegisterPlayer={handleStartRegister} />
      )}

      {activeTab === 'register' && (
        <PlayerTournamentEntry
          initialTournamentId={selectedTournamentForReg}
          onDone={() => setSelectedTournamentForReg(undefined)}
        />
      )}

      {activeTab === 'cash' && <CashManagement />}

      {activeTab === 'billing' && <BillingHistory />}
    </div>
  );
};
