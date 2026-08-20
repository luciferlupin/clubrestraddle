import React, { useState } from 'react';
import { CheckCircle2, Calendar, Clock, Search, ShieldCheck, Filter } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatDateOnly, formatTimeOnly } from '../../utils/formatters';
import { EntryBadge } from '../common/Badge';

export const AdminAttendanceView: React.FC = () => {
  const { checkIns } = useClub();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCheckIns = checkIns.filter(c => {
    const matchesSearch =
      c.playerName.toLowerCase().includes(search.toLowerCase()) ||
      c.playerPhone.includes(search) ||
      c.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && c.verificationStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <CheckCircle2 size={18} color="#10b981" />
            Club Attendance & Daily Check-In Registry
          </h3>
          <p className="card-subtitle">
            Comprehensive audit log of player entries and security clearance statuses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.8rem' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Verification Statuses</option>
            <option value="approved">Approved Entries</option>
            <option value="pending">Pending Clearance</option>
            <option value="rejected">Rejected / Denied</option>
          </select>

          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', width: '200px', fontSize: '0.8rem' }}
              placeholder="Search player, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Check-in Ref</th>
              <th>Player Name</th>
              <th>Contact Phone</th>
              <th>Date</th>
              <th>Time</th>
              <th>Table / Game Preference</th>
              <th>Security Clearance</th>
              <th>Verified By</th>
            </tr>
          </thead>
          <tbody>
            {filteredCheckIns.map(c => (
              <tr key={c.id}>
                <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                  {c.id}
                </td>
                <td style={{ fontWeight: 700 }}>{c.playerName}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.playerPhone}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} color="#94a3b8" />
                    <span>{formatDateOnly(c.checkInDate)}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} color="#94a3b8" />
                    <span className="tabular-num">{formatTimeOnly(c.checkInTime)}</span>
                  </div>
                </td>
                <td style={{ fontSize: '0.82rem', color: 'var(--gold-light)' }}>
                  {c.tablePreference || 'General Floor'}
                </td>
                <td>
                  <EntryBadge status={c.verificationStatus} />
                  {c.rejectionReason && (
                    <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '2px' }}>
                      {c.rejectionReason}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {c.verifiedBy || (c.verificationStatus === 'pending' ? 'Pending' : '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
