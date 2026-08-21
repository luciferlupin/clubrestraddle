import React from 'react';
import { Printer, CheckCircle, Spade } from 'lucide-react';
import { Modal } from './Modal';
import { TournamentEntry } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface ReceiptModalProps {
  entry: TournamentEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ entry, isOpen, onClose }) => {
  if (!entry) return null;

  const totalPaid = entry.buyInAmount + entry.rakeAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tournament Entry & Billing Receipt"
      subtitle={`Receipt No: ${entry.receiptNumber}`}
      size="md"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Print / Save Voucher
          </button>
        </>
      }
    >
      <div className="receipt-paper" id="printable-receipt">
        <div className="receipt-header">
          <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.04em', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Spade size={18} fill="currentColor" aria-hidden="true" /> CLUB RE STRADDLE POKER LOUNGE
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
            OFFICIAL TOURNAMENT ENTRY & PAYMENT VOUCHER
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
            {formatDateTime(entry.registeredAt)}
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div className="receipt-row">
            <span style={{ color: '#64748b' }}>Receipt Ref:</span>
            <span style={{ fontWeight: 700 }}>{entry.receiptNumber}</span>
          </div>
          <div className="receipt-row">
            <span style={{ color: '#64748b' }}>Player Name:</span>
            <span style={{ fontWeight: 700 }}>{entry.playerName}</span>
          </div>
          <div className="receipt-row">
            <span style={{ color: '#64748b' }}>Member ID:</span>
            <span>{entry.playerId}</span>
          </div>
          <div className="receipt-row">
            <span style={{ color: '#64748b' }}>Contact:</span>
            <span>{entry.playerPhone}</span>
          </div>
        </div>

        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a', marginBottom: '6px' }}>
            {entry.tournamentName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#334155' }}>
            <span>Table: <strong>{entry.tableNumber || 'Assigned on Call'}</strong></span>
            <span>Seat: <strong>{entry.seatNumber || 'Random Draw'}</strong></span>
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <div className="receipt-row">
            <span>Tournament Buy-in:</span>
            <span>{formatCurrency(entry.buyInAmount)}</span>
          </div>
          <div className="receipt-row">
            <span>Club Service Charge:</span>
            <span>{formatCurrency(entry.rakeAmount)}</span>
          </div>
          <div className="receipt-row">
            <span>Payment Method:</span>
            <span>{entry.paymentMethod}</span>
          </div>
          <div className="receipt-row">
            <span>Payment Ref / Txn ID:</span>
            <span style={{ fontSize: '0.75rem', color: '#475569' }}>{entry.paymentReference}</span>
          </div>
        </div>

        <div className="receipt-total">
          <span>TOTAL PAID:</span>
          <span style={{ color: '#e11d48', fontWeight: 800 }}>{formatCurrency(totalPaid)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
          <span>Cashier: <strong>{entry.cashierName}</strong></span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e11d48', fontWeight: 700 }}>
            <CheckCircle size={12} color="#e11d48" /> Payment Confirmed
          </span>
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#94a3b8', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
          Present this ticket at the tournament desk to claim your chip stack. Good luck & play responsibly.
        </div>
      </div>
    </Modal>
  );
};
