import React, { useState } from 'react';
import { Trophy, Plus, Users, Calendar } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { TournamentStatus } from '../../types';
import { formatClubLabel, formatCurrency, formatDateTime } from '../../utils/formatters';
import { TournamentStatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface TournamentManagerProps {
  onRegisterPlayer: (tournamentId: string) => void;
}

export const TournamentManager: React.FC<TournamentManagerProps> = ({ onRegisterPlayer }) => {
  const { tournaments, entries, createTournament, updateTournamentStatus } = useClub();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState(() => ({
    name: '',
    buyInFee: 500,
    clubRake: 50,
    startingChips: 30000,
    guaranteedPrizePool: 25000,
    maxSeats: 60,
    blindLevelsMinutes: 20,
    startTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16),
    status: 'Registering' as TournamentStatus,
  }));

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    createTournament({
      name: formData.name,
      buyInFee: Number(formData.buyInFee),
      clubRake: Number(formData.clubRake),
      startingChips: Number(formData.startingChips),
      guaranteedPrizePool: Number(formData.guaranteedPrizePool),
      maxSeats: Number(formData.maxSeats),
      blindLevelsMinutes: Number(formData.blindLevelsMinutes),
      startTime: new Date(formData.startTime).toISOString(),
      status: formData.status,
    });

    setIsCreateModalOpen(false);
    setFormData({
      name: '',
      buyInFee: 500,
      clubRake: 50,
      startingChips: 30000,
      guaranteedPrizePool: 25000,
      maxSeats: 60,
      blindLevelsMinutes: 20,
      startTime: new Date(Date.now() + 4 * 3600 * 1000).toISOString().slice(0, 16),
      status: 'Registering',
    });
  };

  const getEntriesForTournament = (tournamentId: string) => {
    return entries.filter(e => e.tournamentId === tournamentId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
        <div>
          <h3 className="page-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={20} color="#e11d48" />
            Club Tournaments & Events
          </h3>
          <p className="page-subtitle" style={{ fontSize: '0.84rem', color: '#475569', marginTop: '3px', fontWeight: 500 }}>
            Create new poker tournaments, configure entry details, and manage player seating.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={16} /> Create Tournament
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {tournaments.map(trn => {
          const trnEntries = getEntriesForTournament(trn.id);
          const totalPrizePoolCalculated = trnEntries.length * trn.buyInFee;
          const effectivePrizePool = Math.max(trn.guaranteedPrizePool, totalPrizePoolCalculated);

          return (
            <div key={trn.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--gold-light)' }}>
                      {trn.id}
                    </span>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                      {formatClubLabel(trn.name)}
                    </h4>
                  </div>
                  <TournamentStatusBadge status={trn.status} />
                </div>

                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px', marginBottom: '14px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Buy-in + Rake:</span>
                    <span style={{ fontWeight: 700, color: 'var(--gold-light)' }}>
                      {formatCurrency(trn.buyInFee)} + {formatCurrency(trn.clubRake)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Guaranteed Pool:</span>
                    <span style={{ fontWeight: 800, color: '#ffffff' }}>
                      {formatCurrency(effectivePrizePool)} GTD
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Starting Chips:</span>
                    <span className="tabular-num">{trn.startingChips.toLocaleString()} chips</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Seats Enrolled:</span>
                    <span style={{ fontWeight: 600 }}>
                      {trnEntries.length} / {trn.maxSeats} Players
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
                  <Calendar size={13} />
                  <span>Starts: {formatDateTime(trn.startTime)}</span>
                  <span>({trn.blindLevelsMinutes}m blinds)</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <button
                  className="btn btn-emerald btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => onRegisterPlayer(trn.id)}
                  disabled={trn.status === 'Completed' || trn.status === 'Cancelled'}
                >
                  <Users size={14} /> Register Player
                </button>

                <select
                  aria-label={`Update status for ${formatClubLabel(trn.name)}`}
                  className="form-select"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: '0.75rem' }}
                  value={trn.status}
                  onChange={e => updateTournamentStatus(trn.id, e.target.value as TournamentStatus)}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Registering">Registering</option>
                  <option value="Running">Running</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Tournament Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Tournament"
        subtitle="Configure poker tournament structure and prize parameters"
        size="md"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="new-tournament-name">Tournament Name *</label>
            <input
              id="new-tournament-name"
              type="text"
              className="form-input"
              placeholder="e.g. Saturday Night Deepstack Knockout"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="new-tournament-buyin">Buy-in Fee (₹) *</label>
              <input
                id="new-tournament-buyin"
                type="number"
                className="form-input"
                value={formData.buyInFee}
                onChange={e => setFormData({ ...formData, buyInFee: Number(e.target.value) })}
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-tournament-rake">Club Entry Rake (₹) *</label>
              <input
                id="new-tournament-rake"
                type="number"
                className="form-input"
                value={formData.clubRake}
                onChange={e => setFormData({ ...formData, clubRake: Number(e.target.value) })}
                required
                min="0"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="new-tournament-stack">Starting Stack (Chips) *</label>
              <input
                id="new-tournament-stack"
                type="number"
                className="form-input"
                value={formData.startingChips}
                onChange={e => setFormData({ ...formData, startingChips: Number(e.target.value) })}
                required
                step="5000"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-tournament-pool">Guaranteed Prize Pool (₹) *</label>
              <input
                id="new-tournament-pool"
                type="number"
                className="form-input"
                value={formData.guaranteedPrizePool}
                onChange={e => setFormData({ ...formData, guaranteedPrizePool: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label" htmlFor="new-tournament-seats">Max Seats</label>
              <input
                id="new-tournament-seats"
                type="number"
                className="form-input"
                value={formData.maxSeats}
                onChange={e => setFormData({ ...formData, maxSeats: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-tournament-blinds">Blind Levels (Mins)</label>
              <input
                id="new-tournament-blinds"
                type="number"
                className="form-input"
                value={formData.blindLevelsMinutes}
                onChange={e => setFormData({ ...formData, blindLevelsMinutes: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="new-tournament-status">Initial Status</label>
              <select
                id="new-tournament-status"
                className="form-select"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as TournamentStatus })}
              >
                <option value="Registering">Registering</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-tournament-start">Tournament Start Date & Time</label>
            <input
              id="new-tournament-start"
              type="datetime-local"
              className="form-input"
              value={formData.startTime}
              onChange={e => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Create & Publish Tournament
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
