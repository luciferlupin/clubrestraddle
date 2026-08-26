import React, { useState, useEffect } from 'react';
import { DollarSign, Receipt, ArrowRight, ArrowLeft, Users, Trophy, CreditCard, Info } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { PaymentMethod } from '../../types';
import { formatClubLabel, formatCurrency, generateId, formatDateOnly, formatTimeOnly, formatPlayerNumber } from '../../utils/formatters';
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
  const [quickPlayerId, setQuickPlayerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const [generatedInvoice, setGeneratedInvoice] = useState<ClubInvoiceData | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Keep tournament and player synchronized if data loads asynchronously
  useEffect(() => {
    if (initialTournamentId) {
      setSelectedTournamentId(initialTournamentId);
    } else if (!selectedTournamentId && tournaments.length > 0) {
      setSelectedTournamentId(tournaments[0].id);
    }
  }, [initialTournamentId, tournaments, selectedTournamentId]);

  useEffect(() => {
    if (!selectedPlayerId && players.length > 0) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId) || tournaments[0];
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || players[0];

  const effectiveTournamentId = selectedTournament?.id || selectedTournamentId;
  const effectivePlayerId = selectedPlayer?.id || selectedPlayerId;

  const totalFee = selectedTournament
    ? selectedTournament.buyInFee + selectedTournament.clubRake
    : 0;

  const handleContinueToPayment = (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    const tournamentIdToUse = effectiveTournamentId;
    const playerIdToUse = effectivePlayerId;

    if (!tournamentIdToUse) {
      setFormError('Please select a tournament to proceed.');
      return;
    }
    if (!playerIdToUse) {
      setFormError('Please select a registered player to proceed.');
      return;
    }

    if (!selectedTournamentId) setSelectedTournamentId(tournamentIdToUse);
    if (!selectedPlayerId) setSelectedPlayerId(playerIdToUse);

    setStep(2);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // If currently on step 1, advance to step 2 instead of registering immediately
    if (step === 1) {
      handleContinueToPayment(e);
      return;
    }

    const tournamentIdToUse = effectiveTournamentId;
    const playerIdToUse = effectivePlayerId;

    if (!tournamentIdToUse || !playerIdToUse) {
      setFormError('Missing tournament or player selection.');
      return;
    }

    const ref = paymentRef.trim() || generateId('TXN');

    const entry = registerPlayerForTournament({
      tournamentId: tournamentIdToUse,
      playerId: playerIdToUse,
      paymentMethod,
      paymentReference: ref,
    });

    const invoiceData: ClubInvoiceData = {
      invoiceNumber: entry.receiptNumber,
      invoiceDate: entry.registeredAt,
      category: 'Tournament Entry & Service Charge',
      playerId: selectedPlayer ? formatPlayerNumber(selectedPlayer) : undefined,
      playerName: entry.playerName,
      playerPhone: selectedPlayer?.phone,
      playerEmail: selectedPlayer?.email,
      govtIdType: selectedPlayer?.kyc.govtIdType,
      govtIdNumber: selectedPlayer?.kyc.govtIdNumber,
      membershipTier: selectedPlayer?.membershipTier,
      tableLocation: 'Tournament entry',
      eventName: `${formatClubLabel(entry.tournamentName)}`,
      eventDate: `Texas • ${formatDateOnly(entry.registeredAt)} • ${formatTimeOnly(entry.registeredAt)}`,
      eventDetails: 'Tournament registration and payment confirmation',
      items: [
        {
          description: `${formatClubLabel(entry.tournamentName)} - Tournament Entry Charge`,
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
            Step {step} of 2 · {step === 1 ? 'Select Tournament & Member' : 'Payment Settlement'}
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
          onClick={() => {
            setFormError(null);
            setStep(1);
          }}
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
          onClick={handleContinueToPayment}
        >
          <span className="wizard-step-badge">2</span>
          <div className="wizard-step-text">
            <span className="wizard-step-title">Payment</span>
            <span className="wizard-step-desc">Method, reference & invoice</span>
          </div>
        </button>
      </div>

      {formError && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '10px 14px',
            borderRadius: '8px',
            marginTop: '12px',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          role="alert"
        >
          <Info size={16} />
          <span>{formError}</span>
        </div>
      )}

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
                value={effectiveTournamentId}
                onChange={e => setSelectedTournamentId(e.target.value)}
                required
              >
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>
                    {formatClubLabel(t.name)} — Entry Charge: {formatCurrency(t.buyInFee)} + Service Charge: {formatCurrency(t.clubRake)} ({t.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cashier-entry-player-id">Quick Player ID</label>
              <input
                id="cashier-entry-player-id"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="form-input"
                placeholder="Type Player ID, e.g. 7"
                value={quickPlayerId}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '');
                  setQuickPlayerId(value);
                  const match = players.find(player => formatPlayerNumber(player) === value);
                  if (match) setSelectedPlayerId(match.id);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleContinueToPayment();
                  }
                }}
              />
              {quickPlayerId && (
                <small style={{ color: players.some(player => formatPlayerNumber(player) === quickPlayerId) ? '#86efac' : '#fca5a5' }}>
                  {players.find(player => formatPlayerNumber(player) === quickPlayerId)?.fullName || 'No player found with this ID'}
                </small>
              )}
            </div>

            {/* Player Selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="cashier-entry-player">Select Registered Player *</label>
              <select
                id="cashier-entry-player"
                className="form-select"
                value={effectivePlayerId}
                onChange={e => {
                  const playerId = e.target.value;
                  const player = players.find(candidate => candidate.id === playerId);
                  setSelectedPlayerId(playerId);
                  setQuickPlayerId(player ? formatPlayerNumber(player) : '');
                }}
                required
              >
                {players.map(p => {
                  const checkedIn = hasPlayerCheckedInToday(p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (Player ID {formatPlayerNumber(p)} • {p.phone}) {checkedIn ? '— Checked in today' : ''}
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
                  <span style={{ color: 'var(--text-muted)' }}>Tournament Entry Charge:</span>
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
          </div>
        )}

        {/* Wizard Controls */}
        <div className="wizard-nav-actions">
          <div>
            {step === 2 ? (
              <button
                type="button"
                className="wizard-prev-btn"
                onClick={() => {
                  setFormError(null);
                  setStep(1);
                }}
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
                onClick={handleContinueToPayment}
              >
                <span>Continue to Payment</span>
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
        onClose={() => {
          setIsInvoiceOpen(false);
          if (onDone) onDone();
        }}
      />
    </div>
  );
};

