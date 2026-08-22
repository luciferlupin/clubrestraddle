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
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Radio,
  Bell,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { ChipRequest, PaymentMethod } from '../../types';
import { formatINR, formatTimeOnly } from '../../utils/formatters';
import { ClubTaxInvoiceModal, ClubInvoiceData } from '../common/ClubTaxInvoiceModal';
import { Modal } from '../common/Modal';
import confetti from 'canvas-confetti';

export const ChipOrderManager: React.FC = () => {
  const {
    chipRequests,
    fulfillChipRequest,
    cancelChipRequest,
    updateChipRequest,
    deleteChipRequest,
    requestBuyChips,
    staffName,
    players,
    todayCheckIns,
    isRealtimeConnected,
    syncNow,
  } = useClub();

  const [filterStatus, setFilterStatus] = useState<'pending' | 'all' | 'delivered' | 'cancelled'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<ClubInvoiceData | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ChipRequest | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [createData, setCreateData] = useState({
    playerId: players[0]?.id || '',
    amount: 5000,
    tableNumber: 'Table 1',
    seatNumber: 'Seat 1',
    paymentMethod: 'Cash' as PaymentMethod,
    notes: '',
  });

  const [editData, setEditData] = useState({
    amount: 5000,
    tableNumber: 'Table 1',
    seatNumber: 'Seat 1',
    paymentMethod: 'Cash' as PaymentMethod,
    status: 'pending' as ChipRequest['status'],
    notes: '',
  });

  const pendingRequests = chipRequests.filter(r => r.status === 'pending');
  const deliveredRequests = chipRequests.filter(r => r.status === 'delivered');
  const cancelledRequests = chipRequests.filter(r => r.status === 'cancelled');
  const totalDeliveredAmount = deliveredRequests.reduce((sum, r) => sum + r.amount, 0);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncNow();
      setActionSuccessMessage('Real-time queue synchronized with server & peer terminals.');
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch {
      // Sync fallback
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleOpenEdit = (req: ChipRequest) => {
    setSelectedOrder(req);
    setEditData({
      amount: req.amount,
      tableNumber: req.tableNumber,
      seatNumber: req.seatNumber,
      paymentMethod: req.paymentMethod,
      status: req.status,
      notes: req.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || editData.amount <= 0) return;

    updateChipRequest(selectedOrder.id, {
      amount: Number(editData.amount),
      chipsQuantity: Number(editData.amount),
      tableNumber: editData.tableNumber,
      seatNumber: editData.seatNumber,
      paymentMethod: editData.paymentMethod,
      status: editData.status,
      notes: editData.notes,
    });

    setIsEditModalOpen(false);
    setSelectedOrder(null);
    setActionSuccessMessage(`Order ${selectedOrder.id} updated successfully.`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleDelete = () => {
    if (!selectedOrder) return;
    deleteChipRequest(selectedOrder.id);
    setIsDeleteModalOpen(false);
    setSelectedOrder(null);
    setActionSuccessMessage('Chip order removed from queue.');
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.playerId || createData.amount <= 0) return;

    requestBuyChips({
      playerId: createData.playerId,
      amount: Number(createData.amount),
      tableNumber: createData.tableNumber,
      seatNumber: createData.seatNumber,
      paymentMethod: createData.paymentMethod,
      notes: createData.notes,
    });

    setIsCreateModalOpen(false);
    setActionSuccessMessage(`Created new chip order for ${formatINR(createData.amount)}.`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const filteredRequests = chipRequests.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      r.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.playerPhone && r.playerPhone.includes(searchQuery));
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
      {/* Realtime Live Pulse Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          background: 'linear-gradient(135deg, rgba(20, 8, 12, 0.95) 0%, rgba(10, 4, 6, 0.95) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isRealtimeConnected ? '#10b981' : '#f59e0b',
              boxShadow: isRealtimeConnected ? '0 0 10px #10b981, 0 0 20px #10b981' : 'none',
              animation: 'pulse 2s infinite',
            }}
          />
          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
            {isRealtimeConnected ? 'Live Real-time Queue Active' : 'Connecting Real-time Stream...'}
          </span>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            · Subscribed to Table Requests & Cashier Dispatch
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleManualSync}
            disabled={isSyncing}
            style={{ fontSize: '0.78rem', padding: '6px 12px' }}
          >
            <RefreshCw size={13} className={isSyncing ? 'spin-animation' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Pending Alert Attention Banner */}
      {pendingRequests.length > 0 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(225, 29, 72, 0.22) 0%, rgba(159, 18, 57, 0.15) 100%)',
            border: '1.5px solid #e11d48',
            borderRadius: '12px',
            padding: '12px 18px',
            animation: 'pulse 3s infinite',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(225, 29, 72, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Bell size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                {pendingRequests.length} Table Chip Request{pendingRequests.length > 1 ? 's' : ''} Awaiting Cashier Dispatch
              </div>
              <div style={{ fontSize: '0.76rem', color: '#fca5a5' }}>
                Players are waiting at live tables. Fulfill orders to release high-denomination chips.
              </div>
            </div>
          </div>
          {filterStatus !== 'pending' && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setFilterStatus('pending')}
              style={{ fontSize: '0.76rem' }}
            >
              View Active Queue
            </button>
          )}
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid-3" style={{ gap: '16px' }}>
        <div
          className="card stat-card"
          onClick={() => setFilterStatus('pending')}
          style={{
            background: 'linear-gradient(145deg, #15080c 0%, #0c0406 100%)',
            border: pendingRequests.length > 0 ? '1.5px solid #e11d48' : '1px solid var(--border-subtle)',
            boxShadow: pendingRequests.length > 0 ? '0 0 20px rgba(225, 29, 72, 0.25)' : 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Queue (Pending Dispatch)
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
          onClick={() => setFilterStatus('delivered')}
          style={{ background: 'linear-gradient(145deg, #15080c 0%, #0c0406 100%)', cursor: 'pointer' }}
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
            {todayCheckIns.length} members checked into club today
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
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 className="card-title">
              <Coins size={18} color="#e11d48" />
              Chip Order Dispatch Queue ({chipRequests.length})
            </h3>
            <p className="card-subtitle">
              Incoming table chip requests synced in real-time across player and cashier portals.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={14} /> New Chip Order
            </button>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search player, table, ID..."
                className="form-input"
                style={{ paddingLeft: '32px', width: '210px', fontSize: '0.82rem' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>
        </div>

        {/* Interactive Queue Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.25)',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              border: filterStatus === 'pending' ? '1px solid #e11d48' : '1px solid var(--border-subtle)',
              background: filterStatus === 'pending' ? 'linear-gradient(135deg, rgba(225, 29, 72, 0.3) 0%, rgba(159, 18, 57, 0.2) 100%)' : 'rgba(255, 255, 255, 0.03)',
              color: filterStatus === 'pending' ? '#ffffff' : '#94a3b8',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: pendingRequests.length > 0 ? '#ef4444' : '#64748b',
                animation: pendingRequests.length > 0 ? 'pulse 1.5s infinite' : 'none',
              }}
            />
            Active Queue (Pending Dispatch)
            <span
              style={{
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                background: filterStatus === 'pending' ? '#e11d48' : 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                fontWeight: 800,
              }}
            >
              {pendingRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: filterStatus === 'all' ? '1px solid #e11d48' : '1px solid var(--border-subtle)',
              background: filterStatus === 'all' ? 'linear-gradient(135deg, rgba(225, 29, 72, 0.3) 0%, rgba(159, 18, 57, 0.2) 100%)' : 'rgba(255, 255, 255, 0.03)',
              color: filterStatus === 'all' ? '#ffffff' : '#94a3b8',
            }}
          >
            All Orders
            <span
              style={{
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
              }}
            >
              {chipRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('delivered')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: filterStatus === 'delivered' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
              background: filterStatus === 'delivered' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              color: filterStatus === 'delivered' ? '#34d399' : '#94a3b8',
            }}
          >
            <CheckCircle2 size={13} />
            Delivered
            <span
              style={{
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
              }}
            >
              {deliveredRequests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus('cancelled')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: filterStatus === 'cancelled' ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
              background: filterStatus === 'cancelled' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(255, 255, 255, 0.03)',
              color: filterStatus === 'cancelled' ? '#fca5a5' : '#94a3b8',
            }}
          >
            <XCircle size={13} />
            Cancelled
            <span
              style={{
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                background: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
              }}
            >
              {cancelledRequests.length}
            </span>
          </button>
        </div>

        {/* Requests Table */}
        <div className="table-container chip-orders-table">
          {filteredRequests.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <Coins size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                {filterStatus === 'pending' ? 'Active Queue is Clear' : 'No Chip Orders Found'}
              </div>
              <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                {filterStatus === 'pending'
                  ? 'All table chip orders have been dispatched. Incoming table requests will appear here instantly.'
                  : 'When players request chips from their table pass, requests appear here instantly.'}
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
                  <th style={{ textAlign: 'right' }}>Actions</th>
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
                        background: isPending ? 'rgba(225, 29, 72, 0.07)' : undefined,
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
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          {isPending && (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleFulfill(req.id, req.playerName, req.amount)}
                                style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                              >
                                <Check size={13} /> Fulfill & Dispatch
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleCancel(req.id, req.playerName)}
                                style={{ padding: '5px 7px', fontSize: '0.75rem', color: '#fca5a5' }}
                                title="Cancel Request"
                              >
                                <XCircle size={13} />
                              </button>
                            </>
                          )}
                          {isDelivered && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                              onClick={() => openInvoiceForChip(req)}
                              title="View Tax Invoice"
                            >
                              <Receipt size={12} /> Receipt
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 7px' }}
                            onClick={() => handleOpenEdit(req)}
                            title="Edit Order"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 7px' }}
                            onClick={() => {
                              setSelectedOrder(req);
                              setIsDeleteModalOpen(true);
                            }}
                            title="Delete Order"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Chip Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Table Chip Order"
        subtitle="Issue high-grade playing chips for an active player"
        size="md"
      >
        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Select Registered Player *</label>
            <select
              className="form-select"
              value={createData.playerId}
              onChange={e => {
                const pid = e.target.value;
                const checkIn = todayCheckIns.find(c => c.playerId === pid);
                setCreateData({
                  ...createData,
                  playerId: pid,
                  tableNumber: checkIn?.tablePreference?.split('•')[0]?.trim() || createData.tableNumber,
                });
              }}
              required
            >
              {players.map(p => {
                const isCheckedIn = todayCheckIns.some(c => c.playerId === p.id);
                return (
                  <option key={p.id} value={p.id}>
                    {isCheckedIn ? '🟢 [Checked-in Today] ' : ''}{p.fullName} ({p.phone}) - {p.id} ({p.membershipTier})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Chip Amount (₹) *</label>
              <input
                type="number"
                className="form-input"
                value={createData.amount}
                onChange={e => setCreateData({ ...createData, amount: Number(e.target.value) })}
                required
                min="100"
                step="500"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <select
                className="form-select"
                value={createData.paymentMethod}
                onChange={e => setCreateData({ ...createData, paymentMethod: e.target.value as PaymentMethod })}
              >
                <option value="Cash">Cash</option>
                <option value="UPI/Digital">UPI / Digital</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Credit/Debit Card">Credit/Debit Card</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Table Number *</label>
              <input
                type="text"
                className="form-input"
                value={createData.tableNumber}
                onChange={e => setCreateData({ ...createData, tableNumber: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Seat Number *</label>
              <input
                type="text"
                className="form-input"
                value={createData.seatNumber}
                onChange={e => setCreateData({ ...createData, seatNumber: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> Place Chip Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Chip Order Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Chip Order: ${selectedOrder.id}`}
          subtitle={`Player: ${selectedOrder.playerName}`}
          size="md"
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Chip Amount (₹) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={editData.amount}
                  onChange={e => setEditData({ ...editData, amount: Number(e.target.value) })}
                  required
                  min="100"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select
                  className="form-select"
                  value={editData.paymentMethod}
                  onChange={e => setEditData({ ...editData, paymentMethod: e.target.value as PaymentMethod })}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI/Digital">UPI / Digital</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit/Debit Card">Credit/Debit Card</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Table Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.tableNumber}
                  onChange={e => setEditData({ ...editData, tableNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Seat Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={editData.seatNumber}
                  onChange={e => setEditData({ ...editData, seatNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={editData.status}
                onChange={e => setEditData({ ...editData, status: e.target.value as any })}
              >
                <option value="pending">Pending Dispatch</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                type="text"
                className="form-input"
                value={editData.notes}
                onChange={e => setEditData({ ...editData, notes: e.target.value })}
              />
            </div>

            <div className="modal-footer" style={{ margin: '20px -24px -24px', padding: '16px 24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Order Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Chip Order Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Chip Order"
          subtitle="Irreversible action"
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1.5px solid #ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', margin: 0 }}>
              Are you sure you want to delete chip order <strong>{selectedOrder.id}</strong> (₹{selectedOrder.amount.toLocaleString('en-IN')} for {selectedOrder.playerName})?
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                Delete Order
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Official Tax / Billing Invoice Modal */}
      <ClubTaxInvoiceModal
        invoice={selectedInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </div>
  );
};
