import React, { useState } from 'react';
import { Trophy, DollarSign, Users, Calendar, Award } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { TournamentStatusBadge } from '../common/Badge';

export const AdminTournamentsView: React.FC = () => {
  const { tournaments, entries } = useClub();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  const totalRakeEarned = entries.reduce((sum, e) => sum + e.rakeAmount, 0);
  const totalBuyInsCollected = entries.reduce((sum, e) => sum + e.buyInAmount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tournament Financials Overview */}
      <div className="stats-grid" style={{ marginBottom: 0 }}>
        <div
          className="stat-card"
          style={{ '--stat-glow': 'rgba(245, 158, 11, 0.15)', '--stat-color': '#fbbf24' } as React.CSSProperties}
        >
          <div className="stat-info">
            <span className="stat-label">Total Tournaments</span>
            <span className="stat-value">{tournaments.length}</span>
            <span className="stat-helper">Across all schedules</span>
          </div>
          <div className="stat-icon-wrapper">
            <Trophy size={22} />
          </div>
        </div>

        <div
          className="stat-card"
          style={{ '--stat-glow': 'rgba(16, 185, 129, 0.15)', '--stat-color': '#34d399' } as React.CSSProperties}
        >
          <div className="stat-info">
            <span className="stat-label">Total Buy-in Pool</span>
            <span className="stat-value" style={{ color: '#34d399' }}>
              {formatCurrency(totalBuyInsCollected)}
            </span>
            <span className="stat-helper">Collected from {entries.length} entries</span>
          </div>
          <div className="stat-icon-wrapper">
            <DollarSign size={22} />
          </div>
        </div>

        <div
          className="stat-card"
          style={{ '--stat-glow': 'rgba(168, 85, 247, 0.15)', '--stat-color': '#c084fc' } as React.CSSProperties}
        >
          <div className="stat-info">
            <span className="stat-label">House Rake Earned</span>
            <span className="stat-value" style={{ color: '#c084fc' }}>
              {formatCurrency(totalRakeEarned)}
            </span>
            <span className="stat-helper">Club fee revenue</span>
          </div>
          <div className="stat-icon-wrapper">
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* Tournaments Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Trophy size={18} color="#f59e0b" />
              Tournament Records & Prize Structures
            </h3>
            <p className="card-subtitle">Complete schedule of tournaments, rake fees, and player entries.</p>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tournament Name</th>
                <th>Buy-in + Rake</th>
                <th>Starting Chips</th>
                <th>Guaranteed Pool</th>
                <th>Entries / Seats</th>
                <th>Start Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map(trn => {
                const trnEntries = entries.filter(e => e.tournamentId === trn.id);
                return (
                  <tr key={trn.id}>
                    <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                      {trn.id}
                    </td>
                    <td style={{ fontWeight: 700 }}>{trn.name}</td>
                    <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                      {formatCurrency(trn.buyInFee)} + {formatCurrency(trn.clubRake)}
                    </td>
                    <td className="tabular-num">{trn.startingChips.toLocaleString()}</td>
                    <td className="tabular-num" style={{ color: '#34d399', fontWeight: 700 }}>
                      {formatCurrency(trn.guaranteedPrizePool)}
                    </td>
                    <td>
                      <span className="badge badge-default">
                        {trnEntries.length} / {trn.maxSeats} Players
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {formatDateTime(trn.startTime)}
                    </td>
                    <td>
                      <TournamentStatusBadge status={trn.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
