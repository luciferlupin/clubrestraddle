import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  Trash2,
  Mail,
  CheckCircle2,
  Ban,
  Edit3,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { StaffRole, StaffUser } from '../../types';
import { formatDateOnly } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const StaffManager: React.FC = () => {
  const { staffUsers, createStaffUser, updateStaffUser, deleteStaffUser, toggleStaffStatus } = useClub();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'cashier' as 'cashier' | 'security',
  });

  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'cashier' as 'cashier' | 'security' | 'admin',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const pendingDeleteUser = staffUsers.find(user => user.id === pendingDeleteId);

  const handleOpenEdit = (user: StaffUser) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName,
      email: user.email,
      password: user.password,
      role: user.role,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editFormData.fullName.trim() || !editFormData.email.trim()) return;

    updateStaffUser(editingUser.id, {
      fullName: editFormData.fullName,
      email: editFormData.email,
      role: editFormData.role as StaffRole,
      password: editFormData.password || editingUser.password,
    });

    setSuccess(`Updated staff profile for ${editFormData.fullName}!`);
    setTimeout(() => setSuccess(null), 3000);
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteStaffUser(pendingDeleteId);
    setPendingDeleteId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    const result = createStaffUser({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });

    if (!result.success) {
      setError(result.message || 'Failed to create staff account.');
      return;
    }

    setSuccess(`Successfully created ${formData.role.toUpperCase()} account for ${formData.fullName}!`);
    setTimeout(() => setSuccess(null), 3500);

    setFormData({
      fullName: '',
      email: '',
      password: '',
      role: 'cashier',
    });
    setIsCreateModalOpen(false);
  };

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-purple">Admin</span>;
      case 'cashier':
        return <span className="badge badge-warning">Cashier</span>;
      case 'security':
        return <span className="badge badge-success">Security</span>;
    }
  };

  return (
    <div className="card" style={{ background: '#120508', border: '1px solid rgba(225, 29, 72, 0.35)', borderRadius: '16px' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
        <div>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '1.05rem', fontWeight: 800 }}>
            <Shield size={20} color="#e11d48" />
            Staff Accounts & Access Management
          </h3>
          <p className="card-subtitle" style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '3px' }}>
            Provision and manage authorized login credentials for Cashier terminals and Security door stations.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, padding: '9px 16px', borderRadius: '10px' }}
        >
          <UserPlus size={16} /> Create Staff Account
        </button>
      </div>

      {success && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.25) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#34d399',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '14px 0',
          }}
        >
          <CheckCircle2 size={18} color="#34d399" />
          <span>{success}</span>
        </div>
      )}

      {/* Staff Accounts Table (Desktop) */}
      <div className="table-container staff-desktop-table" style={{ marginTop: '14px' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Login Email</th>
              <th>Assigned Portal Role</th>
              <th>Account Status</th>
              <th>Created Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffUsers.map(user => {
              const isSuperAdmin = user.role === 'admin';
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: user.role === 'admin' ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : user.role === 'cashier' ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '0.9rem',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                          flexShrink: 0,
                        }}
                      >
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#ffffff' }}>{user.fullName}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#cbd5e1' }}>{user.email}</span>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      <span className="badge-dot" /> {user.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {formatDateOnly(user.createdAt)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!isSuperAdmin && (
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(user)}
                          title="Edit staff account"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className={`btn btn-sm ${user.status === 'active' ? 'btn-secondary' : 'btn-emerald'}`}
                          onClick={() => toggleStaffStatus(user.id)}
                          title={user.status === 'active' ? 'Suspend staff account' : 'Reactivate account'}
                          style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {user.status === 'active' ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                          <span>{user.status === 'active' ? 'Suspend' : 'Activate'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => setPendingDeleteId(user.id)}
                          title="Delete staff account"
                          aria-label={`Delete ${user.fullName}`}
                          style={{ padding: '6px 8px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                    {isSuperAdmin && (
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenEdit(user)}
                          title="Edit master admin profile"
                          style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gold-light)', fontWeight: 800, padding: '4px 8px', background: 'rgba(251, 191, 36, 0.12)', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                          Primary Admin
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Staff Accounts Mobile Cards */}
      <div className="staff-mobile-list" aria-label="Staff accounts" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {staffUsers.map(user => {
          const isSuperAdmin = user.role === 'admin';
          return (
            <article
              key={user.id}
              className="staff-account-card"
              style={{
                background: 'linear-gradient(145deg, #16060b 0%, #0c0305 100%)',
                border: '1.5px solid rgba(225, 29, 72, 0.3)',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Topline: Avatar + Name + Role Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: user.role === 'admin' ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : user.role === 'cashier' ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '0.95rem',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                      flexShrink: 0,
                    }}
                  >
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', color: '#ffffff', fontSize: '0.92rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.fullName}
                    </strong>
                    <small style={{ color: '#94a3b8', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                      {user.id} · {formatDateOnly(user.createdAt)}
                    </small>
                  </div>
                </div>
                <div>{getRoleBadge(user.role)}</div>
              </div>

              {/* Login Email */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: '#cbd5e1',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <Mail size={14} color="#e11d48" style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
              </div>

              {/* Actions & Status Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '8px',
                }}
              >
                <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.72rem' }}>
                  <span className="badge-dot" /> {user.status}
                </span>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleOpenEdit(user)}
                    style={{ padding: '5px 10px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit3 size={12} /> Edit
                  </button>

                  {!isSuperAdmin ? (
                    <>
                      <button
                        type="button"
                        className={`btn btn-sm ${user.status === 'active' ? 'btn-secondary' : 'btn-emerald'}`}
                        onClick={() => toggleStaffStatus(user.id)}
                        style={{ padding: '5px 10px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {user.status === 'active' ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                        <span>{user.status === 'active' ? 'Suspend' : 'Activate'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger btn-sm btn-icon"
                        aria-label={`Delete ${user.fullName}`}
                        onClick={() => setPendingDeleteId(user.id)}
                        style={{ padding: '5px 8px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: 'var(--gold-light)', fontWeight: 800 }}>
                      Primary Admin
                    </span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Create Staff Account Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Staff Account"
        subtitle="Provision access for Cashier Terminal or Security Door verification"
        size="md"
      >
        {error && (
          <div role="alert" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', color: '#f87171', fontSize: '0.8rem', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="new-staff-name">Full Name *</label>
            <input
              id="new-staff-name"
              type="text"
              className="form-input"
              placeholder="e.g. Alice Walker or Officer Sterling"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-staff-email">Login Email Address *</label>
            <input
              id="new-staff-email"
              type="email"
              className="form-input"
              placeholder="e.g. cashier1@clubrestraddle.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-staff-password">Password *</label>
            <input
              id="new-staff-password"
              type="password"
              className="form-input"
              placeholder="Create strong password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-staff-role">Assigned Role & Portal Access *</label>
            <select
              id="new-staff-role"
              className="form-select"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as 'cashier' | 'security' })}
            >
              <option value="cashier">Cashier portal — tournaments, entries and cash</option>
              <option value="security">Security portal — verification and door clearance</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '18px -24px -22px', padding: '16px 24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <UserPlus size={16} /> Create Staff Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Account Modal */}
      {editingUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          title={`Edit Staff Profile: ${editingUser.fullName}`}
          subtitle={`Staff ID: ${editingUser.id}`}
          size="md"
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={editFormData.fullName}
                onChange={e => setEditFormData({ ...editFormData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Login Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={editFormData.email}
                onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Leave blank to keep existing password"
                value={editFormData.password}
                onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Role</label>
              <select
                className="form-select"
                value={editFormData.role}
                onChange={e => setEditFormData({ ...editFormData, role: e.target.value as any })}
                disabled={editingUser.role === 'admin'}
              >
                <option value="cashier">Cashier Desk</option>
                <option value="security">Security Door Desk</option>
                <option value="admin">Super Admin</option>
              </select>
            </div>

            <div className="modal-footer" style={{ margin: '18px -24px -22px', padding: '16px 24px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingUser(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Staff Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!pendingDeleteUser}
        onClose={() => setPendingDeleteId(null)}
        title="Delete staff account?"
        subtitle={pendingDeleteUser ? `This removes login access for ${pendingDeleteUser.fullName}.` : undefined}
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setPendingDeleteId(null)}>
              Keep account
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete}>
              <Trash2 size={16} /> Delete account
            </button>
          </>
        }
      >
        <p style={{ color: '#cbd5e1', fontSize: '0.86rem', lineHeight: 1.6 }}>
          This action cannot be undone. Attendance and audit records remain available.
        </p>
      </Modal>
    </div>
  );
};
