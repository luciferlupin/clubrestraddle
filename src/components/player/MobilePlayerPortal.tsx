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
    (!currentPlayer || showNewPlayerFormInitially) ? 'new_kyc' : 'home',
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
    if (currentPlayer) {
      setActiveTab('home');
    } else {
      setEntryView('choice');
    }
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
      ) : (!currentPlayer || activeTab === 'new_kyc') ? (
        <div className="mobile-player-entry">
          {entryView === 'choice' && !currentPlayer ? (
            <>
              <section className="mobile-welcome-card" aria-labelledby="player-welcome-title">
                {/* Card fan hero */}
                <div className="welcome-card-fan-hero" aria-hidden="true">
                  <CardDeckFan size={130} />
                </div>
                {/* Animated suit strip */}
                <div className="mobile-welcome-suits" aria-hidden="true">
                  <CardSuit suit="spade" size={20} color="#ffffff" className="suit-hover-anim" />
                  <CardSuit suit="heart" size={20} color="#e11d48" className="suit-hover-anim suit-delay-1" />
                  <CardSuit suit="diamond" size={20} color="#e11d48" className="suit-hover-anim suit-delay-2" />
                  <CardSuit suit="club" size={20} color="#ffffff" className="suit-hover-anim suit-delay-3" />
                </div>
                <span className="mobile-flow-eyebrow">Player access</span>
                <h1 id="player-welcome-title">Welcome to the club</h1>
                <p>Load your member pass or register for your first visit.</p>
                <div className="mobile-trust-row">
                  <span><CardSuit suit="spade" size={13} color="#ffffff" /> Members only</span>
                  <span><CardSuit suit="club" size={13} color="#ffffff" /> Secure KYC</span>
                  <span><CardSuit suit="diamond" size={13} color="#e11d48" /> Under 2 min</span>
                </div>
              </section>

              <div className="mobile-start-options" aria-label="Choose how to continue">
                <button type="button" className="mobile-start-option primary" onClick={() => setEntryView('lookup')}>
                  <span className="mobile-start-icon"><CreditCard size={23} /></span>
                  <span><strong>I&apos;m already a member</strong><small>Open my digital pass</small></span>
                  <ChevronRight size={21} aria-hidden="true" />
                </button>
                <button type="button" className="mobile-start-option" onClick={() => setEntryView('register')}>
                  <span className="mobile-start-icon"><UserPlus size={23} /></span>
                  <span><strong>I&apos;m new here</strong><small>Create a pass and check in</small></span>
                  <ChevronRight size={21} aria-hidden="true" />
                </button>
              </div>
            </>
          ) : entryView === 'lookup' && !currentPlayer ? (
            <section className="mobile-lookup-flow" aria-labelledby="member-lookup-title">
              <div className="mobile-flow-heading">
                <button
                  type="button"
                  className="mobile-icon-button"
                  onClick={() => { setEntryView('choice'); setLookupError(null); }}
                  aria-label="Back to player options"
                >
                  <ArrowLeft size={21} />
                </button>
                <div>
                  <span className="mobile-flow-eyebrow">Existing member</span>
                  <h1 id="member-lookup-title">Open your player pass</h1>
                  <p>Use the mobile number linked to your membership.</p>
                </div>
              </div>

              <form className="m-card mobile-lookup-card" onSubmit={handleLookupMember} noValidate>
                <div className="m-form-group">
                  <label className="m-form-label" htmlFor="member-lookup-phone">Mobile number</label>
                  <div className="mobile-phone-field">
                    <span aria-hidden="true">+91</span>
                    <input
                      id="member-lookup-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      className="m-input"
                      placeholder="98765 43210"
                      value={lookupPhone}
                      aria-invalid={Boolean(lookupError)}
                      aria-describedby={lookupError ? 'member-lookup-error' : undefined}
                      onChange={(event) => { setLookupPhone(event.target.value); setLookupError(null); }}
                    />
                  </div>
                  {lookupError && <span id="member-lookup-error" className="m-field-error" role="alert">{lookupError}</span>}
                </div>
                <button type="submit" className="m-btn m-btn-primary" disabled={isLookingUp}>
                  <Phone size={18} /> {isLookingUp ? 'Finding your pass…' : 'Find my pass'}
                </button>
              </form>

              <button type="button" className="mobile-secondary-link" onClick={() => { setEntryView('register'); setLookupError(null); }}>
                New to the club? Create a member pass <ChevronRight size={17} />
              </button>
            </section>
          ) : (
            <MobileKYCForm onSuccess={handleKYCSuccess} onCancel={closeRegistration} />
          )}
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
