import React, { useState } from 'react';
import {
  UserPlus,
  Shield,
  Trash2,
  Mail,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { StaffRole } from '../../types';
import { formatDateOnly } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const StaffManager: React.FC = () => {
  const { staffUsers, createStaffUser, deleteStaffUser, toggleStaffStatus } = useClub();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'cashier' as 'cashier' | 'security',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const pendingDeleteUser = staffUsers.find(user => user.id === pendingDeleteId);

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
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">
            <Shield size={20} color="#e11d48" />
            Staff Accounts & Access Management
          </h3>
          <p className="card-subtitle">
            Create and manage authorized login accounts for Cashier terminals and Security door staff.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus size={16} /> Create Staff Account
        </button>
      </div>

      {success && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: 'rgba(139, 0, 0, 0.25)',
            border: '1px solid rgba(139, 0, 0, 0.6)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#ffffff',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} color="#ffffff" />
          <span>{success}</span>
        </div>
      )}

      {/* Staff Accounts Table */}
      <div className="table-container staff-desktop-table">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Staff Name</th>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#150508',
                          border: '1px solid rgba(139, 0, 0, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          color: '#ffffff',
                        }}
                      >
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800 }}>{user.fullName}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{user.email}</span>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      <span className="badge-dot" /> {user.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {formatDateOnly(user.createdAt)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {!isSuperAdmin && (
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${user.status === 'active' ? 'btn-secondary' : 'btn-emerald'}`}
                          onClick={() => toggleStaffStatus(user.id)}
                          title={user.status === 'active' ? 'Suspend staff account' : 'Reactivate account'}
                        >
                          {user.status === 'active' ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                          <span>{user.status === 'active' ? 'Suspend' : 'Activate'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setPendingDeleteId(user.id)}
                          title="Delete staff account"
                          aria-label={`Delete ${user.fullName}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                    {isSuperAdmin && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--gold-light)', fontWeight: 700 }}>
                        Primary Master Admin
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="staff-mobile-list" aria-label="Staff accounts">
        {staffUsers.map(user => {
          const isSuperAdmin = user.role === 'admin';
          return (
            <article key={user.id} className="staff-account-card">
              <div className="staff-account-topline">
                <span className="staff-account-avatar" aria-hidden="true">{user.fullName.charAt(0)}</span>
                <span className="staff-account-name">
                  <strong>{user.fullName}</strong>
                  <small>{user.id} · {formatDateOnly(user.createdAt)}</small>
                </span>
                {getRoleBadge(user.role)}
              </div>
              <div className="staff-account-email"><Mail size={14} /> <span>{user.email}</span></div>
              <div className="staff-account-actions">
                <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                  <span className="badge-dot" /> {user.status}
                </span>
                {isSuperAdmin ? (
                  <span className="staff-master-label">Master admin</span>
                ) : (
                  <div>
                    <button
                      type="button"
                      className={`btn btn-sm ${user.status === 'active' ? 'btn-secondary' : 'btn-emerald'}`}
                      onClick={() => toggleStaffStatus(user.id)}
                    >
                      {user.status === 'active' ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                      {user.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm btn-icon"
                      aria-label={`Delete ${user.fullName}`}
                      onClick={() => setPendingDeleteId(user.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
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
