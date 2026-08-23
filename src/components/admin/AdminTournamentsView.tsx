import React, { useState } from 'react';
import { Trophy, DollarSign, Award, Plus, Edit3, Trash2, AlertTriangle, Users } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Tournament, TournamentStatus, TournamentEntry } from '../../types';
import { formatClubLabel, formatCurrency, formatDateTime } from '../../utils/formatters';
import { TournamentStatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const AdminTournamentsView: React.FC = () => {
  const { tournaments, entries, createTournament, updateTournament, deleteTournament, updateTournamentStatus, deleteTournamentEntry } = useClub();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [viewingEntriesTournament, setViewingEntriesTournament] = useState<Tournament | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<TournamentEntry | null>(null);

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

  const totalRakeEarned = entries.reduce((sum, e) => sum + e.rakeAmount, 0);
  const totalBuyInsCollected = entries.reduce((sum, e) => sum + e.buyInAmount, 0);

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

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Entry Charge Pool</span>
            <span className="stat-value" style={{ color: '#ffffff' }}>
              {formatCurrency(totalBuyInsCollected)}
            </span>
            <span className="stat-helper">Collected from {entries.length} entries</span>
          </div>
          <div className="stat-icon-wrapper">
            <DollarSign size={22} color="#ffffff" />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Service Charges Earned</span>
            <span className="stat-value" style={{ color: '#ffffff' }}>
              {formatCurrency(totalRakeEarned)}
            </span>
            <span className="stat-helper">Club service fee revenue</span>
          </div>
          <div className="stat-icon-wrapper">
            <Award size={22} color="#ffffff" />
          </div>
        </div>
      </div>

      {/* Tournaments Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="card-title">
              <Trophy size={18} color="#e11d48" />
              Tournament Records & Prize Structures ({tournaments.length})
            </h3>
            <p className="card-subtitle">Complete schedule of tournaments, service charges, and player entries.</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={14} /> Create Tournament
          </button>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tournament Name</th>
                <th>Entry Charge + Service Charge</th>
                <th>Starting Chips</th>
                <th>Guaranteed Pool</th>
                <th>Entries / Seats</th>
                <th>Start Time</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                    <td style={{ fontWeight: 700 }}>{formatClubLabel(trn.name)}</td>
                    <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                      {formatCurrency(trn.buyInFee)} + {formatCurrency(trn.clubRake)}
                    </td>
                    <td className="tabular-num">{trn.startingChips.toLocaleString()}</td>
                    <td className="tabular-num" style={{ color: '#ffffff', fontWeight: 800 }}>
                      {formatCurrency(trn.guaranteedPrizePool)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '3px 8px',
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: trnEntries.length > 0 ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                          color: trnEntries.length > 0 ? '#34d399' : 'var(--text-muted)',
                          borderColor: trnEntries.length > 0 ? 'rgba(52, 211, 153, 0.3)' : 'var(--border-subtle)',
                        }}
                        onClick={() => setViewingEntriesTournament(trn)}
                        title="View enrolled players & manage entries"
                      >
                        <Users size={12} />
                        {trnEntries.length} Players
                      </button>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {formatDateTime(trn.startTime)}
                    </td>
                    <td>
                      <TournamentStatusBadge status={trn.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 6px' }}
                          title="Edit Tournament"
                          onClick={() => handleOpenEdit(trn)}
                        >
                          <Edit3 size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '3px 6px' }}
                          title="Delete Tournament"
                          onClick={() => {
                            setSelectedTournament(trn);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tournament Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Tournament"
        subtitle="Configure tournament structure and prize parameters"
        size="md"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Tournament Name *</label>
            <input
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
              <label className="form-label">Entry Charge (₹) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.buyInFee}
                onChange={e => setFormData({ ...formData, buyInFee: Number(e.target.value) })}
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Service Charge (₹) *</label>
              <input
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
              <label className="form-label">Starting Stack (Chips) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.startingChips}
                onChange={e => setFormData({ ...formData, startingChips: Number(e.target.value) })}
                required
                step="5000"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Guaranteed Prize Pool (₹) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.guaranteedPrizePool}
                onChange={e => setFormData({ ...formData, guaranteedPrizePool: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Blind Levels (Mins)</label>
              <input
                type="number"
                className="form-input"
                value={formData.blindLevelsMinutes}
                onChange={e => setFormData({ ...formData, blindLevelsMinutes: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select
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
            <label className="form-label">Tournament Start Date & Time</label>
            <input
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
                <label className="form-label">Entry Charge (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={editFormData.buyInFee}
                  onChange={e => setEditFormData({ ...editFormData, buyInFee: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Service Charge (₹) *</label>
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

            <div className="form-grid-2">
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

      {/* Enrolled Players Modal */}
      {viewingEntriesTournament && (
        <Modal
          isOpen={!!viewingEntriesTournament}
          onClose={() => setViewingEntriesTournament(null)}
          title={`Enrolled Players (${entries.filter(e => e.tournamentId === viewingEntriesTournament.id).length})`}
          subtitle={`Event: ${viewingEntriesTournament.name} • ${formatCurrency(viewingEntriesTournament.buyInFee + viewingEntriesTournament.clubRake)}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {entries.filter(e => e.tournamentId === viewingEntriesTournament.id).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                No players currently registered for this event.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Player Name</th>
                      <th>Receipt #</th>
                      <th>Seat / Table</th>
                      <th>Amount Paid</th>
                      <th>Payment Mode</th>
                      <th>Registered At</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries
                      .filter(e => e.tournamentId === viewingEntriesTournament.id)
                      .map(entry => (
                        <tr key={entry.id}>
                          <td style={{ fontWeight: 700, color: '#ffffff' }}>
                            {entry.playerName}
                          </td>
                          <td className="tabular-num" style={{ color: 'var(--gold-light)', fontSize: '0.8rem' }}>
                            {entry.receiptNumber || entry.id}
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>
                            {entry.seatNumber ? `Table ${entry.tableNumber || 1} • Seat ${entry.seatNumber}` : 'Assigned'}
                          </td>
                          <td className="tabular-num" style={{ fontWeight: 700, color: '#34d399' }}>
                            {formatCurrency(entry.buyInAmount + entry.rakeAmount)}
                          </td>
                          <td>
                            <span className="badge badge-default" style={{ fontSize: '0.72rem' }}>
                              {entry.paymentMethod}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {formatDateTime(entry.registeredAt)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Delete/Void Player Entry"
                              onClick={() => setEntryToDelete(entry)}
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewingEntriesTournament(null)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete / Void Entry Confirmation Modal */}
      {entryToDelete && (
        <Modal
          isOpen={!!entryToDelete}
          onClose={() => setEntryToDelete(null)}
          title="Remove Player Entry"
          subtitle={`Receipt: ${entryToDelete.receiptNumber || entryToDelete.id}`}
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontWeight: 800, color: '#ffffff' }}>{entryToDelete.playerName}</div>
              <div style={{ fontSize: '0.82rem', color: '#fda4af' }}>{entryToDelete.tournamentName}</div>
              <div style={{ fontWeight: 800, color: '#f43f5e', fontSize: '1.1rem', marginTop: '4px' }}>
                {formatCurrency(entryToDelete.buyInAmount + entryToDelete.rakeAmount)} • {entryToDelete.paymentMethod}
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Are you sure you want to remove this player entry? This will permanently delete the registration and void the associated cashier billing transaction across all terminals.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setEntryToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={() => {
                  deleteTournamentEntry(entryToDelete.id);
                  setEntryToDelete(null);
                }}
              >
                <Trash2 size={14} /> Confirm Remove
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
