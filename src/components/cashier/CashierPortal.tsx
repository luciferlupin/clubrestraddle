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
import { AppBreadcrumbs } from '../common/AppBreadcrumbs';

type CashierTab = 'chip-orders' | 'tournaments' | 'register' | 'billing';

export const CashierPortal: React.FC = () => {
  const { staffName, tournaments, pendingChipOrdersCount, todayEntries, todayCashTransactions, todayExpenses } = useClub();
  const [activeTab, setActiveTab] = useState<CashierTab>('chip-orders');
  const [selectedTournamentForReg, setSelectedTournamentForReg] = useState<string | undefined>(undefined);

  const totalTodayRecords = todayEntries.length + todayCashTransactions.length + todayExpenses.length;

  const handleStartRegister = (tournamentId: string) => {
    setSelectedTournamentForReg(tournamentId);
    setActiveTab('register');
  };

  const sections: DesktopSectionNavItem<CashierTab>[] = [
    { id: 'chip-orders', label: 'Chip orders', icon: <Coins size={16} />, badge: pendingChipOrdersCount },
    { id: 'tournaments', label: `Events (${tournaments.length})`, icon: <Trophy size={16} /> },
    { id: 'register', label: 'New entry', icon: <UserPlus size={16} /> },
    { id: 'billing', label: "Today's ledger", icon: <Receipt size={16} />, badge: totalTodayRecords },
  ];

  const getActiveTabLabel = () => {
    switch (activeTab) {
      case 'chip-orders':
        return 'Chip Order Dispatch';
      case 'tournaments':
        return 'Tournaments & Fixtures';
      case 'register':
        return 'Tournament Entry & Billing';
      case 'billing':
        return "Today's Desk Transactions & Balances";
      default:
        return 'Overview';
    }
  };

  return (
    <div className="desktop-portal desktop-cashier-portal">
      {/* Contextual Breadcrumb Navigation Bar */}
      <AppBreadcrumbs
        items={[
          { label: 'Club Re Straddle', onClick: () => setActiveTab('chip-orders') },
          { label: 'Staff Operations', onClick: () => setActiveTab('chip-orders') },
          { label: 'Cashier Desk', onClick: () => setActiveTab('chip-orders') },
          { label: getActiveTabLabel() },
        ]}
        activeRole="cashier"
        onBack={
          activeTab === 'register' && selectedTournamentForReg
            ? () => {
                setSelectedTournamentForReg(undefined);
                setActiveTab('tournaments');
              }
            : activeTab !== 'chip-orders'
            ? () => setActiveTab('chip-orders')
            : undefined
        }
        backLabel={
          activeTab === 'register' && selectedTournamentForReg
            ? 'Back to Tournaments'
            : 'Back to Chip Orders'
        }
      />

      <DesktopPortalHeader
        icon={<DollarSign size={24} />}
        eyebrow="Cashier desk"
        title="Cashier operations workspace"
        subtitle={<>Signed in as <strong>{staffName}</strong> · Terminal 1</>}
        notice={<><Lock size={14} aria-hidden="true" /> Event registration, chip dispatch & player desk</>}
      />

      <DesktopSectionNav<CashierTab>
        ariaLabel="Cashier sections"
        activeId={activeTab}
        items={sections}
        onChange={tab => setActiveTab(tab)}
      />

      {/* Tab Content */}
      {activeTab === 'chip-orders' && <ChipOrderManager />}

      {activeTab === 'tournaments' && (
        <TournamentManager onRegisterPlayer={handleStartRegister} />
      )}

      {activeTab === 'register' && (
        <PlayerTournamentEntry
          initialTournamentId={selectedTournamentForReg}
          onDone={() => {
            setSelectedTournamentForReg(undefined);
            setActiveTab('tournaments');
          }}
        />
      )}

      {activeTab === 'billing' && <BillingHistory />}
    </div>
  );
};
