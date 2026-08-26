import React, { useState } from 'react';
import { Users, Search, ShieldCheck, CheckCircle, XCircle, Eye, Edit3, Trash2, UserCheck, Calendar, AlertTriangle, Wallet, Trophy, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { Player, KYCStatus, MembershipTier } from '../../types';
import { formatDateOnly, formatDateTime, maskGovtId, formatFullAadhaar, formatPlayerNumber, formatCurrency } from '../../utils/formatters';
import { KYCBadge, TierBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Pagination } from '../common/Pagination';
import { PlayerLedger } from '../player/PlayerLedger';
import { AdminKycDocumentPhotos } from './AdminKycDocumentPhotos';
import { DocumentPhotoUpload } from '../common/DocumentPhotoUpload';

export const AdminPlayersView: React.FC = () => {
  const { players, reviewKYC, updatePlayer, deletePlayer, checkIns, depositToPlayerWallet, withdrawFromPlayerWallet } = useClub();
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectTab, setInspectTab] = useState<'details' | 'wallet' | 'ledger'>('details');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [adminWalletAction, setAdminWalletAction] = useState<'deposit' | 'cashout' | null>(null);
  const [adminWalletAmount, setAdminWalletAmount] = useState<number | ''>(5000);
  const [adminWalletNotes, setAdminWalletNotes] = useState('');
  const [adminWalletMsg, setAdminWalletMsg] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTier, setEditTier] = useState<MembershipTier>('Standard');
  const [editAddress, setEditAddress] = useState('');
  const [editAadhaarPhotoUrl, setEditAadhaarPhotoUrl] = useState('');
  const [editAadhaarBackPhotoUrl, setEditAadhaarBackPhotoUrl] = useState('');
  const [editPanPhotoUrl, setEditPanPhotoUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const exactPlayerNumberMatch = /^\d+$/.test(search.trim())
    ? players.find(p => formatPlayerNumber(p) === search.trim())
    : undefined;
  const filteredPlayers = (exactPlayerNumberMatch
    ? [exactPlayerNumberMatch]
    : players.filter(
        p =>
          p.fullName.toLowerCase().includes(search.toLowerCase()) ||
          p.phone.includes(search) ||
          p.id.toLowerCase().includes(search.toLowerCase()) ||
          p.email.toLowerCase().includes(search.toLowerCase())
      ))
    .sort((a, b) => {
      if (a.kycStatus === 'pending' && b.kycStatus !== 'pending') return -1;
      if (b.kycStatus === 'pending' && a.kycStatus !== 'pending') return 1;
      const timeA = new Date(a.registeredAt || 0).getTime();
      const timeB = new Date(b.registeredAt || 0).getTime();
      if (timeA !== timeB) return timeB - timeA;
      return Number(formatPlayerNumber(b)) - Number(formatPlayerNumber(a));
    });

  const paginatedPlayers = filteredPlayers.slice((page - 1) * pageSize, page * pageSize);

  const handleInspect = (player: Player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (player: Player) => {
    setSelectedPlayer(player);
    setEditFullName(player.fullName);
    setEditPhone(player.phone);
    setEditEmail(player.email);
    setEditTier(player.membershipTier);
    setEditAddress(player.kyc?.address || '');
    setEditAadhaarPhotoUrl(player.kyc?.aadhaarPhotoUrl || '');
    setEditAadhaarBackPhotoUrl(player.kyc?.aadhaarBackPhotoUrl || '');
    setEditPanPhotoUrl(player.kyc?.panPhotoUrl || '');
    setEditNotes(player.notes || '');
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    updatePlayer(selectedPlayer.id, {
      fullName: editFullName,
      phone: editPhone,
      email: editEmail,
      membershipTier: editTier,
      notes: editNotes,
      kyc: {
        ...selectedPlayer.kyc,
        fullName: editFullName,
        phone: editPhone,
        email: editEmail,
        address: editAddress,
        aadhaarPhotoUrl: editAadhaarPhotoUrl,
        aadhaarBackPhotoUrl: editAadhaarBackPhotoUrl,
        panPhotoUrl: editPanPhotoUrl,
      },
    });

    setIsEditOpen(false);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!selectedPlayer) return;
    deletePlayer(selectedPlayer.id);
    setIsDeleteConfirmOpen(false);
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <Users size={18} color="#e11d48" />
            Registered Players & KYC Registry ({filteredPlayers.length})
          </h3>
          <p className="card-subtitle">
            Master directory of all club members, identity credentials, and membership status.
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '32px', width: '240px', fontSize: '0.8rem' }}
            placeholder="Search member, phone, ID..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Tier</th>
              <th>Contact Phone</th>
              <th>Full Aadhaar Number</th>
              <th>KYC Status</th>
              <th>Wallet Balance</th>
              <th>Visits</th>
              <th>Registration Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPlayers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No members found matching your search.
                </td>
              </tr>
            ) : (
              paginatedPlayers.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {p.kyc.photoUrl ? (
                        <img
                          src={p.kyc.photoUrl}
                          alt=""
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--bg-surface-elevated)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'var(--gold-light)',
                          }}
                        >
                          {p.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700 }}>{p.fullName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Player ID {formatPlayerNumber(p)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <TierBadge tier={p.membershipTier} />
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>{p.phone}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    <span className="tabular-num">{formatFullAadhaar(p.kyc.aadhaarNumber, p.kyc.govtIdNumber)}</span>
                  </td>
                  <td>
                    <KYCBadge status={p.kycStatus} />
                  </td>
                  <td className="tabular-num" style={{ fontWeight: 800, color: (p.walletBalance ?? 0) > 0 ? '#34d399' : 'var(--text-muted)' }}>
                    {formatCurrency(p.walletBalance ?? 0)}
                  </td>
                  <td className="tabular-num" style={{ fontWeight: 700 }}>
                    {p.totalVisits}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    {formatDateOnly(p.registeredAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleInspect(p)} title="Inspect Member Profile">
                        <Eye size={13} />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(p)} title="Edit Member Profile">
                        <Edit3 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <Pagination
        currentPage={page}
        totalItems={filteredPlayers.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        itemLabel="members"
      />

      {/* Player Detail Inspection Modal */}
      {selectedPlayer && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Member Profile: ${selectedPlayer.fullName}`}
          subtitle={`Player ID: ${formatPlayerNumber(selectedPlayer)} • Registered: ${formatDateOnly(selectedPlayer.registeredAt)}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {selectedPlayer.kyc.photoUrl && (
                <img
                  src={selectedPlayer.kyc.photoUrl}
                  alt=""
                  style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-light)' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{selectedPlayer.fullName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedPlayer.email}</div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <TierBadge tier={selectedPlayer.membershipTier} />
                  <KYCBadge status={selectedPlayer.kycStatus} />
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setIsModalOpen(false);
                  handleOpenEdit(selectedPlayer);
                }}
              >
                <Edit3 size={14} /> Edit
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
              <button
                type="button"
                className={`btn btn-sm ${inspectTab === 'details' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInspectTab('details')}
              >
                Member Details & KYC
              </button>
              <button
                type="button"
                className={`btn btn-sm ${inspectTab === 'wallet' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                onClick={() => setInspectTab('wallet')}
              >
                <Wallet size={13} />
                <span>Wallet ({formatCurrency(selectedPlayer.walletBalance ?? 0)})</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${inspectTab === 'ledger' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setInspectTab('ledger')}
              >
                Financial Ledger & Invoices
              </button>
            </div>

            {inspectTab === 'details' ? (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <div className="form-grid-2" style={{ rowGap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Phone</span>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{selectedPlayer.phone}</span>
                      {selectedPlayer.phoneVerified || selectedPlayer.kyc.phoneVerified ? (
                        <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>
                          ✓ SMS Verified
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '4px', padding: '1px 5px', fontWeight: 600 }}>
                          Unverified
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Member ID</span>
                    <div style={{ fontWeight: 600 }}>{formatPlayerNumber(selectedPlayer)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Aadhaar Card</span>
                    <div style={{ fontWeight: 600, color: '#ffffff', fontFamily: 'monospace' }}>
                      {formatFullAadhaar(selectedPlayer.kyc.aadhaarNumber, selectedPlayer.kyc.govtIdNumber)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>PAN Card</span>
                    <div style={{ fontWeight: 600, color: '#fb7185', fontFamily: 'monospace' }}>
                      {selectedPlayer.kyc.panNumber || (selectedPlayer.kyc.govtIdNumber ? maskGovtId(selectedPlayer.kyc.govtIdNumber) : 'PAN Verified')}
                    </div>
                  </div>
                </div>
                <AdminKycDocumentPhotos
                  aadhaarPhotoUrl={selectedPlayer.kyc.aadhaarPhotoUrl}
                  aadhaarBackPhotoUrl={selectedPlayer.kyc.aadhaarBackPhotoUrl}
                  panPhotoUrl={selectedPlayer.kyc.panPhotoUrl}
                />
                <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Residential Address</span>
                  <div style={{ fontSize: '0.84rem' }}>{selectedPlayer.kyc.address || '—'}</div>
                </div>
                {selectedPlayer.notes && (
                  <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--gold-light)', textTransform: 'uppercase' }}>Staff Notes</span>
                    <div style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>{selectedPlayer.notes}</div>
                  </div>
                )}
              </div>
            ) : inspectTab === 'wallet' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Admin Wallet Status Card */}
                <div style={{ background: 'linear-gradient(135deg, rgba(30, 20, 10, 0.8) 0%, rgba(15, 8, 4, 0.95) 100%)', border: '1.5px solid rgba(245, 158, 11, 0.4)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--gold-light)', textTransform: 'uppercase', fontWeight: 700 }}>Current Digital Wallet Balance</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', marginTop: '2px' }}>
                        {formatCurrency(selectedPlayer.walletBalance ?? 0)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}
                        onClick={() => {
                          setAdminWalletAction('deposit');
                          setAdminWalletMsg(null);
                        }}
                      >
                        <ArrowDownLeft size={14} /> + Credit Deposit
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        onClick={() => {
                          setAdminWalletAction('cashout');
                          setAdminWalletMsg(null);
                        }}
                      >
                        <ArrowUpRight size={14} /> - Debit Payout
                      </button>
                    </div>
                  </div>

                  {adminWalletMsg && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.8rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      {adminWalletMsg}
                    </div>
                  )}

                  {/* Admin Wallet Adjustment Form */}
                  {adminWalletAction && (
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: adminWalletAction === 'deposit' ? '#34d399' : '#f87171' }}>
                        {adminWalletAction === 'deposit' ? 'Credit / Deposit to Player Wallet' : 'Debit / Payout from Player Wallet'}
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr auto auto', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                        <input
                          type="number"
                          className="form-input"
                          style={{ fontSize: '0.82rem' }}
                          placeholder="Amount (₹)"
                          value={adminWalletAmount}
                          onChange={e => setAdminWalletAmount(e.target.value ? Number(e.target.value) : '')}
                          min={1}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.82rem' }}
                          placeholder="Reason / Reference (e.g. Table payout)"
                          value={adminWalletNotes}
                          onChange={e => setAdminWalletNotes(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: '0.78rem', background: adminWalletAction === 'deposit' ? '#10b981' : '#e11d48' }}
                          onClick={() => {
                            if (!adminWalletAmount || Number(adminWalletAmount) <= 0) return;
                            try {
                              if (adminWalletAction === 'deposit') {
                                depositToPlayerWallet({
                                  playerId: selectedPlayer.id,
                                  amount: Number(adminWalletAmount),
                                  description: adminWalletNotes || 'Admin manual credit',
                                });
                                setAdminWalletMsg(`Successfully credited ₹${Number(adminWalletAmount).toLocaleString('en-IN')}.`);
                              } else {
                                withdrawFromPlayerWallet({
                                  playerId: selectedPlayer.id,
                                  amount: Number(adminWalletAmount),
                                  description: adminWalletNotes || 'Admin manual debit',
                                });
                                setAdminWalletMsg(`Successfully debited ₹${Number(adminWalletAmount).toLocaleString('en-IN')}.`);
                              }
                              setAdminWalletAction(null);
                              setAdminWalletNotes('');
                            } catch (err: any) {
                              setAdminWalletMsg(`Error: ${err.message}`);
                            }
                          }}
                        >
                          Execute
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => setAdminWalletAction(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wallet History List */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Wallet Transaction History ({(selectedPlayer.walletHistory || []).length})
                  </span>

                  {(selectedPlayer.walletHistory || []).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.84rem' }}>
                      No wallet transactions recorded for this player yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                      {(selectedPlayer.walletHistory || []).map(txn => {
                        const isCredit = txn.direction === 'credit';
                        return (
                          <div
                            key={txn.id}
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              borderRadius: '8px',
                              padding: '10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#ffffff' }}>
                                {txn.description}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                                {formatDateTime(txn.timestamp)} • Ref: {txn.referenceId || txn.id}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: isCredit ? '#34d399' : '#f87171' }}>
                                {isCredit ? '+' : '-'}{formatCurrency(txn.amount)}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--gold-light)' }}>
                                Bal: {formatCurrency(txn.balanceAfter)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <PlayerLedger player={selectedPlayer} />
            )}

            {/* Admin KYC Override Action */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Admin Actions:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    reviewKYC(selectedPlayer.id, 'pending');
                    setIsModalOpen(false);
                  }}
                  disabled={selectedPlayer.kycStatus === 'pending'}
                >
                  <XCircle size={14} /> Mark Pending
                </button>
                <button
                  className="btn btn-emerald btn-sm"
                  onClick={() => {
                    reviewKYC(selectedPlayer.id, 'verified');
                    setIsModalOpen(false);
                  }}
                  disabled={selectedPlayer.kycStatus === 'verified'}
                >
                  <CheckCircle size={14} /> Mark Verified
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    setIsDeleteConfirmOpen(true);
                  }}
                >
                  <Trash2 size={14} /> Delete Member
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT PLAYER MODAL */}
      {selectedPlayer && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Member: ${selectedPlayer.fullName}`}
          subtitle={`Player ID: ${formatPlayerNumber(selectedPlayer)}`}
          size="md"
        >
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editFullName}
                  onChange={e => setEditFullName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Membership Tier</label>
                <select
                  className="form-input"
                  value={editTier}
                  onChange={e => setEditTier(e.target.value as MembershipTier)}
                >
                  <option value="Standard">Standard</option>
                  <option value="Silver">Silver</option>
                  <option value="Gold">Gold</option>
                  <option value="Platinum">Platinum</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Residential Address</label>
              <input
                type="text"
                className="form-input"
                value={editAddress}
                onChange={e => setEditAddress(e.target.value)}
              />
            </div>

            <DocumentPhotoUpload
              id="admin-edit-aadhaar-photo"
              label="Aadhaar Card (Front)"
              value={editAadhaarPhotoUrl}
              onChange={(url) => setEditAadhaarPhotoUrl(url || '')}
            />

            <DocumentPhotoUpload
              id="admin-edit-aadhaar-back-photo"
              label="Aadhaar Card (Back)"
              value={editAadhaarBackPhotoUrl}
              onChange={(url) => setEditAadhaarBackPhotoUrl(url || '')}
            />

            <DocumentPhotoUpload
              id="admin-edit-pan-photo"
              label="PAN Card"
              value={editPanPhotoUrl}
              onChange={(url) => setEditPanPhotoUrl(url || '')}
            />

            <div className="form-group">
              <label className="form-label">Staff Internal Notes</label>
              <textarea
                className="form-input"
                rows={2}
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Table preferences, VIP perks, remarks..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Member Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {selectedPlayer && (
        <Modal
          isOpen={isDeleteConfirmOpen}
          onClose={() => setIsDeleteConfirmOpen(false)}
          title="Delete Member Profile"
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
              Are you sure you want to delete member <strong>{selectedPlayer.fullName}</strong> (Player ID {formatPlayerNumber(selectedPlayer)})? All check-in history will be removed.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsDeleteConfirmOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDelete}>
                Delete Permanently
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
