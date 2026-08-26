import React, { useState, useMemo } from 'react';
import {
  FileText,
  DollarSign,
  Printer,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  CheckCircle2,
  Receipt,
  CreditCard,
  Trophy,
  User,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Player, DailyCheckIn, TournamentEntry, CashTransaction, Tournament } from '../../types';
import { useClub } from '../../context/ClubContext';
import { formatCurrency, formatDateOnly, formatDateTime, formatTimeOnly } from '../../utils/formatters';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { generateEntryFeeInvoice, generateTournamentInvoice, generateCashTransactionInvoice } from '../../utils/invoiceGenerator';

interface PlayerLedgerProps {
  player: Player;
  onOpenInvoice?: (invoice: ClubInvoiceData) => void;
}

export interface LedgerItem {
  id: string;
  date: string;
  type: 'Entry Fee' | 'Tournament Entry' | 'Cash Game Buy-in' | 'Chip Purchase' | 'Cash Out' | 'Tournament Payout' | 'Service Fee';
  description: string;
  paymentMethod: string;
  referenceId: string;
  debit?: number; // Outflow (money paid)
  credit?: number; // Inflow (money received)
  invoiceData?: ClubInvoiceData;
}

export const PlayerLedger: React.FC<PlayerLedgerProps> = ({ player, onOpenInvoice }) => {
  const { checkIns, entries, cashTransactions, tournaments, staffName } = useClub();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeInvoice, setActiveInvoice] = useState<ClubInvoiceData | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Compile all player ledger items from check-ins, tournament entries, and cash transactions
  const ledgerItems = useMemo<LedgerItem[]>(() => {
    const items: LedgerItem[] = [];

    // 1. Entry Fees from Check-Ins (₹500 per visit, ONLY SECURITY APPROVED)
    const playerCheckIns = checkIns.filter(c => c.playerId === player.id && c.verificationStatus === 'approved');
    playerCheckIns.forEach(c => {
      const checkInDateTime = c.checkInDate && c.checkInTime ? `${c.checkInDate}T${c.checkInTime}` : player.registeredAt;
      const inv = generateEntryFeeInvoice(player, c, staffName);
      items.push({
        id: `LED-ENT-${c.id}`,
        date: checkInDateTime,
        type: 'Entry Fee',
        description: 'Club Door Entry & Facility Access Fee (5% GST Included)',
        paymentMethod: c.paymentMethod || 'Cash',
        referenceId: c.id,
        debit: 500,
        invoiceData: inv,
      });
    });

    // 2. Tournament Entries
    const playerTournEntries = entries.filter((e: TournamentEntry) => e.playerId === player.id);
    playerTournEntries.forEach((e: TournamentEntry) => {
      const trn = tournaments.find(t => t.id === e.tournamentId);
      const totalAmount = (e.buyInAmount || 0) + (e.rakeAmount || 0);
      const inv = generateTournamentInvoice(e, trn, player, staffName);
      items.push({
        id: `LED-TRN-${e.id}`,
        date: e.registeredAt,
        type: 'Tournament Entry',
        description: `${e.tournamentName} (Entry Charge ₹${e.buyInAmount.toLocaleString()} + Service Charge ₹${e.rakeAmount.toLocaleString()})`,
        paymentMethod: e.paymentMethod,
        referenceId: e.receiptNumber || e.id,
        debit: totalAmount,
        invoiceData: inv,
      });
    });

    // 3. Cash Transactions matching Player Name
    const playerTxns = cashTransactions.filter(
      t => t.playerName && t.playerName.toLowerCase().trim() === player.fullName.toLowerCase().trim()
    );
    playerTxns.forEach(txn => {
      const isPayoutOrCashOut = txn.type === 'out' || txn.category.includes('Payout') || txn.category.includes('Cash Out');
      const inv = !isPayoutOrCashOut ? generateCashTransactionInvoice(txn, player, staffName) : undefined;
      items.push({
        id: `LED-CSH-${txn.id}`,
        date: txn.timestamp,
        type: txn.category.includes('Payout') ? 'Tournament Payout' : txn.category.includes('Chip') ? 'Chip Purchase' : txn.type === 'out' ? 'Cash Out' : 'Cash Game Buy-in',
        description: `${txn.category} - ${txn.description}`,
        paymentMethod: txn.paymentMethod,
        referenceId: txn.referenceId || txn.id,
        debit: txn.type === 'in' ? txn.amount : undefined,
        credit: txn.type === 'out' ? txn.amount : undefined,
        invoiceData: inv,
      });
    });

    // 4. Tournament Prize Winnings from Settled Tournaments
    tournaments.forEach(trn => {
      if (trn.winners && trn.winners.length > 0) {
        const winningRank = trn.winners.find(w => w.playerId === player.id);
        if (winningRank) {
          items.push({
            id: `LED-WIN-${trn.id}-${winningRank.rank}`,
            date: winningRank.awardedAt || trn.completedAt || trn.createdAt,
            type: 'Tournament Payout',
            description: `🏆 ${winningRank.rank === 1 ? '1st Place Champion' : winningRank.rank === 2 ? '2nd Place Runner-up' : winningRank.rank === 3 ? '3rd Place Finalist' : `Rank #${winningRank.rank}`} Prize - ${trn.name}`,
            paymentMethod: 'Vault Wallet Credit',
            referenceId: trn.id,
            credit: winningRank.prizeAmount,
          });
        }
      }
    });

    // Sort newest first
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [player, checkIns, entries, tournaments, cashTransactions, staffName]);

  const totalSpent = useMemo(() => ledgerItems.reduce((sum, item) => sum + (item.debit || 0), 0), [ledgerItems]);
  const totalReceived = useMemo(() => ledgerItems.reduce((sum, item) => sum + (item.credit || 0), 0), [ledgerItems]);

  const totalEntryFees = ledgerItems.filter(i => i.type === 'Entry Fee').reduce((sum, item) => sum + (item.debit || 0), 0);
  const totalTournamentSpent = ledgerItems.filter(i => i.type === 'Tournament Entry').reduce((sum, item) => sum + (item.debit || 0), 0);

  const filteredItems = useMemo(() => {
    return ledgerItems.filter(item => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'entry') return item.type === 'Entry Fee';
      if (selectedCategory === 'tournament') return item.type === 'Tournament Entry' || item.type === 'Tournament Payout';
      if (selectedCategory === 'cash') return item.type === 'Chip Purchase' || item.type === 'Cash Out' || item.type === 'Cash Game Buy-in';
      return true;
    });
  }, [ledgerItems, selectedCategory]);

  const handleOpenInvoiceModal = (inv: ClubInvoiceData) => {
    if (onOpenInvoice) {
      onOpenInvoice(inv);
    } else {
      setActiveInvoice(inv);
      setIsInvoiceOpen(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Financial Stat Summary */}
      <div className="stats-grid" style={{ marginBottom: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <div className="stat-card" style={{ background: 'rgba(225, 29, 72, 0.12)', border: '1px solid rgba(225, 29, 72, 0.4)', borderRadius: '12px', padding: '14px 16px' }}>
          <span style={{ fontSize: '0.72rem', color: '#fda4af', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            Total Inflows (Debited)
          </span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
            {formatCurrency(totalSpent)}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Entry fees, tournament buy-ins & chips
          </span>
        </div>

        <div className="stat-card" style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: '12px', padding: '14px 16px' }}>
          <span style={{ fontSize: '0.72rem', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            Total Cash-outs (Credited)
          </span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
            {formatCurrency(totalReceived)}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
            Tournament winnings & cash-outs
          </span>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '14px 16px' }}>
          <span style={{ fontSize: '0.72rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            Door Entry Fees (₹500/Visit · 5% GST)
          </span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
            {formatCurrency(totalEntryFees)}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {ledgerItems.filter(i => i.type === 'Entry Fee').length} verified visits (incl. 5% GST)
          </span>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '14px 16px' }}>
          <span style={{ fontSize: '0.72rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            Tournament Entries
          </span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fb7185', marginTop: '4px' }}>
            {formatCurrency(totalTournamentSpent)}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Including 18% GST Service Fee
          </span>
        </div>
      </div>

      {/* Filter Toolbar & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Transactions' },
            { id: 'entry', label: '₹500 Entry (5% GST)' },
            { id: 'tournament', label: 'Tournaments' },
            { id: 'cash', label: 'Cash & Chips' },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              className={`btn btn-sm ${selectedCategory === f.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(f.id)}
              style={{ fontSize: '0.76rem', padding: '5px 12px' }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
          Showing <strong>{filteredItems.length}</strong> ledger entries
        </div>
      </div>

      {/* Ledger Table */}
      <div className="table-responsive" style={{ border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: '12px', overflow: 'hidden' }}>
        <table className="table" style={{ margin: 0 }}>
          <thead>
            <tr style={{ background: '#17060a' }}>
              <th>Date & Time</th>
              <th>Transaction / Activity</th>
              <th>Reference</th>
              <th>Payment</th>
              <th style={{ textAlign: 'right' }}>Debit (Paid ₹)</th>
              <th style={{ textAlign: 'right' }}>Credit (Received ₹)</th>
              <th style={{ textAlign: 'center' }}>Tax Invoice</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  <Receipt size={32} color="#e11d48" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>No transaction history found for this category.</p>
                </td>
              </tr>
            ) : (
              filteredItems.map(item => (
                <tr key={item.id}>
                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{formatDateOnly(item.date)}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{formatTimeOnly(item.date)}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: item.type === 'Entry Fee'
                            ? 'rgba(225, 29, 72, 0.25)'
                            : item.type === 'Tournament Entry'
                            ? 'rgba(244, 63, 94, 0.25)'
                            : item.credit
                            ? 'rgba(16, 185, 129, 0.25)'
                            : 'rgba(255, 255, 255, 0.1)',
                          color: item.type === 'Entry Fee'
                            ? '#fb7185'
                            : item.type === 'Tournament Entry'
                            ? '#f43f5e'
                            : item.credit
                            ? '#6ee7b7'
                            : '#ffffff',
                          border: '1px solid rgba(255,255,255,0.1)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.type}
                      </span>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#ffffff' }}>
                        {item.description}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                    {item.referenceId}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    {item.paymentMethod}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: item.debit ? '#fb7185' : '#64748b' }}>
                    {item.debit ? formatCurrency(item.debit) : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: item.credit ? '#34d399' : '#64748b' }}>
                    {item.credit ? formatCurrency(item.credit) : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {item.invoiceData ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleOpenInvoiceModal(item.invoiceData!)}
                        title="View Official GST Tax Invoice"
                      >
                        <FileText size={13} color="#e11d48" />
                        <span>View Invoice</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Tax Invoice Modal */}
      <ClubTaxInvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        invoice={activeInvoice}
      />
    </div>
  );
};
