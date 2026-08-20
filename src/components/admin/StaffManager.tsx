import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  DollarSign,
  ShieldCheck,
  Trash2,
  Lock,
  Mail,
  CheckCircle2,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { StaffUser, StaffRole } from '../../types';
import { formatDateOnly } from '../../utils/formatters';
import { Modal } from '../common/Modal';

export const StaffManager: React.FC = () => {
  const { staffUsers, createStaffUser, deleteStaffUser, toggleStaffStatus, currentStaffUser } = useClub();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'cashier' as 'cashier' | 'security',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
            <Shield size={20} color="#c084fc" />
            Staff Accounts & Access Management
          </h3>
          <p className="card-subtitle">
            Create and manage authorized login accounts for Cashier terminals and Security door staff.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus size={16} /> Create Staff Account
        </button>
      </div>

      {success && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#34d399',
            fontSize: '0.85rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Staff Accounts Table */}
      <div className="table-container">
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
                          background: 'var(--bg-surface-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                          color: user.role === 'admin' ? '#c084fc' : user.role === 'cashier' ? 'var(--gold-light)' : '#34d399',
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
                          className={`btn btn-sm ${user.status === 'active' ? 'btn-secondary' : 'btn-emerald'}`}
                          onClick={() => toggleStaffStatus(user.id)}
                          title={user.status === 'active' ? 'Suspend staff account' : 'Reactivate account'}
                        >
                          {user.status === 'active' ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                          <span>{user.status === 'active' ? 'Suspend' : 'Activate'}</span>
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${user.fullName}'s account?`)) {
                              deleteStaffUser(user.id);
                            }
                          }}
                          title="Delete staff account"
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

      {/* Create Staff Account Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Staff Account"
        subtitle="Provision access for Cashier Terminal or Security Door verification"
        size="md"
      >
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', color: '#f87171', fontSize: '0.8rem', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreateSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alice Walker or Officer Sterling"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Login Email Address *</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. cashier1@clubshowdown.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="form-input"
              placeholder="Create strong password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Role & Portal Access *</label>
            <select
              className="form-select"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as 'cashier' | 'security' })}
            >
              <option value="cashier">💵 Cashier Portal (Tournaments, Entries & Cash Drawer)</option>
              <option value="security">🛡️ Security Portal (Entrance Verification, Age Check & Door Clearance)</option>
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
    </div>
  );
};
