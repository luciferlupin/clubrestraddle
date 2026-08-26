import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Lock,
  QrCode,
  UserPlus,
  DollarSign,
  ArrowRightLeft,
  Wallet,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { SecurityVerificationCard } from './SecurityVerificationCard';
import { SecurityQueue } from './SecurityQueue';
import { QRScannerModal } from './QRScannerModal';
import { WalkInRegistrationModal } from './WalkInRegistrationModal';
import { GateCashHandoverModal } from './GateCashHandoverModal';
import { ClubQRModal } from '../common/ClubQRModal';
import { StatCard } from '../common/StatCard';
import { DesktopPortalHeader } from '../common/DesktopPortalHeader';
import { AppBreadcrumbs } from '../common/AppBreadcrumbs';

export const SecurityPortal: React.FC = () => {
  const {
    staffName,
    players,
    todayCheckIns,
    isRealtimeConnected,
    syncNow,
    todayApprovedDoorCount,
    todayGateCollected,
    todayGateTransferredAmount,
    todayGateCashInHand,
    fetchMultiplePlayerKycDocs,
  } = useClub();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isQRStandeeOpen, setIsQRStandeeOpen] = useState(false);
  const [isGateCashModalOpen, setIsGateCashModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Automatically prefetch KYC docs for all pending check-in players and arrivals
  useEffect(() => {
    const pendingIds = todayCheckIns
      .filter(c => c.verificationStatus === 'pending')
      .map(c => c.playerId);
    const kycPendingIds = players
      .filter(p => p.kycStatus === 'pending')
      .map(p => p.id);
    const targetIds = Array.from(new Set([...pendingIds, ...kycPendingIds])).slice(0, 15);
    if (targetIds.length > 0) {
      fetchMultiplePlayerKycDocs(targetIds);
    }
  }, [todayCheckIns, players, fetchMultiplePlayerKycDocs]);

  // Prefer a scanned/deep-linked player, then the first pending arrival.
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(() => {
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
    return null;
  });

  // Automatically deselect if the player is deleted
  useEffect(() => {
    if (selectedPlayer && !players.some(p => p.id === selectedPlayer.id)) {
      setSelectedPlayer(null);
    }
  }, [players, selectedPlayer]);

  const selectedPlayerCheckIn = selectedPlayer
    ? todayCheckIns.find(c => c.playerId === selectedPlayer.id)
    : undefined;
  
  const pendingCheckIn = todayCheckIns.find(c => c.verificationStatus === 'pending');
  const firstPendingPlayer = pendingCheckIn
    ? players.find(p => p.id === pendingCheckIn.playerId) || null
    : players.find(p => p.kycStatus === 'pending') || null;

  const focusedPlayer = selectedPlayer || firstPendingPlayer;
  const focusedCheckIn = focusedPlayer
    ? todayCheckIns.find(c => c.playerId === focusedPlayer.id)
    : undefined;

  const pendingCount = players.filter(p => {
    const chk = todayCheckIns.find(c => c.playerId === p.id);
    return chk?.verificationStatus === 'pending' || p.kycStatus === 'pending';
  }).length;
  const approvedTodayCount = todayCheckIns.filter(c => c.verificationStatus === 'approved').length;
  const rejectedTodayCount = players.filter(p => {
    const chk = todayCheckIns.find(c => c.playerId === p.id);
    return (chk?.verificationStatus === 'rejected' || p.kycStatus === 'rejected') && chk?.verificationStatus !== 'approved';
  }).length;

  const handleSelect = (player: Player, _checkIn?: DailyCheckIn) => {
    setSelectedPlayer(player);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  return (
    <div className="desktop-portal desktop-security-portal">
      {/* Contextual Breadcrumbs */}
      <AppBreadcrumbs
        items={[
          { label: 'Club Re Straddle' },
          { label: 'Staff Operations' },
          { label: 'Security Entrance' },
          { label: focusedPlayer ? `Clearance: ${focusedPlayer.fullName}` : 'Inspection Queue' },
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
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Synchronize check-ins with server"
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isRealtimeConnected ? '#10b981' : '#f59e0b',
                  display: 'inline-block',
                }}
              />
              <span>{isSyncing ? 'Syncing...' : 'Live Sync'}</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setIsGateCashModalOpen(true)}
              style={{ borderColor: 'rgba(245, 158, 11, 0.45)', background: 'rgba(245, 158, 11, 0.12)' }}
            >
              <Wallet size={17} color="#fbbf24" />
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                Gate Till: {formatCurrency(todayGateCashInHand)}
              </span>
            </button>
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

      {/* Realtime Entrance Attention Alert */}
      {pendingCount > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(225, 29, 72, 0.22) 0%, rgba(159, 18, 57, 0.15) 100%)',
            border: '1.5px solid #e11d48',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '16px',
            animation: 'pulse 3s infinite',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(225, 29, 72, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                {pendingCount} Player{pendingCount > 1 ? 's' : ''} Awaiting Entrance Clearance
              </div>
              <div style={{ fontSize: '0.76rem', color: '#fca5a5' }}>
                Arrivals checked in via mobile pass. Inspect KYC credentials and grant floor access.
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              const pending = todayCheckIns.find(c => c.verificationStatus === 'pending');
              if (pending) {
                const target = players.find(p => p.id === pending.playerId);
                if (target) handleSelect(target, pending);
              }
            }}
            style={{ fontSize: '0.76rem' }}
          >
            Review Next Arrival
          </button>
        </div>
      )}

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

      {/* Gate Cash Handover Modal */}
      <GateCashHandoverModal
        isOpen={isGateCashModalOpen}
        onClose={() => setIsGateCashModalOpen(false)}
      />

      {/* Security Stat KPIs */}
      <div className="stats-grid security-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
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
        <div
          className="stat-card"
          style={{
            border: '1.5px solid rgba(245, 158, 11, 0.5)',
            background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.7) 0%, rgba(15, 8, 4, 0.95) 100%)',
            cursor: 'pointer',
          }}
          onClick={() => setIsGateCashModalOpen(true)}
        >
          <div className="stat-info">
            <span className="stat-label" style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
              💵 Gate Cash In Hand
            </span>
            <span className="stat-value" style={{ color: 'var(--gold-light)' }}>
              {formatCurrency(todayGateCashInHand)}
            </span>
            <span className="stat-helper" style={{ color: '#fbbf24' }}>
              Collected {formatCurrency(todayGateCollected)} / Handed Over {formatCurrency(todayGateTransferredAmount)}
            </span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <ArrowRightLeft size={22} />
          </div>
        </div>
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
          {focusedPlayer ? (
            <SecurityVerificationCard player={focusedPlayer} checkIn={focusedCheckIn} />
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
              <CheckCircle2 size={38} color="#10b981" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ color: '#ffffff', margin: 0 }}>Entrance queue is clear</h3>
            </div>
          )}
        </div>

        {/* Right Column: Live Arrival Queue */}
        <div className="security-col-queue">
          <SecurityQueue
            onSelectPlayer={handleSelect}
            selectedPlayerId={focusedPlayer?.id || null}
          />
        </div>
      </div>
    </div>
  );
};
