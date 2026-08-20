import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  QrCode,
  Sparkles,
  Lock,
  History,
  Check,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatDateOnly, formatTimeOnly, maskGovtId } from '../../utils/formatters';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import confetti from 'canvas-confetti';

export const MobileSecurityPortal: React.FC = () => {
  const {
    staffName,
    players,
    todayCheckIns,
    approvePlayerEntry,
    rejectPlayerEntry,
    reviewKYC,
  } = useClub();

  const [activeNav, setActiveNav] = useState<'scan' | 'queue' | 'history'>('scan');
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Govt ID details mismatch or expired identification.');
  const [verificationSuccessToast, setVerificationSuccessToast] = useState<string | null>(null);

  const pendingCheckIns = todayCheckIns.filter(c => c.verificationStatus === 'pending');
  const approvedCheckIns = todayCheckIns.filter(c => c.verificationStatus === 'approved');

  // Search filter
  const searchResults = search.trim()
    ? players.filter(
        p =>
          p.fullName.toLowerCase().includes(search.toLowerCase()) ||
          p.phone.includes(search) ||
          p.id.toLowerCase().includes(search.toLowerCase()) ||
          p.kyc.govtIdNumber.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const selectedPlayerCheckIn = selectedPlayer
    ? todayCheckIns.find(c => c.playerId === selectedPlayer.id)
    : undefined;

  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = selectedPlayer ? calculateAge(selectedPlayer.kyc.dateOfBirth) : 0;
  const is21Plus = age >= 21;

  const handleApprove = (player: Player, checkIn?: DailyCheckIn) => {
    if (checkIn) {
      approvePlayerEntry(checkIn.id);
    } else if (player.kycStatus === 'pending') {
      reviewKYC(player.id, 'verified');
    }

    setVerificationSuccessToast(`✓ Entry Approved for ${player.fullName}!`);
    setTimeout(() => setVerificationSuccessToast(null), 3000);

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399'],
      });
    } catch {
      // Fallback
    }
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    if (selectedPlayerCheckIn) {
      rejectPlayerEntry(selectedPlayerCheckIn.id, rejectReason);
    } else {
      reviewKYC(selectedPlayer.id, 'rejected', rejectReason);
    }

    setIsRejectOpen(false);
    setVerificationSuccessToast(`Entry Denied for ${selectedPlayer.fullName}`);
    setTimeout(() => setVerificationSuccessToast(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Toast Notification */}
      {verificationSuccessToast && (
        <div
          style={{
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: '#ffffff',
            padding: '12px 16px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '0.88rem',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{verificationSuccessToast}</span>
        </div>
      )}

      {/* TAB 1: DOOR SCANNER / VERIFICATION MAIN */}
      {activeNav === 'scan' && (
        <>
          {/* Main Large Touch Search & Scanner Card */}
          <div className="m-card" style={{ border: '1.5px solid rgba(16, 185, 129, 0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 className="m-card-title">
                  <ShieldCheck size={20} color="#10b981" />
                  Entrance Door Scanner
                </h3>
                <p className="m-card-subtitle">Fast 1-hand player clearance</p>
              </div>
              <span className="badge badge-success">
                <span className="badge-dot" /> {staffName.split(' ')[1] || 'Security'}
              </span>
            </div>

            {/* Big Touch Search Bar */}
            <div style={{ position: 'relative', marginTop: '4px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: '#94a3b8' }} />
              <input
                type="text"
                className="m-input"
                style={{ paddingLeft: '44px', fontSize: '0.95rem' }}
                placeholder="Search member name, phone, ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Quick Pending Clearance Alert if players waiting */}
            {pendingCheckIns.length > 0 && !search && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => setActiveNav('queue')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="#fbbf24" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>
                    {pendingCheckIns.length} Player{pendingCheckIns.length > 1 ? 's' : ''} Waiting at Door
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold-light)', fontWeight: 700 }}>
                  Inspect Queue →
                </span>
              </div>
            )}
          </div>

          {/* Search Results Dropdown / Cards */}
          {search.trim() && (
            <div className="m-card">
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Search Results ({searchResults.length})
              </span>

              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  No player found matching "{search}".
                </div>
              ) : (
                searchResults.map(p => {
                  const checkIn = todayCheckIns.find(c => c.playerId === p.id);
                  return (
                    <div
                      key={p.id}
                      className="m-list-card"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedPlayer(p);
                        setSearch('');
                      }}
                    >
                      <div className="m-list-row">
                        <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>{p.fullName}</span>
                        <KYCBadge status={p.kycStatus} />
                      </div>
                      <div className="m-list-row" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        <span>{p.id} • {p.phone}</span>
                        {checkIn && <EntryBadge status={checkIn.verificationStatus} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Player Verification Inspector Card (If a player is selected or top pending player) */}
          {(() => {
            const playerToInspect = selectedPlayer || (pendingCheckIns.length > 0 ? players.find(p => p.id === pendingCheckIns[0].playerId) : players[0]);
            if (!playerToInspect) return null;

            const checkIn = todayCheckIns.find(c => c.playerId === playerToInspect.id);
            const playerAge = calculateAge(playerToInspect.kyc.dateOfBirth);
            const legalAge = playerAge >= 21;

            return (
              <div className="m-card" style={{ border: '1.5px solid var(--border-gold)' }}>
                <div className="m-card-header">
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-light)', textTransform: 'uppercase' }}>
                    Verification Inspection
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <KYCBadge status={playerToInspect.kycStatus} />
                    {checkIn && <EntryBadge status={checkIn.verificationStatus} />}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {playerToInspect.kyc.photoUrl ? (
                    <img
                      src={playerToInspect.kyc.photoUrl}
                      alt=""
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--gold-light)',
                        boxShadow: '0 0 12px rgba(0,0,0,0.5)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'var(--bg-card-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: 'var(--gold-light)',
                      }}
                    >
                      {playerToInspect.fullName.charAt(0)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                      {playerToInspect.fullName}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--gold-light)' }}>
                      {playerToInspect.id} • {playerToInspect.phone}
                    </div>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: legalAge ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: legalAge ? '#34d399' : '#f87171',
                      }}
                    >
                      {legalAge ? `✓ Age: ${playerAge} (21+ OK)` : `⚠ Age: ${playerAge} (UNDERAGE)`}
                    </div>
                  </div>
                </div>

                {/* KYC Info Details Box */}
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Govt ID:</span>
                    <span style={{ fontWeight: 700 }}>
                      {playerToInspect.kyc.govtIdType}: {maskGovtId(playerToInspect.kyc.govtIdNumber)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Date of Birth:</span>
                    <span>{formatDateOnly(playerToInspect.kyc.dateOfBirth)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Today's Check-in:</span>
                    <span style={{ color: checkIn ? '#fbbf24' : '#f87171', fontWeight: 700 }}>
                      {checkIn ? `Checked-in (${formatTimeOnly(checkIn.checkInTime)})` : 'Not checked-in today'}
                    </span>
                  </div>

                  {checkIn?.tablePreference && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Table:</span>
                      <span style={{ color: 'var(--gold-light)' }}>{checkIn.tablePreference}</span>
                    </div>
                  )}
                </div>

                {/* Large 1-Hand Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    className="m-btn m-btn-danger"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setSelectedPlayer(playerToInspect);
                      setIsRejectOpen(true);
                    }}
                    disabled={checkIn?.verificationStatus === 'rejected'}
                  >
                    <XCircle size={18} /> Deny Entry
                  </button>

                  <button
                    className="m-btn m-btn-emerald"
                    style={{ flex: 2 }}
                    onClick={() => handleApprove(playerToInspect, checkIn)}
                    disabled={checkIn?.verificationStatus === 'approved' || !legalAge}
                  >
                    <CheckCircle2 size={20} />
                    <span>{checkIn?.verificationStatus === 'approved' ? 'Already Approved' : 'Approve Entry'}</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* TAB 2: LIVE ENTRANCE QUEUE */}
      {activeNav === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-card">
            <h3 className="m-card-title">
              <Clock size={18} color="#f59e0b" />
              Live Door Queue ({pendingCheckIns.length} Awaiting)
            </h3>
            <p className="m-card-subtitle">Tap player to inspect and approve entry</p>
          </div>

          {pendingCheckIns.length === 0 ? (
            <div className="m-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
              <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>No players waiting in door queue.</p>
            </div>
          ) : (
            pendingCheckIns.map(c => {
              const player = players.find(p => p.id === c.playerId);
              if (!player) return null;
              return (
                <div
                  key={c.id}
                  className="m-card"
                  style={{ borderLeft: '4px solid #f59e0b', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedPlayer(player);
                    setActiveNav('scan');
                  }}
                >
                  <div className="m-list-row">
                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{c.playerName}</span>
                    <span className="badge badge-warning">Awaiting Door Review</span>
                  </div>
                  <div className="m-list-row" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Checked in at {formatTimeOnly(c.checkInTime)}</span>
                    <span style={{ color: 'var(--gold-light)' }}>{c.tablePreference}</span>
                  </div>
                  <button
                    className="m-btn m-btn-emerald m-btn-sm"
                    style={{ marginTop: '4px' }}
                    onClick={e => {
                      e.stopPropagation();
                      handleApprove(player, c);
                    }}
                  >
                    <CheckCircle2 size={16} /> 1-Tap Approve Access
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: APPROVED ENTRIES LOG */}
      {activeNav === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-card">
            <h3 className="m-card-title">
              <History size={18} color="#10b981" />
              Approved Entries Today ({approvedCheckIns.length})
            </h3>
            <p className="m-card-subtitle">Active players cleared to play on the club floor</p>
          </div>

          {approvedCheckIns.map(c => (
            <div key={c.id} className="m-list-card">
              <div className="m-list-row">
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.playerName}</span>
                <span className="badge badge-success">✓ Inside Club</span>
              </div>
              <div className="m-list-row" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span>Checked in: {formatTimeOnly(c.checkInTime)}</span>
                <span>Verified by {c.verifiedBy || 'Security'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Bottom Drawer */}
      <MobileBottomDrawer
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Deny Player Entry"
        subtitle={`Select reason for denying ${selectedPlayer?.fullName}`}
      >
        <form onSubmit={handleRejectConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="m-form-group">
            <label className="m-form-label">Predefined Reason</label>
            <select
              className="m-select"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            >
              <option value="Govt ID details mismatch or expired identification.">
                Govt ID details mismatch / expired
              </option>
              <option value="Under legal club age requirement (21+).">
                Under legal club age (21+)
              </option>
              <option value="Self-exclusion list or house security suspension.">
                Security suspension / blacklist
              </option>
              <option value="Dress code or club conduct violation.">
                Dress code or conduct violation
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
            />
          </div>

          <button type="submit" className="m-btn m-btn-danger" style={{ marginTop: '8px' }}>
            <ShieldAlert size={18} /> Confirm Entry Denial
          </button>
        </form>
      </MobileBottomDrawer>

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav">
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
          <Clock size={20} />
          {pendingCheckIns.length > 0 && <span className="nav-tab-dot" />}
          <span className="nav-tab-label">Queue ({pendingCheckIns.length})</span>
        </button>

        <button
          className={`nav-tab-item security-color ${activeNav === 'history' ? 'active' : ''}`}
          onClick={() => setActiveNav('history')}
        >
          <History size={20} />
          <span className="nav-tab-label">Approved ({approvedCheckIns.length})</span>
        </button>
      </nav>
    </div>
  );
};
