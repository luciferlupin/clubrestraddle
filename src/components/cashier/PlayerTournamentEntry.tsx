import React, { useState } from 'react';
import { UserCheck, DollarSign, Receipt, CreditCard, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { PaymentMethod, TournamentEntry } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import confetti from 'canvas-confetti';

interface PlayerTournamentEntryProps {
  initialTournamentId?: string;
  onDone?: () => void;
}

export const PlayerTournamentEntry: React.FC<PlayerTournamentEntryProps> = ({
  initialTournamentId,
  onDone,
}) => {
  const {
    tournaments,
    players,
    registerPlayerForTournament,
    hasPlayerCheckedInToday,
    staffName,
  } = useClub();

  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    initialTournamentId || tournaments[0]?.id || ''
  );
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [tableNum, setTableNum] = useState<string>('Table 1');
  const [seatNum, setSeatNum] = useState<string>('Seat 4');

  const [generatedInvoice, setGeneratedInvoice] = useState<ClubInvoiceData | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const totalFee = selectedTournament
    ? selectedTournament.buyInFee + selectedTournament.clubRake
    : 0;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentId || !selectedPlayerId) return;

    const ref = paymentRef.trim() || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;

    const entry = registerPlayerForTournament({
      tournamentId: selectedTournamentId,
      playerId: selectedPlayerId,
      paymentMethod,
      paymentReference: ref,
      tableNumber: tableNum,
      seatNumber: seatNum,
    });

    const invoiceData: ClubInvoiceData = {
      invoiceNumber: entry.receiptNumber,
      invoiceDate: entry.registeredAt,
      category: 'Tournament Entry & Rake',
      playerId: selectedPlayer?.id,
      playerName: entry.playerName,
      playerPhone: selectedPlayer?.phone,
      playerEmail: selectedPlayer?.email,
      govtIdType: selectedPlayer?.kyc.govtIdType,
      govtIdNumber: selectedPlayer?.kyc.govtIdNumber,
      membershipTier: selectedPlayer?.membershipTier,
      tableLocation: `${entry.tableNumber} • ${entry.seatNumber}`,
      items: [
        {
          description: `${entry.tournamentName} - Tournament Buy-in Stack`,
          details: `${selectedTournament?.startingChips?.toLocaleString()} Starting Chips`,
          chips: selectedTournament?.startingChips,
          amount: entry.buyInAmount,
        },
        {
          description: 'House Operating Rake & Registration Fee',
          details: 'Club tournament organization & dealer rake',
          amount: entry.rakeAmount,
        },
      ],
      subtotal: entry.buyInAmount,
      rakeOrFee: entry.rakeAmount,
      totalAmount: entry.buyInAmount + entry.rakeAmount,
      paymentMethod: entry.paymentMethod,
      paymentReference: entry.paymentReference,
      cashierName: entry.cashierName || staffName,
    };

    setGeneratedInvoice(invoiceData);
    setIsInvoiceOpen(true);
    setSuccessMsg(true);
    setPaymentRef('');

    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#f43f5e', '#be123c'],
      });
    } catch {
      // Fallback
    }

    if (onDone) onDone();
  };

  return (
    <div className="card" style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <DollarSign size={18} color="#e11d48" />
            Tournament Player Registration & Billing Desk
          </h3>
          <p className="card-subtitle">
            Collect tournament buy-in, record payment references, and generate billing vouchers.
          </p>
        </div>
      </div>

      <form onSubmit={handleRegister}>
        {/* Tournament Selection */}
        <div className="form-group">
          <label className="form-label">Select Active Tournament *</label>
          <select
            className="form-select"
            value={selectedTournamentId}
            onChange={e => setSelectedTournamentId(e.target.value)}
            required
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>
                🏆 {t.name} — Buy-in: {formatCurrency(t.buyInFee)} + {formatCurrency(t.clubRake)} ({t.status})
              </option>
            ))}
          </select>
        </div>

        {/* Player Selection */}
        <div className="form-group">
          <label className="form-label">Select Registered Player *</label>
          <select
            className="form-select"
            value={selectedPlayerId}
            onChange={e => setSelectedPlayerId(e.target.value)}
            required
          >
            {players.map(p => {
              const checkedIn = hasPlayerCheckedInToday(p.id);
              return (
                <option key={p.id} value={p.id}>
                  👤 {p.fullName} ({p.id} • {p.phone}) {checkedIn ? '✓ Checked-in Today' : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Pricing Summary Card */}
        {selectedTournament && (
          <div
            style={{
              background: '#110406',
              border: '1px solid rgba(139, 0, 0, 0.55)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tournament Buy-in Fee:</span>
              <span className="tabular-num">{formatCurrency(selectedTournament.buyInFee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>House Rake & Entry Fee:</span>
              <span className="tabular-num">{formatCurrency(selectedTournament.clubRake)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px dashed rgba(255,255,255,0.15)',
                paddingTop: '10px',
                marginTop: '10px',
                fontSize: '1.1rem',
                fontWeight: 800,
              }}
            >
              <span style={{ color: '#ffffff' }}>TOTAL BILLING DUE:</span>
              <span style={{ color: 'var(--gold-light)' }}>{formatCurrency(totalFee)}</span>
            </div>
          </div>
        )}

        {/* Payment & Seating Details */}
        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Payment Mode Received *</label>
            <select
              className="form-select"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              <option value="Cash">Cash at Counter</option>
              <option value="UPI/Digital">UPI / Club QR Scan</option>
              <option value="Bank Transfer">Bank Wire / IMPS</option>
              <option value="Credit/Debit Card">Credit / Debit Card POS</option>
              <option value="Chips">Club Chips Handover</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Settlement Reference / Notes</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cash Handover or UPI Ref #"
              value={paymentRef}
              onChange={e => setPaymentRef(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="form-label">Assigned Table Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Table 1"
              value={tableNum}
              onChange={e => setTableNum(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Seat Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Seat 4"
              value={seatNum}
              onChange={e => setSeatNum(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            <Receipt size={18} /> Confirm Physical Settlement & Generate Official Tax Invoice
          </button>
        </div>
      </form>

      {/* Official Tax & Billing Invoice Modal */}
      <ClubTaxInvoiceModal
        invoice={generatedInvoice}
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
      />
    </div>
  );
};
