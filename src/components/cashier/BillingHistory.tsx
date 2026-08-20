import React, { useState } from 'react';
import { Receipt, Search, FileText, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { TournamentEntry } from '../../types';
import { formatClubLabel, formatCurrency, formatDateTime } from '../../utils/formatters';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { Modal } from '../common/Modal';

export const BillingHistory: React.FC = () => {
  const { entries, players, tournaments, updateTournamentEntry, deleteTournamentEntry } = useClub();
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TournamentEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editData, setEditData] = useState({
    tableNumber: '',
    seatNumber: '',
    entryStatus: 'Registered' as TournamentEntry['entryStatus'],
  });

  const filteredEntries = entries.filter(
    e =>
      e.playerName.toLowerCase().includes(search.toLowerCase()) ||
      e.tournamentName.toLowerCase().includes(search.toLowerCase()) ||
      e.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.paymentReference.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenEdit = (entry: TournamentEntry) => {
    setSelectedEntry(entry);
    setEditData({
      tableNumber: entry.tableNumber || '',
      seatNumber: entry.seatNumber || '',
      entryStatus: entry.entryStatus || 'Registered',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    updateTournamentEntry(selectedEntry.id, {
      tableNumber: editData.tableNumber,
      seatNumber: editData.seatNumber,
      entryStatus: editData.entryStatus,
    });

    setIsEditModalOpen(false);
    setSelectedEntry(null);
  };

  const handleDelete = () => {
    if (!selectedEntry) return;
    deleteTournamentEntry(selectedEntry.id);
    setIsDeleteModalOpen(false);
    setSelectedEntry(null);
  };

  const handleViewReceipt = (entry: TournamentEntry) => {
    const playerObj = players.find(p => p.id === entry.playerId);
    const tournamentObj = tournaments.find(t => t.name === entry.tournamentName);

    const invoiceData: ClubInvoiceData = {
      invoiceNumber: entry.receiptNumber,
      invoiceDate: entry.registeredAt,
      category: 'Tournament Entry & Rake',
      playerId: entry.playerId,
      playerName: entry.playerName,
      playerPhone: entry.playerPhone || playerObj?.phone,
      playerEmail: playerObj?.email,
      govtIdType: playerObj?.kyc.govtIdType,
      govtIdNumber: playerObj?.kyc.govtIdNumber,
      membershipTier: playerObj?.membershipTier,
      tableLocation: `${entry.tableNumber || 'Assigned'} • ${entry.seatNumber || 'Assigned'}`,
      items: [
        {
          description: `${formatClubLabel(entry.tournamentName)} - Player Buy-in Stack`,
          details: `${tournamentObj?.startingChips?.toLocaleString() || '50,000'} Starting Tournament Playing Chips`,
          chips: tournamentObj?.startingChips || 50000,
          amount: entry.buyInAmount,
        },
        {
          description: 'House Operating Rake & Registration Fee',
          details: 'Club tournament organization & dealer rake fee',
          amount: entry.rakeAmount,
        },
      ],
      subtotal: entry.buyInAmount,
      rakeOrFee: entry.rakeAmount,
      totalAmount: entry.buyInAmount + entry.rakeAmount,
      paymentMethod: entry.paymentMethod,
      paymentReference: entry.paymentReference,
      cashierName: entry.cashierName,
    };

    setSelectedInvoice(invoiceData);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <Receipt size={18} color="#e11d48" />
            Billing & Tournament Entry Records ({filteredEntries.length})
          </h3>
          <p className="card-subtitle">
            All generated tournament tickets, seating positions, billing receipts, and cashier records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', width: '220px', fontSize: '0.8rem' }}
              placeholder="Search player, receipt..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-dim)' }}>
          <Receipt size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: '0.9rem' }}>No billing records found matching your filter.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Player</th>
                <th>Tournament</th>
                <th>Buy-in + Rake</th>
                <th>Payment Method</th>
                <th>Payment Ref</th>
                <th>Table / Seat</th>
                <th>Cashier</th>
                <th>Date & Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map(entry => {
                const totalPaid = entry.buyInAmount + entry.rakeAmount;
                return (
                  <tr key={entry.id}>
                    <td className="tabular-num" style={{ fontWeight: 700, color: 'var(--gold-light)' }}>
                      {entry.receiptNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{entry.playerName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{entry.playerId}</div>
                    </td>
                    <td style={{ maxWidth: '180px', fontSize: '0.82rem' }}>
                      {formatClubLabel(entry.tournamentName)}
                    </td>
                    <td className="tabular-num" style={{ fontWeight: 800, color: '#ffffff' }}>
                      {formatCurrency(totalPaid)}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{entry.paymentMethod}</span>
                    </td>
                    <td className="tabular-num" style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {entry.paymentReference}
                    </td>
                    <td>
                      <span className="badge badge-default">
                        {entry.tableNumber || 'TBD'} • {entry.seatNumber || 'TBD'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {entry.cashierName}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {formatDateTime(entry.registeredAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 8px' }}
                          onClick={() => handleViewReceipt(entry)}
                          title="View Official Tax Invoice"
                        >
                          <FileText size={13} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '3px 6px' }}
                          onClick={() => handleOpenEdit(entry)}
                          title="Edit Seating / Entry"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '3px 6px' }}
                          onClick={() => {
                            setSelectedEntry(entry);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Unregister / Delete Entry"
                        >
                          <Trash2 size={13} />
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

      {/* Edit Entry Modal */}
      {selectedEntry && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Registration: ${selectedEntry.playerName}`}
          subtitle={`Event: ${selectedEntry.tournamentName} • Receipt: ${selectedEntry.receiptNumber}`}
          size="md"
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Table Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Table 2"
                  value={editData.tableNumber}
                  onChange={e => setEditData({ ...editData, tableNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Seat Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Seat 5"
                  value={editData.seatNumber}
                  onChange={e => setEditData({ ...editData, seatNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Entry Status</label>
              <select
                className="form-select"
                value={editData.entryStatus}
                onChange={e => setEditData({ ...editData, entryStatus: e.target.value as any })}
              >
                <option value="Registered">Registered & Active</option>
                <option value="Eliminated">Eliminated</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Seating Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete / Unregister Modal */}
      {selectedEntry && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Unregister / Delete Entry"
          subtitle="Remove tournament entry record"
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
              Are you sure you want to delete registration for <strong>{selectedEntry.playerName}</strong> from {selectedEntry.tournamentName} (Receipt: {selectedEntry.receiptNumber})?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                Delete Entry
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Official Tax / Billing Invoice Modal */}
      <ClubTaxInvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};
