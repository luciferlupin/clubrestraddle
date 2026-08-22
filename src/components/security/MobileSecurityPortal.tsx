import React, { useState } from 'react';
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
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatTimeOnly, maskGovtId } from '../../utils/formatters';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { QRScannerModal } from './QRScannerModal';
import { WalkInRegistrationModal } from './WalkInRegistrationModal';
import { ClubQRModal } from '../common/ClubQRModal';
import confetti from 'canvas-confetti';

export const MobileSecurityPortal: React.FC = () => {
  const {
    staffName,
    logoutStaff,
    players,
    todayCheckIns,
    approvePlayerEntry,
    rejectPlayerEntry,
    isRealtimeConnected,
    syncNow,
  } = useClub();

  const [activeNav, setActiveNav] = useState<'scan' | 'queue'>('scan');
  const [queueFilter, setQueueFilter] = useState<'pending' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const scanId = params.get('scan');
    const playerId = params.get('player') || params.get('playerId');
    if (scanId) {
      const foundCheckIn = todayCheckIns.find(c => c.id === scanId);
      return players.find(p => p.id === foundCheckIn?.playerId) || null;
    }
    return players.find(p => p.id === playerId) || null;
  });

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Govt ID details mismatch or expired identification.');
  const [verificationSuccessToast, setVerificationSuccessToast] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isQRStandeeOpen, setIsQRStandeeOpen] = useState(false);
  const [isKYCInspectOpen, setIsKYCInspectOpen] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{ player: Player; checkIn?: DailyCheckIn } | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);

  const pendingCheckIns = todayCheckIns.filter(c => c.verificationStatus === 'pending');

  // Search filter
  const searchResults = search.trim()
    ? players.filter(
        p => {
          const checkIn = todayCheckIns.find(c => c.playerId === p.id);
          return checkIn?.verificationStatus !== 'approved' && (
            p.fullName.toLowerCase().includes(search.toLowerCase()) ||
            p.phone.includes(search) ||
            p.id.toLowerCase().includes(search.toLowerCase()) ||
            p.kyc.govtIdNumber.toLowerCase().includes(search.toLowerCase())
          );
        }
      )
    : [];

  const selectedPlayerCheckIn = selectedPlayer
    ? todayCheckIns.find(c => c.playerId === selectedPlayer.id)
    : undefined;

  const handleApprove = (player: Player, checkIn?: DailyCheckIn) => {
    approvePlayerEntry(checkIn?.id || player.id);
    setSelectedPlayer(null);
    setPendingApproval(null);

    setVerificationSuccessToast(`Entry approved for ${player.fullName}!`);
    setTimeout(() => setVerificationSuccessToast(null), 3000);

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

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    rejectPlayerEntry(selectedPlayerCheckIn?.id || selectedPlayer.id, rejectReason.trim());

    setIsRejectOpen(false);
    setVerificationSuccessToast(`Entry Denied for ${selectedPlayer.fullName}`);
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

  return (
    <div className="staff-mobile-portal security-mobile-theme" style={{ paddingBottom: '90px' }}>

      <header className="security-session-strip">
        <div className="security-session-person">
          <span className="security-session-avatar">{(staffName || 'S').charAt(0).toUpperCase()}</span>
          <span>
            <strong>{staffName || 'Security officer'}</strong>
            <small><span className={isRealtimeConnected ? '' : 'offline'} /> Security on duty · Desk 1</small>
          </span>
        </div>
        <div className="security-session-actions">
          {pendingCheckIns.length > 0 && (
            <button type="button" onClick={() => setActiveNav('queue')}>
              <Clock size={13} /> {pendingCheckIns.length} waiting
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

        {/* Floating Success / Feedback Toast */}
        {verificationSuccessToast && (
          <div
            style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
              color: '#34d399',
              border: '1.5px solid #10b981',
              padding: '12px 16px',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '0.88rem',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <CheckCircle2 size={20} color="#10b981" />
            <span>{verificationSuccessToast}</span>
          </div>
        )}

        {/* TAB 1: DOOR SCANNER / VERIFICATION MAIN */}
        {activeNav === 'scan' && (
          <>
            <section className="security-dashboard-clean">
              <div className="security-dashboard-intro">
                <span>Entrance workspace</span>
                <h1>Who is arriving?</h1>
                <p>Scan the player pass, check KYC and decide entry.</p>
              </div>

              <button type="button" className="security-primary-action" onClick={() => setIsScannerOpen(true)}>
                <span className="security-primary-icon"><QrCode size={24} /></span>
                <span><strong>Scan player pass</strong><small>Open the camera and verify instantly</small></span>
                <ChevronRight size={19} />
              </button>

              <button type="button" className="security-waiting-action" onClick={() => setActiveNav('queue')}>
                <span className="security-waiting-count">{pendingCheckIns.length}</span>
                <span><strong>{pendingCheckIns.length === 1 ? 'Player waiting' : 'Players waiting'}</strong><small>{pendingCheckIns.length ? 'Review the entrance queue next' : 'No arrivals need review'}</small></span>
                <ChevronRight size={18} />
              </button>

              <div className="security-secondary-actions">
                <button type="button" onClick={() => setIsWalkInOpen(true)}><UserPlus size={19} /><span><strong>Register walk-in</strong><small>Create a new player profile</small></span><ChevronRight size={17} /></button>
                <button type="button" onClick={() => setIsQRStandeeOpen(true)}><QrCode size={19} /><span><strong>Show door QR</strong><small>Let players start registration</small></span><ChevronRight size={17} /></button>
              </div>

              <label className="security-search-field">
                <Search size={17} />
                <input type="search" placeholder="Search player name, phone or ID" value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={17} /></button>}
              </label>
            </section>

            {/* Search Results Dropdown List */}
            {search.trim() && (
              <div
                style={{
                  background: '#120508',
                  border: '1.5px solid #e11d48',
                  borderRadius: '16px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', paddingLeft: '4px' }}>
                  Matching Members ({searchResults.length})
                </span>

                {searchResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No member found matching "{search}".
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
                          <span>{p.id} • {p.phone}</span>
                          {checkIn && <EntryBadge status={checkIn.verificationStatus} />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {/* Selected / Focused Player Verification Card */}
            {(() => {
              const selectedCheckIn = selectedPlayer ? todayCheckIns.find(c => c.playerId === selectedPlayer.id) : undefined;
              const playerToInspect = selectedCheckIn?.verificationStatus === 'pending'
                ? selectedPlayer
                : (pendingCheckIns.length > 0 ? players.find(p => p.id === pendingCheckIns[0].playerId) : null);
              if (!playerToInspect) return null;

              const checkIn = todayCheckIns.find(c => c.playerId === playerToInspect.id);

              return (
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
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <TierBadge tier={playerToInspect.membershipTier} />
                      <KYCBadge status={playerToInspect.kycStatus} />
                      {checkIn && <EntryBadge status={checkIn.verificationStatus} />}
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
                          border: `2.5px solid ${checkIn?.verificationStatus === 'approved' ? '#10b981' : '#e11d48'}`,
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
                        {playerToInspect.id} • {playerToInspect.phone}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1' }}>
                      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CreditCard size={13} color="#e11d48" /> Aadhaar UIDAI:
                      </span>
                      <strong style={{ color: '#ffffff', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                        {playerToInspect.kyc.aadhaarNumber ? maskGovtId(playerToInspect.kyc.aadhaarNumber) : (playerToInspect.kyc.govtIdNumber || 'Verified')}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#cbd5e1' }}>
                      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <BadgeCheck size={13} color="#fb7185" /> Income Tax PAN:
                      </span>
                      <strong style={{ color: '#fb7185', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                        {playerToInspect.kyc.panNumber || 'PAN Verified'}
                      </strong>
                    </div>

                    {/* Attached Photo Previews */}
                    {(playerToInspect.kyc.aadhaarPhotoUrl || playerToInspect.kyc.panPhotoUrl) && (
                      <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        {playerToInspect.kyc.aadhaarPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setViewingDoc({ title: `${playerToInspect.fullName} - Aadhaar Card Photo`, url: playerToInspect.kyc.aadhaarPhotoUrl! })}
                            style={{
                              flex: 1,
                              background: 'rgba(225, 29, 72, 0.12)',
                              border: '1px solid rgba(225, 29, 72, 0.35)',
                              borderRadius: '8px',
                              padding: '6px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              color: '#ffffff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={12} color="#fb7185" /> Aadhaar Photo
                          </button>
                        )}
                        {playerToInspect.kyc.panPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setViewingDoc({ title: `${playerToInspect.fullName} - PAN Card Photo`, url: playerToInspect.kyc.panPhotoUrl! })}
                            style={{
                              flex: 1,
                              background: 'rgba(56, 189, 248, 0.12)',
                              border: '1px solid rgba(56, 189, 248, 0.35)',
                              borderRadius: '8px',
                              padding: '6px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                              color: '#ffffff',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={12} color="#38bdf8" /> PAN Photo
                          </button>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Today's Arrival:</span>
                      <strong style={{ color: checkIn ? '#fbbf24' : '#94a3b8' }}>
                        {checkIn ? `Checked In (${formatTimeOnly(checkIn.checkInTime)})` : 'Walk-in (Not Checked In)'}
                      </strong>
                    </div>
                  </div>

                  {/* 1-Hand Action Bar */}
                  {pendingApproval?.player.id === playerToInspect.id ? (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
                        border: '1.5px solid #10b981',
                        borderRadius: '14px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                        Grant entry for {playerToInspect.fullName}?
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ flex: 2, background: '#10b981', borderColor: '#10b981', color: '#000', fontWeight: 900 }}
                          onClick={() => {
                            handleApprove(pendingApproval.player, pendingApproval.checkIn);
                            setPendingApproval(null);
                          }}
                        >
                          <CheckCircle2 size={16} /> Confirm Entry
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ flex: 1 }}
                          onClick={() => setPendingApproval(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPlayer(playerToInspect);
                          setIsRejectOpen(true);
                        }}
                        style={{
                          background: 'rgba(225, 29, 72, 0.15)',
                          border: '1px solid #e11d48',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          color: '#fb7185',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          flex: 1,
                          minHeight: '46px',
                        }}
                        disabled={checkIn?.verificationStatus === 'rejected'}
                      >
                        <XCircle size={17} /> Deny Entry
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (checkIn?.verificationStatus === 'approved') {
                            setVerificationSuccessToast(`${playerToInspect.fullName} is already approved.`);
                            setTimeout(() => setVerificationSuccessToast(null), 2500);
                          } else {
                            handleApprove(playerToInspect, checkIn);
                          }
                        }}
                        style={{
                          background: checkIn?.verificationStatus === 'approved'
                            ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '0.92rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          flex: 1.5,
                          minHeight: '46px',
                          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
                        }}
                      >
                        <CheckCircle2 size={19} />
                        <span>{checkIn?.verificationStatus === 'approved' ? 'Entry Approved' : 'Approve & Clear'}</span>
                      </button>
                    </div>
                  )}

                  {/* Secondary trigger to inspect KYC in full drawer */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlayer(playerToInspect);
                      setIsKYCInspectOpen(true);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Eye size={14} color="#e11d48" /> View full KYC credentials & emergency contacts
                  </button>
                </div>
              );
            })()}
          </>
        )}

        {/* TAB 2: LIVE ENTRANCE QUEUE */}
        {activeNav === 'queue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                background: 'linear-gradient(145deg, #18080d 0%, #0d0305 100%)',
                border: '1.5px solid rgba(225, 29, 72, 0.4)',
                borderRadius: '16px',
                padding: '14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={18} color="#fb7185" /> Live Arrival Queue
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0' }}>
                  1-tap clearance for checked-in members
                </p>
              </div>
              <span style={{ background: '#e11d48', color: '#ffffff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800 }}>
                {pendingCheckIns.length} Awaiting
              </span>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              <button
                type="button"
                className={`btn btn-sm ${queueFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setQueueFilter('pending')}
                style={{ fontSize: '0.75rem', borderRadius: '10px' }}
              >
                Awaiting ({pendingCheckIns.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${queueFilter === 'rejected' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setQueueFilter('rejected')}
                style={{ fontSize: '0.75rem', borderRadius: '10px' }}
              >
                Denied
              </button>
            </div>

            {/* Queue Items */}
            {(() => {
              const items = todayCheckIns.filter(c => {
                if (queueFilter === 'pending') return c.verificationStatus === 'pending';
                if (queueFilter === 'rejected') return c.verificationStatus === 'rejected';
                return false;
              });

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

              return items.map(c => {
                const player = players.find(p => p.id === c.playerId);
                if (!player) return null;

                return (
                  <article
                    key={c.id}
                    style={{
                      background: 'linear-gradient(145deg, #15060b 0%, #0a0305 100%)',
                      border: `1.5px solid ${c.verificationStatus === 'approved' ? '#10b981' : c.verificationStatus === 'rejected' ? '#e11d48' : '#fbbf24'}`,
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
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>{c.playerName}</div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontFamily: 'monospace' }}>{c.playerId} • {c.playerPhone}</div>
                        </div>
                      </div>
                      <EntryBadge status={c.verificationStatus} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '8px' }}>
                      <span>Arrival: <strong>{formatTimeOnly(c.checkInTime)}</strong></span>
                      <span>Table: <strong style={{ color: '#fb7185' }}>{c.tablePreference || 'Floor'}</strong></span>
                    </div>

                    {c.verificationStatus === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
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
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ flex: 2, background: '#10b981', borderColor: '#10b981', color: '#000', fontWeight: 800, padding: '8px' }}
                          onClick={() => handleApprove(player, c)}
                        >
                          <Check size={14} /> Quick Approve
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
                        <span>Verified by: <strong>{c.verifiedBy || 'Security'}</strong></span>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                          onClick={() => {
                            setSelectedPlayer(player);
                            setActiveNav('scan');
                          }}
                        >
                          Inspect
                        </button>
                      </div>
                    )}
                  </article>
                );
              });
            })()}
          </div>
        )}

      </div>{/* end staff-scroll-area */}

      {/* Reject Reason Bottom Drawer */}
      <MobileBottomDrawer
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Deny Entrance Clearance"
        subtitle={`Select cause for flagging ${selectedPlayer?.fullName}`}
      >
        <form onSubmit={handleRejectConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="m-form-group">
            <label className="m-form-label">Predefined Reason</label>
            <select
              className="m-select"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              style={{ background: '#120508', color: '#ffffff', borderColor: '#e11d48' }}
            >
              <option value="Govt ID details mismatch or expired identification.">
                Govt ID details mismatch / expired
              </option>
              <option value="Under legal club age requirement (Strictly 21+ only).">
                Under legal club age (21+)
              </option>
              <option value="Self-exclusion list or house security suspension.">
                Security suspension / blacklist
              </option>
              <option value="Dress code or club conduct policy violation.">
                Dress code or conduct violation
              </option>
              <option value="Failed security screening check at entrance.">
                Failed security screening check
              </option>
            </select>
          </div>

          <div className="m-form-group">
            <label className="m-form-label">Custom Reason / Notes</label>
            <textarea
              className="m-textarea"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={2}
              required
              style={{ background: '#120508', color: '#ffffff' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-danger"
            style={{ padding: '12px', fontSize: '0.92rem', fontWeight: 800, marginTop: '6px' }}
          >
            <ShieldAlert size={18} /> Confirm Entry Denial
          </button>
        </form>
      </MobileBottomDrawer>

      {/* Full KYC Inspection Bottom Drawer */}
      <MobileBottomDrawer
        isOpen={isKYCInspectOpen && Boolean(selectedPlayer)}
        onClose={() => setIsKYCInspectOpen(false)}
        title="Member KYC Profile"
        subtitle={selectedPlayer?.fullName || ''}
      >
        {selectedPlayer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              {selectedPlayer.kyc.photoUrl ? (
                <img
                  src={selectedPlayer.kyc.photoUrl}
                  alt=""
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e11d48' }}
                />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff' }}>
                  {selectedPlayer.fullName.charAt(0)}
                </div>
              )}
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>{selectedPlayer.fullName}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {selectedPlayer.id}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <TierBadge tier={selectedPlayer.membershipTier} />
                  <KYCBadge status={selectedPlayer.kycStatus} />
                </div>
              </div>
            </div>

            <div style={{ background: '#120508', padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '0.82rem', border: '1px solid rgba(225, 29, 72, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Phone:</span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{selectedPlayer.phone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Date of Birth:</span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>{selectedPlayer.kyc.dateOfBirth}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Aadhaar Card:</span>
                <span style={{ color: '#ffffff', fontWeight: 700, fontFamily: 'monospace' }}>
                  {selectedPlayer.kyc.aadhaarNumber ? maskGovtId(selectedPlayer.kyc.aadhaarNumber) : (selectedPlayer.kyc.govtIdNumber || 'Verified')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>PAN Card:</span>
                <span style={{ color: '#fb7185', fontWeight: 700, fontFamily: 'monospace' }}>{selectedPlayer.kyc.panNumber || 'PAN Verified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: '#94a3b8' }}>Address:</span>
                <span style={{ color: '#ffffff', textAlign: 'right', maxWidth: '60%' }}>{selectedPlayer.kyc.address || 'Delhi NCR'}</span>
              </div>
              {selectedPlayer.kyc.emergencyContactPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Emergency Contact:</span>
                  <a href={`tel:${selectedPlayer.kyc.emergencyContactPhone}`} style={{ color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
                    {selectedPlayer.kyc.emergencyContactName} ({selectedPlayer.kyc.emergencyContactPhone})
                  </a>
                </div>
              )}
            </div>

            {/* Original Document Photos Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fb7185', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Attached Government Identity Photos
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Aadhaar Photo Card */}
                <div
                  style={{
                    background: '#140508',
                    border: '1px solid rgba(225, 29, 72, 0.35)',
                    borderRadius: '10px',
                    padding: '8px',
                    textAlign: 'center',
                    cursor: selectedPlayer.kyc.aadhaarPhotoUrl ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (selectedPlayer.kyc.aadhaarPhotoUrl) {
                      setViewingDoc({ title: `${selectedPlayer.fullName} - Aadhaar Card`, url: selectedPlayer.kyc.aadhaarPhotoUrl });
                    }
                  }}
                >
                  {selectedPlayer.kyc.aadhaarPhotoUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '80px', borderRadius: '6px', overflow: 'hidden', marginBottom: '6px' }}>
                      <img src={selectedPlayer.kyc.aadhaarPhotoUrl} alt="Aadhaar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ZoomIn size={16} color="#ffffff" />
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: '80px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.72rem', marginBottom: '6px' }}>
                      No Photo
                    </div>
                  )}
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffffff' }}>Aadhaar Card</span>
                </div>

                {/* PAN Photo Card */}
                <div
                  style={{
                    background: '#140508',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '10px',
                    padding: '8px',
                    textAlign: 'center',
                    cursor: selectedPlayer.kyc.panPhotoUrl ? 'pointer' : 'default',
                  }}
                  onClick={() => {
                    if (selectedPlayer.kyc.panPhotoUrl) {
                      setViewingDoc({ title: `${selectedPlayer.fullName} - PAN Card`, url: selectedPlayer.kyc.panPhotoUrl });
                    }
                  }}
                >
                  {selectedPlayer.kyc.panPhotoUrl ? (
                    <div style={{ position: 'relative', width: '100%', height: '80px', borderRadius: '6px', overflow: 'hidden', marginBottom: '6px' }}>
                      <img src={selectedPlayer.kyc.panPhotoUrl} alt="PAN" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ZoomIn size={16} color="#ffffff" />
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: '80px', background: 'rgba(255,255,255,0.04)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.72rem', marginBottom: '6px' }}>
                      No Photo
                    </div>
                  )}
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffffff' }}>PAN Card</span>
                </div>
              </div>
            </div>

            {/* Direct Approval Actions inside Drawer */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn btn-danger"
                style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
                onClick={() => {
                  setIsKYCInspectOpen(false);
                  setIsRejectOpen(true);
                }}
              >
                <XCircle size={16} /> Deny Entry
              </button>
              <button
                type="button"
                className="btn btn-emerald"
                style={{ flex: 1.5, padding: '12px', fontSize: '0.88rem', fontWeight: 900 }}
                onClick={() => {
                  const chk = todayCheckIns.find(c => c.playerId === selectedPlayer.id);
                  handleApprove(selectedPlayer, chk);
                  setIsKYCInspectOpen(false);
                }}
              >
                <CheckCircle2 size={17} /> Approve Clearance
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsKYCInspectOpen(false)}
              style={{ width: '100%' }}
            >
              Close Drawer
            </button>
          </div>
        )}
      </MobileBottomDrawer>

      {/* Camera & Quick Door Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectPlayer={(player) => {
          setSelectedPlayer(player);
          setActiveNav('scan');
        }}
      />

      {/* Walk-in Player Desk Quick Registration Modal */}
      <WalkInRegistrationModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        onSuccess={(player) => {
          setSelectedPlayer(player);
          setActiveNav('scan');
          setVerificationSuccessToast(`Walk-in registered & entry granted for ${player.fullName}!`);
          setTimeout(() => setVerificationSuccessToast(null), 3500);
        }}
      />

      {/* Front Desk Registration QR Standee */}
      <ClubQRModal
        isOpen={isQRStandeeOpen}
        onClose={() => setIsQRStandeeOpen(false)}
        onOpenNewPlayerForm={() => setIsWalkInOpen(true)}
      />

      {/* ── Fixed Mobile Bottom Nav ────────────────────────── */}
      <nav
        className="mobile-bottom-nav"
        aria-label="Security portal sections"
        style={{
          background: 'rgba(15, 4, 8, 0.95)',
          backdropFilter: 'blur(16px)',
          borderTop: '1.5px solid rgba(225, 29, 72, 0.4)',
          boxShadow: '0 -4px 25px rgba(0, 0, 0, 0.8)',
        }}
      >
        <button
          className={`nav-tab-item security-color ${activeNav === 'scan' ? 'active' : ''}`}
          onClick={() => setActiveNav('scan')}
        >
          <QrCode size={20} />
          <span className="nav-tab-label">Door Scan</span>
        </button>

        <button
          className={`nav-tab-item security-color ${activeNav === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveNav('queue')}
        >
          <div style={{ position: 'relative' }}>
            <Clock size={20} />
            {pendingCheckIns.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  background: '#e11d48',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  borderRadius: '10px',
                  padding: '1px 5px',
                  boxShadow: '0 0 8px #e11d48',
                }}
              >
                {pendingCheckIns.length}
              </span>
            )}
          </div>
          <span className="nav-tab-label">Queue</span>
        </button>

      </nav>

      {/* High-Resolution Document Zoom Lightbox Modal */}
      {viewingDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setViewingDoc(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '640px',
              width: '100%',
              background: '#15060b',
              border: '1.5px solid #e11d48',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 35px rgba(225,29,72,0.4)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#10b981" />
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                  {viewingDoc.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: '16px',
                background: '#090204',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxHeight: '70vh',
                overflow: 'auto',
              }}
            >
              <img
                src={viewingDoc.url}
                alt={viewingDoc.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '65vh',
                  objectFit: 'contain',
                  borderRadius: '10px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              />
            </div>

            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.5)',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Official Verified KYC Document
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setViewingDoc(null)}
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
