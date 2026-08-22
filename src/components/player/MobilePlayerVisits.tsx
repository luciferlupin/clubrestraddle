import React, { useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, History, MapPin, ShieldCheck } from 'lucide-react';
import { DailyCheckIn, Player } from '../../types';
import { formatDateOnly, formatTimeOnly } from '../../utils/formatters';
import { EntryBadge } from '../common/Badge';
import { Pagination } from '../common/Pagination';

interface MobilePlayerVisitsProps {
  player: Player;
  checkIns: DailyCheckIn[];
}

export const MobilePlayerVisits: React.FC<MobilePlayerVisitsProps> = ({ player, checkIns }) => {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const approvedVisits = checkIns.filter((checkIn) => checkIn.verificationStatus === 'approved').length;
  const latestVisit = checkIns[0];
  const paginatedCheckIns = checkIns.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="player-subscreen" aria-labelledby="player-visits-title">
      <header className="player-subscreen-heading">
        <span className="mobile-flow-eyebrow">Membership activity</span>
        <h1 id="player-visits-title">Your visits</h1>
        <p>A simple record of your recent club check-ins.</p>
      </header>

      <div className="player-summary-grid" aria-label="Visit summary">
        <article>
          <span><History size={18} /></span>
          <strong>{player.totalVisits}</strong>
          <small>Total club visits</small>
        </article>
        <article>
          <span><ShieldCheck size={18} /></span>
          <strong>{approvedVisits}</strong>
          <small>Approved records</small>
        </article>
        <article>
          <span><CalendarDays size={18} /></span>
          <strong>{latestVisit ? formatDateOnly(latestVisit.checkInDate).replace(/, \d{4}/, '') : '—'}</strong>
          <small>Latest check-in</small>
        </article>
      </div>

      <div className="player-section-heading">
        <div>
          <span className="mobile-flow-eyebrow">Recent activity</span>
          <h2>Check-in history</h2>
        </div>
        <span>{checkIns.length} recorded</span>
      </div>

      {checkIns.length === 0 ? (
        <div className="player-empty-state">
          <span><History size={25} /></span>
          <h2>No visits yet</h2>
          <p>Your check-in history will appear here after your first visit.</p>
        </div>
      ) : (
        <>
          <div className="player-visit-timeline">
            {paginatedCheckIns.map((checkIn, index) => (
              <article key={checkIn.id} className="player-visit-card">
                <span className={`player-visit-marker ${checkIn.verificationStatus}`} aria-hidden="true">
                  <CheckCircle2 size={16} />
                </span>
                <div className="player-visit-content">
                  <div className="player-visit-topline">
                    <div>
                      <strong>{formatDateOnly(checkIn.checkInDate)}</strong>
                      <span><Clock3 size={14} /> {formatTimeOnly(checkIn.checkInTime)}</span>
                    </div>
                    <EntryBadge status={checkIn.verificationStatus} />
                  </div>
                  <div className="player-visit-location">
                    <MapPin size={15} />
                    <span>{checkIn.tablePreference || 'General club floor'}</span>
                  </div>
                  <div className="player-visit-footer">
                    <span>{checkIn.verifiedBy ? `Verified by ${checkIn.verifiedBy}` : 'Awaiting security review'}</span>
                    <code>Visit #{(page - 1) * pageSize + index + 1}</code>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalItems={checkIns.length}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="visits"
          />
        </>
      )}
    </section>
  );
};
