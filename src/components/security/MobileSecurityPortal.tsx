import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  ChevronRight,
  LogOut,
  UserPlus,
  RefreshCw,
  Eye,
  Check,
  X,
  ZoomIn,
  CreditCard,
  BadgeCheck,
  FileText,
  FileCheck2,
  FileX,
  Users,
  Wallet,
  DollarSign,
  ArrowRightLeft,
  ArrowRight,
  Building2,
  History,
  Printer,
  Copy,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn, PaymentMethod } from '../../types';
import { formatTimeOnly, formatAadhaarNumber, formatPanNumber, formatPlayerNumber, formatCurrency, formatShortDateTime } from '../../utils/formatters';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { QRScannerModal } from './QRScannerModal';
import { WalkInRegistrationModal } from './WalkInRegistrationModal';
import { GateCashHandoverModal } from './GateCashHandoverModal';
import { ClubQRModal } from '../common/ClubQRModal';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { generateEntryFeeInvoice } from '../../utils/invoiceGenerator';
import { parsePlayerVerificationCode } from '../../utils/qrPass';
import confetti from 'canvas-confetti';

export const MobileSecurityPortal: React.FC = () => {
  const {
    staffName,
    logoutStaff,
    players,
    todayCheckIns,
    checkIns,
    approvePlayerEntry,
    rejectPlayerEntry,
    reviewKYC,
    isRealtimeConnected,
    syncNow,
    todayApprovedDoorCount,
    todayGateCollected,
    todayGateTransferredAmount,
    todayGateCashInHand,
    todayGateTransfers,
    fetchPlayerKycDocs,
    fetchMultiplePlayerKycDocs,
    ensureScannedPlayer,
  } = useClub();

  const [activeNav, setActiveNav] = useState<'scan' | 'queue' | 'gate-cash'>('scan');
  const [isGateCashModalOpen, setIsGateCashModalOpen] = useState(false);
  const [queueFilter, setQueueFilter] = useState<'pending' | 'rejected' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(() => {
    if (typeof window === 'undefined' || !window.location.search) return null;
    const parsed = parsePlayerVerificationCode(window.location.search);
    if (parsed.fullName || parsed.phone || parsed.playerId || parsed.scanId) {
      const res = ensureScannedPlayer({
        id: parsed.playerId,
        checkInId: parsed.scanId,
        fullName: parsed.fullName,
        phone: parsed.phone,
        email: parsed.email,
        aadhaarNumber: parsed.aadhaarNumber,
        panNumber: parsed.panNumber,
        membershipTier: parsed.membershipTier,
      });
      if (res && res.player) return res.player;
    }
    return null;
  });

  // Reactive URL query parameter listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.search) return;
    const parsed = parsePlayerVerificationCode(window.location.search);
    if (parsed.fullName || parsed.phone || parsed.playerId || parsed.scanId) {
      const res = ensureScannedPlayer({
        id: parsed.playerId,
        checkInId: parsed.scanId,
        fullName: parsed.fullName,
        phone: parsed.phone,
        email: parsed.email,
        aadhaarNumber: parsed.aadhaarNumber,
        panNumber: parsed.panNumber,
        membershipTier: parsed.membershipTier,
      });
      if (res && res.player) {
        setSelectedPlayer(res.player);
      }
    }
  }, [players, todayCheckIns, checkIns, ensureScannedPlayer]);

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRejectKycOpen, setIsRejectKycOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Govt ID details mismatch or expired identification.');
  const [rejectKycReason, setRejectKycReason] = useState('Govt ID photo is unclear or name does not match Aadhaar/PAN record.');
  const [verificationSuccessToast, setVerificationSuccessToast] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isQRStandeeOpen, setIsQRStandeeOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [entryInvoice, setEntryInvoice] = useState<ClubInvoiceData | null>(null);
  const [pendingApproval, setPendingApproval] = useState<{ player: Player; checkIn?: DailyCheckIn } | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);

  // Automatically prefetch KYC docs for all pending check-in players
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

  // Automatically deselect if player is deleted and fetch KYC docs on-demand
  useEffect(() => {
    if (selectedPlayer && !players.some(p => p.id === selectedPlayer.id)) {
      setSelectedPlayer(null);
    }
    if (pendingApproval && !players.some(p => p.id === pendingApproval.player.id)) {
      setPendingApproval(null);
    }
    const targetId = selectedPlayer?.id || pendingApproval?.player?.id || (pendingQueuePlayers.length > 0 ? pendingQueuePlayers[0]?.id : players[0]?.id);
    if (targetId) {
      fetchPlayerKycDocs(targetId);
    }
  }, [players, selectedPlayer, pendingApproval, fetchPlayerKycDocs]);

  const pendingQueuePlayers = players
    .filter(p => {
      const checkIn = todayCheckIns.find(c => c.playerId === p.id);
      return checkIn?.verificationStatus === 'pending' || p.kycStatus === 'pending';
    })
    .sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime());

  const rejectedQueuePlayers = players
    .filter(p => {
      const checkIn = todayCheckIns.find(c => c.playerId === p.id);
      return (checkIn?.verificationStatus === 'rejected' || p.kycStatus === 'rejected') && checkIn?.verificationStatus !== 'approved';
    })
    .sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime());

  // Search filter across ALL players
  const searchResults = search.trim()
    ? players.filter(
        p =>
          p.fullName.toLowerCase().includes(search.toLowerCase()) ||
          p.phone.includes(search) ||
          p.id.toLowerCase().includes(search.toLowerCase()) ||
          String(p.memberNumber || '').includes(search) ||
          (p.kyc?.aadhaarNumber || '').replace(/\s/g, '').includes(search.replace(/\s/g, '')) ||
          (p.kyc?.panNumber || '').toLowerCase().includes(search.toLowerCase()) ||
          (p.kyc?.govtIdNumber || '').toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const selectedPlayerCheckIn = selectedPlayer
    ? todayCheckIns.find(c => c.playerId === selectedPlayer.id)
    : undefined;

  const [doorPaymentMethod, setDoorPaymentMethod] = useState<PaymentMethod>('Cash');

  const handleApprove = (player: Player, checkIn?: DailyCheckIn, shouldPrint = false) => {
    approvePlayerEntry(checkIn?.id || player.id, doorPaymentMethod);
    setPendingApproval(null);

    setVerificationSuccessToast(`Entry approved for ${player.fullName} (${doorPaymentMethod})!`);
    setTimeout(() => setVerificationSuccessToast(null), 3000);

    if (shouldPrint) {
      setEntryInvoice(generateEntryFeeInvoice(player, checkIn, staffName));
      setIsInvoiceOpen(true);
    }

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#ffffff', '#34d399', '#059669'],
      });
    } catch {
      // Fallback
    }
  };

  const handleVerifyKYC = (player: Player) => {
    reviewKYC(player.id, 'verified');
    setVerificationSuccessToast(`Aadhaar & PAN KYC verified for ${player.fullName}!`);
    setTimeout(() => setVerificationSuccessToast(null), 3000);
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#ffffff'],
      });
    } catch {}
  };

  const handleVerifyKycAndApprove = (player: Player, checkIn?: DailyCheckIn, shouldPrint = false) => {
    reviewKYC(player.id, 'verified');
    approvePlayerEntry(checkIn?.id || player.id, doorPaymentMethod);
    setPendingApproval(null);

    setVerificationSuccessToast(`KYC Verified & Entry Approved for ${player.fullName} (${doorPaymentMethod})!`);
    setTimeout(() => setVerificationSuccessToast(null), 3000);

    if (shouldPrint) {
      setEntryInvoice(generateEntryFeeInvoice(player, checkIn, staffName));
      setIsInvoiceOpen(true);
    }

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#ffffff', '#34d399', '#e11d48'],
      });
    } catch {}
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    rejectPlayerEntry(selectedPlayerCheckIn?.id || selectedPlayer.id, rejectReason.trim());

    setIsRejectOpen(false);
    setVerificationSuccessToast(`Entry Denied for ${selectedPlayer.fullName}`);
    setTimeout(() => setVerificationSuccessToast(null), 3000);
  };

  const handleRejectKycConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    reviewKYC(selectedPlayer.id, 'rejected', rejectKycReason.trim());
    setIsRejectKycOpen(false);
    setVerificationSuccessToast(`KYC Rejected for ${selectedPlayer.fullName}`);
    setTimeout(() => setVerificationSuccessToast(null), 3000);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const rawPlayerToInspect =
    selectedPlayer ||
    (pendingQueuePlayers.length > 0 ? pendingQueuePlayers[0] : null);

  const playerToInspect = rawPlayerToInspect
    ? players.find(p => p.id === rawPlayerToInspect.id) || rawPlayerToInspect
    : null;

  const playerToInspectCheckIn = playerToInspect
    ? todayCheckIns.find(c => c.playerId === playerToInspect.id)
    : undefined;

  return (
    <div className="mobile-app-shell staff-app-shell is-security-portal">
      {/* ── Security Officer Top Bar ──────────────────────── */}
      <header className="security-session-bar" role="banner">
        <div className="security-session-id">
          <span className="security-station-badge"><ShieldCheck size={13} /> ENTRANCE GATE</span>
          <span className="security-officer-name">
            <strong>{staffName}</strong>
            <small><span className={isRealtimeConnected ? '' : 'offline'} /> Security on duty · Desk 1</small>
          </span>
        </div>
        <div className="security-session-actions">
          {pendingQueuePlayers.length > 0 && (
            <button type="button" onClick={() => setActiveNav('queue')}>
              <Clock size={13} /> {pendingQueuePlayers.length} waiting
            </button>
          )}
          <button type="button" onClick={handleManualSync} disabled={isSyncing} aria-label="Sync entrance queue" title="Sync entrance queue">
            <RefreshCw size={15} className={isSyncing ? 'spin-animation' : ''} />
          </button>
          <button type="button" onClick={logoutStaff} aria-label="Sign out" title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── Main Content Area ─────────────────────────────── */}
      <div className="staff-scroll-area" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Floating Success Toast */}
        {verificationSuccessToast && (
          <div
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}
          >
            <CheckCircle2 size={18} /> {verificationSuccessToast}
          </div>
        )}

        {/* Gate Till In-Hand Banner (Always visible in Security) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.9) 0%, rgba(15, 8, 4, 0.98) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.55)',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>
              <Wallet size={14} /> Gate Till In Hand
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-light)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(todayGateCashInHand)}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#cbd5e1', marginTop: '1px' }}>
              Collected {formatCurrency(todayGateCollected)} ({todayApprovedDoorCount} entries) · Handed {formatCurrency(todayGateTransferredAmount)}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{
              fontSize: '0.76rem',
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderColor: '#fbbf24',
              color: '#000000',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setIsGateCashModalOpen(true)}
          >
            <ArrowRightLeft size={13} />
            <span>Handover Cash</span>
          </button>
        </div>

        {/* TAB 1: SCAN & VERIFICATION */}
        {activeNav === 'scan' && (
          <>
            {/* Quick Action Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  padding: '12px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                }}
                onClick={() => setIsScannerOpen(true)}
              >
                <QrCode size={20} />
                <span>Scan QR Pass</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '12px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                }}
                onClick={() => setIsWalkInOpen(true)}
              >
                <UserPlus size={20} color="#fb7185" />
                <span>Walk-in Member</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '12px 6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '12px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                }}
                onClick={() => setIsQRStandeeOpen(true)}
              >
                <QrCode size={20} color="#38bdf8" />
                <span>Desk Standee</span>
              </button>
            </div>

            {/* Member Lookup Bar */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px', height: '42px', fontSize: '0.88rem', borderRadius: '12px' }}
                placeholder="Search member name (e.g. abcd), phone, ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Search Dropdown Results */}
            {search.trim() && (
              <div
                style={{
                  background: '#15060b',
                  border: '1.5px solid rgba(225, 29, 72, 0.4)',
                  borderRadius: '14px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                }}
              >
                {searchResults.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                    No members found matching "{search}"
                  </div>
                ) : (
                  searchResults.map(p => {
                    const checkIn = todayCheckIns.find(c => c.playerId === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          color: '#ffffff',
                        }}
                        onClick={() => {
                          setSelectedPlayer(p);
                          setSearch('');
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>{p.fullName}</span>
                          <KYCBadge status={p.kycStatus} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#94a3b8' }}>
                          <span>Player ID {formatPlayerNumber(p)} • {p.phone}</span>
                          {checkIn && <EntryBadge status={checkIn.verificationStatus} />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Selected / Focused Player Verification Card */}
            {playerToInspect ? (
              <div
                style={{
                  background: 'linear-gradient(155deg, #18080d 0%, #0d0305 100%)',
                  border: '1.5px solid rgba(225, 29, 72, 0.45)',
                  borderRadius: '18px',
                  padding: '16px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(225, 29, 72, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={15} color="#10b981" /> Member Clearance Card
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <TierBadge tier={playerToInspect.membershipTier} />
                    <KYCBadge status={playerToInspect.kycStatus} />
                    {playerToInspectCheckIn && <EntryBadge status={playerToInspectCheckIn.verificationStatus} />}
                    {selectedPlayer && (
                      <button
                        type="button"
                        onClick={() => setSelectedPlayer(null)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '6px',
                          color: '#cbd5e1',
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                        title="Deselect Player"
                      >
                        <X size={12} /> Clear
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {playerToInspect.kyc.photoUrl ? (
                    <img
                      src={playerToInspect.kyc.photoUrl}
                      alt={playerToInspect.fullName}
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: `2.5px solid ${playerToInspectCheckIn?.verificationStatus === 'approved' ? '#10b981' : '#e11d48'}`,
                        boxShadow: '0 0 15px rgba(0,0,0,0.8)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #e11d48 0%, #881337 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.6rem',
                        fontWeight: 900,
                        color: '#ffffff',
                        border: '2.5px solid #ffffff',
                        flexShrink: 0,
                      }}
                    >
                      {playerToInspect.fullName.charAt(0)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {playerToInspect.fullName}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: '#cbd5e1', marginTop: '3px' }}>
                      Player ID {formatPlayerNumber(playerToInspect)} • {playerToInspect.phone}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>
                      {playerToInspect.totalVisits} Club Visits · {playerToInspect.membershipTier} Tier
                    </div>
                  </div>
                </div>

                {/* KYC & Verification Details Summary */}
                <div
                  style={{
                    background: '#100407',
                    border: '1px solid rgba(225, 29, 72, 0.35)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '9px',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', background: 'rgba(0,0,0,0.35)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(225,29,72,0.2)' }}>
                    <span style={{ color: '#fda4af', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 800 }}>
                      <CreditCard size={14} color="#e11d48" /> 1. Aadhaar ID:
                    </span>
                    <strong style={{ color: '#ffffff', fontFamily: 'monospace', letterSpacing: '0.04em', fontSize: '0.92rem' }}>
                      {formatAadhaarNumber(playerToInspect.kyc.aadhaarNumber, playerToInspect.kyc.govtIdNumber) || 'Aadhaar On File'}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1', background: 'rgba(0,0,0,0.35)', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.2)' }}>
                    <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 800 }}>
                      <BadgeCheck size={14} color="#38bdf8" /> 2. PAN ID:
                    </span>
                    <strong style={{ color: '#38bdf8', fontFamily: 'monospace', letterSpacing: '0.04em', fontSize: '0.92rem' }}>
                      {formatPanNumber(playerToInspect.kyc.panNumber, playerToInspect.kyc.govtIdNumber) || 'PAN On File'}
                    </strong>
                  </div>

                  {/* Attached Document Buttons */}
                  <div style={{ display: 'flex', gap: '6px', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', flexWrap: 'wrap' }}>
                    {playerToInspect.kyc.aadhaarPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewingDoc({ title: `${playerToInspect.fullName} - Aadhaar Front`, url: playerToInspect.kyc.aadhaarPhotoUrl! })}
                        style={{
                          flex: 1,
                          minWidth: '95px',
                          background: 'rgba(225, 29, 72, 0.18)',
                          border: '1px solid rgba(225, 29, 72, 0.45)',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={12} color="#fb7185" /> Aadhaar Front
                      </button>
                    ) : (
                      <div
                        style={{
                          flex: 1,
                          minWidth: '95px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px dashed rgba(225, 29, 72, 0.25)',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fda4af',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                        }}
                      >
                        No Front Photo
                      </div>
                    )}
                    {playerToInspect.kyc.aadhaarBackPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewingDoc({ title: `${playerToInspect.fullName} - Aadhaar Back`, url: playerToInspect.kyc.aadhaarBackPhotoUrl! })}
                        style={{
                          flex: 1,
                          minWidth: '95px',
                          background: 'rgba(225, 29, 72, 0.18)',
                          border: '1px solid rgba(225, 29, 72, 0.45)',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={12} color="#fb7185" /> Aadhaar Back
                      </button>
                    ) : (
                      <div
                        style={{
                          flex: 1,
                          minWidth: '95px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px dashed rgba(225, 29, 72, 0.25)',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fda4af',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                        }}
                      >
                        No Back Photo
                      </div>
                    )}
                    {playerToInspect.kyc.panPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setViewingDoc({ title: `${playerToInspect.fullName} - PAN Card Photo`, url: playerToInspect.kyc.panPhotoUrl! })}
                        style={{
                          flex: 1,
                          minWidth: '95px',
                          background: 'rgba(56, 189, 248, 0.18)',
                          border: '1px solid rgba(56, 189, 248, 0.45)',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          color: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={12} color="#38bdf8" /> PAN Photo
                      </button>
                    ) : (
                      <div
                        style={{
                          flex: 1,
                          minWidth: '95px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px dashed rgba(56, 189, 248, 0.25)',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#7dd3fc',
                          fontSize: '0.68rem',
                          fontWeight: 600,
                        }}
                      >
                        No PAN Photo
                      </div>
                    )}
                  </div>

                  {/* Security KYC Controls */}
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      KYC: <strong style={{ color: playerToInspect.kycStatus === 'verified' ? '#34d399' : '#fbbf24' }}>{playerToInspect.kycStatus.toUpperCase()}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {playerToInspect.kycStatus !== 'verified' ? (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.72rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none' }}
                          onClick={() => handleVerifyKYC(playerToInspect)}
                        >
                          <Check size={12} /> Verify KYC
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          onClick={() => reviewKYC(playerToInspect.id, 'pending')}
                        >
                          Reset KYC
                        </button>
                      )}
                      {playerToInspect.kycStatus !== 'rejected' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', color: '#ef4444' }}
                          onClick={() => {
                            setSelectedPlayer(playerToInspect);
                            setIsRejectKycOpen(true);
                          }}
                        >
                          <FileX size={12} /> Reject KYC
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Entry Approval Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Channel Picker for ₹500 Door Fee */}
                  {playerToInspectCheckIn?.verificationStatus !== 'approved' && (
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.35)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${doorPaymentMethod === 'Cash' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, fontSize: '0.68rem', padding: '4px 2px', borderRadius: '6px' }}
                        onClick={() => setDoorPaymentMethod('Cash')}
                      >
                        💵 Cash (Till)
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${doorPaymentMethod === 'UPI/Digital' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, fontSize: '0.68rem', padding: '4px 2px', borderRadius: '6px', color: doorPaymentMethod === 'UPI/Digital' ? undefined : '#38bdf8' }}
                        onClick={() => setDoorPaymentMethod('UPI/Digital')}
                      >
                        📱 UPI (Bank)
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${doorPaymentMethod === 'Bank Transfer' ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, fontSize: '0.68rem', padding: '4px 2px', borderRadius: '6px', color: doorPaymentMethod === 'Bank Transfer' ? undefined : '#c084fc' }}
                        onClick={() => setDoorPaymentMethod('Bank Transfer')}
                      >
                        🏦 Wire (Bank)
                      </button>
                    </div>
                  )}

                  {playerToInspect.kycStatus === 'pending' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-emerald"
                        style={{
                          padding: '11px 8px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                        }}
                        onClick={() => handleVerifyKycAndApprove(playerToInspect, playerToInspectCheckIn, false)}
                        title="Verify KYC and grant entrance without opening bill"
                      >
                        <CheckCircle2 size={15} /> Verify (No Bill)
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{
                          background: 'linear-gradient(135deg, #e11d48, #be123c)',
                          borderColor: '#fda4af',
                          padding: '11px 8px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                        }}
                        onClick={() => handleVerifyKycAndApprove(playerToInspect, playerToInspectCheckIn, true)}
                        title="Verify KYC and instantly print/view ₹500 bill"
                      >
                        <Printer size={15} /> Verify & Print Bill
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: playerToInspectCheckIn?.verificationStatus === 'approved' ? '1fr' : '1fr 1.3fr 1.3fr', gap: '6px' }}>
                    {playerToInspectCheckIn?.verificationStatus !== 'approved' && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', padding: '10px 6px', fontSize: '0.78rem' }}
                        onClick={() => {
                          setSelectedPlayer(playerToInspect);
                          setIsRejectOpen(true);
                        }}
                      >
                        <XCircle size={14} /> Deny
                      </button>
                    )}

                    {playerToInspectCheckIn?.verificationStatus !== 'approved' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{
                            background: '#10b981',
                            borderColor: '#10b981',
                            color: '#000000',
                            fontWeight: 900,
                            padding: '10px 6px',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                          onClick={() => handleApprove(playerToInspect, playerToInspectCheckIn, false)}
                          title="Approve entry without opening printable bill"
                        >
                          <Check size={14} /> No Bill
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{
                            background: 'linear-gradient(135deg, #e11d48, #be123c)',
                            borderColor: '#fda4af',
                            color: '#ffffff',
                            fontWeight: 800,
                            padding: '10px 6px',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                          }}
                          onClick={() => handleApprove(playerToInspect, playerToInspectCheckIn, true)}
                          title="Approve entry and open printable ₹500 bill"
                        >
                          <Printer size={14} /> Print Bill
                        </button>
                      </>
                    )}
                  </div>

                  {playerToInspectCheckIn?.verificationStatus === 'approved' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        width: '100%',
                        background: 'rgba(225, 29, 72, 0.16)',
                        borderColor: 'rgba(225, 29, 72, 0.45)',
                        color: '#ffffff',
                        fontWeight: 800,
                        padding: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        fontSize: '0.86rem',
                        borderRadius: '10px',
                      }}
                      onClick={() => {
                        setEntryInvoice(generateEntryFeeInvoice(playerToInspect, playerToInspectCheckIn, staffName));
                        setIsInvoiceOpen(true);
                      }}
                    >
                      <Printer size={16} color="#fb7185" />
                      <span>Print / View Bill Receipt (₹500 · 5% Service Charge)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#120508',
                  border: '1px dashed rgba(225, 29, 72, 0.4)',
                  borderRadius: '16px',
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: '#94a3b8',
                }}
              >
                <ShieldCheck size={36} color="#fb7185" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem' }}>No Player Selected</div>
                <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>Scan a pass or select a member from search/queue to inspect credentials.</div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: ENTRANCE & KYC QUEUE */}
        {activeNav === 'queue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px' }}>
              <button
                type="button"
                className={`btn btn-sm ${queueFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setQueueFilter('pending')}
                style={{ flex: 1, fontSize: '0.75rem', borderRadius: '10px' }}
              >
                Awaiting ({pendingQueuePlayers.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${queueFilter === 'rejected' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setQueueFilter('rejected')}
                style={{ flex: 1, fontSize: '0.75rem', borderRadius: '10px' }}
              >
                Denied ({rejectedQueuePlayers.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${queueFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setQueueFilter('all')}
                style={{ flex: 1, fontSize: '0.75rem', borderRadius: '10px' }}
              >
                All ({todayCheckIns.length})
              </button>
            </div>

            {/* Queue Items */}
            {(() => {
              let items: Player[] = [];
              if (queueFilter === 'pending') items = pendingQueuePlayers;
              else if (queueFilter === 'rejected') items = rejectedQueuePlayers;
              else items = players.filter(p => todayCheckIns.some(c => c.playerId === p.id) || p.kycStatus === 'pending' || p.kycStatus === 'rejected').sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime());

              if (items.length === 0) {
                return (
                  <div
                    style={{
                      background: '#120508',
                      border: '1px dashed rgba(225, 29, 72, 0.4)',
                      borderRadius: '16px',
                      padding: '32px 16px',
                      textAlign: 'center',
                      color: '#94a3b8',
                    }}
                  >
                    <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem' }}>Queue is Clear</div>
                    <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>No players matching the selected filter.</div>
                  </div>
                );
              }

              return items.map(player => {
                const checkIn = todayCheckIns.find(c => c.playerId === player.id);

                return (
                  <article
                    key={player.id}
                    style={{
                      background: 'linear-gradient(145deg, #15060b 0%, #0a0305 100%)',
                      border: `1.5px solid ${checkIn?.verificationStatus === 'approved' ? '#10b981' : checkIn?.verificationStatus === 'rejected' ? '#e11d48' : '#fbbf24'}`,
                      borderRadius: '14px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {player.kyc.photoUrl ? (
                          <img
                            src={player.kyc.photoUrl}
                            alt=""
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #ffffff' }}
                          />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e11d48', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                            {player.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>{player.fullName}</div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontFamily: 'monospace' }}>Player ID {formatPlayerNumber(player)} • {player.phone}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <KYCBadge status={player.kycStatus} />
                        {checkIn && <EntryBadge status={checkIn.verificationStatus} />}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.76rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#fda4af', fontWeight: 700 }}>Aadhaar:</span>
                        <strong style={{ color: '#ffffff', fontFamily: 'monospace' }}>
                          {formatAadhaarNumber(player.kyc.aadhaarNumber, player.kyc.govtIdNumber) || 'On File'}
                        </strong>
                        {(player.kyc.aadhaarPhotoUrl || player.kyc.aadhaarBackPhotoUrl) && (
                          <span style={{ fontSize: '0.62rem', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '1px 4px', borderRadius: '3px' }}>
                            Photo Attached
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>PAN Card:</span>
                        <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
                          {formatPanNumber(player.kyc.panNumber, player.kyc.govtIdNumber) || 'On File'}
                        </strong>
                        {player.kyc.panPhotoUrl && (
                          <span style={{ fontSize: '0.62rem', background: 'rgba(56,189,248,0.2)', color: '#38bdf8', padding: '1px 4px', borderRadius: '3px' }}>
                            Photo Attached
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {player.kycStatus === 'pending' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1, color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)', padding: '8px', fontSize: '0.74rem' }}
                          onClick={() => handleVerifyKYC(player)}
                        >
                          <FileCheck2 size={13} /> Verify KYC
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, padding: '8px' }}
                        onClick={() => {
                          setSelectedPlayer(player);
                          setActiveNav('scan');
                        }}
                      >
                        Inspect ID
                      </button>
                      {checkIn?.verificationStatus === 'approved' && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '8px 10px',
                            fontSize: '0.74rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(225, 29, 72, 0.12)',
                            borderColor: 'rgba(225, 29, 72, 0.35)',
                            color: '#fda4af',
                          }}
                          onClick={() => {
                            setEntryInvoice(generateEntryFeeInvoice(player, checkIn, staffName));
                            setIsInvoiceOpen(true);
                          }}
                          title="Print / View ₹500 Bill Receipt"
                        >
                          <Printer size={13} /> Bill
                        </button>
                      )}
                      {(checkIn?.verificationStatus === 'pending' || (!checkIn && player.kycStatus === 'pending')) && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1.5, background: '#10b981', borderColor: '#10b981', color: '#000', fontWeight: 800, padding: '8px' }}
                          onClick={() => {
                            if (player.kycStatus === 'pending') {
                              reviewKYC(player.id, 'verified');
                            }
                            handleApprove(player, checkIn);
                          }}
                        >
                          <Check size={14} /> Clear Entry
                        </button>
                      )}
                    </div>
                  </article>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* ── Document Zoom Modal ─────────────────────────────── */}
      {viewingDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{viewingDoc.title}</span>
            <button
              type="button"
              onClick={() => setViewingDoc(null)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', color: '#fff', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '10px 0' }}>
            <img
              src={viewingDoc.url}
              alt={viewingDoc.title}
              style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setViewingDoc(null)}
            >
              Close
            </button>
            {playerToInspect && playerToInspect.kycStatus !== 'verified' && (
              <button
                type="button"
                className="btn btn-success"
                style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', fontWeight: 800 }}
                onClick={() => {
                  handleVerifyKYC(playerToInspect);
                  setViewingDoc(null);
                }}
              >
                <Check size={16} /> Verify KYC
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Reject Entry Drawer ────────────────────────────── */}
      <MobileBottomDrawer
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Deny Player Entry"
        subtitle={selectedPlayer ? `For ${selectedPlayer.fullName}` : ''}
      >
        <form onSubmit={handleRejectConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Select Predefined Reason</label>
            <select
              className="form-select"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            >
              <option value="Govt ID details mismatch or expired identification.">Govt ID details mismatch or expired identification</option>
              <option value="Dress code violation (club rules).">Dress code violation (club rules)</option>
              <option value="Under 21 age restriction policy.">Under 21 age restriction policy</option>
              <option value="Club management restriction / blacklisted.">Club management restriction / blacklisted</option>
              <option value="Other / Security discretion.">Other / Security discretion</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Detailed Notes</label>
            <textarea
              className="form-input"
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Provide specific notes..."
              required
            />
          </div>

          <button type="submit" className="btn btn-danger" style={{ width: '100%', padding: '12px' }}>
            <XCircle size={16} /> Confirm Denial
          </button>
        </form>
      </MobileBottomDrawer>

      {/* ── Reject KYC Drawer ─────────────────────────────── */}
      <MobileBottomDrawer
        isOpen={isRejectKycOpen}
        onClose={() => setIsRejectKycOpen(false)}
        title="Reject Member KYC Documents"
        subtitle={selectedPlayer ? `For ${selectedPlayer.fullName}` : ''}
      >
        <form onSubmit={handleRejectKycConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label">Rejection Reason</label>
            <select
              className="form-select"
              value={rejectKycReason}
              onChange={e => setRejectKycReason(e.target.value)}
            >
              <option value="Govt ID photo is unclear or blurred.">Govt ID photo is unclear or blurred</option>
              <option value="Aadhaar back photo is missing or unreadable.">Aadhaar back photo is missing or unreadable</option>
              <option value="Name on ID does not match registration details.">Name on ID does not match registration details</option>
              <option value="Invalid or mismatched PAN card.">Invalid or mismatched PAN card</option>
              <option value="Suspected fraudulent or duplicate document.">Suspected fraudulent or duplicate document</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Officer Remarks</label>
            <textarea
              className="form-input"
              rows={3}
              value={rejectKycReason}
              onChange={e => setRejectKycReason(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-danger" style={{ width: '100%', padding: '12px' }}>
            <FileX size={16} /> Confirm KYC Rejection
          </button>
        </form>
      </MobileBottomDrawer>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectPlayer={(player) => {
          setSelectedPlayer(player);
          setIsScannerOpen(false);
        }}
      />

      {/* Walk-in Modal */}
      <WalkInRegistrationModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        onSuccess={(player: Player) => {
          setSelectedPlayer(player);
          setIsWalkInOpen(false);
        }}
      />

      {/* QR Standee Modal */}
      <ClubQRModal
        isOpen={isQRStandeeOpen}
        onClose={() => setIsQRStandeeOpen(false)}
        onOpenNewPlayerForm={() => {
          setIsQRStandeeOpen(false);
          setIsWalkInOpen(true);
        }}
      />

      {/* Gate Cash Handover Modal */}
      <GateCashHandoverModal
        isOpen={isGateCashModalOpen}
        onClose={() => setIsGateCashModalOpen(false)}
      />

      {/* Official ₹500 Thermal Tax Invoice Bill Modal */}
      <ClubTaxInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={entryInvoice}
      />

      {/* ── Fixed Bottom Navigation ────────────────────────── */}
      <nav className="mobile-bottom-nav" aria-label="Security Sections">
        <button
          className={`nav-tab-item security-color ${activeNav === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveNav('scan')}
        >
          <ShieldCheck size={20} />
          <span className="nav-tab-label">Verify & Scan</span>
        </button>

        <button
          className={`nav-tab-item security-color ${activeNav === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveNav('queue')}
        >
          <Clock size={20} />
          <span className="nav-tab-label">
            Queue {pendingQueuePlayers.length > 0 && `(${pendingQueuePlayers.length})`}
          </span>
        </button>

        <button
          className={`nav-tab-item security-color ${activeNav === 'gate-cash' ? 'active' : ''}`}
          onClick={() => setActiveNav('gate-cash')}
        >
          <Wallet size={20} />
          {todayGateCashInHand > 0 && <span className="nav-badge">₹</span>}
          <span className="nav-tab-label">Gate Till</span>
        </button>
      </nav>
    </div>
  );
};
