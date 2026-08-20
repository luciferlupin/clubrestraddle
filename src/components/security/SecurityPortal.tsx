import React, { useState } from 'react';
import {
  ShieldCheck,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Lock,
  Search,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { SecurityVerificationCard } from './SecurityVerificationCard';
import { SecurityQueue } from './SecurityQueue';
import { StatCard } from '../common/StatCard';

export const SecurityPortal: React.FC = () => {
  const { staffName, players, todayCheckIns } = useClub();

  // Pick first pending player as default selected, or first player
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(() => {
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

  const handleSelect = (player: Player, checkIn?: DailyCheckIn) => {
    setSelectedPlayer(player);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Security Station Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(16, 185, 129, 0.3)',
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
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#ffffff' }}>
              Security & Door Verification Desk
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Officer: <strong style={{ color: '#34d399' }}>{staffName}</strong> • Entrance Scanner Station #1
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
          <Lock size={13} color="#10b981" />
          <span>Strict Access: Verification & KYC only. Cashier billing and financial data hidden.</span>
        </div>
      </div>

      {/* Security Stat KPIs */}
      <div className="stats-grid">
        <StatCard
          label="Awaiting Door Clearance"
          value={pendingCount}
          icon={<Clock size={20} />}
          helper="Waiting in entrance queue"
          glowColor="rgba(245, 158, 11, 0.15)"
          iconColor="#fbbf24"
        />
        <StatCard
          label="Entries Approved Today"
          value={approvedTodayCount}
          icon={<CheckCircle2 size={20} />}
          helper="Active players on club floor"
          glowColor="rgba(16, 185, 129, 0.15)"
          iconColor="#34d399"
        />
        <StatCard
          label="Entries Denied Today"
          value={rejectedTodayCount}
          icon={<XCircle size={20} />}
          helper="Failed age or ID checks"
          glowColor="rgba(239, 68, 68, 0.15)"
          iconColor="#f87171"
        />
        <StatCard
          label="Total Registered Players"
          value={players.length}
          icon={<Users size={20} />}
          helper="Club member database"
          glowColor="rgba(59, 130, 246, 0.15)"
          iconColor="#60a5fa"
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
