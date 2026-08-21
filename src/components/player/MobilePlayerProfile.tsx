import React from 'react';
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  CreditCard,
  IdCard,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import { Player } from '../../types';
import { formatDateOnly, maskGovtId } from '../../utils/formatters';
import { KYCBadge, TierBadge } from '../common/Badge';
import { PlayerLedger } from './PlayerLedger';

interface MobilePlayerProfileProps {
  player: Player;
  onOpenPass: () => void;
}

export const MobilePlayerProfile: React.FC<MobilePlayerProfileProps> = ({ player, onOpenPass }) => {
  return (
    <section className="player-subscreen player-profile-screen" aria-labelledby="player-profile-title">
      <header className="player-profile-hero">
        <div className="player-profile-photo">
          {player.kyc.photoUrl ? <img src={player.kyc.photoUrl} alt="" /> : <span>{player.fullName.charAt(0)}</span>}
          <span className="player-profile-verified" aria-label="Verified member"><BadgeCheck size={16} /></span>
        </div>
        <div className="player-profile-copy">
          <span className="mobile-flow-eyebrow">Member profile</span>
          <h1 id="player-profile-title">{player.fullName}</h1>
          <p>{player.id}</p>
          <div><TierBadge tier={player.membershipTier} /><KYCBadge status={player.kycStatus} /></div>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '8px', margin: '14px 0' }}>
        <button type="button" className="player-profile-pass-cta" style={{ flex: 1, margin: 0 }} onClick={onOpenPass}>
          <span><CreditCard size={20} /></span>
          <span><strong>Digital Pass</strong><small>Door & Cashier QR</small></span>
        </button>
      </div>

      <div style={{ margin: '16px 0' }}>
        <PlayerLedger player={player} />
      </div>

      <section className="player-profile-section" aria-labelledby="player-contact-title">
        <div className="player-profile-section-heading">
          <span><UserRoundCheck size={18} /></span>
          <div><h2 id="player-contact-title">Contact details</h2><p>Linked to your membership</p></div>
        </div>
        <dl className="player-profile-list">
          <div>
            <dt><Phone size={17} /> Mobile</dt>
            <dd>{player.phone}</dd>
          </div>
          <div>
            <dt><Mail size={17} /> Email</dt>
            <dd>{player.email}</dd>
          </div>
        </dl>
      </section>

      <section className="player-profile-section" aria-labelledby="player-verification-title">
        <div className="player-profile-section-heading">
          <span><ShieldCheck size={18} /></span>
          <div><h2 id="player-verification-title">Identity verification</h2><p>Private KYC information</p></div>
        </div>
        <dl className="player-profile-list">
          <div>
            <dt><IdCard size={17} /> 1. Aadhaar Card</dt>
            <dd style={{ fontFamily: 'monospace' }}>
              {player.kyc.aadhaarNumber ? maskGovtId(player.kyc.aadhaarNumber) : (player.kyc.govtIdNumber || 'UIDAI Verified')}
            </dd>
          </div>
          <div>
            <dt><CreditCard size={17} /> 2. PAN Card</dt>
            <dd style={{ fontFamily: 'monospace', color: '#fb7185' }}>
              {player.kyc.panNumber || (player.kyc.govtIdNumber ? maskGovtId(player.kyc.govtIdNumber) : 'PAN Verified')}
            </dd>
          </div>
          <div>
            <dt><BadgeCheck size={17} /> KYC status</dt>
            <dd className="player-profile-status">{player.kycStatus}</dd>
          </div>
        </dl>
      </section>

      <section className="player-profile-section" aria-labelledby="player-safety-title">
        <div className="player-profile-section-heading">
          <span><Phone size={18} /></span>
          <div><h2 id="player-safety-title">Emergency contact</h2><p>Visible only to authorised club staff</p></div>
        </div>
        <dl className="player-profile-list">
          <div>
            <dt>Contact</dt>
            <dd>{player.kyc.emergencyContactName || 'Not provided'}</dd>
          </div>
          {player.kyc.emergencyContactPhone && (
            <div>
              <dt>Mobile</dt>
              <dd>{player.kyc.emergencyContactPhone}</dd>
            </div>
          )}
        </dl>
      </section>

      <div className="player-profile-privacy">
        <Lock size={17} />
        <p><strong>Your information is protected.</strong> Ask the front desk if any membership detail needs to be updated.</p>
      </div>
    </section>
  );
};
