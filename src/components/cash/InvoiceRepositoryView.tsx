import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  Eye,
  CreditCard,
  Building2,
  Receipt,
  Users,
  Trophy,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  CheckCircle2
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { formatCurrency, formatDateTime, formatDateOnly, formatTimeOnly, maskGovtId, formatPlayerNumber } from '../../utils/formatters';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { Pagination } from '../common/Pagination';
import {
  generateEntryFeeInvoice,
  generateTournamentInvoice,
  generateCashTransactionInvoice
} from '../../utils/invoiceGenerator';
import { Player, DailyCheckIn, TournamentEntry, CashTransaction, Tournament } from '../../types';

export interface AggregatedInvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  category: 'Door Entry' | 'Tournament' | 'Cash Buy-in' | 'Chip Purchase' | 'Settlement';
  playerName: string;
  playerId?: string;
  playerPhone?: string;
  panOrAadhaar?: string;
  description: string;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentReference?: string;
  cashierOrStaff: string;
  invoiceData: ClubInvoiceData;
}

export const InvoiceRepositoryView: React.FC = () => {
  const { players, checkIns, entries, tournaments, cashTransactions, staffName } = useClub();
  
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compile all invoice records from live database state
  const allInvoices = useMemo<AggregatedInvoiceRecord[]>(() => {
    const list: AggregatedInvoiceRecord[] = [];

    // 1. ₹500 Door Entry Invoices from Check-Ins (ONLY SECURITY APPROVED)
    checkIns.filter(chk => chk.verificationStatus === 'approved').forEach(chk => {
      const player = players.find(p => p.id === chk.playerId) || {
        id: chk.playerId,
        fullName: chk.playerName,
        phone: chk.playerPhone,
        email: '',
        membershipTier: 'Standard',
        kycStatus: 'verified',
        registeredAt: chk.checkInDate || new Date().toISOString(),
        totalVisits: 1,
        kyc: {
          fullName: chk.playerName,
          phone: chk.playerPhone,
          email: '',
          dateOfBirth: '2000-01-01',
          govtIdType: 'Aadhaar & PAN Card',
          govtIdNumber: 'KYC-VERIFIED',
          address: 'Delhi NCR, India',
          emergencyContactName: '',
          emergencyContactPhone: '',
          photoUrl: '',
          agreedToRules: true,
          submittedAt: new Date().toISOString(),
        }
      } as Player;

      const invoiceData = generateEntryFeeInvoice(player, chk, staffName);
      const chkDateTime = chk.checkInDate && chk.checkInTime ? `${chk.checkInDate}T${chk.checkInTime}` : new Date().toISOString();

      list.push({
        id: `INV-REC-ENT-${chk.id}`,
        invoiceNumber: invoiceData.invoiceNumber,
        date: chkDateTime,
        category: 'Door Entry',
        playerName: chk.playerName,
        playerId: formatPlayerNumber(player),
        playerPhone: chk.playerPhone,
        panOrAadhaar: player.kyc?.panNumber || player.kyc?.aadhaarNumber || player.kyc?.govtIdNumber,
        description: 'Club Door Entry & Facility Access Fee (SAC 999691 • 5% GST)',
        taxableAmount: 476.19,
        gstAmount: 23.81,
        totalAmount: 500,
        paymentMethod: chk.paymentMethod || 'Cash',
        paymentReference: `ENT-${chk.id}`,
        cashierOrStaff: chk.verifiedBy || staffName || 'Security Desk',
        invoiceData,
      });
    });

    // 2. Tournament Entry & Service Charge Invoices
    entries.forEach(entry => {
      const player = players.find(p => p.id === entry.playerId);
      const tournament = tournaments.find(t => t.id === entry.tournamentId);
      const invoiceData = generateTournamentInvoice(entry, tournament, player, staffName);
      const total = (entry.buyInAmount || 0) + (entry.rakeAmount || 0);
      const rake = entry.rakeAmount || 0;
      const taxableService = rake > 0 ? Number((rake / 1.18).toFixed(2)) : 0;
      const gstService = rake > 0 ? Number((rake - taxableService).toFixed(2)) : 0;

      list.push({
        id: `INV-REC-TRN-${entry.id}`,
        invoiceNumber: invoiceData.invoiceNumber,
        date: entry.registeredAt || new Date().toISOString(),
        category: 'Tournament',
        playerName: entry.playerName,
        playerId: player ? formatPlayerNumber(player) : entry.playerId,
        playerPhone: entry.playerPhone || player?.phone,
        panOrAadhaar: player?.kyc?.panNumber || player?.kyc?.aadhaarNumber || player?.kyc?.govtIdNumber,
        description: `${entry.tournamentName} (Entry Charge ₹${entry.buyInAmount.toLocaleString()} + Service Charge ₹${entry.rakeAmount.toLocaleString()})`,
        taxableAmount: taxableService,
        gstAmount: gstService,
        totalAmount: total,
        paymentMethod: entry.paymentMethod || 'Cash',
        paymentReference: entry.paymentReference || `TRN-${entry.id}`,
        cashierOrStaff: entry.cashierName || staffName || 'Cashier Desk',
        invoiceData,
      });
    });

    // 3. Cash Game Buy-ins, Chip Purchases, and Inflow Collections (Excludes Payouts/Cash Outs)
    cashTransactions.forEach(txn => {
      // Cash payouts / cash outs are disbursements to players and do not generate tax invoices
      if (txn.type === 'out' || txn.category.includes('Payout') || txn.category.includes('Cash Out')) {
        return;
      }

      const player = players.find(p => p.fullName === txn.playerName || p.id === txn.referenceId);
      const invoiceData = generateCashTransactionInvoice(txn, player, staffName);

      let cat: AggregatedInvoiceRecord['category'] = 'Settlement';
      if (txn.category.includes('Tournament')) cat = 'Tournament';
      else if (txn.category.includes('Chip')) cat = 'Chip Purchase';
      else if (txn.category.includes('Buy-in') || txn.category.includes('Cash In')) cat = 'Cash Buy-in';

      list.push({
        id: `INV-REC-CSH-${txn.id}`,
        invoiceNumber: invoiceData.invoiceNumber,
        date: txn.timestamp || new Date().toISOString(),
        category: cat,
        playerName: txn.playerName || player?.fullName || 'Cash Desk Customer',
        playerId: player ? formatPlayerNumber(player) : undefined,
        playerPhone: player?.phone,
        panOrAadhaar: player?.kyc?.panNumber || player?.kyc?.aadhaarNumber || player?.kyc?.govtIdNumber,
        description: `${txn.category} - ${txn.description}`,
        taxableAmount: Number((txn.amount / 1.18).toFixed(2)),
        gstAmount: Number((txn.amount - (txn.amount / 1.18)).toFixed(2)),
        totalAmount: txn.amount,
        paymentMethod: txn.paymentMethod || 'Cash',
        paymentReference: txn.referenceId || txn.id,
        cashierOrStaff: txn.cashierName || staffName || 'Cashier Desk',
        invoiceData,
      });
    });

    // Sort newest invoices first
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [players, checkIns, entries, tournaments, cashTransactions, staffName]);

  // Filtered invoices list
  const filteredInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        inv.playerName.toLowerCase().includes(search.toLowerCase()) ||
        (inv.playerPhone && inv.playerPhone.includes(search)) ||
        (inv.playerId && inv.playerId.toLowerCase().includes(search.toLowerCase())) ||
        (inv.paymentReference && inv.paymentReference.toLowerCase().includes(search.toLowerCase())) ||
        inv.description.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'entry') return inv.category === 'Door Entry';
      if (categoryFilter === 'tournament') return inv.category === 'Tournament';
      if (categoryFilter === 'cash') return inv.category === 'Cash Buy-in' || inv.category === 'Chip Purchase';

      return true;
    });
  }, [allInvoices, search, categoryFilter]);

  const paginatedInvoices = useMemo(() => {
    return filteredInvoices.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredInvoices, page, pageSize]);

  // Aggregate Metrics
  const totalVolume = useMemo(() => allInvoices.reduce((sum, i) => sum + i.totalAmount, 0), [allInvoices]);
  const totalGST = useMemo(() => allInvoices.reduce((sum, i) => sum + i.gstAmount, 0), [allInvoices]);
  const doorEntryCount = useMemo(() => allInvoices.filter(i => i.category === 'Door Entry').length, [allInvoices]);
  const tournamentInvoicesCount = useMemo(() => allInvoices.filter(i => i.category === 'Tournament').length, [allInvoices]);

  const handleOpenInvoice = (invData: ClubInvoiceData) => {
    setSelectedInvoice(invData);
    setIsModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Hero KPI Summary */}
      <div className="stats-grid" style={{ marginBottom: 0 }}>
        {/* Total Invoices */}
        <div className="stat-card" style={{ borderColor: 'rgba(225, 29, 72, 0.4)' }}>
          <div className="stat-header">
            <span className="stat-label">Total Invoices Generated</span>
            <div className="stat-icon" style={{ background: 'rgba(225, 29, 72, 0.15)', color: '#f43f5e' }}>
              <Receipt size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#ffffff' }}>
            {allInvoices.length}
          </div>
          <div className="stat-subtext" style={{ color: '#fda4af' }}>
            Official Tax Invoices (SAC 999691)
          </div>
        </div>

        {/* Total Invoiced Volume */}
        <div className="stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
          <div className="stat-header">
            <span className="stat-label">Total Invoiced Amount</span>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div className="stat-value tabular-num" style={{ color: '#ffffff' }}>
            {formatCurrency(totalVolume)}
          </div>
          <div className="stat-subtext" style={{ color: '#34d399' }}>
            GST Total: {formatCurrency(totalGST)}
          </div>
        </div>

        {/* Door Entry Invoices */}
        <div className="stat-card" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
          <div className="stat-header">
            <span className="stat-label">₹500 Door Entry Invoices</span>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value tabular-num" style={{ color: '#ffffff' }}>
            {doorEntryCount}
          </div>
          <div className="stat-subtext" style={{ color: '#fbbf24' }}>
            Total Entry Fees: {formatCurrency(doorEntryCount * 500)}
          </div>
        </div>

        {/* Tournament Invoices */}
        <div className="stat-card" style={{ borderColor: 'rgba(168, 85, 247, 0.4)' }}>
          <div className="stat-header">
            <span className="stat-label">Tournament Invoices</span>
            <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <Trophy size={18} />
            </div>
          </div>
          <div className="stat-value tabular-num" style={{ color: '#ffffff' }}>
            {tournamentInvoicesCount}
          </div>
          <div className="stat-subtext" style={{ color: '#c084fc' }}>
            Tournament Entries & Service Charges
          </div>
        </div>
      </div>

      {/* Main Invoices Table & Card List */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '14px', alignItems: 'flex-start' }}>
          <div style={{ flex: '1 1 280px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#e11d48" />
              <span>Central Tax Invoice & Billing Records ({filteredInvoices.length})</span>
            </h3>
            <p className="card-subtitle">
              Comprehensive ledger of official Tax Invoices (5% Door Entry & 18% Service Charges) for player door entries, tournaments, and chip transactions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', width: '100%', maxWidth: '100%' }}>
            {/* Category Filter Pills (Smooth Horizontal Scroll on Mobile) */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%', scrollbarWidth: 'none' }}>
              {[
                { id: 'all', label: 'All Records' },
                { id: 'entry', label: '₹500 Entry' },
                { id: 'tournament', label: 'Tournaments' },
                { id: 'cash', label: 'Cash & Chips' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  className={`btn btn-sm ${categoryFilter === f.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '5px 12px', fontSize: '0.76rem', borderRadius: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onClick={() => {
                    setCategoryFilter(f.id);
                    setPage(1);
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px', width: '100%' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '32px', height: '36px', fontSize: '0.82rem', width: '100%' }}
                placeholder="Search Invoice #, Name, Phone..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Mobile View: Dedicated Luxury Cards */}
        <div className="mobile-only-cards" style={{ padding: '12px 14px 4px' }}>
          {paginatedInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
              No invoice records found matching your filter.
            </div>
          ) : (
            paginatedInvoices.map(inv => (
              <div
                key={inv.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(20, 8, 12, 0.85) 0%, rgba(10, 3, 6, 0.95) 100%)',
                  border: '1px solid rgba(225, 29, 72, 0.35)',
                  borderRadius: '14px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                {/* Card Header: Invoice # & Category Pill */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.88rem', color: 'var(--gold-light)' }}>
                      {inv.invoiceNumber}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {formatDateTime(inv.date)}
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background:
                        inv.category === 'Door Entry'
                          ? 'rgba(225, 29, 72, 0.18)'
                          : inv.category === 'Tournament'
                          ? 'rgba(168, 85, 247, 0.18)'
                          : 'rgba(16, 185, 129, 0.18)',
                      color:
                        inv.category === 'Door Entry'
                          ? '#fda4af'
                          : inv.category === 'Tournament'
                          ? '#c084fc'
                          : '#6ee7b7',
                      border: '1px solid rgba(255,255,255,0.12)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inv.category}
                  </span>
                </div>

                {/* Member & Description Row */}
                <div style={{ background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px', padding: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#ffffff' }}>{inv.playerName}</strong>
                    {inv.playerId && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--gold-light)', fontWeight: 600 }}>
                        Member #{inv.playerId}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                    📞 {inv.playerPhone || 'On File'} · Staff: {inv.cashierOrStaff}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: '6px', lineHeight: '1.35', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                    {inv.description}
                  </div>
                </div>

                {/* Amount Details & Action Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2px' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                      Taxable {formatCurrency(inv.taxableAmount)} + GST {formatCurrency(inv.gstAmount)}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '1px' }}>
                      {formatCurrency(inv.totalAmount)}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 14px', borderRadius: '8px', background: 'rgba(225, 29, 72, 0.2)', borderColor: 'rgba(225, 29, 72, 0.5)', color: '#ffffff' }}
                    onClick={() => handleOpenInvoice(inv.invoiceData)}
                  >
                    <Eye size={14} color="#fda4af" />
                    <span>View Bill</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="table-responsive desktop-only-table">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice # & Date</th>
                <th>Member / Customer</th>
                <th>Category / Supply Description</th>
                <th style={{ textAlign: 'right' }}>Taxable Amt</th>
                <th style={{ textAlign: 'right' }}>GST Amt</th>
                <th style={{ textAlign: 'right' }}>Total (₹)</th>
                <th>Payment Ref</th>
                <th>Cashier / Staff</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No invoice records found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--gold-light)' }}>
                        {inv.invoiceNumber}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {formatDateTime(inv.date)}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                        {inv.playerName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {inv.playerId ? `${inv.playerId} • ` : ''}{inv.playerPhone || 'On File'}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            background:
                              inv.category === 'Door Entry'
                                ? 'rgba(225, 29, 72, 0.15)'
                                : inv.category === 'Tournament'
                                ? 'rgba(168, 85, 247, 0.15)'
                                : 'rgba(16, 185, 129, 0.15)',
                            color:
                              inv.category === 'Door Entry'
                                ? '#fda4af'
                                : inv.category === 'Tournament'
                                ? '#c084fc'
                                : '#6ee7b7',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}
                        >
                          {inv.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {inv.description}
                      </div>
                    </td>

                    <td className="tabular-num" style={{ textAlign: 'right', color: '#94a3b8', fontSize: '0.82rem' }}>
                      {formatCurrency(inv.taxableAmount)}
                    </td>

                    <td className="tabular-num" style={{ textAlign: 'right', color: '#fda4af', fontSize: '0.82rem' }}>
                      {formatCurrency(inv.gstAmount)}
                    </td>

                    <td className="tabular-num" style={{ textAlign: 'right', fontWeight: 800, color: '#ffffff', fontSize: '0.9rem' }}>
                      {formatCurrency(inv.totalAmount)}
                    </td>

                    <td>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                        {inv.paymentMethod}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        {inv.paymentReference || '—'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                        {inv.cashierOrStaff}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', padding: '4px 10px' }}
                        onClick={() => handleOpenInvoice(inv.invoiceData)}
                        title="View Official GST Thermal Tax Invoice"
                      >
                        <Eye size={13} color="#f43f5e" />
                        <span>Print Bill</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredInvoices.length > pageSize && (
          <div style={{ marginTop: '14px' }}>
            <Pagination
              currentPage={page}
              pageSize={pageSize}
              totalItems={filteredInvoices.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Official Tax Invoice Modal */}
      <ClubTaxInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
};
