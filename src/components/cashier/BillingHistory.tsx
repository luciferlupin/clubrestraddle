import React, { useState } from 'react';
import { Receipt, Printer, Search, Eye, Filter, User, FileText } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { TournamentEntry } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';

export const BillingHistory: React.FC = () => {
  const { entries, players, tournaments } = useClub();
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);

  const filteredEntries = entries.filter(
    e =>
      e.playerName.toLowerCase().includes(search.toLowerCase()) ||
      e.tournamentName.toLowerCase().includes(search.toLowerCase()) ||
      e.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.paymentReference.toLowerCase().includes(search.toLowerCase())
  );

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
          description: `${entry.tournamentName} - Player Buy-in Stack`,
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
            Billing & Tournament Entry Records
          </h3>
          <p className="card-subtitle">
            All generated tournament tickets, billing receipts, and cashier transaction records.
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
                <th>Actions</th>
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
                      {entry.tournamentName}
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
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewReceipt(entry)}
                        title="View Official Tax Invoice & Billing Voucher"
                      >
                        <FileText size={13} /> Official Invoice
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
