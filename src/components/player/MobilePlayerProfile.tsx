import React, { useState, useEffect } from 'react';
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
  Eye,
  X,
  LogOut,
} from 'lucide-react';
import { Player } from '../../types';
import { formatDateOnly, maskGovtId, formatPlayerNumber } from '../../utils/formatters';
import { KYCBadge, TierBadge } from '../common/Badge';
import { useClub } from '../../context/ClubContext';
import { PlayerLedger } from './PlayerLedger';

interface MobilePlayerProfileProps {
  player: Player;
  onOpenPass: () => void;
  onLogout?: () => void;
}

export const MobilePlayerProfile: React.FC<MobilePlayerProfileProps> = ({ player, onOpenPass, onLogout }) => {
  const { fetchPlayerKycDocs } = useClub();
  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);

  useEffect(() => {
    if (player?.id) {
      fetchPlayerKycDocs(player.id);
    }
  }, [player?.id, fetchPlayerKycDocs]);

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
          <p>Player ID {formatPlayerNumber(player)}</p>
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
            <dd style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontFamily: 'monospace' }}>
                {player.kyc.aadhaarNumber ? maskGovtId(player.kyc.aadhaarNumber) : (player.kyc.govtIdNumber || 'UIDAI Verified')}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {player.kyc.aadhaarPhotoUrl && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setViewingDoc({ title: 'Aadhaar Card (Front)', url: player.kyc.aadhaarPhotoUrl! })}
                  >
                    <Eye size={12} /> Front
                  </button>
                )}
                {player.kyc.aadhaarBackPhotoUrl && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setViewingDoc({ title: 'Aadhaar Card (Back)', url: player.kyc.aadhaarBackPhotoUrl! })}
                  >
                    <Eye size={12} /> Back
                  </button>
                )}
              </div>
            </dd>
          </div>
          <div>
            <dt><CreditCard size={17} /> 2. PAN Card</dt>
            <dd style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontFamily: 'monospace', color: '#fb7185' }}>
                {player.kyc.panNumber || (player.kyc.govtIdNumber ? maskGovtId(player.kyc.govtIdNumber) : 'PAN Verified')}
              </span>
              {player.kyc.panPhotoUrl && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setViewingDoc({ title: 'PAN Card Photo', url: player.kyc.panPhotoUrl! })}
                >
                  <Eye size={12} /> View Photo
                </button>
              )}
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

      {onLogout && (
        <div style={{ marginTop: '20px', marginBottom: '32px' }}>
          <button
            type="button"
            className="m-btn"
            style={{
              width: '100%',
              background: 'rgba(225, 29, 72, 0.12)',
              border: '1.5px solid rgba(225, 29, 72, 0.4)',
              color: '#fda4af',
              fontWeight: 700,
              padding: '12px 16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
            onClick={onLogout}
          >
            <LogOut size={16} />
            <span>Log out of Player Pass</span>
          </button>
        </div>
      )}

      {/* Mobile Photo Modal */}
      {viewingDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setViewingDoc(null)}
        >
          <div
            style={{
              maxWidth: '450px',
              width: '100%',
              background: '#130508',
              borderRadius: '16px',
              border: '2px solid rgba(225, 29, 72, 0.5)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.6)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.88rem' }}>
                {viewingDoc.title}
              </span>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '12px', display: 'flex', justifyContent: 'center', background: '#0a0204' }}>
              <img
                src={viewingDoc.url}
                alt={viewingDoc.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                }}
              />
            </div>

            <div
              style={{
                padding: '10px 16px',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                className="m-btn m-btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                onClick={() => setViewingDoc(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
