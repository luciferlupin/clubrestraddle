import React, { useState } from 'react';
import { History, Search, Trash2, AlertTriangle } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatDateTime } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';

export const AdminAuditLogsView: React.FC = () => {
  const { auditLogs, deleteAuditLog, clearAuditLogs } = useClub();
  const [search, setSearch] = useState('');
  const [portalFilter, setPortalFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (portalFilter !== 'all' && log.portal !== portalFilter) return false;
    return true;
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const getPortalBadgeColor = (portal: string) => {
    switch (portal) {
      case 'Player':
        return 'badge-info';
      case 'Cashier':
        return 'badge-warning';
      case 'Security':
        return 'badge-success';
      case 'Admin':
        return 'badge-purple';
      default:
        return 'badge-default';
    }
  };

  const handleConfirmClear = () => {
    clearAuditLogs();
    setIsClearModalOpen(false);
    setPage(1);
  };

  const handleConfirmDeleteSingle = () => {
    if (!selectedLogId) return;
    deleteAuditLog(selectedLogId);
    setSelectedLogId(null);
  };

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 className="card-title">
            <History size={18} color="#e11d48" />
            Team Activity Audit Trail ({filteredLogs.length})
          </h3>
          <p className="card-subtitle">
            Chronological audit logs of all actions performed across all 4 portals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {auditLogs.length > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              style={{ color: '#ef4444' }}
              onClick={() => setIsClearModalOpen(true)}
            >
              <Trash2 size={13} /> Clear Logs
            </button>
          )}

          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.82rem', fontWeight: 600, minHeight: '38px', padding: '8px 36px 8px 14px' }}
            value={portalFilter}
            onChange={e => {
              setPortalFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Portals ({auditLogs.length})</option>
            <option value="Player">Player Portal</option>
            <option value="Cashier">Cashier Portal</option>
            <option value="Security">Security Portal</option>
            <option value="Admin">Admin Portal</option>
          </select>

          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', width: '210px', fontSize: '0.84rem', minHeight: '38px' }}
              placeholder="Search logs, staff..."
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
              <th>Log ID</th>
              <th>Portal</th>
              <th>Staff / User</th>
              <th>Action</th>
              <th>Audit Details</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No audit logs found matching your filters.
                </td>
              </tr>
            ) : (
              paginatedLogs.map(log => (
                <tr key={log.id}>
                  <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                    {log.id}
                  </td>
                  <td>
                    <span className={`badge ${getPortalBadgeColor(log.portal)}`}>
                      {log.portal}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.user}</td>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{log.action}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '320px' }}>
                    {log.details}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#ef4444', padding: '3px 6px' }}
                      title="Delete Log"
                      onClick={() => setSelectedLogId(log.id)}
                    >
                      <Trash2 size={12} />
                    </button>
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
        totalItems={filteredLogs.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        itemLabel="logs"
      />

      {/* Clear All Logs Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear All Audit Logs"
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
            Are you sure you want to clear all {auditLogs.length} audit logs?
          </p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsClearModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleConfirmClear}>
              Clear All Logs
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Single Log Modal */}
      {selectedLogId && (
        <Modal
          isOpen={!!selectedLogId}
          onClose={() => setSelectedLogId(null)}
          title="Delete Audit Log"
          subtitle={`Log ID: ${selectedLogId}`}
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0 }}>
              Are you sure you want to delete log <strong>{selectedLogId}</strong>?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedLogId(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleConfirmDeleteSingle}>
                Delete Log
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
