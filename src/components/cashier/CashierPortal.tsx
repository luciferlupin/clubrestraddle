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

type CashierTab = 'chip-orders' | 'tournaments' | 'register' | 'billing';

export const CashierPortal: React.FC = () => {
  const { staffName, tournaments, pendingChipOrdersCount } = useClub();
  const [activeTab, setActiveTab] = useState<CashierTab>('chip-orders');
  const [selectedTournamentForReg, setSelectedTournamentForReg] = useState<string | undefined>(undefined);

  const handleStartRegister = (tournamentId: string) => {
    setSelectedTournamentForReg(tournamentId);
    setActiveTab('register');
  };

  const sections: DesktopSectionNavItem<CashierTab>[] = [
    { id: 'chip-orders', label: 'Chip orders', icon: <Coins size={16} />, badge: pendingChipOrdersCount },
    { id: 'tournaments', label: `Events (${tournaments.length})`, icon: <Trophy size={16} /> },
    { id: 'register', label: 'New entry', icon: <UserPlus size={16} /> },
    { id: 'billing', label: 'Billing records', icon: <Receipt size={16} /> },
  ];

  return (
    <div className="desktop-portal desktop-cashier-portal">
      <DesktopPortalHeader
        icon={<DollarSign size={24} />}
        eyebrow="Cashier desk"
        title="Cashier operations workspace"
        subtitle={<>Signed in as <strong>{staffName}</strong> · Terminal 1</>}
        notice={<><Lock size={14} aria-hidden="true" /> Event registration, chip dispatch & member vouchers</>}
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

      {activeTab === 'billing' && <BillingHistory />}
    </div>
  );
};
