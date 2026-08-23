import React, { useState } from 'react';
import {
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Building2,
  Receipt,
  CheckCircle2,
  Clock,
  History,
  FileText,
  Wallet,
  Smartphone
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { PaymentMethod, GateCashTransfer } from '../../types';
import { formatCurrency, formatShortDateTime, formatTimeOnly } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import confetti from 'canvas-confetti';

interface GateCashHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GateCashHandoverModal: React.FC<GateCashHandoverModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    staffName,
    currentStaffUser,
    staffUsers,
    todayApprovedDoorCount,
    todayGateCollected,
    todayGateCashCollected,
    todayGateUpiCollected,
    todayGateBankCollected,
    todayGateTransfers,
    todayGateTransferredAmount,
    todayGateCashInHand,
    transferGateCashToCashier,
  } = useClub();

  const [tab, setTab] = useState<'transfer' | 'history'>('transfer');
  const [amount, setAmount] = useState<number>(todayGateCashInHand > 0 ? todayGateCashInHand : 1000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [receivedBy, setReceivedBy] = useState<string>(() => {
    const cashier = staffUsers.find(s => s.role === 'cashier' && s.status === 'active');
    return cashier ? cashier.fullName : 'Main Inside Cashier';
  });
  const [notes, setNotes] = useState<string>('');
  const [lastTransfer, setLastTransfer] = useState<GateCashTransfer | null>(null);

  const cashierStaffList = staffUsers.filter(s => s.role === 'cashier' || s.role === 'admin');

  const handlePreset = (val: number) => {
    setAmount(val);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    const result = transferGateCashToCashier({
      amount: Number(amount),
      receivedByCashier: receivedBy || 'Inside Cashier',
      paymentMethod,
      notes,
    });

    setLastTransfer(result);
    setNotes('');

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#fbbf24', '#ffffff', '#e11d48'],
      });
    } catch {}
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setLastTransfer(null);
        onClose();
      }}
      title="Gate Cash Collection & Handover"
      subtitle="Transfer physical cash collected at Entrance Gate to Inside Cashier Desk"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Navigation Tabs (Transfer vs Handover History) */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
          <button
            type="button"
            className={`btn btn-sm ${tab === 'transfer' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('transfer')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <DollarSign size={15} />
            <span>Handover Cash</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm ${tab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab('history')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
          >
            <History size={15} />
            <span>Transfer History ({todayGateTransfers.length})</span>
          </button>
        </div>

        {/* Informational Callout: UPI & Bank are common/centralized directly to club bank */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '0.76rem',
            color: '#cbd5e1',
            lineHeight: 1.45,
          }}
        >
          <strong style={{ color: '#38bdf8' }}>💡 Central Treasury Architecture:</strong> UPI and Bank transfers received anywhere (at the gate or inside desk) are credited directly to the club's common bank account. Only <strong>Physical Cash</strong> collected at the gate requires a handover drop to the inside cashier.
        </div>

        {/* Live Gate Till Overview (Channel Breakdown) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '12px', padding: '10px 12px' }}>
            <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>💵 Physical Cash</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {formatCurrency(todayGateCashCollected)}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Collected at Door
            </div>
          </div>

          <div style={{ background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '12px', padding: '10px 12px' }}>
            <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>📱 UPI / Bank (Common)</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
              {formatCurrency(todayGateUpiCollected + todayGateBankCollected)}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Direct in Club Bank
            </div>
          </div>

          <div style={{ background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.35)', borderRadius: '12px', padding: '10px 12px' }}>
            <span style={{ fontSize: '0.68rem', color: '#c084fc', fontWeight: 700, textTransform: 'uppercase' }}>🚚 Handed Over</span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c084fc', marginTop: '2px' }}>
              {formatCurrency(todayGateTransferredAmount)}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {todayGateTransfers.length} Transferred Today
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25) 0%, rgba(15, 10, 4, 0.85) 100%)', border: '1.5px solid #fbbf24', borderRadius: '12px', padding: '10px 12px' }}>
            <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase' }}>Till Cash In Hand</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-light)', marginTop: '2px' }}>
              {formatCurrency(todayGateCashInHand)}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#fbbf24' }}>
              Physical Cash in Drawer
            </div>
          </div>
        </div>

        {tab === 'transfer' && (
          <>
            {lastTransfer && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1.5px solid #34d399', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 800, fontSize: '0.9rem' }}>
                  <CheckCircle2 size={18} />
                  <span>Transfer Successful & Deposited into Inside Cashier!</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#ffffff' }}>
                  Amount: <strong>{formatCurrency(lastTransfer.amount)}</strong> ({lastTransfer.paymentMethod}) · Handed Over to <strong>{lastTransfer.receivedBy}</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                  Receipt #{lastTransfer.receiptNumber} · {formatShortDateTime(lastTransfer.timestamp)}
                </div>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Handover Flow Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="#fda4af" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FROM (Gate / Security)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>{staffName}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: '#fbbf24', padding: '0 8px' }}>
                  <ArrowRight size={18} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TO (Inside Cashier)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>{receivedBy || 'Inside Cashier'}</div>
                  </div>
                  <Building2 size={18} color="#38bdf8" />
                </div>
              </div>

              {/* Amount Input & Presets */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Transfer Amount (₹)</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gold-light)', fontWeight: 600 }}>
                    Till In Hand: {formatCurrency(todayGateCashInHand)}
                  </span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#fbbf24', fontSize: '1.1rem' }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    style={{ paddingLeft: '28px', fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}
                    placeholder="Enter handover amount"
                    value={amount || ''}
                    onChange={e => setAmount(Number(e.target.value))}
                    required
                  />
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {[1000, 2500, 5000, 10000].map(val => (
                    <button
                      key={val}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '3px 8px', borderRadius: '6px' }}
                      onClick={() => handlePreset(val)}
                    >
                      +{formatCurrency(val)}
                    </button>
                  ))}
                  {todayGateCashInHand > 0 && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '3px 10px', borderRadius: '6px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderColor: '#fbbf24', color: '#000000', fontWeight: 800 }}
                      onClick={() => handlePreset(todayGateCashInHand)}
                    >
                      All in Hand ({formatCurrency(todayGateCashInHand)})
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Payment Channel */}
                <div className="form-group">
                  <label className="form-label">Payment Channel</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="Cash">💵 Physical Cash</option>
                    <option value="UPI/Digital">📱 UPI / QR Digital</option>
                    <option value="Bank Transfer">🏦 Bank Wire</option>
                  </select>
                </div>

                {/* Receiving Cashier Picker */}
                <div className="form-group">
                  <label className="form-label">Receiving Inside Cashier</label>
                  <select
                    className="form-select"
                    value={receivedBy}
                    onChange={e => setReceivedBy(e.target.value)}
                    required
                  >
                    <option value="Inside Cashier Desk">Inside Cashier Desk</option>
                    {cashierStaffList.map(s => (
                      <option key={s.id} value={s.fullName}>
                        {s.fullName} ({s.role.toUpperCase()})
                      </option>
                    ))}
                    <option value="Floor Manager">Floor Manager</option>
                    <option value="Main Treasury Vault">Main Treasury Vault</option>
                  </select>
                </div>
              </div>

              {/* Handover Note */}
              <div className="form-group">
                <label className="form-label">Handover Note / Shift Ref (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 6 PM shift gate cash drop to cashier"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ height: '46px', fontSize: '0.95rem', fontWeight: 800, marginTop: '6px' }}
                disabled={!amount || amount <= 0}
              >
                <CheckCircle2 size={18} />
                <span>Confirm & Transfer {formatCurrency(amount || 0)} to Cashier</span>
              </button>
            </form>
          </>
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
            {todayGateTransfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '10px' }}>
                No cash handovers recorded in the current session yet.
              </div>
            ) : (
              todayGateTransfers.map(trf => (
                <div
                  key={trf.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.84rem', color: 'var(--gold-light)' }}>
                        {trf.receiptNumber}
                      </span>
                      <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                        {trf.paymentMethod}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                      +{formatCurrency(trf.amount)}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                    Officer: <strong>{trf.handedOverBy}</strong> → Received by: <strong>{trf.receivedBy}</strong>
                  </div>

                  {trf.notes && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Note: {trf.notes}
                    </div>
                  )}

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {formatShortDateTime(trf.timestamp)} · Session: {trf.transferDate}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
