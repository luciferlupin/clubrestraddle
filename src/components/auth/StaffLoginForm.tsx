import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Key,
  ShieldCheck,
  DollarSign,
  LayoutDashboard,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';
import { UserRole } from '../../types';

interface StaffLoginFormProps {
  portalRole: 'cashier' | 'security' | 'admin';
  onSuccess?: () => void;
  onBackToPlayer?: () => void;
}

export const StaffLoginForm: React.FC<StaffLoginFormProps> = ({
  portalRole,
  onSuccess,
  onBackToPlayer,
}) => {
  const { loginStaff, setActiveRole } = useClub();
  const [email, setEmail] = useState('jaigoel2206@gmail.com');
  const [password, setPassword] = useState('12345');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getPortalInfo = () => {
    switch (portalRole) {
      case 'cashier':
        return {
          title: 'Cashier Terminal Access',
          subtitle: 'Enter cashier or admin credentials to manage tournaments, billing and cash ledger',
          color: 'var(--gold-light)',
          icon: <DollarSign size={28} color="var(--gold-light)" />,
          allowedRoles: ['cashier', 'admin'],
        };
      case 'security':
        return {
          title: 'Security Door Control',
          subtitle: 'Enter security officer or admin credentials to verify members & door clearance',
          color: '#34d399',
          icon: <ShieldCheck size={28} color="#34d399" />,
          allowedRoles: ['security', 'admin'],
        };
      case 'admin':
      default:
        return {
          title: 'Executive Admin Portal',
          subtitle: 'Super Admin login for financial oversight, audit trail & staff account creation',
          color: '#c084fc',
          icon: <LayoutDashboard size={28} color="#c084fc" />,
          allowedRoles: ['admin'],
        };
    }
  };

  const portal = getPortalInfo();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    setTimeout(() => {
      const result = loginStaff(email, password);

      if (!result.success || !result.user) {
        setErrorMessage(result.message || 'Authentication failed.');
        setSubmitting(false);
        return;
      }

      // Check role authorization
      if (!portal.allowedRoles.includes(result.user.role)) {
        setErrorMessage(
          `Unauthorized: Your account role is "${result.user.role.toUpperCase()}". Only ${portal.allowedRoles.map(r => r.toUpperCase()).join(' or ')} accounts can access this portal.`
        );
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      if (onSuccess) onSuccess();
    }, 300);
  };

  const handleFillAdmin = () => {
    setEmail('jaigoel2206@gmail.com');
    setPassword('12345');
    setErrorMessage(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '16px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          border: `1.5px solid ${portal.color}`,
          boxShadow: `0 12px 40px rgba(0,0,0,0.8), 0 0 25px rgba(245, 158, 11, 0.08)`,
          padding: '28px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${portal.color}`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            {portal.icon}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>{portal.title}</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {portal.subtitle}
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.82rem',
              color: '#f87171',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <span>Staff Email Address</span>
              <button
                type="button"
                onClick={handleFillAdmin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold-light)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Sparkles size={12} /> Auto-fill Admin
              </button>
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="staff@clubpoker.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Staff Password</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '15px', color: '#94a3b8' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '14px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Quick Default Credentials Callout */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <strong>Default Super Admin:</strong> <br />
            Email: <code style={{ color: 'var(--gold-light)' }}>jaigoel2206@gmail.com</code> | Pass: <code style={{ color: 'var(--gold-light)' }}>12345</code>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ marginTop: '6px', width: '100%' }}
            disabled={submitting}
          >
            <Lock size={16} />
            {submitting ? 'Verifying Credentials...' : 'Secure Staff Login'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              if (onBackToPlayer) onBackToPlayer();
              else setActiveRole('player');
            }}
          >
            <ArrowLeft size={14} /> Back to Player Portal
          </button>
        </div>
      </div>
    </div>
  );
};
