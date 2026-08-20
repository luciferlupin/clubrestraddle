import React from 'react';
import {
  Users,
  CheckCircle2,
  Trophy,
  DollarSign,
  Receipt,
  Wallet,
  ShieldCheck,
  Coins,
  History,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatCurrency, formatDateTime, formatINR } from '../../utils/formatters';
import { SuitWatermark } from '../common/PokerGraphics';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  helper?: string;
  suit?: 'spade' | 'heart' | 'diamond' | 'club';
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  helper,
  suit = 'spade',
}) => (
  <div className="stat-card">
    <SuitWatermark suit={suit} size={52} opacity={0.06} color="#ffffff" className="stat-suit-accent" />
    <div className="stat-info">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {helper && <span className="stat-helper">{helper}</span>}
    </div>
    <div className="stat-icon-wrapper">
      {icon}
    </div>
  </div>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const {
    players,
    todayCheckIns,
    tournaments,
    chipRequests,
    pendingChipOrdersCount,
    auditLogs,
    currentCashBalance,
    totalExpensesAmount,
  } = useClub();

  const activeTournaments = tournaments.filter(t => t.status === 'Registering' || t.status === 'Running');
  const approvedToday = todayCheckIns.filter(c => c.verificationStatus === 'approved').length;
  const deliveredChipOrders = chipRequests.filter(r => r.status === 'delivered');
  const totalChipVolume = deliveredChipOrders.reduce((sum, r) => sum + r.amount, 0);

  const netTreasuryBalance = currentCashBalance - totalExpensesAmount;

  // Recent Cashier & Security activity
  const cashierActivities = auditLogs
    .filter(l => l.portal === 'Cashier')
    .slice(0, 5);

  const securityActivities = auditLogs
    .filter(l => l.portal === 'Security')
    .slice(0, 5);

  return (
    <div className="admin-dashboard">
      {/* Top Required Admin Dashboard Metrics */}
      <div className="stats-grid admin-kpi-grid">
        <StatCard
          label="Total Registered Players"
          value={players.length}
          icon={<Users size={22} color="#ffffff" />}
          helper={`${players.filter(p => p.kycStatus === 'verified').length} KYC Verified`}
          suit="spade"
        />

        <StatCard
          label="Today's Checked-in Players"
          value={todayCheckIns.length}
          icon={<CheckCircle2 size={22} color="#ffffff" />}
          helper={`${approvedToday} Approved & Inside Club`}
          suit="heart"
        />

        <StatCard
          label="Live Table Chip Orders"
          value={chipRequests.length}
          icon={<Coins size={22} color="#ffffff" />}
          helper={`${pendingChipOrdersCount} Pending | ₹${formatINR(totalChipVolume)} Delivered`}
          suit="diamond"
        />

        <StatCard
          label="Active Tournaments"
          value={activeTournaments.length}

          icon={<Trophy size={22} color="#ffffff" />}
          helper={`${tournaments.length} Total Events in System`}
        />

        <StatCard
          label="KYC Compliance Rate"
          value={`${players.length > 0 ? Math.round((players.filter(p => p.kycStatus === 'verified').length / players.length) * 100) : 100}%`}
          icon={<ShieldCheck size={22} color="#ffffff" />}
          helper={`${players.filter(p => p.kycStatus === 'verified').length} of ${players.length} Members Verified`}
        />

        <StatCard
          label="System Activity Logs"
          value={auditLogs.length}
          icon={<History size={22} color="#ffffff" />}
          helper="Complete Audit Trail Recorded"
        />
      </div>

      {/* Operational Overview Quick Actions Banner */}
      <div
        style={{
          background: 'linear-gradient(155deg, #110406 0%, #080203 100%)',
          border: '1px solid rgba(139, 0, 0, 0.5)',
          borderRadius: '18px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
          color: '#ffffff',
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
            Club Operational Command Center
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
            {activeTournaments.length} Live Events · {approvedToday} Members in Lounge
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
            Table chip orders, member registrations, security clearances & tournament operations
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('players')}>
            <Users size={14} /> Member Directory
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigateTab('tournaments')}>
            <Trophy size={14} /> Tournament Desk
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
                <DollarSign size={18} color="#e11d48" />
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
                    background: '#110406',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(139, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#ffffff' }}>
                    {log.details}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
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
                <ShieldCheck size={18} color="#e11d48" />
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
                    background: '#110406',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(139, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff' }}>
                      {log.action}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#ffffff' }}>
                    {log.details}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
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
