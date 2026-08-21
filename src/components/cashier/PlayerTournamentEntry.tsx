import React, { useState } from 'react';
import { DollarSign, Receipt, ArrowRight, ArrowLeft, Users, Trophy, CreditCard } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { PaymentMethod } from '../../types';
import { formatClubLabel, formatCurrency, generateId, formatDateOnly, formatTimeOnly } from '../../utils/formatters';
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

  const [step, setStep] = useState<1 | 2>(1);
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

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const totalFee = selectedTournament
    ? selectedTournament.buyInFee + selectedTournament.clubRake
    : 0;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournamentId || !selectedPlayerId) return;

    const ref = paymentRef.trim() || generateId('TXN');

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
      category: 'Tournament Entry & Service Charge',
      playerId: selectedPlayer?.id,
      playerName: entry.playerName,
      playerPhone: selectedPlayer?.phone,
      playerEmail: selectedPlayer?.email,
      govtIdType: selectedPlayer?.kyc.govtIdType,
      govtIdNumber: selectedPlayer?.kyc.govtIdNumber,
      membershipTier: selectedPlayer?.membershipTier,
      tableLocation: `${entry.tableNumber} • ${entry.seatNumber}`,
      eventName: `${formatClubLabel(entry.tournamentName)}`,
      eventDate: `Texas • ${formatDateOnly(entry.registeredAt)} • ${formatTimeOnly(entry.registeredAt)}`,
      eventDetails: `Texas • MTC • Table ${entry.tableNumber} • Seat ${entry.seatNumber}`,
      items: [
        {
          description: `${formatClubLabel(entry.tournamentName)} - Tournament Buy-in Stack`,
          details: `${selectedTournament?.startingChips?.toLocaleString()} Starting Chips`,
          chips: selectedTournament?.startingChips,
          amount: entry.buyInAmount,
        },
        {
          description: 'Club Service Charges & Tournament Organization',
          details: 'Club tournament organization & dealer service fee',
          amount: entry.rakeAmount,
        },
      ],
      subtotal: entry.buyInAmount,
      serviceCharge: entry.rakeAmount,
      totalAmount: entry.buyInAmount + entry.rakeAmount,
      paymentMethod: entry.paymentMethod,
      paymentReference: entry.paymentReference,
      cashierName: entry.cashierName || staffName,
    };

    setGeneratedInvoice(invoiceData);
    setIsInvoiceOpen(true);
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
    <div className="card wizard-container" style={{ maxWidth: '780px', margin: '0 auto' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <DollarSign size={18} color="#e11d48" />
            Tournament Player Registration & Billing Desk
          </h3>
          <p className="card-subtitle">
            Step {step} of 2 · {step === 1 ? 'Select Tournament & Member' : 'Seating & Payment Settlement'}
          </p>
        </div>
        {onDone && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onDone}>
            <ArrowLeft size={14} /> Back to Events
          </button>
        )}
      </div>

      {/* 2-Step Interactive Stepper */}
      <div className="wizard-step-tracker" role="navigation" aria-label="Tournament Entry Steps">
        <button
          type="button"
          className={`wizard-step-item ${step === 1 ? 'active' : 'complete'}`}
          onClick={() => setStep(1)}
        >
          <span className="wizard-step-badge">1</span>
          <div className="wizard-step-text">
            <span className="wizard-step-title">Event & Member</span>
            <span className="wizard-step-desc">Pick tournament & player</span>
          </div>
        </button>

        <div className={`wizard-step-connector ${step === 2 ? 'complete' : ''}`} aria-hidden="true" />

        <button
          type="button"
          className={`wizard-step-item ${step === 2 ? 'active' : ''}`}
          onClick={() => {
            if (selectedTournamentId && selectedPlayerId) setStep(2);
          }}
        >
          <span className="wizard-step-badge">2</span>
          <div className="wizard-step-text">
            <span className="wizard-step-title">Payment & Seating</span>
            <span className="wizard-step-desc">Method, table & invoice</span>
          </div>
        </button>
      </div>

      <form onSubmit={handleRegister}>
        {/* STEP 1: EVENT & PLAYER SELECTION */}
        {step === 1 && (
          <div style={{ marginTop: '16px' }}>
            {/* Tournament Selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="cashier-entry-tournament">Select Active Tournament *</label>
              <select
                id="cashier-entry-tournament"
                className="form-select"
                value={selectedTournamentId}
                onChange={e => setSelectedTournamentId(e.target.value)}
                required
              >
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>
                    {formatClubLabel(t.name)} — Buy-in: {formatCurrency(t.buyInFee)} + {formatCurrency(t.clubRake)} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Player Selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="cashier-entry-player">Select Registered Player *</label>
              <select
                id="cashier-entry-player"
                className="form-select"
                value={selectedPlayerId}
                onChange={e => setSelectedPlayerId(e.target.value)}
                required
              >
                {players.map(p => {
                  const checkedIn = hasPlayerCheckedInToday(p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id} • {p.phone}) {checkedIn ? '— Checked in today' : ''}
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
                  marginTop: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tournament Buy-in Fee:</span>
                  <span className="tabular-num">{formatCurrency(selectedTournament.buyInFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Club Service Charge:</span>
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
          </div>
        )}

        {/* STEP 2: PAYMENT & SEATING DETAILS */}
        {step === 2 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Event: </span>
                <strong style={{ color: '#ffffff' }}>{selectedTournament ? formatClubLabel(selectedTournament.name) : '—'}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Player: </span>
                <strong style={{ color: '#ffffff' }}>{selectedPlayer?.fullName || '—'}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Amount: </span>
                <strong style={{ color: 'var(--gold-light)' }}>{formatCurrency(totalFee)}</strong>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="cashier-entry-payment">Payment Mode Received *</label>
                <select
                  id="cashier-entry-payment"
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
                <label className="form-label" htmlFor="cashier-entry-reference">Settlement Reference / Notes</label>
                <input
                  id="cashier-entry-reference"
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
                <label className="form-label" htmlFor="cashier-entry-table">Assigned Table Number</label>
                <input
                  id="cashier-entry-table"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Table 1"
                  value={tableNum}
                  onChange={e => setTableNum(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cashier-entry-seat">Assigned Seat Number</label>
                <input
                  id="cashier-entry-seat"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Seat 4"
                  value={seatNum}
                  onChange={e => setSeatNum(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="wizard-nav-actions">
          <div>
            {step === 2 ? (
              <button
                type="button"
                className="wizard-prev-btn"
                onClick={() => setStep(1)}
              >
                <ArrowLeft size={16} /> Previous: Event Selection
              </button>
            ) : onDone ? (
              <button
                type="button"
                className="wizard-prev-btn"
                onClick={onDone}
              >
                Cancel
              </button>
            ) : null}
          </div>

          <div>
            {step === 1 ? (
              <button
                type="button"
                className="wizard-next-btn"
                onClick={() => {
                  if (selectedTournamentId && selectedPlayerId) setStep(2);
                }}
              >
                <span>Continue to Seating & Payment</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" className="wizard-next-btn">
                <Receipt size={18} />
                <span>Confirm Settlement & Issue Invoice</span>
              </button>
            )}
          </div>
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
