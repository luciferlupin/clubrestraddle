import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Printer,
  Search,
  Users,
  Check,
  ShieldCheck,
  Wallet,
  Sparkles,
  FileSpreadsheet,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
} from 'lucide-react';
import { Player, KYCStatus, MembershipTier } from '../../types';
import {
  formatPlayerNumber,
  formatAadhaarNumber,
  formatPanNumber,
  formatCurrency,
  formatDateOnly,
  formatFullAadhaar,
  formatPanNumber as formatPan,
} from '../../utils/formatters';
import {
  downloadPlayersCSV,
  copyPlayersToClipboard,
  printPlayersTable,
} from '../../utils/exportPlayers';
import { KYCBadge, TierBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface AdminPlayerExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

type ColumnPreset = 'all' | 'kyc' | 'financial' | 'contact';

export const AdminPlayerExportModal: React.FC<AdminPlayerExportModalProps> = ({
  isOpen,
  onClose,
  players,
}) => {
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState<'all' | KYCStatus>('all');
  const [tierFilter, setTierFilter] = useState<'all' | MembershipTier>('all');
  const [columnPreset, setColumnPreset] = useState<ColumnPreset>('all');
  const [copied, setCopied] = useState(false);

  // Filtered dataset
  const filteredPlayers = useMemo(() => {
    return players.filter(p => {
      // KYC Filter
      if (kycFilter !== 'all' && p.kycStatus !== kycFilter) return false;

      // Tier Filter
      if (tierFilter !== 'all' && p.membershipTier !== tierFilter) return false;

      // Search Query
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const playerNum = formatPlayerNumber(p).toLowerCase();
        const name = p.fullName.toLowerCase();
        const phone = p.phone.toLowerCase();
        const email = (p.email || '').toLowerCase();
        const aadhaar = (p.kyc?.aadhaarNumber || '').replace(/\s/g, '');
        const pan = (p.kyc?.panNumber || '').toLowerCase();
        const govtId = (p.kyc?.govtIdNumber || '').toLowerCase();
        const queryNoSpaces = query.replace(/\s/g, '');

        const matches =
          name.includes(query) ||
          phone.includes(query) ||
          playerNum.includes(query) ||
          email.includes(query) ||
          aadhaar.includes(queryNoSpaces) ||
          pan.includes(query) ||
          govtId.includes(query);

        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      const numA = Number(formatPlayerNumber(a)) || 0;
      const numB = Number(formatPlayerNumber(b)) || 0;
      return numA - numB;
    });
  }, [players, search, kycFilter, tierFilter]);

  // Aggregate stats of current filtered view
  const totalWallet = useMemo(
    () => filteredPlayers.reduce((sum, p) => sum + (p.walletBalance ?? 0), 0),
    [filteredPlayers]
  );
  const verifiedCount = useMemo(
    () => filteredPlayers.filter(p => p.kycStatus === 'verified').length,
    [filteredPlayers]
  );
  const pendingCount = useMemo(
    () => filteredPlayers.filter(p => p.kycStatus === 'pending').length,
    [filteredPlayers]
  );

  const handleDownloadCSV = () => {
    const filename = `Club_Re_Straddle_Players_${kycFilter !== 'all' ? kycFilter + '_' : ''}${new Date().toISOString().slice(0, 10)}.csv`;
    downloadPlayersCSV(filteredPlayers, filename);
  };

  const handleCopyClipboard = async () => {
    const success = await copyPlayersToClipboard(filteredPlayers);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    let summary = `Showing ${filteredPlayers.length} Members`;
    if (kycFilter !== 'all') summary += ` • KYC: ${kycFilter.toUpperCase()}`;
    if (tierFilter !== 'all') summary += ` • Tier: ${tierFilter}`;
    if (search) summary += ` • Search: "${search}"`;
    printPlayersTable(filteredPlayers, summary);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Members Directory & KYC Table"
      subtitle={`Comprehensive tabular export of ${filteredPlayers.length} player profiles with identity & financial data.`}
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* KPI Banner */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
            background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.08) 0%, rgba(20, 10, 15, 0.6) 100%)',
            border: '1px solid rgba(225, 29, 72, 0.25)',
            borderRadius: '12px',
            padding: '12px 16px',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Filtered Records
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              {filteredPlayers.length}{' '}
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>of {players.length}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              KYC Status
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#34d399' }}>
                {verifiedCount} Verified
              </span>
              {pendingCount > 0 && (
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fbbf24' }}>
                  • {pendingCount} Pending
                </span>
              )}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Wallet Pool
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalWallet)}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px',
          }}
        >
          {/* Export Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleDownloadCSV}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, padding: '7px 14px' }}
              title="Download Excel / CSV format (.csv)"
            >
              <Download size={15} />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyClipboard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderColor: copied ? '#10b981' : undefined,
                color: copied ? '#34d399' : undefined,
              }}
              title="Copy Tab-Separated Values to paste straight into Excel / Google Sheets"
            >
              {copied ? <Check size={15} color="#34d399" /> : <Copy size={15} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy for Excel / Sheets'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 14px' }}
              title="Print official landscape document / Save as PDF"
            >
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
          </div>

          {/* Column Presets */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>Columns:</span>
            <button
              type="button"
              className={`btn btn-xs ${columnPreset === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setColumnPreset('all')}
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
            >
              All Data
            </button>
            <button
              type="button"
              className={`btn btn-xs ${columnPreset === 'kyc' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setColumnPreset('kyc')}
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
            >
              KYC & ID
            </button>
            <button
              type="button"
              className={`btn btn-xs ${columnPreset === 'financial' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setColumnPreset('financial')}
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
            >
              Financials
            </button>
            <button
              type="button"
              className={`btn btn-xs ${columnPreset === 'contact' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setColumnPreset('contact')}
              style={{ fontSize: '0.72rem', padding: '3px 8px' }}
            >
              Contacts
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', width: '100%', fontSize: '0.8rem', height: '34px' }}
              placeholder="Filter by name, phone, Aadhaar, PAN, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* KYC Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>KYC:</span>
            <select
              className="form-input"
              value={kycFilter}
              onChange={e => setKycFilter(e.target.value as any)}
              style={{ fontSize: '0.8rem', padding: '4px 8px', height: '34px', minWidth: '110px' }}
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified Only</option>
              <option value="pending">Pending Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Tier:</span>
            <select
              className="form-input"
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value as any)}
              style={{ fontSize: '0.8rem', padding: '4px 8px', height: '34px', minWidth: '110px' }}
            >
              <option value="all">All Tiers</option>
              <option value="Standard">Standard</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="VIP">VIP</option>
              <option value="High Roller">High Roller</option>
            </select>
          </div>

          {(search || kycFilter !== 'all' || tierFilter !== 'all') && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch('');
                setKycFilter('all');
                setTierFilter('all');
              }}
              style={{ fontSize: '0.75rem', color: '#f87171' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Full Table View Container */}
        <div
          style={{
            maxHeight: '480px',
            overflowX: 'auto',
            overflowY: 'auto',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            background: 'rgba(0, 0, 0, 0.4)',
          }}
        >
          <table
            className="custom-table"
            style={{
              width: '100%',
              fontSize: '0.78rem',
              borderCollapse: 'collapse',
              whiteSpace: 'nowrap',
            }}
          >
            <thead
              style={{
                position: 'sticky',
                top: 0,
                background: '#16080d',
                zIndex: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>Member #</th>
                <th>Full Name</th>
                <th>Phone Number</th>
                {(columnPreset === 'all' || columnPreset === 'contact') && <th>Email</th>}
                {(columnPreset === 'all' || columnPreset === 'financial') && <th>Tier</th>}
                {(columnPreset === 'all' || columnPreset === 'kyc') && <th>KYC Status</th>}
                {(columnPreset === 'all' || columnPreset === 'kyc') && <th>Aadhaar Card</th>}
                {(columnPreset === 'all' || columnPreset === 'kyc') && <th>PAN Card</th>}
                {(columnPreset === 'all' || columnPreset === 'kyc' || columnPreset === 'contact') && <th>Address</th>}
                {(columnPreset === 'all' || columnPreset === 'contact') && <th>Emergency Contact</th>}
                {(columnPreset === 'all' || columnPreset === 'financial') && (
                  <th style={{ textAlign: 'right' }}>Wallet Balance</th>
                )}
                {(columnPreset === 'all' || columnPreset === 'financial') && (
                  <th style={{ textAlign: 'center' }}>Visits</th>
                )}
                {(columnPreset === 'all' || columnPreset === 'financial') && <th>Registered Date</th>}
                {columnPreset === 'all' && <th>Staff Notes</th>}
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}
                  >
                    No members match the current export filters.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map(p => {
                  const aadhaar = formatAadhaarNumber(p.kyc?.aadhaarNumber, p.kyc?.govtIdNumber);
                  const pan = formatPanNumber(p.kyc?.panNumber, p.kyc?.govtIdNumber);
                  const isVerified = p.phoneVerified || p.kyc?.phoneVerified;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      {/* Member # */}
                      <td
                        style={{
                          textAlign: 'center',
                          fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--gold-light)',
                        }}
                      >
                        {formatPlayerNumber(p)}
                      </td>

                      {/* Full Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'rgba(225, 29, 72, 0.2)',
                              color: '#fda4af',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                            }}
                          >
                            {p.fullName.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 700, color: '#ffffff' }}>{p.fullName}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{p.phone}</span>
                          {isVerified ? (
                            <span
                              style={{
                                fontSize: '0.62rem',
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#34d399',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '3px',
                                padding: '1px 4px',
                                fontWeight: 700,
                              }}
                            >
                              ✓ SMS
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.62rem',
                                background: 'rgba(100, 116, 139, 0.15)',
                                color: '#94a3b8',
                                borderRadius: '3px',
                                padding: '1px 4px',
                              }}
                            >
                              Unverified
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      {(columnPreset === 'all' || columnPreset === 'contact') && (
                        <td style={{ color: p.email ? '#cbd5e1' : '#64748b' }}>{p.email || '—'}</td>
                      )}

                      {/* Tier */}
                      {(columnPreset === 'all' || columnPreset === 'financial') && (
                        <td>
                          <TierBadge tier={p.membershipTier} />
                        </td>
                      )}

                      {/* KYC Status */}
                      {(columnPreset === 'all' || columnPreset === 'kyc') && (
                        <td>
                          <KYCBadge status={p.kycStatus} />
                        </td>
                      )}

                      {/* Aadhaar */}
                      {(columnPreset === 'all' || columnPreset === 'kyc') && (
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#fca5a5' }}>
                          {aadhaar || '—'}
                        </td>
                      )}

                      {/* PAN */}
                      {(columnPreset === 'all' || columnPreset === 'kyc') && (
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#38bdf8', fontWeight: 600 }}>
                          {pan || '—'}
                        </td>
                      )}

                      {/* Address */}
                      {(columnPreset === 'all' || columnPreset === 'kyc' || columnPreset === 'contact') && (
                        <td
                          style={{
                            maxWidth: '180px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#94a3b8',
                          }}
                          title={p.kyc?.address}
                        >
                          {p.kyc?.address || '—'}
                        </td>
                      )}

                      {/* Emergency Contact */}
                      {(columnPreset === 'all' || columnPreset === 'contact') && (
                        <td style={{ color: '#cbd5e1' }}>
                          {p.kyc?.emergencyContactName ? (
                            <span>
                              {p.kyc.emergencyContactName}{' '}
                              {p.kyc.emergencyContactPhone && (
                                <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                  ({p.kyc.emergencyContactPhone})
                                </span>
                              )}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}

                      {/* Wallet */}
                      {(columnPreset === 'all' || columnPreset === 'financial') && (
                        <td
                          className="tabular-num"
                          style={{
                            textAlign: 'right',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: (p.walletBalance ?? 0) > 0 ? '#34d399' : '#94a3b8',
                          }}
                        >
                          {formatCurrency(p.walletBalance ?? 0)}
                        </td>
                      )}

                      {/* Visits */}
                      {(columnPreset === 'all' || columnPreset === 'financial') && (
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.totalVisits ?? 0}</td>
                      )}

                      {/* Registered Date */}
                      {(columnPreset === 'all' || columnPreset === 'financial') && (
                        <td style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                          {formatDateOnly(p.registeredAt)}
                        </td>
                      )}

                      {/* Notes */}
                      {columnPreset === 'all' && (
                        <td
                          style={{
                            maxWidth: '140px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#cbd5e1',
                            fontStyle: p.notes ? 'normal' : 'italic',
                          }}
                          title={p.notes}
                        >
                          {p.notes || '—'}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Info */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.76rem',
            color: '#94a3b8',
            padding: '4px 2px',
          }}
        >
          <div>
            Showing <strong>{filteredPlayers.length}</strong> of <strong>{players.length}</strong> total registered club players
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span>UTF-8 Excel CSV</span>
            <span>•</span>
            <span>TSV Clipboard Ready</span>
            <span>•</span>
            <span>A4 Landscape PDF</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
