import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Clock,
  ShieldAlert,
  Check,
  FileCheck2,
  Users,
  Printer,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, DailyCheckIn } from '../../types';
import { formatTimeOnly, formatDateOnly, maskGovtId, formatPlayerNumber } from '../../utils/formatters';
import { KYCBadge, EntryBadge } from '../common/Badge';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { generateEntryFeeInvoice } from '../../utils/invoiceGenerator';
import confetti from 'canvas-confetti';

interface SecurityQueueProps {
  selectedPlayerId: string | null;
  onSelectPlayer: (player: Player, checkIn?: DailyCheckIn) => void;
}

export const SecurityQueue: React.FC<SecurityQueueProps> = ({
  selectedPlayerId,
  onSelectPlayer,
}) => {
  const { players, todayCheckIns, approvePlayerEntry, reviewKYC, staffName } = useClub();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'pending' | 'rejected' | 'all'>('pending');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [entryInvoice, setEntryInvoice] = useState<ClubInvoiceData | null>(null);

  const pendingCount = players.filter(p => {
    const chk = todayCheckIns.find(c => c.playerId === p.id);
    return chk?.verificationStatus === 'pending' || p.kycStatus === 'pending';
  }).length;

  const rejectedCount = players.filter(p => {
    const chk = todayCheckIns.find(c => c.playerId === p.id);
    return (chk?.verificationStatus === 'rejected' || p.kycStatus === 'rejected') && chk?.verificationStatus !== 'approved';
  }).length;

  // Build list of items to display
  const displayItems = players
    .map(p => {
      const todayCheckIn = todayCheckIns.find(c => c.playerId === p.id);
      return {
        player: p,
        checkIn: todayCheckIn,
      };
    })
    .filter(({ player, checkIn }) => {
      const matchesSearch =
        player.fullName.toLowerCase().includes(search.toLowerCase()) ||
        player.phone.includes(search) ||
        player.id.toLowerCase().includes(search.toLowerCase()) ||
        player.kyc.govtIdNumber.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (filter === 'pending') {
        if (checkIn?.verificationStatus === 'approved' && player.kycStatus === 'verified') return false;
        return checkIn?.verificationStatus === 'pending' || player.kycStatus === 'pending';
      }
      if (filter === 'rejected') {
        return checkIn?.verificationStatus === 'rejected' || player.kycStatus === 'rejected';
      }
      if (filter === 'all') {
        return !!checkIn || player.kycStatus === 'pending';
      }
      return true;
    })
    .sort((a, b) => {
      const aPending = a.checkIn?.verificationStatus === 'pending' || a.player.kycStatus === 'pending';
      const bPending = b.checkIn?.verificationStatus === 'pending' || b.player.kycStatus === 'pending';
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;
      return new Date(b.player.registeredAt || 0).getTime() - new Date(a.player.registeredAt || 0).getTime();
    });

  return (
    <div
      className="card"
      style={{
        border: '1px solid rgba(225, 29, 72, 0.35)',
        background: 'linear-gradient(155deg, rgba(20, 8, 12, 0.95) 0%, rgba(10, 4, 6, 0.95) 100%)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(225, 29, 72, 0.2)',
              border: '1px solid var(--border-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#ffffff' }}>
              Live Entrance & KYC Verification Queue
            </h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
              Real-time arrivals, pending member approvals, and KYC document clearance.
            </p>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            id="security-queue-search"
            aria-label="Search the entrance queue"
            type="text"
            className="form-input"
            style={{ paddingLeft: '32px', width: '220px', fontSize: '0.8rem' }}
            placeholder="Search name, phone, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Queue Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn btn-sm ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('pending')}
          style={{ fontSize: '0.78rem' }}
        >
          <Clock size={13} /> Awaiting Review ({pendingCount})
        </button>

        <button
          type="button"
          className={`btn btn-sm ${filter === 'rejected' ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setFilter('rejected')}
          style={{ fontSize: '0.78rem' }}
        >
          <ShieldAlert size={13} /> Denied ({rejectedCount})
        </button>

        <button
          type="button"
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
          style={{ fontSize: '0.78rem' }}
        >
          <Users size={13} /> All Today ({todayCheckIns.length})
        </button>
      </div>

      {displayItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
          <ShieldCheck size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: '0.88rem', color: '#ffffff', fontWeight: 600 }}>No players found in this queue.</p>
          <p style={{ fontSize: '0.76rem' }}>When players register, check in at the entrance or scan their pass, they appear here instantly.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Member Profile</th>
                <th>Government ID</th>
                <th>DOB / Age</th>
                <th>KYC Status</th>
                <th>Arrival Status</th>
                <th style={{ textAlign: 'right' }}>Clearance Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayItems.map(({ player, checkIn }) => {
                const isSelected = selectedPlayerId === player.id;
                const isPending = checkIn?.verificationStatus === 'pending' || player.kycStatus === 'pending';

                return (
                  <tr
                    key={player.id}
                    style={{
                      background: isSelected
                        ? 'rgba(225, 29, 72, 0.16)'
                        : isPending
                        ? 'rgba(225, 29, 72, 0.05)'
                        : undefined,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onClick={() => onSelectPlayer(player, checkIn)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {player.kyc.photoUrl ? (
                          <img
                            src={player.kyc.photoUrl}
                            alt=""
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              objectFit: 'cover',
                              border: `1.5px solid ${isSelected ? '#e11d48' : 'rgba(225,29,72,0.3)'}`,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: 'rgba(225, 29, 72, 0.15)',
                              border: '1px solid var(--border-red)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              color: '#ffffff',
                            }}
                          >
                            {player.fullName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.86rem' }}>
                            {player.fullName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            Player ID {formatPlayerNumber(player)} • {player.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{player.kyc.govtIdType}</div>
                      <div className="tabular-num" style={{ fontSize: '0.72rem', color: '#fb7185', fontFamily: 'var(--font-mono)' }}>
                        {maskGovtId(player.kyc.govtIdNumber)}
                      </div>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <div>{formatDateOnly(player.kyc.dateOfBirth)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#10b981' }}>21+ Verified</div>
                    </td>

                    <td>
                      <KYCBadge status={player.kycStatus} />
                    </td>

                    <td>
                      {checkIn ? (
                        <div>
                          <EntryBadge status={checkIn.verificationStatus} />
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                            {formatTimeOnly(checkIn.checkInTime)}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: '#fbbf24' }}>Pending Check-in</span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                        {player.kycStatus === 'pending' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                            onClick={() => {
                              reviewKYC(player.id, 'verified');
                            }}
                            title="Verify Member KYC"
                          >
                            <FileCheck2 size={12} /> Verify KYC
                          </button>
                        )}
                        {checkIn?.verificationStatus === 'approved' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '4px 9px',
                              fontSize: '0.72rem',
                              color: '#fda4af',
                              borderColor: 'rgba(225, 29, 72, 0.4)',
                              background: 'rgba(225, 29, 72, 0.12)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            onClick={() => {
                              setEntryInvoice(generateEntryFeeInvoice(player, checkIn, staffName));
                              setIsInvoiceOpen(true);
                            }}
                            title="Print / View Official ₹500 Bill Receipt"
                          >
                            <Printer size={12} /> Bill
                          </button>
                        )}
                        {(checkIn?.verificationStatus === 'pending' || (!checkIn && player.kycStatus === 'pending')) && (
                          <button
                            type="button"
                            className="btn btn-emerald btn-sm"
                            style={{ padding: '4px 10px', fontSize: '0.74rem', gap: '4px' }}
                            onClick={() => {
                              if (player.kycStatus === 'pending') {
                                reviewKYC(player.id, 'verified');
                              }
                              approvePlayerEntry(checkIn?.id || player.id);
                              try {
                                confetti({
                                  particleCount: 40,
                                  spread: 50,
                                  origin: { y: 0.7 },
                                  colors: ['#e11d48', '#ffffff', '#fb7185', '#10b981'],
                                });
                              } catch {}
                            }}
                            title="Quick Clear & Grant Entry"
                          >
                            <Check size={13} /> Clear Entry
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                          onClick={() => onSelectPlayer(player, checkIn)}
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Official Tax Invoice Modal for Security Printing */}
      <ClubTaxInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={entryInvoice}
      />
    </div>
  );
};
