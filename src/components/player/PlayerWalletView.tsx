import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Trophy,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  CreditCard,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  Send,
  Building,
  Smartphone,
  Coins,
} from 'lucide-react';
import { Player, Tournament, PaymentMethod } from '../../types';
import { useClub } from '../../context/ClubContext';
import { formatCurrency, formatDateTime, formatDateOnly, formatTimeOnly } from '../../utils/formatters';
import { Modal } from '../common/Modal';
import { CardSuit, SuitWatermark } from '../common/PokerGraphics';

interface PlayerWalletViewProps {
  player: Player;
  onOpenChipsModal?: () => void;
  onOpenTournaments?: () => void;
}

export const PlayerWalletView: React.FC<PlayerWalletViewProps> = ({
  player,
  onOpenChipsModal,
  onOpenTournaments,
}) => {
  const { tournaments, withdrawFromPlayerWallet, depositToPlayerWallet } = useClub();
  
  const [filterType, setFilterType] = useState<'all' | 'winnings' | 'cashout' | 'deposit'>('all');
  const [search, setSearch] = useState('');
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState<number | ''>(5000);
  const [cashoutMethod, setCashoutMethod] = useState<PaymentMethod>('Cash');
  const [cashoutNotes, setCashoutNotes] = useState('');
  const [depositAmount, setDepositAmount] = useState<number | ''>(5000);
  const [depositMethod, setDepositMethod] = useState<PaymentMethod>('UPI/Digital');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const walletBalance = player.walletBalance ?? 0;
  const walletHistory = player.walletHistory ?? [];

  // Find all tournament placements / winner ranks for this player
  const playerTournamentWins = useMemo(() => {
    const wins: {
      tournament: Tournament;
      rank: number;
      prizeAmount: number;
      awardedAt: string;
      notes?: string;
    }[] = [];

    tournaments.forEach(t => {
      if (t.winners && t.winners.length > 0) {
        const winningRank = t.winners.find(w => w.playerId === player.id);
        if (winningRank) {
          wins.push({
            tournament: t,
            rank: winningRank.rank,
            prizeAmount: winningRank.prizeAmount,
            awardedAt: winningRank.awardedAt || t.completedAt || t.createdAt,
            notes: winningRank.notes,
          });
        }
      }
    });

    return wins.sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());
  }, [tournaments, player.id]);

  const totalWinningsEarned = useMemo(() => {
    return playerTournamentWins.reduce((sum, w) => sum + w.prizeAmount, 0);
  }, [playerTournamentWins]);

  const totalCashouts = useMemo(() => {
    return walletHistory
      .filter(t => t.direction === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [walletHistory]);

  const filteredHistory = useMemo(() => {
    return walletHistory.filter(item => {
      if (filterType === 'winnings' && item.type !== 'tournament_winnings') return false;
      if (filterType === 'cashout' && item.direction !== 'debit') return false;
      if (filterType === 'deposit' && item.type !== 'deposit') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.description.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          (item.referenceId && item.referenceId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [walletHistory, filterType, search]);

  const handleCashoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!cashoutAmount || Number(cashoutAmount) <= 0) {
      setErrorMessage('Please enter a valid cashout amount.');
      return;
    }
    if (Number(cashoutAmount) > walletBalance) {
      setErrorMessage(`Insufficient wallet balance. Maximum available: ${formatCurrency(walletBalance)}`);
      return;
    }

    try {
      withdrawFromPlayerWallet({
        playerId: player.id,
        amount: Number(cashoutAmount),
        paymentMethod: cashoutMethod,
        description: `Wallet Payout (${cashoutMethod}): ${cashoutNotes || 'Player withdrawal'}`,
      });

      setIsCashoutModalOpen(false);
      setSuccessMessage(`Successfully processed cashout of ${formatCurrency(Number(cashoutAmount))} via ${cashoutMethod}.`);
      setCashoutNotes('');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process cashout.');
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!depositAmount || Number(depositAmount) <= 0) {
      setErrorMessage('Please enter a valid deposit amount.');
      return;
    }

    try {
      depositToPlayerWallet({
        playerId: player.id,
        amount: Number(depositAmount),
        paymentMethod: depositMethod,
        description: `Wallet Deposit via ${depositMethod}`,
      });

      setIsDepositModalOpen(false);
      setSuccessMessage(`Successfully deposited ${formatCurrency(Number(depositAmount))} into your wallet.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to process deposit.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Alert Notices */}
      {successMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '12px',
          padding: '12px 16px',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
        }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          padding: '12px 16px',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
        }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Top Hero Wallet Balance Card ────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.85) 0%, rgba(15, 8, 4, 0.95) 100%)',
          border: '1.5px solid rgba(245, 158, 11, 0.45)',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(245, 158, 11, 0.2)',
        }}
      >
        <SuitWatermark
          suit="spade"
          size={160}
          opacity={0.06}
          color="#fbbf24"
          style={{ position: 'absolute', right: 20, top: -20, pointerEvents: 'none' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold-light)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Wallet size={16} />
              <span>Player Portal Vault Balance</span>
            </div>
            <div style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '6px', textShadow: '0 2px 10px rgba(245, 158, 11, 0.2)' }}>
              {formatCurrency(walletBalance)}
            </div>
            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} color="#fbbf24" />
              Available for Table Buy-ins, Chips, or Direct Cash Payouts
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                borderColor: '#fb7185',
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                padding: '8px 16px',
              }}
              onClick={() => setIsCashoutModalOpen(true)}
            >
              <ArrowUpRight size={16} />
              <span>Withdraw / Cashout</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.15)',
              }}
              onClick={() => setIsDepositModalOpen(true)}
            >
              <ArrowDownLeft size={16} color="#34d399" />
              <span>Add Deposit</span>
            </button>

            {onOpenChipsModal && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  padding: '8px 14px',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                  color: 'var(--gold-light)',
                }}
                onClick={onOpenChipsModal}
              >
                <Coins size={15} />
                <span>Order Chips</span>
              </button>
            )}
          </div>
        </div>

        {/* Financial Metrics Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>🏆 Total Tournament Winnings</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
              {formatCurrency(totalWinningsEarned)}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>Across {playerTournamentWins.length} ranking placements</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>💸 Total Payouts Withdrawn</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>
              {formatCurrency(totalCashouts)}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>Direct member disbursements</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>🎖️ Club Membership Tier</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {player.membershipTier} Tier
            </div>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>Member #{player.memberNumber || player.id}</span>
          </div>
        </div>
      </div>

      {/* ── Trophy Cabinet & Tournament Winnings Showcase ───── */}
      {playerTournamentWins.length > 0 && (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(20, 10, 15, 0.7) 0%, rgba(10, 5, 8, 0.9) 100%)', border: '1px solid rgba(225, 29, 72, 0.3)' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} color="#fbbf24" />
                <span>Tournament Championship Trophies & Prize Placements ({playerTournamentWins.length})</span>
              </h3>
              <p className="card-subtitle">
                Official leaderboard rankings and deposited cash prizes won in club championship fixtures.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {playerTournamentWins.map(win => {
              const isFirst = win.rank === 1;
              const isSecond = win.rank === 2;
              const isThird = win.rank === 3;
              const badgeColor = isFirst ? '#fbbf24' : isSecond ? '#94a3b8' : isThird ? '#cd7f32' : '#cbd5e1';
              const rankTitle = isFirst ? '🥇 1st Place Champion' : isSecond ? '🥈 2nd Place Runner-Up' : isThird ? '🥉 3rd Place Finalist' : `🎖️ Rank #${win.rank}`;

              return (
                <div
                  key={`${win.tournament.id}-${win.rank}`}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: `1px solid ${isFirst ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: isFirst ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        color: badgeColor,
                        border: `1px solid ${isFirst ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.12)'}`,
                      }}
                    >
                      {rankTitle}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {formatDateOnly(win.awardedAt)}
                    </span>
                  </div>

                  <strong style={{ fontSize: '0.96rem', color: '#ffffff', marginTop: '2px' }}>
                    {win.tournament.name}
                  </strong>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Prize Deposited:</span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#34d399' }}>
                      +{formatCurrency(win.prizeAmount)}
                    </span>
                  </div>
                  {win.notes && (
                    <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                      &ldquo;{win.notes}&rdquo;
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Detailed Financial Ledger & Wallet Statement ────── */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="#e11d48" />
              <span>Wallet Statement & Transaction Audit Log ({filteredHistory.length})</span>
            </h3>
            <p className="card-subtitle">
              Live chronological record of prize deposits, table transfers, buy-ins, and cashier disbursements.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'winnings', label: '🏆 Winnings' },
              { id: 'cashout', label: '💸 Cash-outs' },
              { id: 'deposit', label: '📥 Deposits' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                className={`btn btn-sm ${filterType === f.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                onClick={() => setFilterType(f.id as any)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-dim)' }}>
            <Wallet size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>No wallet transactions found for this view.</p>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
              Tournament winnings and deposits will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Transaction Type</th>
                  <th>Description / Fixture</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Balance After</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(txn => {
                  const isCredit = txn.direction === 'credit';
                  return (
                    <tr key={txn.id}>
                      <td className="tabular-num" style={{ color: 'var(--gold-light)', fontSize: '0.76rem' }}>
                        {txn.id.slice(-8)}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            background: isCredit ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: isCredit ? '#34d399' : '#fb7185',
                            border: `1px solid ${isCredit ? 'rgba(52, 211, 153, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                          }}
                        >
                          {txn.type === 'tournament_winnings'
                            ? '🏆 Prize Winning'
                            : txn.type === 'deposit'
                            ? '📥 Deposit'
                            : txn.type === 'cashout'
                            ? '💸 Cashout'
                            : txn.type === 'tournament_buyin'
                            ? '🎟️ Tourney Buy-in'
                            : 'Chip Transfer'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.84rem' }}>
                          {txn.description}
                        </div>
                        {txn.referenceId && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                            Ref: {txn.referenceId}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        {formatDateTime(txn.timestamp)}
                      </td>
                      <td
                        className="tabular-num"
                        style={{
                          textAlign: 'right',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          color: isCredit ? '#34d399' : '#f87171',
                        }}
                      >
                        {isCredit ? '+' : '-'}{formatCurrency(txn.amount)}
                      </td>
                      <td
                        className="tabular-num"
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          color: 'var(--gold-light)',
                          fontSize: '0.84rem',
                        }}
                      >
                        {formatCurrency(txn.balanceAfter)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Cashout Modal ───────────────────────────────────── */}
      <Modal
        isOpen={isCashoutModalOpen}
        onClose={() => setIsCashoutModalOpen(false)}
        title="Request Wallet Cashout / Payout"
        subtitle={`Available Balance: ${formatCurrency(walletBalance)}`}
        size="md"
      >
        <form onSubmit={handleCashoutSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="cashout-amount">Withdrawal Amount (₹) *</label>
            <input
              id="cashout-amount"
              type="number"
              className="form-input"
              value={cashoutAmount}
              onChange={e => setCashoutAmount(e.target.value ? Number(e.target.value) : '')}
              min={100}
              max={walletBalance}
              required
            />
            {/* Quick Amount Pills */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[1000, 5000, 10000, 25000, 50000, walletBalance].map(amt => (
                <button
                  key={amt}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  onClick={() => setCashoutAmount(amt)}
                >
                  {amt === walletBalance ? 'All (Max)' : formatCurrency(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cashout-method">Disbursement Mode *</label>
            <select
              id="cashout-method"
              className="form-select"
              value={cashoutMethod}
              onChange={e => setCashoutMethod(e.target.value as PaymentMethod)}
            >
              <option value="Cash">💵 Cash at Cashier Station</option>
              <option value="UPI/Digital">📱 Instant UPI / QR Transfer</option>
              <option value="Bank Transfer">🏦 Direct Bank IMPS/NEFT</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cashout-notes">Bank / UPI / Notes (Optional)</label>
            <input
              id="cashout-notes"
              type="text"
              className="form-input"
              placeholder="e.g. UPI ID or Cash desk pickup"
              value={cashoutNotes}
              onChange={e => setCashoutNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCashoutModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: '#e11d48', borderColor: '#fb7185' }}
              disabled={!cashoutAmount || Number(cashoutAmount) <= 0 || Number(cashoutAmount) > walletBalance}
            >
              <ArrowUpRight size={16} /> Confirm Cashout
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Deposit Modal ───────────────────────────────────── */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title="Add Funds to Player Wallet"
        subtitle={`Current Balance: ${formatCurrency(walletBalance)}`}
        size="md"
      >
        <form onSubmit={handleDepositSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="deposit-amount">Deposit Amount (₹) *</label>
            <input
              id="deposit-amount"
              type="number"
              className="form-input"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value ? Number(e.target.value) : '')}
              min={500}
              required
            />
            {/* Quick Amount Pills */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[2000, 5000, 10000, 25000, 50000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  onClick={() => setDepositAmount(amt)}
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="deposit-method">Payment Mode *</label>
            <select
              id="deposit-method"
              className="form-select"
              value={depositMethod}
              onChange={e => setDepositMethod(e.target.value as PaymentMethod)}
            >
              <option value="UPI/Digital">📱 UPI / QR Code</option>
              <option value="Cash">💵 Cash at Vault Desk</option>
              <option value="Bank Transfer">🏦 Bank IMPS Transfer</option>
              <option value="Credit/Debit Card">💳 Card Swipe POS</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDepositModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: '#10b981', borderColor: '#34d399' }}
              disabled={!depositAmount || Number(depositAmount) <= 0}
            >
              <ArrowDownLeft size={16} /> Confirm Deposit
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
