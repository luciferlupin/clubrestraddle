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
  const [selectedDesk, setSelectedDesk] = useState<'admin' | 'cashier' | 'security'>(portalRole);

  const getDefaultEmail = (desk: 'admin' | 'cashier' | 'security') => {
    switch (desk) {
      case 'cashier':
        return 'cashier@club-restraddle.com';
      case 'security':
        return 'security@club-restraddle.com';
      case 'admin':
      default:
        return 'jaigoel2206@gmail.com';
    }
  };

  const [email, setEmail] = useState(getDefaultEmail(portalRole));
  const [password, setPassword] = useState('12345');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync state whenever portalRole changes externally
  React.useEffect(() => {
    setSelectedDesk(portalRole);
    setEmail(getDefaultEmail(portalRole));
    setPassword('12345');
    setErrorMessage(null);
  }, [portalRole]);

  const handleDeskChange = (desk: 'admin' | 'cashier' | 'security') => {
    setSelectedDesk(desk);
    setActiveRole(desk);
    setEmail(getDefaultEmail(desk));
    setPassword('12345');
    setErrorMessage(null);
  };

  const getPortalInfo = () => {
    switch (selectedDesk) {
      case 'cashier':
        return {
          title: 'Cashier Desk Terminal',
          subtitle: 'Manage tournament buy-ins, player seating, cash transactions & prize pool payouts',
          color: '#e11d48',
          icon: <DollarSign size={26} color="#ffffff" />,
          allowedRoles: ['cashier', 'admin'],
        };
      case 'security':
        return {
          title: 'Security Door Control Station',
          subtitle: 'Verify player Aadhaar / PAN documents, live camera QR scanner & door clearance',
          color: '#e11d48',
          icon: <ShieldCheck size={26} color="#ffffff" />,
          allowedRoles: ['security', 'admin'],
        };
      case 'admin':
      default:
        return {
          title: 'Executive Admin Center',
          subtitle: 'Super Admin credentials required for financial oversight, staff accounts & audit trail',
          color: '#e11d48',
          icon: <LayoutDashboard size={26} color="#ffffff" />,
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
        setErrorMessage(result.message || 'Invalid staff email or password.');
        setSubmitting(false);
        return;
      }

      // Check role authorization
      if (!portal.allowedRoles.includes(result.user.role)) {
        setErrorMessage(
          `Access Denied: Your account role is "${result.user.role.toUpperCase()}". Only ${portal.allowedRoles.map(r => r.toUpperCase()).join(' or ')} accounts can access this desk.`
        );
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      if (onSuccess) onSuccess();
    }, 250);
  };

  const handleSelectAccount = (accEmail: string, accPass: string = '12345') => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMessage(null);

    // Auto-align desk to the account's primary role
    if (accEmail.includes('cashier')) {
      setSelectedDesk('cashier');
      setActiveRole('cashier');
    } else if (accEmail.includes('security')) {
      setSelectedDesk('security');
      setActiveRole('security');
    } else {
      setSelectedDesk('admin');
      setActiveRole('admin');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '72vh',
        padding: '16px',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '460px',
          width: '100%',
          border: '1.5px solid rgba(225, 29, 72, 0.5)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.8), 0 0 30px rgba(225, 29, 72, 0.15)',
          padding: '28px',
          background: '#0d0407',
        }}
      >
        {/* Station Selection Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            background: '#15060b',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid rgba(225, 29, 72, 0.3)',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => handleDeskChange('admin')}
            style={{
              padding: '7px 4px',
              borderRadius: '7px',
              border: 'none',
              background: selectedDesk === 'admin' ? 'linear-gradient(135deg, #e11d48, #9f1239)' : 'transparent',
              color: selectedDesk === 'admin' ? '#ffffff' : '#94a3b8',
              fontWeight: selectedDesk === 'admin' ? 800 : 600,
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <LayoutDashboard size={13} /> Admin
          </button>

          <button
            type="button"
            onClick={() => handleDeskChange('cashier')}
            style={{
              padding: '7px 4px',
              borderRadius: '7px',
              border: 'none',
              background: selectedDesk === 'cashier' ? 'linear-gradient(135deg, #e11d48, #9f1239)' : 'transparent',
              color: selectedDesk === 'cashier' ? '#ffffff' : '#94a3b8',
              fontWeight: selectedDesk === 'cashier' ? 800 : 600,
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <DollarSign size={13} /> Cashier
          </button>

          <button
            type="button"
            onClick={() => handleDeskChange('security')}
            style={{
              padding: '7px 4px',
              borderRadius: '7px',
              border: 'none',
              background: selectedDesk === 'security' ? 'linear-gradient(135deg, #e11d48, #9f1239)' : 'transparent',
              color: selectedDesk === 'security' ? '#ffffff' : '#94a3b8',
              fontWeight: selectedDesk === 'security' ? 800 : 600,
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
          >
            <ShieldCheck size={13} /> Security
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'rgba(225, 29, 72, 0.15)',
              border: '1.5px solid #e11d48',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
              boxShadow: '0 0 16px rgba(225, 29, 72, 0.25)',
            }}
          >
            {portal.icon}
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>{portal.title}</h2>
          <p style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '4px' }}>
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
                onClick={() => handleSelectAccount('shivamgupta@restraddle.club', '12345')}
                style={{
                  justifyContent: 'flex-start',
                  fontSize: '0.74rem',
                  padding: '6px 10px',
                  background: email === 'shivamgupta@restraddle.club' ? 'rgba(225, 29, 72, 0.25)' : undefined,
                  border: email === 'shivamgupta@restraddle.club' ? '1px solid #e11d48' : undefined,
                }}
              >
                👑 <strong>Club Owner / Admin</strong> (Shivam Gupta)
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSelectAccount('rajbeergupta@restraddle.club', '12345')}
                style={{
                  justifyContent: 'flex-start',
                  fontSize: '0.74rem',
                  padding: '6px 10px',
                  background: email === 'rajbeergupta@restraddle.club' ? 'rgba(225, 29, 72, 0.25)' : undefined,
                  border: email === 'rajbeergupta@restraddle.club' ? '1px solid #e11d48' : undefined,
                }}
              >
                👑 <strong>Club Owner / Admin</strong> (Rajbeer Gupta)
              </button>

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
