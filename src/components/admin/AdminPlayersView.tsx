import React, { useState } from 'react';
import { Users, Search, ShieldCheck, CheckCircle, XCircle, Eye, UserCheck, Calendar } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, KYCStatus } from '../../types';
import { formatDateOnly, formatDateTime, maskGovtId } from '../../utils/formatters';
import { KYCBadge, TierBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const AdminPlayersView: React.FC = () => {
  const { players, reviewKYC, checkIns } = useClub();
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredPlayers = players.filter(
    p =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInspect = (player: Player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <Users size={18} color="#f59e0b" />
            Registered Players & KYC Registry
          </h3>
          <p className="card-subtitle">
            Master directory of all club members, identity credentials, and membership status.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '32px', width: '240px', fontSize: '0.8rem' }}
            placeholder="Search member, phone, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Tier</th>
              <th>Contact Phone</th>
              <th>Govt ID</th>
              <th>KYC Status</th>
              <th>Visits</th>
              <th>Registration Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {p.kyc.photoUrl ? (
                      <img
                        src={p.kyc.photoUrl}
                        alt=""
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--bg-surface-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: 'var(--gold-light)',
                        }}
                      >
                        {p.fullName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 700 }}>{p.fullName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{p.id}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <TierBadge tier={p.membershipTier} />
                </td>
                <td style={{ fontSize: '0.82rem' }}>{p.phone}</td>
                <td style={{ fontSize: '0.8rem' }}>
                  <span>{p.kyc.govtIdType}: </span>
                  <span className="tabular-num">{maskGovtId(p.kyc.govtIdNumber)}</span>
                </td>
                <td>
                  <KYCBadge status={p.kycStatus} />
                </td>
                <td className="tabular-num" style={{ fontWeight: 700 }}>
                  {p.totalVisits}
                </td>
                <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  {formatDateOnly(p.registeredAt)}
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleInspect(p)}>
                    <Eye size={13} /> Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Player Detail Inspection Modal */}
      {selectedPlayer && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Member Profile: ${selectedPlayer.fullName}`}
          subtitle={`ID: ${selectedPlayer.id} • Registered: ${formatDateOnly(selectedPlayer.registeredAt)}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {selectedPlayer.kyc.photoUrl && (
                <img
                  src={selectedPlayer.kyc.photoUrl}
                  alt=""
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-light)' }}
                />
              )}
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{selectedPlayer.fullName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedPlayer.email}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <TierBadge tier={selectedPlayer.membershipTier} />
                  <KYCBadge status={selectedPlayer.kycStatus} />
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div className="form-grid-2" style={{ rowGap: '10px' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Phone</span>
                  <div style={{ fontWeight: 600 }}>{selectedPlayer.phone}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>DOB</span>
                  <div style={{ fontWeight: 600 }}>{formatDateOnly(selectedPlayer.kyc.dateOfBirth)}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Govt ID</span>
                  <div style={{ fontWeight: 600 }}>{selectedPlayer.kyc.govtIdType}: {selectedPlayer.kyc.govtIdNumber}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Emergency Contact</span>
                  <div style={{ fontWeight: 600 }}>{selectedPlayer.kyc.emergencyContactName || 'N/A'} ({selectedPlayer.kyc.emergencyContactPhone || 'N/A'})</div>
                </div>
              </div>
              <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Residential Address</span>
                <div style={{ fontSize: '0.84rem' }}>{selectedPlayer.kyc.address || '—'}</div>
              </div>
            </div>

            {/* Admin KYC Override Action */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Admin KYC Override:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-emerald btn-sm"
                  onClick={() => {
                    reviewKYC(selectedPlayer.id, 'verified');
                    setIsModalOpen(false);
                  }}
                  disabled={selectedPlayer.kycStatus === 'verified'}
                >
                  <CheckCircle size={14} /> Mark Verified
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    reviewKYC(selectedPlayer.id, 'rejected', 'Admin security manual override');
                    setIsModalOpen(false);
                  }}
                  disabled={selectedPlayer.kycStatus === 'rejected'}
                >
                  <XCircle size={14} /> Mark Rejected
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
