import React, { useState, useMemo } from 'react';
import {
  Download,
  Copy,
  Printer,
  Search,
  Check,
  Filter,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Smartphone,
  Landmark,
  Calendar,
  X,
  FileSpreadsheet,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { CashTransaction, PaymentMethod, CashCategory, CashFlowType } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  printLedgerReport,
  downloadLedgerCSV,
  copyLedgerToClipboard,
} from '../../utils/exportLedger';
import { Modal } from '../common/Modal';

interface AdminLedgerExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: CashTransaction[];
  initialPreset?: 'all' | 'gate' | 'buyin' | 'chip' | 'payout';
}

type DatePreset = 'all' | 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'custom';

export const AdminLedgerExportModal: React.FC<AdminLedgerExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  initialPreset = 'all',
}) => {
  // Preset selection
  const [preset, setPreset] = useState<'all' | 'gate' | 'buyin' | 'chip' | 'payout' | 'custom'>(initialPreset);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFlow, setSelectedFlow] = useState<'all' | CashFlowType>('all');
  const [selectedChannel, setSelectedChannel] = useState<'all' | PaymentMethod>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync initial preset if modal opens with a specific preset
  React.useEffect(() => {
    if (isOpen && initialPreset) {
      handleSelectPreset(initialPreset);
    }
  }, [isOpen, initialPreset]);

  // Handle Preset Switching
  const handleSelectPreset = (p: 'all' | 'gate' | 'buyin' | 'chip' | 'payout' | 'custom') => {
    setPreset(p);
    if (p === 'all') {
      setSelectedCategory('all');
      setSelectedFlow('all');
    } else if (p === 'gate') {
      setSelectedCategory('gate');
      setSelectedFlow('all');
    } else if (p === 'buyin') {
      setSelectedCategory('buyin');
      setSelectedFlow('in');
    } else if (p === 'chip') {
      setSelectedCategory('Chip Purchase');
      setSelectedFlow('all');
    } else if (p === 'payout') {
      setSelectedCategory('payout');
      setSelectedFlow('out');
    }
  };

  // Distinct categories available in current transactions
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Filtered dataset
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions.filter(t => {
      // 1. Category / Stream Filter
      if (preset === 'gate' || selectedCategory === 'gate') {
        const isGateCategory =
          t.category === 'Gate Cash Handover' ||
          t.category === 'Gate Entry Fee Transfer' ||
          (t.description && t.description.toLowerCase().includes('gate'));
        if (!isGateCategory) return false;
      } else if (preset === 'buyin' || selectedCategory === 'buyin') {
        const isBuyIn =
          t.category === 'Tournament Buy-in' ||
          t.category === 'Cash Game Buy-in' ||
          t.category === 'Tournament Entry' ||
          (t.description && t.description.toLowerCase().includes('buy-in'));
        if (!isBuyIn) return false;
      } else if (preset === 'payout' || selectedCategory === 'payout') {
        const isPayout =
          t.category === 'Tournament Prize Payout' ||
          t.category === 'Cash Game Cash-out' ||
          t.category === 'Player Cash Withdrawal' ||
          t.category === 'Player Refund';
        if (!isPayout) return false;
      } else if (selectedCategory !== 'all') {
        if (t.category !== selectedCategory) return false;
      }

      // 2. Flow Direction
      if (selectedFlow !== 'all' && t.type !== selectedFlow) return false;

      // 3. Payment Method / Channel
      if (selectedChannel !== 'all' && t.paymentMethod !== selectedChannel) return false;

      // 4. Date Range
      const txnDate = new Date(t.timestamp);
      const txnDateStr = t.timestamp.slice(0, 10);

      if (datePreset === 'today' && txnDateStr !== todayStr) return false;
      if (datePreset === 'yesterday' && txnDateStr !== yesterdayStr) return false;
      if (datePreset === 'last7' && txnDate < sevenDaysAgo) return false;
      if (datePreset === 'thisMonth' && txnDate < startOfMonth) return false;
      if (datePreset === 'custom') {
        if (startDate && txnDateStr < startDate) return false;
        if (endDate && txnDateStr > endDate) return false;
      }

      // 5. Search text
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matches =
          t.id.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          (t.playerName && t.playerName.toLowerCase().includes(query)) ||
          (t.referenceId && t.referenceId.toLowerCase().includes(query)) ||
          (t.cashierName && t.cashierName.toLowerCase().includes(query));

        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [
    transactions,
    preset,
    selectedCategory,
    selectedFlow,
    selectedChannel,
    datePreset,
    startDate,
    endDate,
    search,
  ]);

  // Aggregate stats
  const totalInflow = useMemo(
    () => filteredTransactions.filter(t => t.type === 'in').reduce((s, t) => s + (t.amount || 0), 0),
    [filteredTransactions]
  );
  const totalOutflow = useMemo(
    () => filteredTransactions.filter(t => t.type === 'out').reduce((s, t) => s + (t.amount || 0), 0),
    [filteredTransactions]
  );
  const netDelta = totalInflow - totalOutflow;

  // Channel breakdown
  const channelStats = useMemo(() => {
    let cashIn = 0, cashOut = 0;
    let upiIn = 0, upiOut = 0;
    let bankIn = 0, bankOut = 0;

    filteredTransactions.forEach(t => {
      if (t.paymentMethod === 'Cash') {
        if (t.type === 'in') cashIn += t.amount; else cashOut += t.amount;
      } else if (t.paymentMethod === 'UPI/Digital') {
        if (t.type === 'in') upiIn += t.amount; else upiOut += t.amount;
      } else if (t.paymentMethod === 'Bank Transfer') {
        if (t.type === 'in') bankIn += t.amount; else bankOut += t.amount;
      }
    });

    return { cashIn, cashOut, upiIn, upiOut, bankIn, bankOut };
  }, [filteredTransactions]);

  // Generate readable labels for PDF
  const getFilterSummaryLabel = () => {
    const parts: string[] = [];
    if (preset === 'gate' || selectedCategory === 'gate') parts.push('Gate Cash Stream Only');
    else if (preset === 'buyin' || selectedCategory === 'buyin') parts.push('Buy-Ins Only (Cash & Tournaments)');
    else if (preset === 'chip') parts.push('Chip Purchases Only');
    else if (preset === 'payout') parts.push('Payouts & Cashouts Only');
    else if (selectedCategory !== 'all') parts.push(`Category: ${selectedCategory}`);

    if (selectedFlow !== 'all') parts.push(`Flow: ${selectedFlow === 'in' ? 'Cash In Only' : 'Cash Out Only'}`);
    if (selectedChannel !== 'all') parts.push(`Channel: ${selectedChannel}`);
    if (search.trim()) parts.push(`Search: "${search.trim()}"`);

    return parts.length > 0 ? parts.join(' | ') : 'All Ledger Categories & Records';
  };

  const getDateRangeLabel = () => {
    if (datePreset === 'today') return 'Today';
    if (datePreset === 'yesterday') return 'Yesterday';
    if (datePreset === 'last7') return 'Last 7 Days';
    if (datePreset === 'thisMonth') return 'Current Month';
    if (datePreset === 'custom') {
      if (startDate && endDate) return `${startDate} to ${endDate}`;
      if (startDate) return `From ${startDate}`;
      if (endDate) return `Until ${endDate}`;
    }
    return 'All Time History';
  };

  const getReportTitle = () => {
    if (preset === 'gate' || selectedCategory === 'gate') {
      return 'Club Re Straddle — Gate Cash Handover & Entry Fee Ledger';
    }
    if (preset === 'buyin' || selectedCategory === 'buyin') {
      return 'Club Re Straddle — Tournament & Cash Game Buy-Ins Ledger';
    }
    if (preset === 'chip') {
      return 'Club Re Straddle — Table Chip Purchases Ledger';
    }
    if (preset === 'payout') {
      return 'Club Re Straddle — Prize Payouts & Player Cash-Outs Ledger';
    }
    if (selectedCategory !== 'all') {
      return `Club Re Straddle — ${selectedCategory} Ledger`;
    }
    return 'Club Re Straddle — Master Total Cash Ledger';
  };

  // Actions
  const handlePrint = () => {
    printLedgerReport(filteredTransactions, {
      title: getReportTitle(),
      subtitle: `${getReportTitle()} • Official Treasury Record`,
      filterSummary: getFilterSummaryLabel(),
      dateRangeLabel: getDateRangeLabel(),
      preparedBy: 'Admin Treasury Management',
    });
  };

  const handleDownloadCSV = () => {
    const slug = (preset === 'all' ? 'total_ledger' : preset + '_ledger').toLowerCase();
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadLedgerCSV(filteredTransactions, `Club_Re_Straddle_${slug}_${dateStr}.csv`);
  };

  const handleCopyClipboard = async () => {
    const success = await copyLedgerToClipboard(filteredTransactions);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleResetFilters = () => {
    setPreset('all');
    setSelectedCategory('all');
    setSelectedFlow('all');
    setSelectedChannel('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Financial Ledger PDF & Treasury Report"
      subtitle={`Official transaction ledger & stream reports • ${filteredTransactions.length} records selected`}
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '82vh' }}>
        {/* Quick Stream Preset Selector */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(225, 29, 72, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(225, 29, 72, 0.25)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fda4af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🎯 Quick Report Presets:
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              Choose a preset or customize specific categories below
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`btn btn-sm ${preset === 'all' && selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSelectPreset('all')}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <DollarSign size={14} /> Total Master Ledger
            </button>

            <button
              type="button"
              className={`btn btn-sm ${preset === 'gate' || selectedCategory === 'gate' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSelectPreset('gate')}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              🚪 Gate Cash Only
            </button>

            <button
              type="button"
              className={`btn btn-sm ${preset === 'buyin' || selectedCategory === 'buyin' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSelectPreset('buyin')}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              🎟️ Buy-Ins Only
            </button>

            <button
              type="button"
              className={`btn btn-sm ${preset === 'chip' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSelectPreset('chip')}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              🪙 Chip Purchases
            </button>

            <button
              type="button"
              className={`btn btn-sm ${preset === 'payout' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleSelectPreset('payout')}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              🏆 Payouts & Cashouts
            </button>
          </div>
        </div>

        {/* Detailed Filter Matrix Controls */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            alignItems: 'end',
          }}
        >
          {/* Specific Category Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
              Specific Category
            </label>
            <select
              className="form-input"
              style={{ fontSize: '0.8rem', padding: '6px 10px', width: '100%' }}
              value={selectedCategory}
              onChange={e => {
                const val = e.target.value;
                setSelectedCategory(val);
                if (val === 'gate') setPreset('gate');
                else if (val === 'buyin') setPreset('buyin');
                else if (val === 'all') setPreset('all');
                else setPreset('custom');
              }}
            >
              <option value="all">All Categories</option>
              <option value="gate">🚪 Gate Cash Streams (Handover & Fees)</option>
              <option value="buyin">🎟️ Buy-In Streams (Cash Game & Tournaments)</option>
              <option value="payout">🏆 Cash-outs & Prize Payouts</option>
              <optgroup label="Individual Categories">
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Payment Method / Channel */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
              Payment Channel
            </label>
            <select
              className="form-input"
              style={{ fontSize: '0.8rem', padding: '6px 10px', width: '100%' }}
              value={selectedChannel}
              onChange={e => setSelectedChannel(e.target.value as any)}
            >
              <option value="all">All Channels</option>
              <option value="Cash">💵 Cash Only</option>
              <option value="UPI/Digital">📱 UPI / QR Digital</option>
              <option value="Bank Transfer">🏦 Bank Transfer Wire</option>
            </select>
          </div>

          {/* Flow Direction */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
              Flow Direction
            </label>
            <select
              className="form-input"
              style={{ fontSize: '0.8rem', padding: '6px 10px', width: '100%' }}
              value={selectedFlow}
              onChange={e => setSelectedFlow(e.target.value as any)}
            >
              <option value="all">All Flows (In & Out)</option>
              <option value="in">▲ Cash In Only (+)</option>
              <option value="out">▼ Cash Out Only (-)</option>
            </select>
          </div>

          {/* Date Range Preset */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
              Date Range
            </label>
            <select
              className="form-input"
              style={{ fontSize: '0.8rem', padding: '6px 10px', width: '100%' }}
              value={datePreset}
              onChange={e => setDatePreset(e.target.value as DatePreset)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last7">Last 7 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
              Search Filter
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '28px', fontSize: '0.8rem', paddingRight: '8px' }}
                placeholder="Name, ID, notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Custom Date Pickers if custom selected */}
        {datePreset === 'custom' && (
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8' }}>Custom Period:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>From:</span>
              <input
                type="date"
                className="form-input"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>To:</span>
              <input
                type="date"
                className="form-input"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                style={{ fontSize: '0.72rem' }}
              >
                Clear Dates
              </button>
            )}
          </div>
        )}

        {/* Live Metrics & Channel Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
          }}
        >
          {/* Total Transactions */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Records Count
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
              {filteredTransactions.length}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              of {transactions.length} total txns
            </div>
          </div>

          {/* Inflow */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '10px',
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Inflow (+)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
              +{formatCurrency(totalInflow)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#059669' }}>
              Gross cash in
            </div>
          </div>

          {/* Outflow */}
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase' }}>
              Total Outflow (-)
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>
              -{formatCurrency(totalOutflow)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>
              Payouts & withdrawals
            </div>
          </div>

          {/* Net Flow */}
          <div
            style={{
              background: netDelta >= 0 ? 'rgba(56, 189, 248, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${netDelta >= 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              borderRadius: '10px',
              padding: '10px 12px',
            }}
          >
            <div style={{ fontSize: '0.7rem', color: netDelta >= 0 ? '#38bdf8' : '#fbbf24', fontWeight: 700, textTransform: 'uppercase' }}>
              Net Flow Delta
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: netDelta >= 0 ? '#38bdf8' : '#fbbf24', marginTop: '2px' }}>
              {netDelta >= 0 ? '+' : ''}{formatCurrency(netDelta)}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              Filtered net balance
            </div>
          </div>
        </div>

        {/* Channel Liquidity Summary Chips */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '0.76rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.7rem' }}>
            Channel Breakdown:
          </span>
          <span style={{ color: '#fbbf24' }}>
            💵 <strong>Cash:</strong> +{formatCurrency(channelStats.cashIn)} / -{formatCurrency(channelStats.cashOut)}
          </span>
          <span style={{ color: '#475569' }}>|</span>
          <span style={{ color: '#38bdf8' }}>
            📱 <strong>UPI:</strong> +{formatCurrency(channelStats.upiIn)} / -{formatCurrency(channelStats.upiOut)}
          </span>
          <span style={{ color: '#475569' }}>|</span>
          <span style={{ color: '#c084fc' }}>
            🏦 <strong>Bank:</strong> +{formatCurrency(channelStats.bankIn)} / -{formatCurrency(channelStats.bankOut)}
          </span>

          <div style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={handleResetFilters}
              style={{ fontSize: '0.72rem', color: '#94a3b8' }}
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Interactive Preview Table */}
        <div
          style={{
            overflowY: 'auto',
            maxHeight: '300px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <table className="custom-table" style={{ fontSize: '0.78rem' }}>
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Date / Time</th>
                <th style={{ width: '80px' }}>Txn ID</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Flow</th>
                <th style={{ width: '150px' }}>Category</th>
                <th style={{ width: '90px', textAlign: 'center' }}>Channel</th>
                <th>Description / Player</th>
                <th style={{ textAlign: 'right', width: '110px' }}>Amount</th>
                <th style={{ textAlign: 'right', width: '110px' }}>Balance After</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No ledger transactions found matching the selected stream and filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 50).map(t => {
                  const isIn = t.type === 'in';
                  return (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {formatDateTime(t.timestamp)}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f8fafc' }}>
                        {t.id}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            background: isIn ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isIn ? '#34d399' : '#f87171',
                            border: `1px solid ${isIn ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          }}
                        >
                          {isIn ? '▲ IN' : '▼ OUT'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: '#e2e8f0' }}>
                        {t.category}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            background:
                              t.paymentMethod === 'Cash'
                                ? 'rgba(245, 158, 11, 0.15)'
                                : t.paymentMethod === 'UPI/Digital'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : 'rgba(168, 85, 247, 0.15)',
                            color:
                              t.paymentMethod === 'Cash'
                                ? '#fbbf24'
                                : t.paymentMethod === 'UPI/Digital'
                                ? '#38bdf8'
                                : '#c084fc',
                          }}
                        >
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {t.playerName || t.description}
                        </div>
                        {t.playerName && t.description && (
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          color: isIn ? '#34d399' : '#f87171',
                        }}
                      >
                        {isIn ? '+' : '-'} {formatCurrency(t.amount)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#94a3b8' }}>
                        {formatCurrency(t.balanceAfter ?? 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length > 50 && (
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center' }}>
            Showing top 50 previews in modal. The printed PDF and CSV will include all <strong>{filteredTransactions.length}</strong> matching records.
          </div>
        )}

        {/* Action Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '12px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Ready to export: <strong style={{ color: '#ffffff' }}>{filteredTransactions.length}</strong> ledger records
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800 }}
              title="Generate high-resolution printable document / Save as PDF"
            >
              <Printer size={16} />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleDownloadCSV}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
              title="Download CSV spreadsheet"
            >
              <Download size={15} />
              <span>Download CSV</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCopyClipboard}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: copied ? '#10b981' : undefined,
                color: copied ? '#34d399' : undefined,
              }}
              title="Copy TSV to paste directly into Excel / Google Sheets"
            >
              {copied ? <Check size={15} color="#34d399" /> : <Copy size={15} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy for Excel'}</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
