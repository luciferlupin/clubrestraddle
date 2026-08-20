import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Lock,
  Search,
  QrCode,
  Camera,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { SecurityVerificationCard } from './SecurityVerificationCard';
import { SecurityQueue } from './SecurityQueue';
import { QRScannerModal } from './QRScannerModal';
import { StatCard } from '../common/StatCard';

export const SecurityPortal: React.FC = () => {
  const { staffName, players, todayCheckIns } = useClub();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Pick first pending player as default selected, or first player
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(() => {
    const pendingCheckIn = todayCheckIns.find(c => c.verificationStatus === 'pending');
    if (pendingCheckIn) {
      const p = players.find(x => x.id === pendingCheckIn.playerId);
      if (p) return p;
    }
    return players[0] || null;
  });

  // Check URL query parameters for pre-selected scanned check-in
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const scanId = params.get('scan');
    const playerId = params.get('player') || params.get('playerId');

    if (scanId) {
      const foundCheckIn = todayCheckIns.find(c => c.id === scanId);
      if (foundCheckIn) {
        const foundPlayer = players.find(p => p.id === foundCheckIn.playerId);
        if (foundPlayer) setSelectedPlayer(foundPlayer);
      }
    } else if (playerId) {
      const foundPlayer = players.find(p => p.id === playerId);
      if (foundPlayer) setSelectedPlayer(foundPlayer);
    }
  }, [todayCheckIns, players]);

  const selectedPlayerCheckIn = selectedPlayer
    ? todayCheckIns.find(c => c.playerId === selectedPlayer.id)
    : undefined;

  const pendingCount = todayCheckIns.filter(c => c.verificationStatus === 'pending').length;
  const approvedTodayCount = todayCheckIns.filter(c => c.verificationStatus === 'approved').length;
  const rejectedTodayCount = todayCheckIns.filter(c => c.verificationStatus === 'rejected').length;

  const handleSelect = (player: Player, checkIn?: DailyCheckIn) => {
    setSelectedPlayer(player);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Security Station Header */}
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
              Security & Door Verification Desk
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
              Officer: <strong style={{ color: '#ffffff' }}>{staffName}</strong> • Entrance Scanner Station #1
            </div>
          </div>
        </div>

        {/* Action Controls & Scanner Launch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => setIsScannerOpen(true)}
            style={{ minHeight: '40px' }}
          >
            <QrCode size={17} />
            <span>Scan Player Pass QR</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
              color: '#ffffff',
              background: '#110406',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(225, 29, 72, 0.45)',
            }}
          >
            <Lock size={13} color="#ffffff" />
            <span>Strict Access: Verification & KYC only.</span>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectPlayer={handleSelect}
      />

      {/* Security Stat KPIs */}
      <div className="stats-grid">
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
