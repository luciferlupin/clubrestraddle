import React, { useState } from 'react';
import { History, Search, ShieldCheck, DollarSign, User, LayoutDashboard, Filter } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatDateTime } from '../../utils/formatters';

export const AdminAuditLogsView: React.FC = () => {
  const { auditLogs } = useClub();
  const [search, setSearch] = useState('');
  const [portalFilter, setPortalFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (portalFilter !== 'all' && log.portal !== portalFilter) return false;
    return true;
  });

  const getPortalBadgeColor = (portal: string) => {
    switch (portal) {
      case 'Player':
        return 'badge-info';
      case 'Cashier':
        return 'badge-warning';
      case 'Security':
        return 'badge-success';
      case 'Admin':
        return 'badge-purple';
      default:
        return 'badge-default';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <History size={18} color="#e11d48" />
            Team Activity Audit Trail
          </h3>
          <p className="card-subtitle">
            Chronological audit logs of all actions performed across all 4 portals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: 'auto', fontSize: '0.82rem', fontWeight: 600, minHeight: '38px', padding: '8px 36px 8px 14px' }}
            value={portalFilter}
            onChange={e => setPortalFilter(e.target.value)}
          >
            <option value="all">All Portals ({auditLogs.length})</option>
            <option value="Player">Player Portal</option>
            <option value="Cashier">Cashier Portal</option>
            <option value="Security">Security Portal</option>
            <option value="Admin">Admin Portal</option>
          </select>

          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', width: '210px', fontSize: '0.84rem', minHeight: '38px' }}
              placeholder="Search logs, staff..."
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
              <th>Log ID</th>
              <th>Portal</th>
              <th>Staff / User</th>
              <th>Action</th>
              <th>Audit Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                  {log.id}
                </td>
                <td>
                  <span className={`badge ${getPortalBadgeColor(log.portal)}`}>
                    {log.portal}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{log.user}</td>
                <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{log.action}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
                  {log.details}
                </td>
                <td style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {formatDateTime(log.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
