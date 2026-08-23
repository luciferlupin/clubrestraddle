import React, { useState } from 'react';
import { DollarSign, ArrowDownLeft, ArrowUpRight, Wallet, Search, Filter, Smartphone, Landmark, CreditCard } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { CashFlowBadge } from '../common/Badge';
import { PaymentMethod } from '../../types';

export const AdminCashView: React.FC = () => {
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
  } = useClub();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<'all' | PaymentMethod>('all');

  const filteredTransactions = cashTransactions.filter(t => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      (t.playerName && t.playerName.toLowerCase().includes(search.toLowerCase())) ||
      (t.referenceId && t.referenceId.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'in' && t.type !== 'in') return false;
    if (filterType === 'out' && t.type !== 'out') return false;
    if (filterPaymentMethod !== 'all' && t.paymentMethod !== filterPaymentMethod) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Separated Liquidity Channels Grid */}
      <div className="stats-grid" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* 1. PHYSICAL CASH */}
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

        {/* 2. UPI & DIGITAL */}
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

        {/* 3. DIRECT BANK TRANSFER */}
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

        {/* 4. TOTAL LIQUID TREASURY */}
        <div
          className="stat-card"
          style={{ '--stat-glow': 'rgba(16, 185, 129, 0.15)', '--stat-color': '#34d399', border: '1.5px solid rgba(16, 185, 129, 0.4)' } as React.CSSProperties}
        >
          <div className="stat-info">
            <span className="stat-label">💎 Total Liquid Treasury</span>
            <span className="stat-value" style={{ color: '#34d399' }}>
              {formatCurrency(totalLiquidityBalance)}
            </span>
            <span className="stat-helper">Gross In: {formatCurrency(totalCashInAmount)} · Out: {formatCurrency(totalCashOutAmount)}</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="card-title">
              <DollarSign size={18} color="#e11d48" />
              Master Cash Flow Ledger & Treasury
            </h3>
            <p className="card-subtitle">Complete chronological record with channel separation.</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '32px', width: '200px', fontSize: '0.8rem' }}
                placeholder="Search ledger..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-input"
              style={{ width: '120px', fontSize: '0.8rem' }}
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
            >
              <option value="all">All Flows</option>
              <option value="in">Cash In</option>
              <option value="out">Cash Out</option>
            </select>
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
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Member / Ref</th>
                <th>Cashier</th>
                <th>Balance After</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                    No cash transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(txn => (
                  <tr key={txn.id}>
                    <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                      {txn.id}
                    </td>
                    <td>
                      <CashFlowBadge type={txn.type} />
                    </td>
                    <td style={{ fontWeight: 600 }}>{txn.category}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {txn.description}
                    </td>
                    <td
                      className="tabular-num"
                      style={{
                        fontWeight: 800,
                        color: txn.type === 'in' ? '#34d399' : '#f87171',
                      }}
                    >
                      {txn.type === 'in' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: txn.paymentMethod === 'Cash' ? 'rgba(251, 191, 36, 0.15)' : txn.paymentMethod === 'UPI/Digital' ? 'rgba(56, 189, 248, 0.15)' : txn.paymentMethod === 'Bank Transfer' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                          color: txn.paymentMethod === 'Cash' ? '#fbbf24' : txn.paymentMethod === 'UPI/Digital' ? '#38bdf8' : txn.paymentMethod === 'Bank Transfer' ? '#c084fc' : '#34d399',
                          border: `1px solid ${txn.paymentMethod === 'Cash' ? 'rgba(251, 191, 36, 0.3)' : txn.paymentMethod === 'UPI/Digital' ? 'rgba(56, 189, 248, 0.3)' : txn.paymentMethod === 'Bank Transfer' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                        }}
                      >
                        {txn.paymentMethod === 'Cash' ? '💵 Cash' : txn.paymentMethod === 'UPI/Digital' ? '📱 UPI' : txn.paymentMethod === 'Bank Transfer' ? '🏦 Bank' : '💳 Card'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {txn.playerName || txn.referenceId || '—'}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {txn.cashierName}
                    </td>
                    <td className="tabular-num" style={{ fontWeight: 700, color: 'var(--gold-light)' }}>
                      {formatCurrency(txn.balanceAfter)}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {formatDateTime(txn.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
