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

  const getDefaultEmail = () => {
    switch (portalRole) {
      case 'cashier':
        return 'cashier@club-restraddle.com';
      case 'security':
        return 'security@club-restraddle.com';
      case 'admin':
      default:
        return 'jaigoel2206@gmail.com';
    }
  };

  const [email, setEmail] = useState(getDefaultEmail());
  const [password, setPassword] = useState('12345');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getPortalInfo = () => {
    switch (portalRole) {
      case 'cashier':
        return {
          title: 'Cashier Desk Terminal',
          subtitle: 'Enter cashier or admin credentials to manage tournaments, billing, and vault ledger',
          color: '#e11d48',
          icon: <DollarSign size={28} color="#ffffff" />,
          allowedRoles: ['cashier', 'admin'],
        };
      case 'security':
        return {
          title: 'Security Door Control Station',
          subtitle: 'Enter security officer or admin credentials to verify members & issue door clearance',
          color: '#e11d48',
          icon: <ShieldCheck size={28} color="#ffffff" />,
          allowedRoles: ['security', 'admin'],
        };
      case 'admin':
      default:
        return {
          title: 'Executive Admin Center',
          subtitle: 'Super Admin credentials required for financial oversight, staff provisioning, and audit logs',
          color: '#e11d48',
          icon: <LayoutDashboard size={28} color="#ffffff" />,
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
        setErrorMessage(result.message || 'Invalid email or password.');
        setSubmitting(false);
        return;
      }

      // Check role authorization
      if (!portal.allowedRoles.includes(result.user.role)) {
        setErrorMessage(
          `Access Denied: Your account role is "${result.user.role.toUpperCase()}". Only ${portal.allowedRoles.map(r => r.toUpperCase()).join(' or ')} accounts can access this portal.`
        );
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      if (onSuccess) onSuccess();
    }, 300);
  };

  const handleSelectAccount = (accEmail: string, accPass: string = '12345') => {
    setEmail(accEmail);
    setPassword(accPass);
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

          {/* 1-Tap Quick Account Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
              Quick Fill Staff Account:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectAccount('jaigoel2206@gmail.com', '12345')}
                style={{
                  justifyContent: 'flex-start',
                  fontSize: '0.74rem',
                  padding: '6px 10px',
                  background: email === 'jaigoel2206@gmail.com' ? 'rgba(225, 29, 72, 0.25)' : undefined,
                  border: email === 'jaigoel2206@gmail.com' ? '1px solid #e11d48' : undefined,
                }}
              >
                👑 <strong>Super Admin</strong> (Jai Goel)
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectAccount('cashier@club-restraddle.com', '12345')}
                style={{
                  justifyContent: 'flex-start',
                  fontSize: '0.74rem',
                  padding: '6px 10px',
                  background: email === 'cashier@club-restraddle.com' ? 'rgba(225, 29, 72, 0.25)' : undefined,
                  border: email === 'cashier@club-restraddle.com' ? '1px solid #e11d48' : undefined,
                }}
              >
                💵 <strong>Cashier Desk</strong> (Elena Rostova)
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectAccount('security@club-restraddle.com', '12345')}
                style={{
                  justifyContent: 'flex-start',
                  fontSize: '0.74rem',
                  padding: '6px 10px',
                  background: email === 'security@club-restraddle.com' ? 'rgba(225, 29, 72, 0.25)' : undefined,
                  border: email === 'security@club-restraddle.com' ? '1px solid #e11d48' : undefined,
                }}
              >
                🛡️ <strong>Security Officer</strong> (Marcus Vance)
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ marginTop: '6px', width: '100%' }}
            disabled={submitting}
          >
            <Lock size={16} />
            {submitting ? 'Verifying Credentials...' : `Log In to ${portal.title}`}
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
