import React, { useState } from 'react';
import { History, Calendar, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { DailyCheckIn } from '../../types';
import { formatDateOnly, formatTimeOnly } from '../../utils/formatters';
import { EntryBadge } from '../common/Badge';
import { Pagination } from '../common/Pagination';

interface CheckInHistoryProps {
  checkIns: DailyCheckIn[];
}

export const CheckInHistory: React.FC<CheckInHistoryProps> = ({ checkIns }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const paginatedCheckIns = checkIns.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <History size={18} color="#e11d48" />
            Check-In & Club Visit History
          </h3>
          <p className="card-subtitle">
            Log of all physical club visits, check-in timestamps, and security approvals.
          </p>
        </div>
        <span className="badge badge-default">{checkIns.length} Total Visits</span>
      </div>

      {checkIns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-dim)' }}>
          <History size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: '0.9rem' }}>No check-in history recorded yet for this member.</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Visit</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Security Clearance</th>
                  <th>Verified By</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCheckIns.map((c, index) => (
                  <tr key={c.id}>
                    <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>
                      #{(page - 1) * pageSize + index + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="#94a3b8" />
                        <span>{formatDateOnly(c.checkInDate)}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#94a3b8" />
                        <span className="tabular-num">{formatTimeOnly(c.checkInTime)}</span>
                      </div>
                    </td>
                    <td>
                      <EntryBadge status={c.verificationStatus} />
                      {c.rejectionReason && (
                        <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '4px' }}>
                          {c.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {c.verifiedBy || (c.verificationStatus === 'pending' ? 'Pending Door Review' : '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalItems={checkIns.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="visits"
          />
        </>
      )}
    </div>
  );
};
