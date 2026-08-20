import React, { useState } from 'react';
import { DollarSign, ArrowDownLeft, ArrowUpRight, Wallet, Search, Filter } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { CashFlowBadge } from '../common/Badge';

export const AdminCashView: React.FC = () => {
  const { cashTransactions, currentCashBalance, totalCashInAmount, totalCashOutAmount } = useClub();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');

  const filteredTransactions = cashTransactions.filter(t => {
    const matchesSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      (t.playerName && t.playerName.toLowerCase().includes(search.toLowerCase())) ||
      (t.referenceId && t.referenceId.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'in') return t.type === 'in';
    if (filterType === 'out') return t.type === 'out';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="stats-grid" style={{ marginBottom: 0 }}>
        <div
          className="stat-card"
          style={{ '--stat-glow': 'rgba(245, 158, 11, 0.15)', '--stat-color': '#fbbf24' } as React.CSSProperties}
        >
          <div className="stat-info">
            <span className="stat-label">Current Cashier Balance</span>
            <span className="stat-value" style={{ color: 'var(--gold-light)' }}>
              {formatCurrency(currentCashBalance)}
            </span>
            <span className="stat-helper">Physical drawer float</span>
          </div>
          <div className="stat-icon-wrapper">
            <Wallet size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Cash In</span>
            <span className="stat-value" style={{ color: '#ffffff' }}>
              +{formatCurrency(totalCashInAmount)}
            </span>
            <span className="stat-helper">All incoming receipts</span>
          </div>
          <div className="stat-icon-wrapper">
            <ArrowDownLeft size={22} color="#ffffff" />
          </div>
        </div>

        <div
          className="stat-card"
          style={{ '--stat-glow': 'rgba(239, 68, 68, 0.15)', '--stat-color': '#f87171' } as React.CSSProperties}
        >
          <div className="stat-info">
            <span className="stat-label">Total Cash Out</span>
            <span className="stat-value" style={{ color: '#f87171' }}>
              -{formatCurrency(totalCashOutAmount)}
            </span>
            <span className="stat-helper">All payouts & settlements</span>
          </div>
          <div className="stat-icon-wrapper">
            <ArrowUpRight size={22} color="#ef4444" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <DollarSign size={18} color="#e11d48" />
              Master Cash Flow Ledger & Treasury
            </h3>
            <p className="card-subtitle">Complete chronological record of all cash flow across cashier desks.</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
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
          </div>
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
                <th>Method</th>
                <th>Player / Reference</th>
                <th>Cashier</th>
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
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
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
                    {txn.playerName || txn.referenceId || '—'}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {txn.cashierName}
                  </td>
                  <td className="tabular-num" style={{ fontWeight: 700 }}>
                    {formatCurrency(txn.balanceAfter)}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {formatDateTime(txn.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
