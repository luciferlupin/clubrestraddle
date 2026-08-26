import React, { useState } from 'react';
import { Trophy, DollarSign, Award, Plus, Edit3, Trash2, AlertTriangle, Users, Medal, CheckCircle2, Wallet, Sparkles } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Tournament, TournamentStatus, TournamentEntry, TournamentWinnerRank } from '../../types';
import { formatClubLabel, formatCurrency, formatDateTime, formatPlayerNumber } from '../../utils/formatters';
import { TournamentStatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface RankInputRow {
  rank: number;
  playerId: string;
  prizeAmount: number | '';
  notes: string;
}

export const AdminTournamentsView: React.FC = () => {
  const {
    tournaments,
    entries,
    players,
    createTournament,
    updateTournament,
    deleteTournament,
    updateTournamentStatus,
    deleteTournamentEntry,
    recordTournamentWinners,
  } = useClub();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [viewingEntriesTournament, setViewingEntriesTournament] = useState<Tournament | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<TournamentEntry | null>(null);

  // Tournament Winner Ranking & Prize Settlement Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settlingTournament, setSettlingTournament] = useState<Tournament | null>(null);
  const [rankRows, setRankRows] = useState<RankInputRow[]>([]);
  const [settleSuccessMsg, setSettleSuccessMsg] = useState<string | null>(null);
  const [settleErrorMsg, setSettleErrorMsg] = useState<string | null>(null);

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

  const handleOpenSettleRanks = (trn: Tournament) => {
    setSettlingTournament(trn);
    setSettleErrorMsg(null);
    setSettleSuccessMsg(null);

    // If tournament already has winners, pre-populate
    if (trn.winners && trn.winners.length > 0) {
      setRankRows(
        trn.winners.map(w => ({
          rank: w.rank,
          playerId: w.playerId,
          prizeAmount: w.prizeAmount,
          notes: w.notes || '',
        }))
      );
    } else {
      // Find registered players for this tournament
      const trnEntries = entries.filter(e => e.tournamentId === trn.id);
      const pool = trn.guaranteedPrizePool || trnEntries.length * trn.buyInFee;

      // Default to top 3 or top 2
      const initial: RankInputRow[] = [
        {
          rank: 1,
          playerId: trnEntries[0]?.playerId || '',
          prizeAmount: Math.round(pool * 0.5),
          notes: '1st Place Champion',
        },
        {
          rank: 2,
          playerId: trnEntries[1]?.playerId || '',
          prizeAmount: Math.round(pool * 0.3),
          notes: '2nd Place Runner-up',
        },
        {
          rank: 3,
          playerId: trnEntries[2]?.playerId || '',
          prizeAmount: Math.round(pool * 0.2),
          notes: '3rd Place Finalist',
        },
      ];
      setRankRows(initial);
    }

    setIsSettleModalOpen(true);
  };

  const handleAddRankRow = () => {
    const nextRank = rankRows.length > 0 ? Math.max(...rankRows.map(r => r.rank)) + 1 : 1;
    setRankRows(prev => [
      ...prev,
      {
        rank: nextRank,
        playerId: '',
        prizeAmount: 0,
        notes: `Rank #${nextRank} Placement`,
      },
    ]);
  };

  const handleRemoveRankRow = (index: number) => {
    setRankRows(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleApplyPreset = (preset: 'top3_50_30_20' | 'top2_65_35' | 'winner_100') => {
    if (!settlingTournament) return;
    const pool = settlingTournament.guaranteedPrizePool || 100000;

    if (preset === 'winner_100') {
      setRankRows([
        {
          rank: 1,
          playerId: rankRows[0]?.playerId || '',
          prizeAmount: pool,
          notes: 'Winner Takes All',
        },
      ]);
    } else if (preset === 'top2_65_35') {
      setRankRows([
        {
          rank: 1,
          playerId: rankRows[0]?.playerId || '',
          prizeAmount: Math.round(pool * 0.65),
          notes: '1st Place Champion',
        },
        {
          rank: 2,
          playerId: rankRows[1]?.playerId || '',
          prizeAmount: Math.round(pool * 0.35),
          notes: '2nd Place Runner-up',
        },
      ]);
    } else {
      setRankRows([
        {
          rank: 1,
          playerId: rankRows[0]?.playerId || '',
          prizeAmount: Math.round(pool * 0.5),
          notes: '1st Place Champion',
        },
        {
          rank: 2,
          playerId: rankRows[1]?.playerId || '',
          prizeAmount: Math.round(pool * 0.3),
          notes: '2nd Place Runner-up',
        },
        {
          rank: 3,
          playerId: rankRows[2]?.playerId || '',
          prizeAmount: Math.round(pool * 0.2),
          notes: '3rd Place Finalist',
        },
      ]);
    }
  };

  const handleSaveRanksAndDistributePrizes = (e: React.FormEvent) => {
    e.preventDefault();
    setSettleErrorMsg(null);
    if (!settlingTournament) return;

    // Validate
    const validRows = rankRows.filter(r => r.playerId.trim());
    if (validRows.length === 0) {
      setSettleErrorMsg('Please select at least one player to award ranks.');
      return;
    }

    // Check duplicate players
    const playerIds = validRows.map(r => r.playerId);
    if (new Set(playerIds).size !== playerIds.length) {
      setSettleErrorMsg('The same player cannot be assigned multiple ranks. Please ensure each rank has a unique player.');
      return;
    }

    try {
      recordTournamentWinners(
        settlingTournament.id,
        validRows.map(r => ({
          rank: r.rank,
          playerId: r.playerId,
          prizeAmount: Number(r.prizeAmount) || 0,
          notes: r.notes,
        }))
      );

      const totalDistributed = validRows.reduce((sum, r) => sum + (Number(r.prizeAmount) || 0), 0);
      setSettleSuccessMsg(
        `🏆 Success! Assigned ranks and deposited ${formatCurrency(totalDistributed)} across ${validRows.length} player wallet(s).`
      );

      setTimeout(() => {
        setIsSettleModalOpen(false);
        setSettlingTournament(null);
      }, 1500);
    } catch (err: any) {
      setSettleErrorMsg(err.message || 'Failed to save tournament rankings.');
    }
  };

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
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.74rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            borderColor: trn.winners && trn.winners.length > 0 ? 'rgba(245, 158, 11, 0.4)' : undefined,
                            color: trn.winners && trn.winners.length > 0 ? '#fbbf24' : undefined,
                            background: trn.winners && trn.winners.length > 0 ? 'rgba(245, 158, 11, 0.12)' : undefined,
                          }}
                          title="Settle Ranks & Prize Money Distribution"
                          onClick={() => handleOpenSettleRanks(trn)}
                        >
                          <Trophy size={13} color="#fbbf24" />
                          <span>{trn.winners && trn.winners.length > 0 ? `${trn.winners.length} Winners` : 'Rank Winners'}</span>
                        </button>
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
      {/* Settle Tournament Ranks & Prize Wallet Distribution Modal */}
      {settlingTournament && (
        <Modal
          isOpen={isSettleModalOpen}
          onClose={() => {
            setIsSettleModalOpen(false);
            setSettlingTournament(null);
          }}
          title={`🏆 Finalize Ranks & Settle Prize Money`}
          subtitle={settlingTournament.name}
          size="lg"
        >
          <form onSubmit={handleSaveRanksAndDistributePrizes}>
            {settleSuccessMsg && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '10px', padding: '12px', color: '#34d399', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <CheckCircle2 size={18} />
                <span>{settleSuccessMsg}</span>
              </div>
            )}

            {settleErrorMsg && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '10px', padding: '12px', color: '#f87171', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <AlertTriangle size={18} />
                <span>{settleErrorMsg}</span>
              </div>
            )}

            {/* Prize Pool Summary Card */}
            <div style={{ background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.8) 0%, rgba(15, 8, 4, 0.95) 100%)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Guaranteed Prize Pool</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gold-light)' }}>
                    {formatCurrency(settlingTournament.guaranteedPrizePool)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Distributed</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>
                    {formatCurrency(rankRows.reduce((sum, r) => sum + (Number(r.prizeAmount) || 0), 0))}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Entries</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                    {entries.filter(e => e.tournamentId === settlingTournament.id).length} Players
                  </div>
                </div>
              </div>

              {/* Preset Distribution Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Quick Presets:</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => handleApplyPreset('top3_50_30_20')}
                >
                  Top 3 (50% / 30% / 20%)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => handleApplyPreset('top2_65_35')}
                >
                  Top 2 (65% / 35%)
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => handleApplyPreset('winner_100')}
                >
                  Winner Takes All (100%)
                </button>
              </div>
            </div>

            {/* Ranking Form Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rank Placements & Winner Payouts
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.74rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleAddRankRow}
                >
                  <Plus size={13} /> Add Another Rank
                </button>
              </div>

              {rankRows.map((row, index) => {
                const trnEntries = entries.filter(e => e.tournamentId === settlingTournament.id);
                const isFirst = row.rank === 1;
                const isSecond = row.rank === 2;
                const isThird = row.rank === 3;
                const badgeColor = isFirst ? '#fbbf24' : isSecond ? '#94a3b8' : isThird ? '#cd7f32' : '#cbd5e1';

                return (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: `1px solid ${isFirst ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 140px 140px 40px',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    {/* Rank Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          color: badgeColor,
                          padding: '4px 8px',
                          borderRadius: '6px',
                          background: isFirst ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${isFirst ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                          width: '100%',
                          textAlign: 'center',
                        }}
                      >
                        {row.rank === 1 ? '🥇 #1' : row.rank === 2 ? '🥈 #2' : row.rank === 3 ? '🥉 #3' : `#${row.rank}`}
                      </span>
                    </div>

                    {/* Player Selection Dropdown */}
                    <div>
                      <select
                        className="form-select"
                        style={{ fontSize: '0.82rem', padding: '6px 10px', background: '#111827', color: '#ffffff' }}
                        value={row.playerId}
                        onChange={e => {
                          const val = e.target.value;
                          setRankRows(prev =>
                            prev.map((r, idx) => (idx === index ? { ...r, playerId: val } : r))
                          );
                        }}
                        required
                      >
                        <option value="">— Select Winning Player —</option>
                        {/* Enrolled Tournament Players */}
                        <optgroup label="Enrolled Tournament Players">
                          {trnEntries.map(e => (
                            <option key={`entry-${e.playerId}`} value={e.playerId}>
                              ★ {e.playerName} (Seat: {e.seatNumber || '1'}, ID: {e.playerId})
                            </option>
                          ))}
                        </optgroup>
                        {/* All Registered Club Members */}
                        <optgroup label="All Registered Club Members">
                          {players
                            .filter(p => !trnEntries.some(e => e.playerId === p.id))
                            .map(p => (
                              <option key={`all-${p.id}`} value={p.id}>
                                {p.fullName} (Member #{formatPlayerNumber(p)}, {p.phone})
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Prize Amount */}
                    <div>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.8rem' }}>₹</span>
                        <input
                          type="number"
                          className="form-input"
                          style={{ paddingLeft: '22px', fontSize: '0.84rem', fontWeight: 700, color: '#34d399' }}
                          placeholder="Prize (₹)"
                          value={row.prizeAmount}
                          onChange={e => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setRankRows(prev =>
                              prev.map((r, idx) => (idx === index ? { ...r, prizeAmount: val } : r))
                            );
                          }}
                          min={0}
                          required
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <input
                        type="text"
                        className="form-input"
                        style={{ fontSize: '0.78rem' }}
                        placeholder="e.g. 1st Place"
                        value={row.notes}
                        onChange={e => {
                          const val = e.target.value;
                          setRankRows(prev =>
                            prev.map((r, idx) => (idx === index ? { ...r, notes: val } : r))
                          );
                        }}
                      />
                    </div>

                    {/* Delete button */}
                    <div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px', color: '#ef4444' }}
                        title="Remove Rank"
                        onClick={() => handleRemoveRankRow(index)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '10px', padding: '12px', marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wallet size={20} color="#34d399" />
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                <strong style={{ color: '#ffffff' }}>Automatic Player Wallet Credit:</strong> Confirming rankings will mark the tournament as <span style={{ color: '#34d399', fontWeight: 700 }}>Completed</span> and automatically deposit the prize money directly into each winning player&apos;s digital wallet balance.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsSettleModalOpen(false);
                  setSettlingTournament(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                  borderColor: '#fb7185',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                }}
              >
                <Trophy size={16} />
                <span>Confirm Ranks & Credit Wallets</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
