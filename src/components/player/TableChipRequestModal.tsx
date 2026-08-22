import React, { useState } from 'react';
import {
  Coins,
  X,
  CreditCard,
  CheckCircle2,
  Clock,
  Info,
  Smartphone,
  Banknote,
  Building,
  ArrowLeft,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { PaymentMethod } from '../../types';
import { formatINR, formatTimeOnly } from '../../utils/formatters';
import confetti from 'canvas-confetti';

interface TableChipRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TableChipRequestModal: React.FC<TableChipRequestModalProps> = ({ isOpen, onClose }) => {
  const { currentPlayer, requestBuyChips, chipRequests } = useClub();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedAmount, setSelectedAmount] = useState<number>(25000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [tableNumber, setTableNumber] = useState('Table 1 (Main Lounge)');
  const [seatNumber, setSeatNumber] = useState('Seat 1');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI/Digital');
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen || !currentPlayer) return null;

  const quickAmounts = [5000, 10000, 25000, 50000, 100000];

  const finalAmount = isCustom ? Number(customAmount) : selectedAmount;

  // Active requests for this specific player
  const playerActiveOrders = chipRequests.filter(
    r => r.playerId === currentPlayer.id && (r.status === 'pending' || r.status === 'delivered')
  ).slice(0, 5);

  const handleNextFromStep1 = () => {
    setFormError(null);
    if (!finalAmount || finalAmount <= 0) {
      setFormError('Please select or enter a valid chip amount.');
      return;
    }
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setFormError(null);
    setStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!finalAmount || finalAmount <= 0) {
      setFormError('Select a chip amount or enter a custom amount greater than ₹0.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const newOrder = requestBuyChips({
        playerId: currentPlayer.id,
        amount: finalAmount,
        tableNumber,
        seatNumber,
        paymentMethod,
        notes: `Table chip request for ${currentPlayer.fullName}`,
      });

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#ffffff', '#f43f5e', '#be123c'],
        });
      } catch {
        // Fallback
      }

      setSubmitting(false);
      setSuccessOrder(newOrder);
    }, 300);
  };

  return (
    <div
      className="player-chip-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="card player-chip-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chip-request-title"
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1.5px solid #e11d48',
          background: 'linear-gradient(160deg, #15060b 0%, #090305 100%)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(225, 29, 72, 0.25)',
          padding: '24px',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(225, 29, 72, 0.2)',
                border: '1px solid var(--border-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Coins size={22} />
            </div>
            <div>
              <h3 id="chip-request-title" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Request Chips at Table
              </h3>
              <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: 0 }}>
                Step {step} of 3 · Real-time cashier table dispatch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close chip request"
            style={{ color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        {!successOrder && (
          <div className="wizard-step-tracker" style={{ marginBottom: '16px', padding: '8px 12px' }}>
            <button
              type="button"
              className={`wizard-step-item ${step === 1 ? 'active' : 'complete'}`}
              onClick={() => setStep(1)}
            >
              <span className="wizard-step-badge">1</span>
              <span className="wizard-step-title">Amount</span>
            </button>
            <div className={`wizard-step-connector ${step > 1 ? 'complete' : ''}`} />
            <button
              type="button"
              className={`wizard-step-item ${step === 2 ? 'active' : step > 2 ? 'complete' : ''}`}
              onClick={() => { if (finalAmount > 0) setStep(2); }}
            >
              <span className="wizard-step-badge">2</span>
              <span className="wizard-step-title">Table/Seat</span>
            </button>
            <div className={`wizard-step-connector ${step > 2 ? 'complete' : ''}`} />
            <button
              type="button"
              className={`wizard-step-item ${step === 3 ? 'active' : ''}`}
              onClick={() => { if (finalAmount > 0) setStep(3); }}
            >
              <span className="wizard-step-badge">3</span>
              <span className="wizard-step-title">Payment & Submit</span>
            </button>
          </div>
        )}

        {successOrder ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid #10b981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                marginBottom: '14px',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>
              Chip Order Dispatched to Cashier!
            </h4>
            <p style={{ fontSize: '0.84rem', color: '#cbd5e1', marginBottom: '18px' }}>
              Your order for <strong>₹{formatINR(successOrder.amount)} ({formatINR(successOrder.chipsQuantity)} chips)</strong> has been sent to the cashier desk.
            </p>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(225, 29, 72, 0.3)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'left',
                marginBottom: '20px',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Order ID:</span>
                <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{successOrder.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Delivery Location:</span>
                <strong style={{ color: '#ffffff' }}>{successOrder.tableNumber}, {successOrder.seatNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Payment Method:</span>
                <strong style={{ color: '#ffffff' }}>{successOrder.paymentMethod}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Status:</span>
                <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                  <span className="badge-dot" /> Pending Cashier Delivery
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setSuccessOrder(null);
                  setStep(1);
                }}
              >
                Order More Chips
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form className="player-chip-request-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {formError && (
              <div className="staff-inline-error" role="alert">
                <Info size={16} aria-hidden="true" /> {formError}
              </div>
            )}

            {/* Player Info Pill */}
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
              }}
            >
              <div>
                <span style={{ color: '#94a3b8' }}>Member: </span>
                <strong style={{ color: '#ffffff' }}>{currentPlayer.fullName}</strong>
              </div>
              <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                {currentPlayer.membershipTier} Tier
              </span>
            </div>

            {/* STEP 1: CHIP AMOUNT SELECTION */}
            {step === 1 && (
              <div>
                <label className="form-label" htmlFor="chip-custom-amount" style={{ fontSize: '0.86rem', marginBottom: '10px', color: '#ffffff', fontWeight: 700 }}>
                  1. Select Chip Order Amount (₹)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '8px' }}>
                  {quickAmounts.map(amt => (
                    <button
                      key={amt}
                      type="button"
                      className={`btn ${!isCustom && selectedAmount === amt ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 800 }}
                      onClick={() => {
                        setSelectedAmount(amt);
                        setIsCustom(false);
                      }}
                    >
                      ₹{formatINR(amt)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`btn ${isCustom ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '12px 8px', fontSize: '0.84rem', fontWeight: 700 }}
                    onClick={() => setIsCustom(true)}
                  >
                    Custom Amount
                  </button>
                </div>

                {isCustom && (
                  <div style={{ marginTop: '10px' }}>
                    <input
                      id="chip-custom-amount"
                      type="number"
                      className="form-input"
                      placeholder="Enter amount in ₹ (e.g. 75000)"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: TABLE & SEAT LOCATION */}
            {step === 2 && (
              <div>
                <label className="form-label" style={{ fontSize: '0.86rem', marginBottom: '10px', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="#e11d48" /> 2. Table & Seat Position
                </label>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label" htmlFor="chip-table-number">Table Location *</label>
                    <select
                      id="chip-table-number"
                      className="form-input"
                      value={tableNumber}
                      onChange={e => setTableNumber(e.target.value)}
                    >
                      <option value="Table 1 (Main Lounge)">Table 1 (Main Lounge)</option>
                      <option value="Table 2 (Executive Lounge)">Table 2 (Executive Lounge)</option>
                      <option value="Table 3 (VIP Area)">Table 3 (VIP Area)</option>
                      <option value="Table 4 (Private Suite)">Table 4 (Private Suite)</option>
                      <option value="Table 5 (General Seating)">Table 5 (General Seating)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="chip-seat-number">Seat Number *</label>
                    <select
                      id="chip-seat-number"
                      className="form-input"
                      value={seatNumber}
                      onChange={e => setSeatNumber(e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(seat => (
                        <option key={seat} value={`Seat ${seat}`}>
                          Seat {seat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT & REVIEW */}
            {step === 3 && (
              <div>
                <div
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(225, 29, 72, 0.3)',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '14px',
                    fontSize: '0.84rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <span style={{ color: '#94a3b8' }}>Chips Amount: </span>
                    <strong style={{ color: '#ffffff' }}>₹{formatINR(finalAmount)}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Destination: </span>
                    <strong style={{ color: '#ffffff' }}>{tableNumber}, {seatNumber}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <div className="form-label" id="chip-payment-label" style={{ fontWeight: 700, color: '#ffffff' }}>
                    Mark Settlement Method *
                  </div>
                  <div
                    className="player-settlement-note"
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(225, 29, 72, 0.25)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.74rem',
                      color: '#cbd5e1',
                      marginBottom: '10px',
                    }}
                  >
                    <Info size={16} aria-hidden="true" />
                    <span>Pay cashier or floor runner directly at table upon delivery.</span>
                  </div>

                  <div role="group" aria-labelledby="chip-payment-label" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {[
                      { mode: 'Cash' as PaymentMethod, label: 'Cash at Table / Counter', icon: <Banknote size={16} /> },
                      { mode: 'UPI/Digital' as PaymentMethod, label: 'UPI / Club QR Scan', icon: <Smartphone size={16} /> },
                      { mode: 'Bank Transfer' as PaymentMethod, label: 'Bank IMPS / NEFT', icon: <Building size={16} /> },
                      { mode: 'Credit/Debit Card' as PaymentMethod, label: 'Club POS Card Machine', icon: <CreditCard size={16} /> },
                    ].map(item => (
                      <button
                        key={item.mode}
                        type="button"
                        className={`btn ${paymentMethod === item.mode ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '8px 10px', fontSize: '0.78rem', justifyContent: 'flex-start', gap: '8px' }}
                        onClick={() => setPaymentMethod(item.mode)}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Actions */}
            <div className="wizard-nav-actions">
              <div>
                {step > 1 ? (
                  <button
                    type="button"
                    className="wizard-prev-btn"
                    onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                  >
                    <ArrowLeft size={16} /> Previous Step
                  </button>
                ) : (
                  <button
                    type="button"
                    className="wizard-prev-btn"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div>
                {step === 1 ? (
                  <button
                    type="button"
                    className="wizard-next-btn"
                    onClick={handleNextFromStep1}
                  >
                    <span>Next: Table & Seat</span>
                    <ArrowRight size={16} />
                  </button>
                ) : step === 2 ? (
                  <button
                    type="button"
                    className="wizard-next-btn"
                    onClick={handleNextFromStep2}
                  >
                    <span>Next: Payment & Review</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="wizard-next-btn"
                    disabled={submitting}
                  >
                    <Coins size={18} />
                    <span>{submitting ? 'Dispatching...' : `Submit Order (₹${formatINR(finalAmount)})`}</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* Player's Active Orders Section */}
        {playerActiveOrders.length > 0 && !successOrder && (
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} color="#e11d48" /> Your Recent Table Chip Orders
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {playerActiveOrders.map(order => (
                <div
                  key={order.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: order.status === 'pending' ? '1px solid #e11d48' : '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>
                      ₹{formatINR(order.amount)} • {order.tableNumber}, {order.seatNumber}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {formatTimeOnly(order.requestedAt)} • {order.paymentMethod}
                    </div>
                  </div>
                  <div>
                    {order.status === 'pending' && (
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                        <span className="badge-dot" /> Dispatching...
                      </span>
                    )}
                    {order.status === 'delivered' && (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                        <CheckCircle2 size={10} /> Delivered
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
