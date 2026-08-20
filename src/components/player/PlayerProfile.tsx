import React, { useState } from 'react';
import { User, ShieldCheck, Mail, Phone, MapPin, Calendar, CreditCard, AlertTriangle, RefreshCw } from 'lucide-react';
import { Player } from '../../types';
import { formatDateOnly, formatDateTime, maskGovtId } from '../../utils/formatters';
import { KYCBadge, TierBadge } from '../common/Badge';
import { useClub } from '../../context/ClubContext';

interface PlayerProfileProps {
  player: Player;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({ player }) => {
  const { updatePlayerKYC } = useClub();
  const [editingId, setEditingId] = useState(false);
  const [newIdNumber, setNewIdNumber] = useState(player.kyc.govtIdNumber);

  const handleResubmitKYC = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdNumber.trim()) return;
    updatePlayerKYC(player.id, {
      govtIdNumber: newIdNumber,
    });
    setEditingId(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <User size={18} color="#f59e0b" />
            Player Profile & KYC Records
          </h3>
          <p className="card-subtitle">
            Private player information & verified credentials on file.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <TierBadge tier={player.membershipTier} />
          <KYCBadge status={player.kycStatus} />
        </div>
      </div>

      {player.kycStatus === 'rejected' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '10px',
            padding: '14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9rem' }}>
              KYC Verification Rejected
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginTop: '2px' }}>
              {player.kyc.rejectionReason || 'Your government ID could not be verified by security.'}
            </div>
            {!editingId ? (
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: '10px' }}
                onClick={() => setEditingId(true)}
              >
                <RefreshCw size={14} /> Update & Resubmit ID Details
              </button>
            ) : (
              <form onSubmit={handleResubmitKYC} style={{ marginTop: '10px', display: 'flex', gap: '8px', maxWidth: '380px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter corrected Govt ID #"
                  value={newIdNumber}
                  onChange={e => setNewIdNumber(e.target.value)}
                />
                <button type="submit" className="btn btn-emerald btn-sm">
                  Save & Resubmit
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingId(false)}>
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="form-grid-2" style={{ rowGap: '16px', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Legal Name</span>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '2px' }}>
            {player.fullName}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Club Member ID</span>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--gold-light)', marginTop: '2px' }}>
            {player.id}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contact Phone</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <Phone size={14} color="#94a3b8" />
            <span>{player.phone}</span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email Address</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <Mail size={14} color="#94a3b8" />
            <span>{player.email}</span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date of Birth</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <Calendar size={14} color="#94a3b8" />
            <span>{formatDateOnly(player.kyc.dateOfBirth)}</span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Govt ID Document</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <CreditCard size={14} color="#94a3b8" />
            <span>{player.kyc.govtIdType}: <strong>{maskGovtId(player.kyc.govtIdNumber)}</strong></span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Residential Address</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <MapPin size={14} color="#94a3b8" />
            <span>{player.kyc.address || '—'}</span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Emergency Contact</span>
          <div style={{ marginTop: '2px' }}>
            {player.kyc.emergencyContactName ? (
              <span>{player.kyc.emergencyContactName} ({player.kyc.emergencyContactPhone})</span>
            ) : (
              <span style={{ color: 'var(--text-dim)' }}>Not provided</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        <span>Registered: <strong>{formatDateTime(player.registeredAt)}</strong></span>
        {player.kyc.verifiedAt && (
          <span style={{ color: '#34d399' }}>
            ✓ Verified by <strong>{player.kyc.verifiedBy || 'Security'}</strong> on {formatDateTime(player.kyc.verifiedAt)}
          </span>
        )}
      </div>
    </div>
  );
};
