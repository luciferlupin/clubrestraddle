import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Lock,
  QrCode,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { SecurityVerificationCard } from './SecurityVerificationCard';
import { SecurityQueue } from './SecurityQueue';
import { QRScannerModal } from './QRScannerModal';
import { StatCard } from '../common/StatCard';
import { DesktopPortalHeader } from '../common/DesktopPortalHeader';

export const SecurityPortal: React.FC = () => {
  const { staffName, players, todayCheckIns } = useClub();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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
      <DesktopPortalHeader
        icon={<ShieldCheck size={24} />}
        eyebrow="Security desk"
        title="Door verification workspace"
        subtitle={<>Officer <strong>{staffName}</strong> · Entrance scanner 1</>}
        notice={<><Lock size={14} aria-hidden="true" /> Verification and KYC access only</>}
        actions={
          <button
            className="btn btn-primary"
            onClick={() => setIsScannerOpen(true)}
          >
            <QrCode size={17} />
            <span>Scan player pass</span>
          </button>
        }
      />

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectPlayer={handleSelect}
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
        <StatCard
          label="Total Registered Players"
          value={players.length}
          icon={<Users size={20} color="#ffffff" />}
          helper="KYC Database"
        />
      </div>

      {/* Verification Card for Selected Player */}
      {selectedPlayer && (
        <SecurityVerificationCard
          player={selectedPlayer}
          checkIn={selectedPlayerCheckIn}
        />
      )}

      {/* Live Entrance Queue */}
      <SecurityQueue
        selectedPlayerId={selectedPlayer?.id || null}
        onSelectPlayer={handleSelect}
      />
    </div>
  );
};
