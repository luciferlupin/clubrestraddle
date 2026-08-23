import React, { useState } from 'react';
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Plus,
  Minus,
  Smartphone,
  Landmark,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { CashCategory, PaymentMethod } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { CashFlowBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const CashManagement: React.FC = () => {
  const {
    cashTransactions,
    physicalCashBalance,
    upiBalance,
    bankBalance,
    cardBalance,
    totalLiquidityBalance,
    physicalCashIn,
    physicalCashOut,
    physicalCashExpenses,
    upiIn,
    upiOut,
    upiExpenses,
    bankIn,
    bankOut,
    bankExpenses,
    totalCashInAmount,
    totalCashOutAmount,
    addCashReceived,
    addCashGiven,
  } = useClub();

  const [isCashInModalOpen, setIsCashInModalOpen] = useState(false);
  const [isCashOutModalOpen, setIsCashOutModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'all' | PaymentMethod>('all');

  // Form State for Cash In
  const [cashInData, setCashInData] = useState({
    category: 'Tournament Buy-in' as CashCategory,
    amount: 1000,
    description: '',
    paymentMethod: 'Cash' as PaymentMethod,
    playerName: '',
    referenceId: '',
  });

  // Form State for Cash Out
  const [cashOutData, setCashOutData] = useState({
    category: 'Tournament Prize Payout' as CashCategory,
    amount: 500,
    description: '',
    paymentMethod: 'Cash' as PaymentMethod,
    playerName: '',
    referenceId: '',
  });

  const handleCashInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashInData.amount || cashInData.amount <= 0) return;

    addCashReceived({
      category: cashInData.category,
      amount: Number(cashInData.amount),
      description: cashInData.description || `Cash In: ${cashInData.category}`,
      paymentMethod: cashInData.paymentMethod,
      playerName: cashInData.playerName,
      referenceId: cashInData.referenceId,
    });

    setIsCashInModalOpen(false);
    setCashInData({
      category: 'Tournament Buy-in',
      amount: 1000,
      description: '',
      paymentMethod: 'Cash',
      playerName: '',
      referenceId: '',
    });
  };

  const handleCashOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashOutData.amount || cashOutData.amount <= 0) return;

    addCashGiven({
      category: cashOutData.category,
      amount: Number(cashOutData.amount),
      description: cashOutData.description || `Cash Out: ${cashOutData.category}`,
      paymentMethod: cashOutData.paymentMethod,
      playerName: cashOutData.playerName,
      referenceId: cashOutData.referenceId,
    });

    setIsCashOutModalOpen(false);
    setCashOutData({
      category: 'Tournament Prize Payout',
      amount: 500,
      description: '',
      paymentMethod: 'Cash',
      playerName: '',
      referenceId: '',
    });
  };

  const filteredTransactions = cashTransactions.filter(t => {
    if (filterType === 'in' && t.type !== 'in') return false;
    if (filterType === 'out' && t.type !== 'out') return false;
    if (filterPaymentMethod !== 'all' && t.paymentMethod !== filterPaymentMethod) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Separated Balances Bar */}
      <div className="stats-grid" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* 1. Physical Cash in Hand */}
        <div
          className="stat-card"
          style={{ '--stat-glow': 'rgba(245, 158, 11, 0.15)', '--stat-color': '#fbbf24', border: '1.5px solid rgba(245, 158, 11, 0.4)' } as React.CSSProperties}
        >
          <div className="stat-info">
            <span className="stat-label">💵 Physical Cash in Hand</span>
            <span className="stat-value" style={{ color: 'var(--gold-light)' }}>
              {formatCurrency(physicalCashBalance)}
            </span>
            <span className="stat-helper">+{formatCurrency(physicalCashIn)} in / -{formatCurrency(physicalCashOut + physicalCashExpenses)} out</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Wallet size={22} />
          </div>
        </div>

        {/* 2. UPI / Digital Payments */}
        <div
          className="stat-card"
          style={{ '--stat-glow': 'rgba(56, 189, 248, 0.15)', '--stat-color': '#38bdf8', border: '1.5px solid rgba(56, 189, 248, 0.4)' } as React.CSSProperties}
        >
          <div className="stat-info">
            <span className="stat-label">📱 UPI / QR Payments</span>
            <span className="stat-value" style={{ color: '#38bdf8' }}>
              {formatCurrency(upiBalance)}
            </span>
            <span className="stat-helper">+{formatCurrency(upiIn)} in / -{formatCurrency(upiOut + upiExpenses)} out</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Smartphone size={22} />
          </div>
        </div>

        {/* 3. Direct Bank Wire */}
        <div
          className="stat-card"
          style={{ '--stat-glow': 'rgba(168, 85, 247, 0.15)', '--stat-color': '#c084fc', border: '1.5px solid rgba(168, 85, 247, 0.4)' } as React.CSSProperties}
        >
          <div className="stat-info">
            <span className="stat-label">🏦 Direct Bank Wire</span>
            <span className="stat-value" style={{ color: '#c084fc' }}>
              {formatCurrency(bankBalance)}
            </span>
            <span className="stat-helper">+{formatCurrency(bankIn)} in / -{formatCurrency(bankOut + bankExpenses)} out</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
            <Landmark size={22} />
          </div>
        </div>

        {/* 4. Combined Treasury */}
        <div
          className="stat-card"
          style={{ '--stat-glow': 'rgba(16, 185, 129, 0.15)', '--stat-color': '#34d399', border: '1.5px solid rgba(16, 185, 129, 0.4)' } as React.CSSProperties}
        >
          <div className="stat-info">
            <span className="stat-label">💎 Total Liquid Treasury</span>
            <span className="stat-value" style={{ color: '#34d399' }}>
              {formatCurrency(totalLiquidityBalance)}
            </span>
            <span className="stat-helper">Gross Receipts: {formatCurrency(totalCashInAmount)}</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Cash In & Out Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button className="btn btn-emerald" onClick={() => setIsCashInModalOpen(true)}>
          <Plus size={16} /> + Record Cash Received (Cash In)
        </button>

        <button className="btn btn-danger" onClick={() => setIsCashOutModalOpen(true)}>
          <Minus size={16} /> - Record Cash Given (Cash Out / Payout)
        </button>
      </div>

      {/* Cash Flow Ledger Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="card-title">
              <DollarSign size={18} color="#e11d48" />
              Cashier Cash Flow Ledger
            </h3>
            <p className="card-subtitle">
              Live audit trail of all money coming into and going out with channel separation.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterType('all')}
            >
              All Records ({cashTransactions.length})
            </button>
            <button
              className={`btn btn-sm ${filterType === 'in' ? 'btn-emerald' : 'btn-secondary'}`}
              onClick={() => setFilterType('in')}
            >
              Cash In
            </button>
            <button
              className={`btn btn-sm ${filterType === 'out' ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setFilterType('out')}
            >
              Cash Out
            </button>
          </div>
        </div>

        {/* Channel Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', background: 'rgba(0, 0, 0, 0.35)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Channel:</span>
          <button
            type="button"
            className={`btn btn-sm ${filterPaymentMethod === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterPaymentMethod('all')}
            style={{ fontSize: '0.74rem', padding: '3px 8px' }}
          >
            All Channels ({formatCurrency(totalLiquidityBalance)})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterPaymentMethod === 'Cash' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterPaymentMethod('Cash')}
            style={{ fontSize: '0.74rem', padding: '3px 8px', color: filterPaymentMethod === 'Cash' ? undefined : '#fbbf24' }}
          >
            💵 Cash ({formatCurrency(physicalCashBalance)})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterPaymentMethod === 'UPI/Digital' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterPaymentMethod('UPI/Digital')}
            style={{ fontSize: '0.74rem', padding: '3px 8px', color: filterPaymentMethod === 'UPI/Digital' ? undefined : '#38bdf8' }}
          >
            📱 UPI ({formatCurrency(upiBalance)})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filterPaymentMethod === 'Bank Transfer' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterPaymentMethod('Bank Transfer')}
            style={{ fontSize: '0.74rem', padding: '3px 8px', color: filterPaymentMethod === 'Bank Transfer' ? undefined : '#c084fc' }}
          >
            🏦 Bank ({formatCurrency(bankBalance)})
          </button>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Flow Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Player / Reference</th>
                <th>Balance After</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(txn => (
                <tr key={txn.id}>
                  <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                    {txn.id}
                  </td>
                  <td>
                    <CashFlowBadge type={txn.type} />
                  </td>
                  <td style={{ fontWeight: 600 }}>{txn.category}</td>
                  <td style={{ maxWidth: '240px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {txn.description}
                  </td>
                  <td
                    className="tabular-num"
                    style={{
                      fontWeight: 800,
                      color: txn.type === 'in' ? '#ffffff' : '#fca5a5',
                    }}
                  >
                    {txn.type === 'in' ? '+' : '-'}
                    {formatCurrency(txn.amount)}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{txn.paymentMethod}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {txn.playerName ? (
                      <span style={{ fontWeight: 600 }}>{txn.playerName}</span>
                    ) : txn.referenceId ? (
                      <span className="tabular-num" style={{ color: 'var(--text-dim)' }}>
                        {txn.referenceId}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>—</span>
                    )}
                  </td>
                  <td className="tabular-num" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {formatCurrency(txn.balanceAfter)}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {formatDateTime(txn.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash In Modal */}
      <Modal
        isOpen={isCashInModalOpen}
        onClose={() => setIsCashInModalOpen(false)}
        title="Add Cash Received (Cash In)"
        subtitle="Record money coming into the cashier vault / drawer"
        size="md"
      >
        <form onSubmit={handleCashInSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="cash-in-category">Category *</label>
            <select
              id="cash-in-category"
              className="form-select"
              value={cashInData.category}
              onChange={e => setFormDataCategory(e.target.value as CashCategory)}
            >
              <option value="Tournament Buy-in">Tournament Entry Charge</option>
              <option value="Cash Game Buy-in">Cash Game Entry Charge</option>
              <option value="Chip Purchase">Chip Purchase</option>
              <option value="Float Deposit">Vault Float Opening / Deposit</option>
              <option value="Table Rake">Table Service Charge Collection</option>
              <option value="Membership Fee">Membership Fee</option>
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cash-in-amount">Amount Received (₹) *</label>
              <input
                id="cash-in-amount"
                type="number"
                className="form-input"
                value={cashInData.amount}
                onChange={e => setCashInData({ ...cashInData, amount: Number(e.target.value) })}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cash-in-method">Payment Method *</label>
              <select
                id="cash-in-method"
                className="form-select"
                value={cashInData.paymentMethod}
                onChange={e => setCashInData({ ...cashInData, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit/Debit Card">Credit/Debit Card</option>
                <option value="Chips">Chips</option>
                <option value="UPI/Digital">UPI / Digital</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cash-in-player">Player Name (Optional)</label>
              <input
                id="cash-in-player"
                type="text"
                className="form-input"
                placeholder="e.g. Vikram Malhotra"
                value={cashInData.playerName}
                onChange={e => setCashInData({ ...cashInData, playerName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cash-in-reference">Reference ID / Receipt #</label>
              <input
                id="cash-in-reference"
                type="text"
                className="form-input"
                placeholder="e.g. REC-9921"
                value={cashInData.referenceId}
                onChange={e => setCashInData({ ...cashInData, referenceId: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cash-in-description">Transaction Description *</label>
            <textarea
              id="cash-in-description"
              className="form-textarea"
              placeholder="Notes on the cash received..."
              value={cashInData.description}
              onChange={e => setCashInData({ ...cashInData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCashInModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-emerald">
              <Plus size={16} /> Record Cash Received
            </button>
          </div>
        </form>
      </Modal>

      {/* Cash Out Modal */}
      <Modal
        isOpen={isCashOutModalOpen}
        onClose={() => setIsCashOutModalOpen(false)}
        title="Add Cash Given (Cash Out / Payout)"
        subtitle="Record money going out from the cashier vault / drawer"
        size="md"
      >
        <form onSubmit={handleCashOutSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="cash-out-category">Category *</label>
            <select
              id="cash-out-category"
              className="form-select"
              value={cashOutData.category}
              onChange={e => setCashOutData({ ...cashOutData, category: e.target.value as CashCategory })}
            >
              <option value="Tournament Prize Payout">Tournament Prize Payout</option>
              <option value="Cash Game Cash-out">Cash Game Cash-out</option>
              <option value="Player Cash Withdrawal">Player Cash Withdrawal</option>
              <option value="Float Withdrawal">Float Withdrawal to Main Safe</option>
              <option value="Player Refund">Player Refund</option>
              <option value="Cashier Settlement">Cashier Shift Settlement</option>
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cash-out-amount">Amount Paid Out (₹) *</label>
              <input
                id="cash-out-amount"
                type="number"
                className="form-input"
                value={cashOutData.amount}
                onChange={e => setCashOutData({ ...cashOutData, amount: Number(e.target.value) })}
                required
                min="1"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cash-out-method">Payment Method *</label>
              <select
                id="cash-out-method"
                className="form-select"
                value={cashOutData.paymentMethod}
                onChange={e => setCashOutData({ ...cashOutData, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit/Debit Card">Credit/Debit Card</option>
                <option value="Chips">Chips</option>
                <option value="UPI/Digital">UPI / Digital</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="cash-out-recipient">Recipient / Player Name</label>
              <input
                id="cash-out-recipient"
                type="text"
                className="form-input"
                placeholder="e.g. Sophia Chen"
                value={cashOutData.playerName}
                onChange={e => setCashOutData({ ...cashOutData, playerName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cash-out-reference">Reference ID / Payout Ref</label>
              <input
                id="cash-out-reference"
                type="text"
                className="form-input"
                placeholder="e.g. PO-8812"
                value={cashOutData.referenceId}
                onChange={e => setCashOutData({ ...cashOutData, referenceId: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cash-out-description">Payout Description *</label>
            <textarea
              id="cash-out-description"
              className="form-textarea"
              placeholder="Notes on the payout or cash out..."
              value={cashOutData.description}
              onChange={e => setCashOutData({ ...cashOutData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCashOutModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger">
              <Minus size={16} /> Record Cash Out Payout
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );

  function setFormDataCategory(cat: CashCategory) {
    setCashInData(prev => ({ ...prev, category: cat }));
  }
};
