import React, { useState } from 'react';
import { CheckCircle2, Calendar, Clock, Search, ShieldCheck, Filter, Plus, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { DailyCheckIn } from '../../types';
import { formatDateOnly, formatTimeOnly, getTodayDateString } from '../../utils/formatters';
import { EntryBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';

export const AdminAttendanceView: React.FC = () => {
  const { checkIns, players, performDailyCheckIn, updateCheckIn, deleteCheckIn } = useClub();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<DailyCheckIn | null>(null);

  const [createData, setCreateData] = useState({
    playerId: players[0]?.id || '',
    tablePreference: 'Cash Game Table',
  });

  const [editData, setEditData] = useState({
    tablePreference: '',
    verificationStatus: 'approved' as DailyCheckIn['verificationStatus'],
    rejectionReason: '',
  });

  const handleOpenEdit = (c: DailyCheckIn) => {
    setSelectedCheckIn(c);
    setEditData({
      tablePreference: c.tablePreference || 'General Floor',
      verificationStatus: c.verificationStatus,
      rejectionReason: c.rejectionReason || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheckIn) return;

    updateCheckIn(selectedCheckIn.id, {
      tablePreference: editData.tablePreference,
      verificationStatus: editData.verificationStatus,
      rejectionReason: editData.verificationStatus === 'rejected' ? editData.rejectionReason : undefined,
    });

    setIsEditModalOpen(false);
    setSelectedCheckIn(null);
  };

  const handleDelete = () => {
    if (!selectedCheckIn) return;
    deleteCheckIn(selectedCheckIn.id);
    setIsDeleteModalOpen(false);
    setSelectedCheckIn(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.playerId) return;

    performDailyCheckIn(createData.playerId, createData.tablePreference);
    setIsCreateModalOpen(false);
  };

  const filteredCheckIns = checkIns.filter(c => {
    const matchesSearch =
      c.playerName.toLowerCase().includes(search.toLowerCase()) ||
      c.playerPhone.includes(search) ||
      c.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && c.verificationStatus !== statusFilter) return false;
    return true;
  });

  const paginatedCheckIns = filteredCheckIns.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 className="card-title">
            <CheckCircle2 size={18} color="#e11d48" />
            Club Attendance & Daily Check-In Registry ({filteredCheckIns.length})
          </h3>
          <p className="card-subtitle">
            Comprehensive audit log of player entries and security clearance statuses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={14} /> Manual Check-in
          </button>

          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.82rem', fontWeight: 600, minHeight: '38px', padding: '8px 36px 8px 14px' }}
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Verification Statuses</option>
            <option value="approved">Approved Entries</option>
            <option value="pending">Pending Clearance</option>
            <option value="rejected">Rejected / Denied</option>
          </select>

          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', width: '210px', fontSize: '0.84rem', minHeight: '38px' }}
              placeholder="Search player, phone..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
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
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCheckIns.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No check-in records found.
                </td>
              </tr>
            ) : (
              paginatedCheckIns.map(c => (
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
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 6px' }}
                        title="Edit Check-in"
                        onClick={() => handleOpenEdit(c)}
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '3px 6px' }}
                        title="Delete Check-in"
                        onClick={() => {
                          setSelectedCheckIn(c);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={page}
        totalItems={filteredCheckIns.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        itemLabel="check-ins"
      />

      {/* Manual Check-in Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Manual Player Check-in"
        subtitle="Log player attendance directly from Admin console"
        size="md"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Select Registered Member *</label>
            <select
              className="form-select"
              value={createData.playerId}
              onChange={e => setCreateData({ ...createData, playerId: e.target.value })}
              required
            >
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.phone}) - {p.id}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Table Preference</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Table 2 / Deepstack Tournament"
              value={createData.tablePreference}
              onChange={e => setCreateData({ ...createData, tablePreference: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Check In Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Check-in Modal */}
      {selectedCheckIn && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Check-in: ${selectedCheckIn.playerName}`}
          subtitle={`Ref ID: ${selectedCheckIn.id}`}
          size="md"
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label className="form-label">Table Preference</label>
              <input
                type="text"
                className="form-input"
                value={editData.tablePreference}
                onChange={e => setEditData({ ...editData, tablePreference: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Verification Status</label>
              <select
                className="form-select"
                value={editData.verificationStatus}
                onChange={e => setEditData({ ...editData, verificationStatus: e.target.value as any })}
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {editData.verificationStatus === 'rejected' && (
              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Expired ID / Dress code policy"
                  value={editData.rejectionReason}
                  onChange={e => setEditData({ ...editData, rejectionReason: e.target.value })}
                />
              </div>
            )}

            <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Check-in Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Check-in Confirmation Modal */}
      {selectedCheckIn && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Check-in Record"
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
              Are you sure you want to delete check-in record for <strong>{selectedCheckIn.playerName}</strong> ({selectedCheckIn.id}) on {selectedCheckIn.checkInDate}?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                Delete Check-in
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
