import React, { useState } from 'react';
import {
  Coins,
  CheckCircle2,
  XCircle,
  Search,
  DollarSign,
  ShieldCheck,
  Check,
  Receipt,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { ChipRequest } from '../../types';
import { formatINR, formatTimeOnly } from '../../utils/formatters';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import confetti from 'canvas-confetti';

export const ChipOrderManager: React.FC = () => {
  const { chipRequests, fulfillChipRequest, cancelChipRequest, staffName, players } = useClub();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);

  const pendingRequests = chipRequests.filter(r => r.status === 'pending');
  const deliveredRequests = chipRequests.filter(r => r.status === 'delivered');
  const totalDeliveredAmount = deliveredRequests.reduce((sum, r) => sum + r.amount, 0);

  const filteredRequests = chipRequests.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      r.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.playerPhone.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const openInvoiceForChip = (req: ChipRequest) => {
    const playerObj = players.find(p => p.id === req.playerId);
    const invoiceData: ClubInvoiceData = {
      invoiceNumber: req.receiptNumber || `INV-${req.id}`,
      invoiceDate: req.fulfilledAt || req.requestedAt,
      category: 'Table Chip Purchase',
      playerId: req.playerId,
      playerName: req.playerName,
      playerPhone: req.playerPhone || playerObj?.phone,
      playerEmail: playerObj?.email,
      govtIdType: playerObj?.kyc.govtIdType,
      govtIdNumber: playerObj?.kyc.govtIdNumber,
      membershipTier: playerObj?.membershipTier,
      tableLocation: `${req.tableNumber} • ${req.seatNumber}`,
      items: [
        {
          description: `Table Playing Chips Delivery (${req.tableNumber}, ${req.seatNumber})`,
          details: `Direct table reload of ${formatINR(req.chipsQuantity)} high-grade casino playing chips`,
          chips: req.chipsQuantity,
          amount: req.amount,
        },
      ],
      subtotal: req.amount,
      totalAmount: req.amount,
      paymentMethod: req.paymentMethod,
      paymentReference: req.receiptNumber,
      cashierName: req.fulfilledBy || staffName,
    };
    setSelectedInvoice(invoiceData);
  };

  const handleFulfill = (requestId: string, playerName: string, amount: number) => {
    fulfillChipRequest(requestId);
    const updated = chipRequests.find(r => r.id === requestId);
    if (updated) {
      openInvoiceForChip(updated);
    }
    setActionSuccessMessage(`Successfully dispatched ₹${formatINR(amount)} chips to ${playerName}. Cash logged to vault.`);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#e11d48', '#ffffff', '#f43f5e', '#be123c'],
      });
    } catch {
      // Fallback
    }
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleCancel = (requestId: string, playerName: string) => {
    const reason = window.prompt(`Enter reason for cancelling chip order for ${playerName}:`, 'Player cancelled order at table');
    if (reason !== null) {
      cancelChipRequest(requestId, reason);
      setActionSuccessMessage(`Order ${requestId} cancelled.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* KPI Stats Bar */}
      <div className="grid-3" style={{ gap: '16px' }}>
        <div
          className="card stat-card"
          style={{
            background: 'linear-gradient(145deg, #15080c 0%, #0c0406 100%)',
            border: pendingRequests.length > 0 ? '1.5px solid #e11d48' : '1px solid var(--border-subtle)',
            boxShadow: pendingRequests.length > 0 ? '0 0 20px rgba(225, 29, 72, 0.25)' : 'none',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pending Table Chip Orders
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                {pendingRequests.length}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(225, 29, 72, 0.2)',
                border: '1px solid var(--border-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Coins size={22} />
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.76rem', color: pendingRequests.length > 0 ? '#fca5a5' : '#10b981' }}>
            {pendingRequests.length > 0 ? '● Requires immediate cashier dispatch' : '✓ All table chip requests fulfilled'}
          </div>
        </div>

        <div
          className="card stat-card"
          style={{ background: 'linear-gradient(145deg, #15080c 0%, #0c0406 100%)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Chips Dispatched (Today)
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ffffff', marginTop: '4px' }}>
                ₹{formatINR(totalDeliveredAmount)}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
              }}
            >
              <DollarSign size={22} />
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.76rem', color: '#10b981' }}>
            {deliveredRequests.length} orders successfully processed & credited
          </div>
        </div>

        <div
          className="card stat-card"
          style={{ background: 'linear-gradient(145deg, #15080c 0%, #0c0406 100%)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Cashier Terminal
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
                {staffName}
              </div>
            </div>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(225, 29, 72, 0.15)',
                border: '1px solid var(--border-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <ShieldCheck size={22} />
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.76rem', color: '#94a3b8' }}>
            Real-time WebSocket sync enabled with table players
          </div>
        </div>
      </div>

      {actionSuccessMessage && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#6ee7b7',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Order Queue Table Card */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={20} color="#e11d48" /> Real-Time Table Chip Orders ({filteredRequests.length})
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#94a3b8', margin: '2px 0 0' }}>
              Incoming chip purchase requests from active players seated at cash game & tournament tables.
            </p>
          </div>

          {/* Search & Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '32px', fontSize: '0.82rem', padding: '6px 12px 6px 32px' }}
                placeholder="Search player / table..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>

            <div className="btn-group" style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
              <button
                className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => setFilterStatus('all')}
              >
                All ({chipRequests.length})
              </button>
              <button
                className={`btn btn-sm ${filterStatus === 'pending' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => setFilterStatus('pending')}
              >
                Pending ({pendingRequests.length})
              </button>
              <button
                className={`btn btn-sm ${filterStatus === 'delivered' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => setFilterStatus('delivered')}
              >
                Delivered ({deliveredRequests.length})
              </button>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="table-container chip-orders-table">
          {filteredRequests.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <Coins size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>No Chip Orders Found</div>
              <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                When players request chips from their table pass, requests appear here instantly.
              </p>
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Player Details</th>
                  <th>Table & Seat</th>
                  <th>Chip Amount</th>
                  <th>Payment Method</th>
                  <th>Request Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Cashier Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => {
                  const isPending = req.status === 'pending';
                  const isDelivered = req.status === 'delivered';
                  const isCancelled = req.status === 'cancelled';

                  return (
                    <tr
                      key={req.id}
                      style={{
                        background: isPending ? 'rgba(225, 29, 72, 0.06)' : undefined,
                      }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem', color: '#ffffff' }}>
                        {req.id}
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.86rem' }}>
                          {req.playerName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          {req.playerPhone || req.playerId}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.84rem' }}>
                          {req.tableNumber}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gold-light)' }}>
                          {req.seatNumber}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 900, color: '#ffffff', fontSize: '0.96rem' }}>
                          ₹{formatINR(req.amount)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {formatINR(req.chipsQuantity)} chips
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>
                          {req.paymentMethod}
                        </span>
                      </td>

                      <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                        {formatTimeOnly(req.requestedAt)}
                      </td>

                      <td>
                        {isPending && (
                          <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                            <span className="badge-dot" /> Pending Dispatch
                          </span>
                        )}
                        {isDelivered && (
                          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                            <CheckCircle2 size={12} /> Delivered
                          </span>
                        )}
                        {isCancelled && (
                          <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>
                            <XCircle size={12} /> Cancelled
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {isPending ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleFulfill(req.id, req.playerName, req.amount)}
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            >
                              <Check size={14} /> Fulfill & Dispatch
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleCancel(req.id, req.playerName)}
                              style={{ padding: '6px 8px', fontSize: '0.78rem', color: '#fca5a5' }}
                              title="Cancel Request"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        ) : isDelivered ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                              onClick={() => openInvoiceForChip(req)}
                            >
                              <Receipt size={13} /> Official Invoice
                            </button>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              By {req.fulfilledBy || 'Cashier'}
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.74rem', color: '#ef4444' }}>
                            {req.notes || 'Cancelled'}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Official Tax / Billing Invoice Modal */}
      <ClubTaxInvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};
