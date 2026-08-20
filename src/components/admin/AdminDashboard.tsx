import React from 'react';
import {
  Users,
  CheckCircle2,
  Trophy,
  ShieldCheck,
  Coins,
  UserCheck,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatDateTime, formatINR } from '../../utils/formatters';
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
  } = useClub();

  const activeTournaments = tournaments.filter(t => t.status === 'Registering' || t.status === 'Running');
  const approvedToday = todayCheckIns.filter(c => c.verificationStatus === 'approved').length;
  const verifiedPlayersCount = players.filter(p => p.kycStatus === 'verified').length;
  const deliveredChipOrders = chipRequests.filter(r => r.status === 'delivered');
  const totalChipVolume = deliveredChipOrders.reduce((sum, r) => sum + r.amount, 0);

  // Operational activity logs (Security & Attendance, excluding cash amounts)
  const operationsLogs = auditLogs
    .filter(l => l.portal === 'Security' || l.portal === 'Admin')
    .slice(0, 6);

  const securityActivities = auditLogs
    .filter(l => l.portal === 'Security')
    .slice(0, 6);

  return (
    <div className="admin-dashboard">
      {/* Top Admin Dashboard Operational Metrics (Zero Cash Exposed on Main Dashboard) */}
      <div className="stats-grid admin-kpi-grid">
        <StatCard
          label="Total Registered Players"
          value={players.length}
          icon={<Users size={22} color="#ffffff" />}
          helper={`${verifiedPlayersCount} KYC Verified`}
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
          suit="club"
        />

        <StatCard
          label="KYC Verified Members"
          value={verifiedPlayersCount}
          icon={<UserCheck size={22} color="#ffffff" />}
          helper="Approved Identity Profiles"
          suit="spade"
        />

        <StatCard
          label="Club Access Queue"
          value={todayCheckIns.filter(c => c.verificationStatus === 'pending').length}
          icon={<ShieldCheck size={22} color="#ffffff" />}
          helper="Awaiting Door Clearance"
          suit="heart"
        />
      </div>

      {/* Operations Quick-Access Bar */}
      <div
        style={{
          background: 'linear-gradient(155deg, #110406 0%, #080203 100%)',
          border: '1px solid rgba(139, 0, 0, 0.45)',
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
            Operational Control Desk
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
            Club Operations & Member Management
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage staff, players, attendance records, and live tournament events
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('players')}>
            <Users size={14} /> Member Directory
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('attendance')}>
            <CheckCircle2 size={14} /> Attendance Logs
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigateTab('tournaments')}>
            <Trophy size={14} /> Tournament Events
          </button>
        </div>
      </div>

      {/* 2-Column Feeds: Live Operations Activity & Live Security Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Operations Activity Feed */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <ShieldCheck size={18} color="#e11d48" />
                Live Club Operations
              </h3>
              <p className="card-subtitle">Recent system, staff, and member verification events</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab('audit')}>
              Full Audit Log
            </button>
          </div>

          {operationsLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)' }}>
              No recent operations events.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {operationsLogs.map(log => (
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
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    {log.details}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                    By: <strong>{log.user}</strong> ({log.portal})
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
                Live Door & Entrance Activity
              </h3>
              <p className="card-subtitle">Recent entry approvals, rejections, and KYC verifications</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigateTab('attendance')}>
              View Attendance
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

