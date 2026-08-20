import React from 'react';
import {
  Users,
  CheckCircle2,
  Trophy,
  Wallet,
  Receipt,
  DollarSign,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { StatCard } from '../common/StatCard';
import { CashFlowBadge, EntryBadge, KYCBadge } from '../common/Badge';

export const AdminDashboard: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const {
    players,
    todayCheckIns,
    tournaments,
    currentCashBalance,
    totalExpensesAmount,
    netTreasuryBalance,
    cashTransactions,
    auditLogs,
  } = useClub();

  const activeTournaments = tournaments.filter(t => t.status === 'Registering' || t.status === 'Running');
  const approvedToday = todayCheckIns.filter(c => c.verificationStatus === 'approved').length;

  // Filter recent Cashier and Security activities
  const cashierActivities = auditLogs.filter(l => l.portal === 'Cashier').slice(0, 5);
  const securityActivities = auditLogs.filter(l => l.portal === 'Security').slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Required Admin Dashboard Metrics */}
      <div className="stats-grid">
        <StatCard
          label="Total Registered Players"
          value={players.length}
          icon={<Users size={22} />}
          helper={`${players.filter(p => p.kycStatus === 'verified').length} KYC Verified`}
          glowColor="rgba(59, 130, 246, 0.15)"
          iconColor="#60a5fa"
        />

        <StatCard
          label="Today's Checked-in Players"
          value={todayCheckIns.length}
          icon={<CheckCircle2 size={22} />}
          helper={`${approvedToday} Approved & Inside Club`}
          glowColor="rgba(16, 185, 129, 0.15)"
          iconColor="#34d399"
        />

        <StatCard
          label="Active Tournaments"
          value={activeTournaments.length}
          icon={<Trophy size={22} />}
          helper={`${tournaments.length} Total Events in System`}
          glowColor="rgba(245, 158, 11, 0.15)"
          iconColor="#fbbf24"
        />

        <StatCard
          label="Cash Balance (Vault)"
          value={formatCurrency(currentCashBalance)}
          icon={<Wallet size={22} />}
          helper="Live Cashier Drawer Float"
          glowColor="rgba(245, 158, 11, 0.2)"
          iconColor="#fbbf24"
        />

        <StatCard
          label="Total Club Expenses"
          value={formatCurrency(totalExpensesAmount)}
          icon={<Receipt size={22} />}
          helper="Operating Costs Recorded"
          glowColor="rgba(239, 68, 68, 0.15)"
          iconColor="#f87171"
        />
      </div>

      {/* Financial Health Summary Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(18, 24, 36, 0.95), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Treasury & Net Business Cash Balance
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {formatCurrency(netTreasuryBalance)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
            Reconciliation: {formatCurrency(currentCashBalance)} Cashier Float − {formatCurrency(totalExpensesAmount)} Expenses
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('cash')}>
            <DollarSign size={14} /> View Cash Ledger
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigateTab('expenses')}>
            <Receipt size={14} /> Manage Expenses
          </button>
        </div>
      </div>

      {/* 2-Column Feeds: Live Cashier Activity & Live Security Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Cashier Activity Feed */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <DollarSign size={18} color="#f59e0b" />
                Live Cashier Activity
              </h3>
              <p className="card-subtitle">Recent buy-ins, payouts, and cash transactions</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab('cash')}>
              View All
            </button>
          </div>

          {cashierActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
              No recent cashier events.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cashierActivities.map(log => (
                <div
                  key={log.id}
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gold-light)' }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    {log.details}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    By: <strong>{log.user}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Activity Feed */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <ShieldCheck size={18} color="#10b981" />
                Live Security Activity
              </h3>
              <p className="card-subtitle">Recent entry approvals, rejections, and KYC verifications</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab('attendance')}>
              View All
            </button>
          </div>

          {securityActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
              No recent security events.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {securityActivities.map(log => (
                <div
                  key={log.id}
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#34d399' }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    {log.details}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Officer: <strong>{log.user}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
