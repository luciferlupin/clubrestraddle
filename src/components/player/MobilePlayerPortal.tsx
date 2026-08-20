import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  History,
  User,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  QrCode,
  Sparkles,
  Calendar,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatTimeOnly, formatDateOnly, maskGovtId } from '../../utils/formatters';
import { KYCBadge, EntryBadge, TierBadge } from '../common/Badge';
import { MobileKYCForm } from './MobileKYCForm';
import { MobileRegistrationSuccess } from './MobileRegistrationSuccess';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import confetti from 'canvas-confetti';

interface MobilePlayerPortalProps {
  onOpenQR: () => void;
  showNewPlayerFormInitially?: boolean;
}

export const MobilePlayerPortal: React.FC<MobilePlayerPortalProps> = ({
  onOpenQR,
  showNewPlayerFormInitially = false,
}) => {
  const {
    currentPlayer,
    checkIns,
    hasPlayerCheckedInToday,
    performDailyCheckIn,
  } = useClub();

  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'profile' | 'new_kyc'>(
    showNewPlayerFormInitially ? 'new_kyc' : 'home'
  );
  const [tablePref, setTablePref] = useState('NLH Cash Game (₹250/₹500)');
  const [checkingIn, setCheckingIn] = useState(false);
  const [registrationSuccessData, setRegistrationSuccessData] = useState<{ player: Player; checkIn: DailyCheckIn } | null>(null);
  const [isCheckInSuccessOpen, setIsCheckInSuccessOpen] = useState(false);

  useEffect(() => {
    if (showNewPlayerFormInitially) {
      setActiveTab('new_kyc');
    }
  }, [showNewPlayerFormInitially]);

  const todayCheckIn = currentPlayer ? hasPlayerCheckedInToday(currentPlayer.id) : undefined;
  const isCheckedIn = !!todayCheckIn;

  const playerCheckIns = currentPlayer
    ? checkIns.filter(c => c.playerId === currentPlayer.id)
    : [];

  const handleDailyCheckIn = () => {
    if (!currentPlayer) return;
    setCheckingIn(true);
    setTimeout(() => {
      performDailyCheckIn(currentPlayer.id, tablePref);
      setCheckingIn(false);
      setIsCheckInSuccessOpen(true);
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#ffffff', '#f43f5e', '#ffffff', '#be123c'],
        });
      } catch {
        // Fallback
      }
    }, 250);
  };

  const handleKYCSuccess = (result: { player: Player; checkIn: DailyCheckIn }) => {
    setRegistrationSuccessData(result);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Registration Success Screen */}
      {registrationSuccessData ? (
        <MobileRegistrationSuccess
          player={registrationSuccessData.player}
          checkIn={registrationSuccessData.checkIn}
          onContinue={() => {
            setRegistrationSuccessData(null);
            setActiveTab('home');
          }}
        />
      ) : activeTab === 'new_kyc' ? (
        <MobileKYCForm
          onSuccess={handleKYCSuccess}
          onCancel={() => setActiveTab('home')}
        />
      ) : currentPlayer ? (
        <>
          {/* TAB 1: HOME & DIGITAL PASS */}
          {activeTab === 'home' && (
            <>
              {/* Welcome Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.22), rgba(159, 18, 57, 0.28))',
                  border: '1px solid rgba(225, 29, 72, 0.45)',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(225, 29, 72, 0.15)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#fda4af', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                    Welcome to Club Re Straddle
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginTop: '1px' }}>
                    {currentPlayer.fullName.split(' ')[0]}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <TierBadge tier={currentPlayer.membershipTier} />
                </div>
              </div>

              {/* Digital Pass Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #1c080d 0%, #0d0305 60%, #150609 100%)',
                  border: '1.5px solid rgba(225, 29, 72, 0.6)',
                  borderRadius: '20px',
                  padding: '18px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 24px rgba(225, 29, 72, 0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem', color: '#ffffff' }}>♠</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.06em', color: '#ffffff' }}>
                      MEMBER PASS
                    </span>
                  </div>
                  <KYCBadge status={currentPlayer.kycStatus} />
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                  {currentPlayer.kyc.photoUrl ? (
                    <img
                      src={currentPlayer.kyc.photoUrl}
                      alt=""
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid var(--gold-light)',
                        boxShadow: '0 0 10px rgba(245, 158, 11, 0.3)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'var(--bg-card-elevated)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: 'var(--gold-light)',
                      }}
                    >
                      {currentPlayer.fullName.charAt(0)}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {currentPlayer.fullName}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--gold-light)', margin: '2px 0 4px' }}>
                      {currentPlayer.id}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Total Visits: <strong>{currentPlayer.totalVisits}</strong>
                    </div>
                  </div>
                </div>

                {/* Scan Area */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.45)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                      Entrance & Cashier Scan
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#f8fafc', fontWeight: 600 }}>
                      {currentPlayer.phone}
                    </span>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      padding: '3px',
                      borderRadius: '5px',
                      display: 'flex',
                    }}
                  >
                    <QrCode size={30} color="#0f172a" />
                  </div>
                </div>
              </div>

              {/* Today's Daily Check-In Card / 1-Tap Check-In */}
              <div className="m-card">
                <div className="m-card-header">
                  <span className="m-card-title">
                    <CheckCircle2 size={18} color="#e11d48" />
                    Today's Check-In Status
                  </span>
                  {isCheckedIn ? (
                    <EntryBadge status={todayCheckIn.verificationStatus} />
                  ) : (
                    <span className="badge badge-warning">
                      <span className="badge-dot" /> Not Checked In
                    </span>
                  )}
                </div>

                {isCheckedIn ? (
                  <div
                    style={{
                      background:
                        todayCheckIn.verificationStatus === 'approved'
                          ? 'rgba(16, 185, 129, 0.1)'
                          : todayCheckIn.verificationStatus === 'rejected'
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'rgba(245, 158, 11, 0.1)',
                      border: `1px solid ${
                        todayCheckIn.verificationStatus === 'approved'
                          ? 'rgba(16, 185, 129, 0.3)'
                          : todayCheckIn.verificationStatus === 'rejected'
                          ? 'rgba(239, 68, 68, 0.3)'
                          : 'rgba(245, 158, 11, 0.3)'
                      }`,
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Check-in Time:</span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        Today at {formatTimeOnly(todayCheckIn.checkInTime)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Table:</span>
                      <span style={{ fontWeight: 600, color: 'var(--gold-light)' }}>
                        {todayCheckIn.tablePreference}
                      </span>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px', marginTop: '2px', fontSize: '0.8rem' }}>
                      {todayCheckIn.verificationStatus === 'approved' && (
                        <span style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={16} color="#ffffff" /> Entry Approved by {todayCheckIn.verifiedBy || 'Security'}
                        </span>
                      )}
                      {todayCheckIn.verificationStatus === 'pending' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '6px 0', textAlign: 'center' }}>
                          <div
                            style={{
                              background: '#ffffff',
                              padding: '10px',
                              borderRadius: '14px',
                              border: '2.5px solid #e11d48',
                              boxShadow: '0 4px 18px rgba(0,0,0,0.6)',
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                            }}
                          >
                            <QRCodeSVG
                              value={typeof window !== 'undefined' ? `${window.location.origin}/?portal=security&scan=${todayCheckIn.id}&player=${currentPlayer.id}` : `https://club-re-straddle.vercel.app/?portal=security&scan=${todayCheckIn.id}&player=${currentPlayer.id}`}
                              size={135}
                              bgColor="#ffffff"
                              fgColor="#0f172a"
                              level="H"
                            />
                            <span style={{ color: '#0f172a', fontSize: '0.66rem', fontWeight: 800, marginTop: '4px', letterSpacing: '0.04em' }}>
                              DOOR CLEARANCE PASS
                            </span>
                          </div>

                          <span style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                            <Clock size={15} color="#e11d48" /> Hold this QR in front of door security officer
                          </span>
                        </div>
                      )}
                      {todayCheckIn.verificationStatus === 'rejected' && (
                        <span style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldAlert size={16} color="#ef4444" /> Entry Denied: {todayCheckIn.rejectionReason}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Since you are a registered member, tap below to complete your daily check-in.
                    </p>

                    <div className="m-form-group" style={{ marginBottom: 0 }}>
                      <label className="m-form-label">Game / Table Preference</label>
                      <select
                        className="m-select"
                        value={tablePref}
                        onChange={e => setTablePref(e.target.value)}
                      >
                        <option value="NLH Cash Game (₹100/₹200)">No-Limit Holdem (₹100/₹200)</option>
                        <option value="NLH Cash Game (₹250/₹500)">No-Limit Holdem (₹250/₹500)</option>
                        <option value="High Stakes NLH (₹500/₹1000+)">High Stakes NLH (₹500/₹1000+)</option>
                        <option value="♠ Re Straddle High Roller Championship">♠ Re Straddle High Roller Championship</option>
                        <option value="Pot-Limit Omaha (PLO ₹250/₹500)">Pot-Limit Omaha (PLO ₹250/₹500)</option>
                      </select>
                    </div>

                    {/* Big Touch 1-Tap Check-In Button */}
                    <button
                      className="m-btn m-btn-emerald"
                      onClick={handleDailyCheckIn}
                      disabled={checkingIn}
                    >
                      <CheckCircle2 size={20} />
                      <span>{checkingIn ? 'Checking In...' : '1-Tap Daily Check-In'}</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: VISIT HISTORY */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="m-card">
                <h3 className="m-card-title">
                  <History size={18} color="#ffffff" />
                  Visit & Check-In History
                </h3>
                <p className="m-card-subtitle">{playerCheckIns.length} Total visits recorded</p>
              </div>

              {playerCheckIns.length === 0 ? (
                <div className="m-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-dim)' }}>
                  <History size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '0.85rem' }}>No check-in history yet.</p>
                </div>
              ) : (
                playerCheckIns.map(c => (
                  <div key={c.id} className="m-list-card">
                    <div className="m-list-row">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--gold-light)', fontWeight: 700 }}>
                        {c.id}
                      </span>
                      <EntryBadge status={c.verificationStatus} />
                    </div>

                    <div className="m-list-row" style={{ fontSize: '0.82rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                        <Calendar size={13} /> {formatDateOnly(c.checkInDate)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                        <Clock size={13} /> {formatTimeOnly(c.checkInTime)}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      Table: <strong>{c.tablePreference || 'General Floor'}</strong>
                      {c.verifiedBy && ` • Verified by ${c.verifiedBy}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="m-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {currentPlayer.kyc.photoUrl && (
                    <img
                      src={currentPlayer.kyc.photoUrl}
                      alt=""
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-light)' }}
                    />
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                      {currentPlayer.fullName}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gold-light)', fontFamily: 'var(--font-mono)' }}>
                      {currentPlayer.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="m-card">
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gold-light)', textTransform: 'uppercase' }}>
                  Verified KYC Credentials
                </span>

                <div className="m-list-row" style={{ fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Phone</span>
                  <span>{currentPlayer.phone}</span>
                </div>

                <div className="m-list-row" style={{ fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Email</span>
                  <span>{currentPlayer.email}</span>
                </div>

                <div className="m-list-row" style={{ fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Date of Birth</span>
                  <span>{formatDateOnly(currentPlayer.kyc.dateOfBirth)}</span>
                </div>

                <div className="m-list-row" style={{ fontSize: '0.82rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Govt ID</span>
                  <span>{currentPlayer.kyc.govtIdType}: {maskGovtId(currentPlayer.kyc.govtIdNumber)}</span>
                </div>

                <div className="m-list-row" style={{ fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Emergency Contact</span>
                  <span>{currentPlayer.kyc.emergencyContactName || 'None'}</span>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="m-card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '14px' }}>No player selected.</p>
          <button className="m-btn m-btn-primary" onClick={() => setActiveTab('new_kyc')}>
            <UserPlus size={18} /> Register as New Member
          </button>
        </div>
      )}

      {/* Check-In Confirmation Drawer */}
      <MobileBottomDrawer
        isOpen={isCheckInSuccessOpen}
        onClose={() => setIsCheckInSuccessOpen(false)}
        title="Check-In Confirmed!"
        subtitle="You are checked in for today at Club Re Straddle"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(139, 0, 0, 0.25)',
              border: '2px solid #e11d48',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px var(--red-glow)',
            }}
          >
            <CheckCircle2 size={30} color="#ffffff" />
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
            Daily check-in completed. Please present your Digital Pass to the door security officer for entrance clearance.
          </p>

          <button className="m-btn m-btn-primary" onClick={() => setIsCheckInSuccessOpen(false)}>
            Close & View Pass
          </button>
        </div>
      </MobileBottomDrawer>

      {/* Mobile Player Bottom Nav */}
      <nav className="mobile-bottom-nav">
        <button
          className={`nav-tab-item player-color ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <CreditCard size={20} />
          <span className="nav-tab-label">My Pass</span>
        </button>

        <button
          className={`nav-tab-item player-color ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={20} />
          <span className="nav-tab-label">Visits ({playerCheckIns.length})</span>
        </button>

        <button
          className={`nav-tab-item player-color ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={20} />
          <span className="nav-tab-label">Profile</span>
        </button>

        <button
          className={`nav-tab-item player-color ${activeTab === 'new_kyc' ? 'active' : ''}`}
          onClick={() => setActiveTab('new_kyc')}
        >
          <UserPlus size={20} />
          <span className="nav-tab-label">New KYC</span>
        </button>
      </nav>
    </div>
  );
};
