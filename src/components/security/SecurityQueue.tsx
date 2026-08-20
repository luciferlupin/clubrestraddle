import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatTimeOnly, formatDateOnly, maskGovtId } from '../../utils/formatters';
import { KYCBadge, EntryBadge } from '../common/Badge';

interface SecurityQueueProps {
  selectedPlayerId: string | null;
  onSelectPlayer: (player: Player, checkIn?: DailyCheckIn) => void;
}

export const SecurityQueue: React.FC<SecurityQueueProps> = ({
  selectedPlayerId,
  onSelectPlayer,
}) => {
  const { players, todayCheckIns } = useClub();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const pendingCount = todayCheckIns.filter(c => c.verificationStatus === 'pending').length;
  const approvedCount = todayCheckIns.filter(c => c.verificationStatus === 'approved').length;
  const rejectedCount = todayCheckIns.filter(c => c.verificationStatus === 'rejected').length;

  // Build list of items to display
  const displayItems = players
    .map(p => {
      const todayCheckIn = todayCheckIns.find(c => c.playerId === p.id);
      return {
        player: p,
        checkIn: todayCheckIn,
      };
    })
    .filter(({ player, checkIn }) => {
      const matchesSearch =
        player.fullName.toLowerCase().includes(search.toLowerCase()) ||
        player.phone.includes(search) ||
        player.id.toLowerCase().includes(search.toLowerCase()) ||
        player.kyc.govtIdNumber.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === 'pending') {
        return checkIn?.verificationStatus === 'pending' || player.kycStatus === 'pending';
      }
      if (filter === 'approved') {
        return checkIn?.verificationStatus === 'approved';
      }
      if (filter === 'rejected') {
        return checkIn?.verificationStatus === 'rejected' || player.kycStatus === 'rejected';
      }
      return true;
    });

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <ShieldCheck size={18} color="#e11d48" />
            Live Entrance & KYC Verification Queue
          </h3>
          <p className="card-subtitle">
            Real-time feed of players checking in at the front desk or submitting new KYC.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          <input
            id="security-queue-search"
            aria-label="Search the entrance queue"
            type="text"
            className="form-input"
            style={{ paddingLeft: '32px', width: '220px', fontSize: '0.8rem' }}
            placeholder="Search name, phone, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Queue Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('pending')}
        >
          <Clock size={13} /> Awaiting Review ({pendingCount})
        </button>

        <button
          className={`btn btn-sm ${filter === 'approved' ? 'btn-emerald' : 'btn-secondary'}`}
          onClick={() => setFilter('approved')}
        >
          <CheckCircle2 size={13} /> Approved Today ({approvedCount})
        </button>

        <button
          className={`btn btn-sm ${filter === 'rejected' ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setFilter('rejected')}
        >
          <ShieldAlert size={13} /> Denied ({rejectedCount})
        </button>

        <button
          className={`btn btn-sm ${filter === 'all' ? 'btn-secondary' : 'btn-ghost'}`}
          onClick={() => setFilter('all')}
        >
          All Members ({players.length})
        </button>
      </div>

      {displayItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-dim)' }}>
          <ShieldCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: '0.9rem' }}>No players found in this verification queue.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Govt ID</th>
                <th>DOB / Age</th>
                <th>KYC Status</th>
                <th>Today's Check-in</th>
                <th>Preference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map(({ player, checkIn }) => {
                const isSelected = selectedPlayerId === player.id;
                return (
                  <tr
                    key={player.id}
                    style={{
                      background: isSelected ? 'rgba(245, 158, 11, 0.08)' : undefined,
                      cursor: 'pointer',
                    }}
                    onClick={() => onSelectPlayer(player, checkIn)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {player.kyc.photoUrl ? (
                          <img
                            src={player.kyc.photoUrl}
                            alt=""
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'var(--bg-surface-elevated)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: 'var(--gold-light)',
                            }}
                          >
                            {player.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{player.fullName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {player.id} • {player.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8rem' }}>
                      <div>{player.kyc.govtIdType}</div>
                      <div className="tabular-num" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {maskGovtId(player.kyc.govtIdNumber)}
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8rem' }}>
                      <div>{formatDateOnly(player.kyc.dateOfBirth)}</div>
                    </td>

                    <td>
                      <KYCBadge status={player.kycStatus} />
                    </td>

                    <td>
                      {checkIn ? (
                        <div>
                          <EntryBadge status={checkIn.verificationStatus} />
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {formatTimeOnly(checkIn.checkInTime)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Not checked in</span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.78rem', color: 'var(--gold-light)' }}>
                      {checkIn?.tablePreference || '—'}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onSelectPlayer(player, checkIn)}
                        >
                          Inspect & Verify
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
