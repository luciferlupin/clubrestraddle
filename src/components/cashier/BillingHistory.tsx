import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  FileText,
  Edit3,
  Trash2,
  AlertTriangle,
  Wallet,
  Smartphone,
  Landmark,
  DollarSign,
  Calendar,
  Eye,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { TournamentEntry, CashTransaction, Expense, PaymentMethod } from '../../types';
import {
  formatClubLabel,
  formatCurrency,
  formatDateOnly,
  formatTimeOnly,
  formatPlayerNumber,
  getTodayDateString,
} from '../../utils/formatters';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { generateCashTransactionInvoice } from '../../utils/invoiceGenerator';

type TodayTxnItem = {
  id: string;
  sourceType: 'tournament_entry' | 'cash_in' | 'cash_out' | 'expense';
  title: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  playerName?: string;
  reference?: string;
  timestamp: string;
  entryObj?: TournamentEntry;
  cashTxnObj?: CashTransaction;
  expenseObj?: Expense;
};

export const BillingHistory: React.FC = () => {
  const {
    players,
    tournaments,
    staffName,
    todayEntries,
    todayCashTransactions,
    todayExpenses,
    todayPhysicalCashBalance,
    todayUpiBalance,
    todayBankBalance,
    todayTotalBalance,
    todayPhysicalCashIn,
    todayPhysicalCashOut,
    todayUpiIn,
    todayUpiOut,
    todayBankIn,
    todayBankOut,
    updateTournamentEntry,
    deleteTournamentEntry,
  } = useClub();

  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState<'all' | PaymentMethod>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'tournament' | 'cash_in' | 'cash_out' | 'expense'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TournamentEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editData, setEditData] = useState({
    tableNumber: '',
    seatNumber: '',
    entryStatus: 'Registered' as TournamentEntry['entryStatus'],
  });

  const todayStr = getTodayDateString();

  const unifiedTodayItems: TodayTxnItem[] = useMemo(() => {
    const list: TodayTxnItem[] = [];

    todayEntries.forEach(entry => {
      list.push({
        id: entry.id,
        sourceType: 'tournament_entry',
        title: `Tournament Entry: ${formatClubLabel(entry.tournamentName)}`,
        category: 'Tournament Registration',
        description: `Receipt #${entry.receiptNumber} · Seat ${entry.seatNumber || 'Assigned'}`,
        amount: entry.buyInAmount + entry.rakeAmount,
        paymentMethod: entry.paymentMethod,
        playerName: entry.playerName,
        reference: entry.paymentReference,
        timestamp: entry.registeredAt,
        entryObj: entry,
      });
    });

    todayCashTransactions.forEach(txn => {
      list.push({
        id: txn.id,
        sourceType: txn.type === 'in' ? 'cash_in' : 'cash_out',
        title: txn.category,
        category: txn.type === 'in' ? 'Cash Received (In)' : 'Cash Given (Payout)',
        description: txn.description || `${txn.category} transaction`,
        amount: txn.amount,
        paymentMethod: txn.paymentMethod,
        playerName: txn.playerName,
        reference: txn.referenceId,
        timestamp: txn.timestamp,
        cashTxnObj: txn,
      });
    });

    todayExpenses.forEach(exp => {
      list.push({
        id: exp.id,
        sourceType: 'expense',
        title: `Expense: ${exp.category}`,
        category: 'Operating Expense',
        description: `${exp.description} (Paid to: ${exp.paidTo || 'N/A'})`,
        amount: exp.amount,
        paymentMethod: exp.paymentMethod,
        reference: `EXP-${exp.id}`,
        timestamp: `${exp.date}T12:00:00.000Z`,
        expenseObj: exp,
      });
    });

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [todayEntries, todayCashTransactions, todayExpenses]);

  const filteredItems = useMemo(() => {
    return unifiedTodayItems.filter(item => {
      const matchSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        (item.playerName && item.playerName.toLowerCase().includes(search.toLowerCase())) ||
        (item.reference && item.reference.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;
      if (filterChannel !== 'all' && item.paymentMethod !== filterChannel) return false;
      if (filterCategory === 'tournament' && item.sourceType !== 'tournament_entry') return false;
      if (filterCategory === 'cash_in' && item.sourceType !== 'cash_in') return false;
      if (filterCategory === 'cash_out' && item.sourceType !== 'cash_out') return false;
      if (filterCategory === 'expense' && item.sourceType !== 'expense') return false;
      return true;
    });
  }, [unifiedTodayItems, search, filterChannel, filterCategory]);

  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenEdit = (entry: TournamentEntry) => {
    setSelectedEntry(entry);
    setEditData({
      tableNumber: entry.tableNumber || '',
      seatNumber: entry.seatNumber || '',
      entryStatus: entry.entryStatus || 'Registered',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;
    updateTournamentEntry(selectedEntry.id, {
      tableNumber: editData.tableNumber,
      seatNumber: editData.seatNumber,
      entryStatus: editData.entryStatus,
    });
    setIsEditModalOpen(false);
    setSelectedEntry(null);
  };

  const handleDelete = () => {
    if (!selectedEntry) return;
    deleteTournamentEntry(selectedEntry.id);
    setIsDeleteModalOpen(false);
    setSelectedEntry(null);
  };

  const handleViewReceipt = (item: TodayTxnItem) => {
    if (item.entryObj) {
      const entry = item.entryObj;
      const playerObj = players.find(p => p.id === entry.playerId);
      const tournamentObj = tournaments.find(t => t.name === entry.tournamentName);

      const invoiceData: ClubInvoiceData = {
        invoiceNumber: entry.receiptNumber,
        invoiceDate: entry.registeredAt,
        category: 'Tournament Entry & Service Charge',
        playerId: playerObj ? formatPlayerNumber(playerObj) : entry.playerId,
        playerName: entry.playerName,
        playerPhone: entry.playerPhone || playerObj?.phone,
        playerEmail: playerObj?.email,
        govtIdType: playerObj?.kyc.govtIdType,
        govtIdNumber: playerObj?.kyc.govtIdNumber,
        membershipTier: playerObj?.membershipTier,
        tableLocation: `${entry.tableNumber || 'Assigned'} • ${entry.seatNumber || 'Assigned'}`,
        eventName: `${formatClubLabel(entry.tournamentName)}`,
        eventDate: `Texas • ${formatDateOnly(entry.registeredAt)} • ${formatTimeOnly(entry.registeredAt)}`,
        eventDetails: `Texas • MTC • Table ${entry.tableNumber || 'Assigned'} • Seat ${entry.seatNumber || 'Assigned'}`,
        items: [
          {
            description: `${formatClubLabel(entry.tournamentName)} - Player Entry Charge`,
            details: `${tournamentObj?.startingChips?.toLocaleString() || '50,000'} Starting Tournament Playing Chips`,
            chips: tournamentObj?.startingChips || 50000,
            amount: entry.buyInAmount,
          },
          {
            description: 'Club Service Charges & Tournament Organization',
            details: 'Club tournament organization & dealer service fee',
            amount: entry.rakeAmount,
          },
        ],
        subtotal: entry.buyInAmount,
        serviceCharge: entry.rakeAmount,
        totalAmount: entry.buyInAmount + entry.rakeAmount,
        paymentMethod: entry.paymentMethod,
        paymentReference: entry.paymentReference,
        cashierName: entry.cashierName,
      };

      setSelectedInvoice(invoiceData);
    } else if (item.cashTxnObj) {
      const matchedPlayer = players.find(p => p.fullName.toLowerCase() === (item.cashTxnObj?.playerName || '').toLowerCase());
      const invoice = generateCashTransactionInvoice(item.cashTxnObj, matchedPlayer, staffName);
      setSelectedInvoice(invoice);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="stats-grid" style={{ marginBottom: 0, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="stat-card" style={{ '--stat-glow': 'rgba(245, 158, 11, 0.25)', '--stat-color': '#fbbf24', border: '1.5px solid rgba(245, 158, 11, 0.45)', background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.6) 0%, rgba(15, 8, 4, 0.9) 100%)' } as React.CSSProperties}>
          <div className="stat-info">
            <span className="stat-label">💵 Today's Cash in Hand</span>
            <span className="stat-value" style={{ color: 'var(--gold-light)' }}>{formatCurrency(todayPhysicalCashBalance)}</span>
            <span className="stat-helper">+{formatCurrency(todayPhysicalCashIn)} in / -{formatCurrency(todayPhysicalCashOut)} out</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}><Wallet size={22} /></div>
        </div>
        <div className="stat-card" style={{ '--stat-glow': 'rgba(56, 189, 248, 0.25)', '--stat-color': '#38bdf8', border: '1.5px solid rgba(56, 189, 248, 0.45)', background: 'linear-gradient(135deg, rgba(8, 28, 38, 0.6) 0%, rgba(4, 14, 20, 0.9) 100%)' } as React.CSSProperties}>
          <div className="stat-info">
            <span className="stat-label">📱 Today's UPI & QR</span>
            <span className="stat-value" style={{ color: '#38bdf8' }}>{formatCurrency(todayUpiBalance)}</span>
            <span className="stat-helper">+{formatCurrency(todayUpiIn)} in / -{formatCurrency(todayUpiOut)} out</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}><Smartphone size={22} /></div>
        </div>
        <div className="stat-card" style={{ '--stat-glow': 'rgba(168, 85, 247, 0.25)', '--stat-color': '#c084fc', border: '1.5px solid rgba(168, 85, 247, 0.45)', background: 'linear-gradient(135deg, rgba(28, 12, 38, 0.6) 0%, rgba(14, 6, 20, 0.9) 100%)' } as React.CSSProperties}>
          <div className="stat-info">
            <span className="stat-label">🏦 Today's Bank Wire</span>
            <span className="stat-value" style={{ color: '#c084fc' }}>{formatCurrency(todayBankBalance)}</span>
            <span className="stat-helper">+{formatCurrency(todayBankIn)} in / -{formatCurrency(todayBankOut)} out</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}><Landmark size={22} /></div>
        </div>
        <div className="stat-card" style={{ '--stat-glow': 'rgba(16, 185, 129, 0.25)', '--stat-color': '#34d399', border: '1.5px solid rgba(16, 185, 129, 0.45)', background: 'linear-gradient(135deg, rgba(8, 30, 20, 0.6) 0%, rgba(4, 15, 10, 0.9) 100%)' } as React.CSSProperties}>
          <div className="stat-info">
            <span className="stat-label">💎 Today's Shift Total</span>
            <span className="stat-value" style={{ color: '#34d399' }}>{formatCurrency(todayTotalBalance)}</span>
            <span className="stat-helper">Net Receipts for {todayStr}</span>
          </div>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}><DollarSign size={22} /></div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(225, 29, 72, 0.12)', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: '12px', fontSize: '0.8rem', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fda4af' }}>
          <Calendar size={16} />
          <span><strong>Today's Cashier Ledger ({todayStr})</strong> — Automatically resets each day.</span>
        </div>
        <span style={{ fontSize: '0.72rem', color: '#cbd5e1', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '6px' }}>{filteredItems.length} records today</span>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={18} color="#fbbf24" />
              Today's Desk Transactions
            </h3>
            <p className="card-subtitle">Live audit trail of all tournament registrations, payouts, and expenses.</p>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input type="text" className="form-input" style={{ paddingLeft: '32px', width: '220px', fontSize: '0.8rem' }} placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 16px', background: 'rgba(0, 0, 0, 0.35)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Type:</span>
            <button className={`btn btn-sm ${filterCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterCategory('all'); setPage(1); }} style={{ fontSize: '0.74rem', padding: '3px 8px' }}>All ({unifiedTodayItems.length})</button>
            <button className={`btn btn-sm ${filterCategory === 'tournament' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterCategory('tournament'); setPage(1); }} style={{ fontSize: '0.74rem', padding: '3px 8px' }}>🏆 Tournament Entries ({todayEntries.length})</button>
            <button className={`btn btn-sm ${filterCategory === 'cash_in' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterCategory('cash_in'); setPage(1); }} style={{ fontSize: '0.74rem', padding: '3px 8px', color: '#34d399' }}>+ Cash In</button>
            <button className={`btn btn-sm ${filterCategory === 'cash_out' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterCategory('cash_out'); setPage(1); }} style={{ fontSize: '0.74rem', padding: '3px 8px', color: '#f87171' }}>- Payouts</button>
            <button className={`btn btn-sm ${filterCategory === 'expense' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterCategory('expense'); setPage(1); }} style={{ fontSize: '0.74rem', padding: '3px 8px', color: '#fda4af' }}>🧾 Expenses</button>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Channel:</span>
            <button className={`btn btn-sm ${filterChannel === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterChannel('all'); setPage(1); }} style={{ fontSize: '0.72rem', padding: '2px 7px' }}>All</button>
            <button className={`btn btn-sm ${filterChannel === 'Cash' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterChannel('Cash'); setPage(1); }} style={{ fontSize: '0.72rem', padding: '2px 7px', color: filterChannel === 'Cash' ? undefined : '#fbbf24' }}>💵 Cash</button>
            <button className={`btn btn-sm ${filterChannel === 'UPI/Digital' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterChannel('UPI/Digital'); setPage(1); }} style={{ fontSize: '0.72rem', padding: '2px 7px', color: filterChannel === 'UPI/Digital' ? undefined : '#38bdf8' }}>📱 UPI</button>
            <button className={`btn btn-sm ${filterChannel === 'Bank Transfer' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setFilterChannel('Bank Transfer'); setPage(1); }} style={{ fontSize: '0.72rem', padding: '2px 7px', color: filterChannel === 'Bank Transfer' ? undefined : '#c084fc' }}>🏦 Bank</button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Type</th>
                <th>Details</th>
                <th>Player</th>
                <th>Channel</th>
                <th>Amount</th>
                <th>Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map(item => (
                <tr key={`${item.sourceType}-${item.id}`}>
                  <td className="tabular-num" style={{ color: 'var(--gold-light)' }}>{item.id.slice(-6)}</td>
                  <td><span style={{ fontSize: '0.72rem', fontWeight: 700 }}>{item.category}</span></td>
                  <td><div style={{ fontWeight: 600 }}>{item.title}</div><div style={{ fontSize: '0.76rem' }}>{item.description}</div></td>
                  <td>{item.playerName || '—'}</td>
                  <td>{item.paymentMethod}</td>
                  <td style={{ fontWeight: 800, color: (item.sourceType === 'tournament_entry' || item.sourceType === 'cash_in') ? '#34d399' : '#f87171' }}>
                    {(item.sourceType === 'tournament_entry' || item.sourceType === 'cash_in') ? '+' : '-'}{formatCurrency(item.amount)}
                  </td>
                  <td>{formatTimeOnly(item.timestamp)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '5px' }}>
                      {(item.entryObj || item.cashTxnObj) && <button className="btn btn-secondary btn-sm" onClick={() => handleViewReceipt(item)}><Eye size={12} /></button>}
                      {item.entryObj && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(item.entryObj!)}><Edit3 size={12} /></button>
                          <button className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} onClick={() => { setSelectedEntry(item.entryObj!); setIsDeleteModalOpen(true); }}><Trash2 size={12} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} pageSize={pageSize} totalItems={filteredItems.length} onPageChange={setPage} onPageSizeChange={setPageSize} itemLabel="items" />
      </div>

      {selectedInvoice && <ClubTaxInvoiceModal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} invoice={selectedInvoice} />}

      {selectedEntry && (
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Entry" size="sm">
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input className="form-input" value={editData.tableNumber} onChange={e => setEditData({ ...editData, tableNumber: e.target.value })} placeholder="Table" />
            <input className="form-input" value={editData.seatNumber} onChange={e => setEditData({ ...editData, seatNumber: e.target.value })} placeholder="Seat" />
            <select className="form-select" value={editData.entryStatus} onChange={e => setEditData({ ...editData, entryStatus: e.target.value as any })}>
              <option value="Registered">Registered</option>
              <option value="Eliminated">Eliminated</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </form>
        </Modal>
      )}

      {selectedEntry && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Void Tournament Entry"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <div>
                <strong>Are you sure you want to void this entry?</strong>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  Player: {selectedEntry?.playerName} · Receipt: {selectedEntry?.receiptNumber}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ margin: '14px -24px -24px', padding: '16px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
                Keep Entry
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Confirm Void
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
