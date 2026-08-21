import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Lock,
  QrCode,
  UserPlus,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { SecurityVerificationCard } from './SecurityVerificationCard';
import { SecurityQueue } from './SecurityQueue';
import { QRScannerModal } from './QRScannerModal';
import { WalkInRegistrationModal } from './WalkInRegistrationModal';
import { ClubQRModal } from '../common/ClubQRModal';
import { StatCard } from '../common/StatCard';
import { DesktopPortalHeader } from '../common/DesktopPortalHeader';
import { AppBreadcrumbs } from '../common/AppBreadcrumbs';

export const SecurityPortal: React.FC = () => {
  const { staffName, players, todayCheckIns } = useClub();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isQRStandeeOpen, setIsQRStandeeOpen] = useState(false);

  // Prefer a scanned/deep-linked player, then the first pending arrival.
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const scanId = params.get('scan');
      const playerId = params.get('player') || params.get('playerId');
      const linkedCheckIn = scanId ? todayCheckIns.find(c => c.id === scanId) : undefined;
      const linkedPlayerId = linkedCheckIn?.playerId || playerId;
      const linkedPlayer = linkedPlayerId ? players.find(p => p.id === linkedPlayerId) : undefined;
      if (linkedPlayer) return linkedPlayer;
    }

    const pendingCheckIn = todayCheckIns.find(c => c.verificationStatus === 'pending');
    if (pendingCheckIn) {
      const p = players.find(x => x.id === pendingCheckIn.playerId);
      if (p) return p;
    }
    return players[0] || null;
  });

  const selectedPlayerCheckIn = selectedPlayer
    ? todayCheckIns.find(c => c.playerId === selectedPlayer.id)
    : undefined;

  const pendingCount = todayCheckIns.filter(c => c.verificationStatus === 'pending').length;
  const approvedTodayCount = todayCheckIns.filter(c => c.verificationStatus === 'approved').length;
  const rejectedTodayCount = todayCheckIns.filter(c => c.verificationStatus === 'rejected').length;

  const handleSelect = (player: Player, _checkIn?: DailyCheckIn) => {
    setSelectedPlayer(player);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="desktop-portal desktop-security-portal">
      {/* Contextual Breadcrumbs */}
      <AppBreadcrumbs
        items={[
          { label: 'Club Re Straddle' },
          { label: 'Staff Operations' },
          { label: 'Security Entrance' },
          { label: selectedPlayer ? `Clearance: ${selectedPlayer.fullName}` : 'Inspection Queue' },
        ]}
        activeRole="security"
      />

      <DesktopPortalHeader
        icon={<ShieldCheck size={24} />}
        eyebrow="Security desk"
        title="Door verification workspace"
        subtitle={<>Officer <strong>{staffName}</strong> · Entrance scanner 1</>}
        notice={<><Lock size={14} aria-hidden="true" /> Verification and KYC access only</>}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setIsScannerOpen(true)}
            >
              <QrCode size={17} />
              <span>Scan player pass</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setIsWalkInOpen(true)}
            >
              <UserPlus size={17} color="#fb7185" />
              <span>Register walk-in</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setIsQRStandeeOpen(true)}
            >
              <QrCode size={17} color="#38bdf8" />
              <span>Front desk QR standee</span>
            </button>
          </div>
        }
      />

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectPlayer={handleSelect}
      />

      {/* Walk-in Player Quick Registration Modal */}
      <WalkInRegistrationModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        onSuccess={(player) => {
          handleSelect(player);
        }}
      />

      {/* Front Desk Registration QR Standee */}
      <ClubQRModal
        isOpen={isQRStandeeOpen}
        onClose={() => setIsQRStandeeOpen(false)}
        onOpenNewPlayerForm={() => setIsWalkInOpen(true)}
      />

      {/* Security Stat KPIs */}
      <div className="stats-grid security-kpi-grid">
        <StatCard
          label="Awaiting Door Clearance"
          value={pendingCount}
          icon={<Clock size={20} color="#e11d48" />}
          helper="Waiting in entrance queue"
        />
        <StatCard
          label="Entries Approved Today"
          value={approvedTodayCount}
          icon={<CheckCircle2 size={20} color="#ffffff" />}
          helper="Active players on club floor"
        />
        <StatCard
          label="Entries Denied Today"
          value={rejectedTodayCount}
          icon={<XCircle size={20} color="#e11d48" />}
          helper="Failed age or ID checks"
        />
      </div>

      {/* Main Verification Interface: 2-Column Split */}
      <div className="security-layout-grid">
        {/* Left Column: Focused Player Verification Card */}
        <div className="security-col-main">
          <SecurityVerificationCard
            player={selectedPlayer}
            checkIn={selectedPlayerCheckIn}
          />
        </div>

        {/* Right Column: Live Arrival Queue */}
        <div className="security-col-queue">
          <SecurityQueue
            onSelectPlayer={handleSelect}
            selectedPlayerId={selectedPlayer?.id}
          />
        </div>
      </div>
    </div>
  );
};
