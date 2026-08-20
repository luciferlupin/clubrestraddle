import React, { useState } from 'react';
import { Trophy, Plus, Users, Calendar, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Tournament, TournamentStatus } from '../../types';
import { formatClubLabel, formatCurrency, formatDateTime } from '../../utils/formatters';
import { TournamentStatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface TournamentManagerProps {
  onRegisterPlayer: (tournamentId: string) => void;
}

export const TournamentManager: React.FC<TournamentManagerProps> = ({ onRegisterPlayer }) => {
  const { tournaments, entries, createTournament, updateTournament, deleteTournament, updateTournamentStatus } = useClub();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

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

  const [editFormData, setEditFormData] = useState(() => ({
    name: '',
    buyInFee: 500,
    clubRake: 50,
    startingChips: 30000,
    guaranteedPrizePool: 25000,
    maxSeats: 60,
    blindLevelsMinutes: 20,
    startTime: new Date().toISOString().slice(0, 16),
    status: 'Registering' as TournamentStatus,
  }));

  const handleOpenEdit = (trn: Tournament) => {
    setSelectedTournament(trn);
    setEditFormData({
      name: trn.name,
      buyInFee: trn.buyInFee,
      clubRake: trn.clubRake,
      startingChips: trn.startingChips,
      guaranteedPrizePool: trn.guaranteedPrizePool,
      maxSeats: trn.maxSeats,
      blindLevelsMinutes: trn.blindLevelsMinutes,
      startTime: trn.startTime ? new Date(trn.startTime).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      status: trn.status,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament || !editFormData.name.trim()) return;

    updateTournament(selectedTournament.id, {
      name: editFormData.name,
      buyInFee: Number(editFormData.buyInFee),
      clubRake: Number(editFormData.clubRake),
      startingChips: Number(editFormData.startingChips),
      guaranteedPrizePool: Number(editFormData.guaranteedPrizePool),
      maxSeats: Number(editFormData.maxSeats),
      blindLevelsMinutes: Number(editFormData.blindLevelsMinutes),
      startTime: new Date(editFormData.startTime).toISOString(),
      status: editFormData.status,
    });

    setIsEditModalOpen(false);
    setSelectedTournament(null);
  };

  const handleDelete = () => {
    if (!selectedTournament) return;
    deleteTournament(selectedTournament.id);
    setIsDeleteModalOpen(false);
    setSelectedTournament(null);
  };

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
            Club Tournaments & Events ({tournaments.length})
          </h3>
          <p className="page-subtitle" style={{ fontSize: '0.84rem', color: '#475569', marginTop: '3px', fontWeight: 500 }}>
            Create, edit, manage, and register players for all poker events.
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TournamentStatusBadge status={trn.status} />
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 6px' }}
                      title="Edit Tournament"
                      onClick={() => handleOpenEdit(trn)}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 6px', color: '#ef4444' }}
                      title="Delete Tournament"
                      onClick={() => {
                        setSelectedTournament(trn);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="form-grid-2" style={{ gap: '10px', marginBottom: '12px', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Buy-in / Rake:</span>
                    <div style={{ fontWeight: 800, color: 'var(--gold-light)', fontSize: '0.9rem' }}>
                      {formatCurrency(trn.buyInFee)} + {formatCurrency(trn.clubRake)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Guaranteed Prize:</span>
                    <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>
                      {formatCurrency(effectivePrizePool)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Starting Stack:</span>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {trn.startingChips.toLocaleString()} Chips
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Registered:</span>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {trnEntries.length} / {trn.maxSeats} Seats
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                  <Calendar size={13} />
                  <span>Start: {formatDateTime(trn.startTime)} ({trn.blindLevelsMinutes}m blinds)</span>
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

      {/* Edit Tournament Modal */}
      {selectedTournament && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Tournament: ${selectedTournament.name}`}
          subtitle={`Event ID: ${selectedTournament.id}`}
          size="md"
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label className="form-label">Tournament Name *</label>
              <input
                type="text"
                className="form-input"
                value={editFormData.name}
                onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Buy-in Fee (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={editFormData.buyInFee}
                  onChange={e => setEditFormData({ ...editFormData, buyInFee: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Club Entry Rake (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={editFormData.clubRake}
                  onChange={e => setEditFormData({ ...editFormData, clubRake: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Starting Stack (Chips) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={editFormData.startingChips}
                  onChange={e => setEditFormData({ ...editFormData, startingChips: Number(e.target.value) })}
                  required
                  step="5000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Guaranteed Prize Pool (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={editFormData.guaranteedPrizePool}
                  onChange={e => setEditFormData({ ...editFormData, guaranteedPrizePool: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Max Seats</label>
                <input
                  type="number"
                  className="form-input"
                  value={editFormData.maxSeats}
                  onChange={e => setEditFormData({ ...editFormData, maxSeats: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Blind Levels (Mins)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editFormData.blindLevelsMinutes}
                  onChange={e => setEditFormData({ ...editFormData, blindLevelsMinutes: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Event Status</label>
                <select
                  className="form-select"
                  value={editFormData.status}
                  onChange={e => setEditFormData({ ...editFormData, status: e.target.value as TournamentStatus })}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Registering">Registering</option>
                  <option value="Running">Running</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tournament Start Date & Time</label>
              <input
                type="datetime-local"
                className="form-input"
                value={editFormData.startTime}
                onChange={e => setEditFormData({ ...editFormData, startTime: e.target.value })}
              />
            </div>

            <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Tournament Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Tournament Confirmation Modal */}
      {selectedTournament && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Tournament"
          subtitle="Irreversible action"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1.5px solid #ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0 }}>
              Are you sure you want to delete tournament <strong>{selectedTournament.name}</strong> ({selectedTournament.id})?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                Delete Tournament
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
