import React, { useState } from 'react';
import {
  DollarSign,
  Trophy,
  UserPlus,
  Receipt,
  Wallet,
  Lock,
  Coins,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { TournamentManager } from './TournamentManager';
import { PlayerTournamentEntry } from './PlayerTournamentEntry';
import { CashManagement } from './CashManagement';
import { BillingHistory } from './BillingHistory';
import { ChipOrderManager } from './ChipOrderManager';
import { DesktopPortalHeader } from '../common/DesktopPortalHeader';
import { DesktopSectionNav, DesktopSectionNavItem } from '../common/DesktopSectionNav';

type CashierTab = 'chip-orders' | 'tournaments' | 'register' | 'cash' | 'billing';

export const CashierPortal: React.FC = () => {
  const { staffName, tournaments, pendingChipOrdersCount } = useClub();
  
  // Read initial tab from URL query params or path (e.g. ?tab=cash or ?portal=cashier&tab=cash)
  const [activeTab, setActiveTabState] = useState<CashierTab>(() => {
    if (typeof window === 'undefined') return 'chip-orders';
    const params = new URLSearchParams(window.location.search);
    const tabParam = (params.get('tab') || params.get('view') || '').toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    if (tabParam === 'cash' || tabParam === 'drawer' || pathname.includes('/cash')) {
      return 'cash';
    }
    if (tabParam === 'tournaments' || tabParam === 'events' || pathname.includes('/tournaments')) {
      return 'tournaments';
    }
    if (tabParam === 'register' || tabParam === 'entry') {
      return 'register';
    }
    if (tabParam === 'billing' || tabParam === 'vouchers') {
      return 'billing';
    }
    return 'chip-orders';
  });

  const setActiveTab = (tab: CashierTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('portal', 'cashier');
      if (tab === 'chip-orders') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const [selectedTournamentForReg, setSelectedTournamentForReg] = useState<string | undefined>(undefined);

  const handleStartRegister = (tournamentId: string) => {
    setSelectedTournamentForReg(tournamentId);
    setActiveTab('register');
  };

  const sections: DesktopSectionNavItem<CashierTab>[] = [
    { id: 'chip-orders', label: 'Chip orders', icon: <Coins size={16} />, badge: pendingChipOrdersCount },
    { id: 'tournaments', label: `Events (${tournaments.length})`, icon: <Trophy size={16} /> },
    { id: 'register', label: 'New entry', icon: <UserPlus size={16} /> },
    { id: 'cash', label: 'Cash drawer', icon: <Wallet size={16} /> },
    { id: 'billing', label: 'Billing records', icon: <Receipt size={16} /> },
  ];

  return (
    <div className="desktop-portal desktop-cashier-portal">
      <DesktopPortalHeader
        icon={<DollarSign size={24} />}
        eyebrow="Cashier desk"
        title="Cashier & treasury workspace"
        subtitle={<>Signed in as <strong>{staffName}</strong> · Terminal 1</>}
        notice={<><Lock size={14} aria-hidden="true" /> Financial and event tools active · KYC documents restricted</>}
      />

      <DesktopSectionNav
        ariaLabel="Cashier sections"
        activeId={activeTab}
        items={sections}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'chip-orders' && <ChipOrderManager />}

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
