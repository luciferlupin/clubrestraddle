import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  History,
  Phone,
  QrCode,
  ShieldCheck,
  Smartphone,
  User,
  UserPlus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useClub } from '../../context/ClubContext';
import { DailyCheckIn, Player } from '../../types';
import { MobileBottomDrawer } from '../common/MobileBottomDrawer';
import { PhoneVerificationModal } from '../common/PhoneVerificationModal';
import { MobileKYCForm } from './MobileKYCForm';
import { MobilePlayerHome } from './MobilePlayerHome';
import { MobilePlayerProfile } from './MobilePlayerProfile';
import { MobilePlayerVisits } from './MobilePlayerVisits';
import { MobileRegistrationSuccess } from './MobileRegistrationSuccess';
import { CardDeckFan, CardSuit, AnimatedSuitsRow } from '../common/PokerGraphics';

interface MobilePlayerPortalProps {
  showNewPlayerFormInitially?: boolean;
}

type PlayerTab = 'home' | 'history' | 'profile' | 'new_kyc';
type EntryView = 'choice' | 'lookup' | 'register';

export const MobilePlayerPortal: React.FC<MobilePlayerPortalProps> = ({
  showNewPlayerFormInitially = false,
}) => {
  const {
    currentPlayer,
    checkIns,
    tournaments,
    entries,
    hasPlayerCheckedInToday,
    performDailyCheckIn,
    findMemberByPhone,
    setSelectedPlayerId,
    updatePlayer,
  } = useClub();

  const [activeTab, setActiveTab] = useState<PlayerTab>(
    showNewPlayerFormInitially ? 'new_kyc' : 'home',
  );
  const [entryView, setEntryView] = useState<EntryView>(showNewPlayerFormInitially ? 'register' : 'choice');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [registrationSuccessData, setRegistrationSuccessData] = useState<{ player: Player; checkIn: DailyCheckIn } | null>(null);
  const [isCheckInSuccessOpen, setIsCheckInSuccessOpen] = useState(false);

  const todayCheckIn = currentPlayer ? hasPlayerCheckedInToday(currentPlayer.id) : undefined;
  const playerCheckIns = currentPlayer
    ? checkIns
      .filter((checkIn) => checkIn.playerId === currentPlayer.id)
      .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
    : [];

  const handleLookupMember = async (event: React.FormEvent) => {
    event.preventDefault();
    setLookupError(null);
    const cleanPhone = lookupPhone.trim();

    if (!cleanPhone) {
      setLookupError('Enter the mobile number linked to your membership.');
      return;
    }

    setIsLookingUp(true);
    const matched = await findMemberByPhone(cleanPhone);
    setIsLookingUp(false);

    if (matched) {
      setPendingPlayer(matched);
      setIsVerifyModalOpen(true);
    } else {
      setLookupError('We could not find a pass for that number. Check the digits or create a new member pass.');
    }
  };

  const handleOtpVerified = () => {
    if (pendingPlayer) {
      if (!pendingPlayer.phoneVerified) {
        updatePlayer(pendingPlayer.id, {
          phoneVerified: true,
          phoneVerifiedAt: new Date().toISOString(),
        });
      }
      setSelectedPlayerId(pendingPlayer.id);
      setActiveTab('home');
      setEntryView('choice');
      setLookupPhone('');
      setPendingPlayer(null);
    }
  };

  const handleLogout = () => {
    setSelectedPlayerId('');
    setEntryView('choice');
    setActiveTab('home');
    setLookupPhone('');
    setPendingPlayer(null);
  };

  const handleDailyCheckIn = () => {
    if (!currentPlayer) return;
    setCheckingIn(true);

    setTimeout(() => {
      performDailyCheckIn(currentPlayer.id);
      setCheckingIn(false);
      setIsCheckInSuccessOpen(true);

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#ffffff', '#f43f5e', '#be123c'],
        });
      } catch {
        // The check-in still completes if the celebration effect is unavailable.
      }
    }, 250);
  };

  const handleKYCSuccess = (result: { player: Player; checkIn: DailyCheckIn }) => {
    setRegistrationSuccessData(result);
  };

  const openRegistration = () => {
    setEntryView('register');
    setActiveTab('new_kyc');
  };

  const closeRegistration = () => {
    setActiveTab('home');
    setEntryView('choice');
  };

  return (
    <div className={`mobile-player-portal ${currentPlayer && activeTab !== 'new_kyc' ? 'has-bottom-nav' : ''}`}>
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
          onCancel={closeRegistration}
        />
      ) : !currentPlayer ? (
        <div className="mobile-player-landing">
          <div className="mobile-player-brand-hero">
            <div className="mobile-player-hero-glow" aria-hidden="true" />
            <div className="mobile-player-brand-badge">
              <span className="badge-live-pulse" />
              <span>PREMIUM POKER CLUB · DELHI NCR</span>
            </div>
            <div className="mobile-player-brand-icon">
              <CardDeckFan size={110} />
            </div>
            <h1 className="mobile-player-brand-title">Club Re Straddle</h1>
            <p className="mobile-player-brand-tagline">High Stakes · Tournaments · Private VIP Lounge</p>
            <div className="mobile-player-suits-wrapper">
              <AnimatedSuitsRow size={16} gap={10} />
            </div>
          </div>

          {entryView === 'choice' ? (
            <div className="mobile-player-entry-card">
              <section className="mobile-intro-hero" aria-labelledby="member-access-title">
                <span className="mobile-flow-eyebrow">Digital Player Portal</span>
                <h2 id="member-access-title">Your poker night starts here</h2>
                <p>Access your digital pass, verify today's check-in, or register as a VIP member.</p>

                <div className="mobile-hero-features">
                  <span className="feature-pill"><CardSuit suit="spade" size={12} color="#ffffff" /> Digital ID</span>
                  <span className="feature-pill"><CardSuit suit="heart" size={12} color="#f43f5e" /> Fast Check-In</span>
                  <span className="feature-pill"><CardSuit suit="club" size={12} color="#ffffff" /> Secure KYC</span>
                  <span className="feature-pill"><CardSuit suit="diamond" size={12} color="#f43f5e" /> Under 2 min</span>
                </div>
              </section>

              <div className="mobile-start-options">
                <button
                  type="button"
                  className="m-btn m-btn-primary m-btn-landing"
                  onClick={() => setEntryView('lookup')}
                >
                  <CreditCard size={19} />
                  <span>I'm a Member</span>
                  <ChevronRight size={18} className="btn-end-arrow" />
                </button>
                <button
                  type="button"
                  className="m-btn m-btn-secondary m-btn-landing"
                  onClick={openRegistration}
                >
                  <UserPlus size={19} />
                  <span>New Member Registration</span>
                </button>
              </div>

              <div className="mobile-landing-footer-note">
                <ShieldCheck size={14} color="#34d399" />
                <span>Government KYC verified · 21+ Members only</span>
              </div>
            </div>
          ) : entryView === 'lookup' ? (
            <section className="mobile-lookup-flow" aria-labelledby="member-lookup-title">
              <div className="mobile-flow-heading">
                <button
                  type="button"
                  className="mobile-icon-button"
                  onClick={() => { setEntryView('choice'); setLookupError(null); }}
                  aria-label="Back"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <span className="mobile-flow-eyebrow">Member Access</span>
                  <h2 id="member-lookup-title">Verify Membership</h2>
                </div>
              </div>

              <form className="m-card mobile-lookup-card" onSubmit={handleLookupMember} noValidate>
                <p className="mobile-lookup-hint">
                  Enter your registered mobile number to open your digital pass & live QR clearance.
                </p>
                <div className="m-form-group">
                  <label className="m-form-label" htmlFor="member-lookup-phone">Mobile Number</label>
                  <div className="mobile-phone-field">
                    <span aria-hidden="true" className="mobile-phone-prefix">🇮🇳 +91</span>
                    <input
                      id="member-lookup-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      className="m-input"
                      placeholder="98765 43210"
                      value={lookupPhone}
                      aria-invalid={Boolean(lookupError)}
                      aria-describedby={lookupError ? 'lookup-phone-error' : undefined}
                      onChange={(event) => setLookupPhone(event.target.value)}
                    />
                  </div>
                  {lookupError && (
                    <span id="lookup-phone-error" className="m-field-error" role="alert">
                      {lookupError}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="m-btn m-btn-primary"
                  disabled={isLookingUp || !lookupPhone.trim()}
                >
                  <Smartphone size={18} />
                  <span>{isLookingUp ? 'Searching Member Records...' : 'Send SMS OTP & Verify'}</span>
                </button>
              </form>

              <div className="mobile-lookup-help">
                <p>New to Club Re Straddle?</p>
                <button type="button" className="m-btn m-btn-secondary" onClick={openRegistration}>
                  <UserPlus size={16} /> Register as a new member
                </button>
              </div>
            </section>
          ) : null}
        </div>
      ) : currentPlayer ? (
        <>
          {activeTab === 'home' && (
            <MobilePlayerHome
              player={currentPlayer}
              todayCheckIn={todayCheckIn}
              tournaments={tournaments}
              entries={entries}
              checkingIn={checkingIn}
              isPassOpen={isPassOpen}
              onCheckIn={handleDailyCheckIn}
              onOpenVisits={() => setActiveTab('history')}
              onOpenProfile={() => setActiveTab('profile')}
              onOpenPass={() => setIsPassOpen(true)}
              onClosePass={() => setIsPassOpen(false)}
              onLogout={handleLogout}
            />
          )}
          {activeTab === 'history' && <MobilePlayerVisits player={currentPlayer} checkIns={playerCheckIns} />}
          {activeTab === 'profile' && (
            <MobilePlayerProfile
              player={currentPlayer}
              onOpenPass={() => {
                setIsPassOpen(true);
                setActiveTab('home');
              }}
              onLogout={handleLogout}
            />
          )}
        </>
      ) : (
        <div className="m-card player-empty-state">
          <p>No player is currently selected.</p>
          <button type="button" className="m-btn m-btn-primary" onClick={openRegistration}>
            <UserPlus size={18} /> Register as a new member
          </button>
        </div>
      )}

      <MobileBottomDrawer
        isOpen={isCheckInSuccessOpen}
        onClose={() => setIsCheckInSuccessOpen(false)}
        title="You’re checked in"
        subtitle="Your entrance pass is ready for the security team"
      >
        <div className="player-checkin-success">
          <span><CheckCircle2 size={30} /></span>
          <h2>Check-in complete</h2>
          <p>Open your digital pass and show the QR at the entrance for clearance.</p>
          <button
            type="button"
            className="m-btn m-btn-primary"
            onClick={() => {
              setIsCheckInSuccessOpen(false);
              setIsPassOpen(true);
            }}
          >
            View my pass
          </button>
        </div>
      </MobileBottomDrawer>

      {currentPlayer && activeTab !== 'new_kyc' && !registrationSuccessData && (
        <nav className="mobile-bottom-nav" aria-label="Player navigation">
          <button className={`nav-tab-item player-color ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <CreditCard size={20} /><span className="nav-tab-label">My Pass</span>
          </button>
          <button className={`nav-tab-item player-color ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <History size={20} /><span className="nav-tab-label">Visits</span>
          </button>
          <button className={`nav-tab-item player-color ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <User size={20} /><span className="nav-tab-label">Profile</span>
          </button>
        </nav>
      )}

      <PhoneVerificationModal
        isOpen={isVerifyModalOpen}
        phone={lookupPhone}
        title="Verify Pass Access"
        subtitle={
          pendingPlayer
            ? `We sent a 6-digit SMS verification code to open the member pass for ${pendingPlayer.fullName}.`
            : undefined
        }
        onClose={() => {
          setIsVerifyModalOpen(false);
          setPendingPlayer(null);
        }}
        onSuccess={handleOtpVerified}
      />

    </div>
  );
};
