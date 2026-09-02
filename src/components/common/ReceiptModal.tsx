import React from 'react';
import { Printer, CheckCircle, Spade } from 'lucide-react';
import { Modal } from './Modal';
import { TournamentEntry } from '../../types';
import { formatCurrency, formatDateTime, formatPlayerNumber } from '../../utils/formatters';
import { useClub } from '../../context/ClubContext';

interface ReceiptModalProps {
  entry: TournamentEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ entry, isOpen, onClose }) => {
  const { players } = useClub();
  if (!entry) return null;

  const totalPaid = entry.buyInAmount + entry.rakeAmount;
  const player = players.find(candidate => candidate.id === entry.playerId);

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
            <Printer size={16} /> Print / Save Receipt
          </button>
        </>
      }
    >
      <div
        className="thermal-receipt-paper receipt-paper"
        id="printable-receipt"
        style={{
          padding: '16px 14px 28px 14px',
          backgroundColor: '#ffffff',
          color: '#000000',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", Courier, monospace',
          fontSize: '11px',
          lineHeight: 1.32,
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '380px',
          margin: '0 auto',
        }}
      >
        {/* Top Logo & Organization Branding */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <img
            src="/logo.png"
            alt="Club Re Straddle Logo"
            style={{
              width: '42px',
              height: '42px',
              objectFit: 'contain',
              margin: '0 auto 4px',
              display: 'block',
            }}
          />
          <div style={{ fontSize: '14.5px', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.15, color: '#000000' }}>
            CLUB RE STRADDLE
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '2px', color: '#111827' }}>
            Poker Lounge & Entertainment
          </div>
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#374151', marginTop: '1px' }}>
            JB Complex, Sector 104, Noida, UP - 201304
          </div>
          <div style={{ fontSize: '8.5px', color: '#4b5563', marginTop: '1px' }}>
            Tel: +91 99589 49859 • clubrestraddle@gmail.com
          </div>
        </div>

        {/* Boxed Header */}
        <div
          style={{
            border: '1.5px solid #000000',
            padding: '3.5px 0',
            textAlign: 'center',
            fontWeight: 900,
            fontSize: '11.5px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: '7px 0 9px 0',
            color: '#000000',
          }}
        >
          TOURNAMENT ENTRY RECEIPT
        </div>

        {/* Metadata Grid */}
        <div style={{ marginBottom: '7px', fontSize: '10.5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>Receipt Ref:</span>
            <span style={{ fontWeight: 900, fontFamily: 'monospace' }}>{entry.receiptNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>Date & Time:</span>
            <span style={{ fontWeight: 700 }}>{formatDateTime(entry.registeredAt)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>Cashier:</span>
            <span style={{ fontWeight: 700 }}>{entry.cashierName}</span>
          </div>
        </div>

        {/* Member Details */}
        <div style={{ borderTop: '1px dashed #000000', paddingTop: '5px', marginBottom: '7px', fontSize: '10.5px' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 900, letterSpacing: '0.06em', marginBottom: '3px', textTransform: 'uppercase' }}>
            PLAYER DETAILS
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>Member ID:</span>
            <span style={{ fontWeight: 800, fontFamily: 'monospace' }}>{player ? formatPlayerNumber(player) : entry.playerId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>Player Name:</span>
            <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>{entry.playerName}</span>
          </div>
          {entry.playerPhone && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 600, color: '#374151' }}>Contact:</span>
              <span style={{ fontWeight: 700 }}>{entry.playerPhone}</span>
            </div>
          )}
        </div>

        {/* Tournament Box */}
        <div
          style={{
            border: '1px solid #000000',
            borderRadius: '2px',
            padding: '5px 7px',
            marginBottom: '7px',
            fontSize: '10px',
            textAlign: 'center',
            backgroundColor: '#fafafa',
          }}
        >
          <div style={{ fontSize: '8.5px', fontWeight: 900, textAlign: 'left', marginBottom: '2px', letterSpacing: '0.04em' }}>
            TOURNAMENT SEATING
          </div>
          <div style={{ fontWeight: 800, fontSize: '11px', color: '#000000' }}>
            {entry.tournamentName}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px', fontWeight: 700, color: '#111827' }}>
            <span>Table: <strong>{entry.tableNumber || 'Assigned on Call'}</strong></span>
            <span>Seat: <strong>{entry.seatNumber || 'Random Draw'}</strong></span>
          </div>
        </div>

        {/* Financials Breakdown */}
        <div style={{ borderTop: '1px dashed #000000', paddingTop: '5px', marginBottom: '7px', fontSize: '10.5px' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 900, letterSpacing: '0.06em', marginBottom: '3px' }}>
            CHARGES BREAKDOWN
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
            <span>Tournament Entry Fee:</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(entry.buyInAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
            <span>Club Service Charge:</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(entry.rakeAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
            <span>Payment Method:</span>
            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{entry.paymentMethod}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span>Txn Reference:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 700 }}>{entry.paymentReference}</span>
          </div>

          {/* Bold Total */}
          <div style={{ borderTop: '1.5px solid #000000', borderBottom: '1.5px solid #000000', marginTop: '5px', padding: '4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '12.5px', fontWeight: 900 }}>
            <span>TOTAL PAID:</span>
            <span style={{ fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}>{formatCurrency(totalPaid)}</span>
          </div>
        </div>

        {/* Verification Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', borderTop: '1px dashed #000000', paddingTop: '5px', marginBottom: '7px' }}>
          <span style={{ fontWeight: 600 }}>Desk Status:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#15803d', fontWeight: 800 }}>
            <CheckCircle size={12} color="#15803d" /> CONFIRMED & ISSUED
          </span>
        </div>

        {/* Instructions */}
        <div style={{ textAlign: 'center', fontSize: '8.5px', color: '#4b5563', borderTop: '1px solid #000000', paddingTop: '5px', marginBottom: '6px', lineHeight: 1.25 }}>
          Present this slip at tournament desk to claim stack. Play responsibly.
        </div>

        {/* Boxed Stamp */}
        <div
          style={{
            border: '1.5px solid #000000',
            padding: '3px 0',
            textAlign: 'center',
            fontWeight: 900,
            fontSize: '10.5px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          *** PLAYER ENTRY PASS ***
        </div>

        {/* Thermal Cutter Margin */}
        <div style={{ textAlign: 'center', fontSize: '8px', letterSpacing: '0.12em', color: '#6b7280', paddingTop: '4px' }}>
          *** THANK YOU • GOOD LUCK ***
        </div>
      </div>
    </Modal>
  );
};
