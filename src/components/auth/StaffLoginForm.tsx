import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Eye,
  EyeOff,
  Key,
  LayoutDashboard,
  Lock,
  Mail,
  ShieldCheck,
  UserRoundCog,
} from 'lucide-react';
import { useClub } from '../../context/ClubContext';

type StaffDesk = 'admin' | 'cashier' | 'security' | 'cash';

interface StaffLoginFormProps {
  portalRole: StaffDesk;
  onSuccess?: () => void;
  onBackToPlayer?: () => void;
}

const deskAccounts: Record<StaffDesk, Array<{ email: string; label: string; person: string }>> = {
  admin: [
    { email: 'jaigoel2206@gmail.com', label: 'Super admin', person: 'Jai Goel' },
    { email: 'shivamgupta@restraddle.club', label: 'Club owner', person: 'Shivam Gupta' },
    { email: 'rajbeergupta@restraddle.club', label: 'Club owner', person: 'Rajbeer Gupta' },
  ],
  cashier: [
    { email: 'cashier@club-restraddle.com', label: 'Cashier', person: 'Elena Rostova' },
    { email: 'jaigoel2206@gmail.com', label: 'Admin access', person: 'Jai Goel' },
  ],
  security: [
    { email: 'security@club-restraddle.com', label: 'Security', person: 'Marcus Vance' },
    { email: 'jaigoel2206@gmail.com', label: 'Admin access', person: 'Jai Goel' },
  ],
  cash: [
    { email: 'cashier@club-restraddle.com', label: 'Cashier desk', person: 'Elena Rostova' },
    { email: 'jaigoel2206@gmail.com', label: 'Super admin', person: 'Jai Goel' },
  ],
};

const defaultEmails: Record<StaffDesk, string> = {
  admin: 'jaigoel2206@gmail.com',
  cashier: 'cashier@club-restraddle.com',
  security: 'security@club-restraddle.com',
  cash: 'cashier@club-restraddle.com',
};

export const StaffLoginForm: React.FC<StaffLoginFormProps> = ({
  portalRole,
  onSuccess,
  onBackToPlayer,
}) => {
  const { loginStaff, setActiveRole } = useClub();
  const [selectedDesk, setSelectedDesk] = useState<StaffDesk>(portalRole);
  const [email, setEmail] = useState(defaultEmails[portalRole]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const portal = useMemo(() => {
    if (selectedDesk === 'cash') {
      return {
        title: 'Cash & Treasury Vault',
        subtitle: 'Payments, float balance, cash in / out & records',
        icon: DollarSign,
        allowedRoles: ['cashier', 'admin'],
      };
    }
    if (selectedDesk === 'cashier') {
      return {
        title: 'Cashier desk',
        subtitle: 'Entries, chip requests, events and vouchers',
        icon: DollarSign,
        allowedRoles: ['cashier', 'admin'],
      };
    }
    if (selectedDesk === 'security') {
      return {
        title: 'Security desk',
        subtitle: 'Door queue, player checks and approvals',
        icon: ShieldCheck,
        allowedRoles: ['security', 'admin'],
      };
    }
    return {
      title: 'Admin portal',
      subtitle: 'Players, staff, attendance and audit',
      icon: LayoutDashboard,
      allowedRoles: ['admin'],
    };
  }, [selectedDesk]);

  const PortalIcon = portal.icon;

  const handleDeskChange = (desk: StaffDesk) => {
    setSelectedDesk(desk);
    setActiveRole(desk);
    setEmail(defaultEmails[desk]);
    setPassword('');
    setErrorMessage(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSubmitting(true);

    window.setTimeout(() => {
      const result = loginStaff(email, password);
      if (!result.success || !result.user) {
        setErrorMessage(result.message || 'Email or password is incorrect.');
        setSubmitting(false);
        return;
      }

      if (!portal.allowedRoles.includes(result.user.role)) {
        setErrorMessage(`${result.user.fullName} does not have access to the ${portal.title.toLowerCase()}.`);
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      onSuccess?.();
    }, 250);
  };

  const fillDemoAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('12345');
    setErrorMessage(null);
  };

  return (
    <div className="staff-login-shell">
      <section className="staff-login-card" aria-labelledby="staff-login-title">
        <div className="staff-desk-tabs" role="group" aria-label="Choose staff portal">
          <button type="button" className={selectedDesk === 'admin' ? 'active' : ''} onClick={() => handleDeskChange('admin')}>
            <LayoutDashboard size={15} /> Admin
          </button>
          <button type="button" className={selectedDesk === 'cashier' ? 'active' : ''} onClick={() => handleDeskChange('cashier')}>
            <DollarSign size={15} /> Cashier
          </button>
          <button type="button" className={selectedDesk === 'security' ? 'active' : ''} onClick={() => handleDeskChange('security')}>
            <ShieldCheck size={15} /> Security
          </button>
        </div>

        <div className="staff-login-heading">
          <span className="staff-login-icon" aria-hidden="true"><PortalIcon size={25} /></span>
          <div>
            <h1 id="staff-login-title">{portal.title}</h1>
            <p>{portal.subtitle}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="staff-login-error" role="alert" aria-live="assertive">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="staff-login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="staff-email">Email</label>
            <div className="staff-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                id="staff-email"
                type="email"
                className="form-input"
                autoComplete="username"
                placeholder="name@restraddle.club"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="staff-password">Password</label>
            <div className="staff-input-wrap">
              <Key size={17} aria-hidden="true" />
              <input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="staff-password-toggle"
                onClick={() => setShowPassword(current => !current)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg staff-login-submit" disabled={submitting}>
            <Lock size={17} />
            {submitting ? 'Signing in…' : `Open ${portal.title}`}
          </button>
        </form>

        <details className="staff-demo-access">
          <summary><UserRoundCog size={16} /> Demo access</summary>
          <p>Tap an account to fill the training credentials.</p>
          <div className="staff-demo-list">
            {deskAccounts[selectedDesk].map(account => (
              <button
                key={account.email}
                type="button"
                className={email === account.email && password ? 'selected' : ''}
                onClick={() => fillDemoAccount(account.email)}
              >
                <span><strong>{account.label}</strong><small>{account.person}</small></span>
                <span>Use account</span>
              </button>
            ))}
          </div>
        </details>

        <button
          type="button"
          className="btn btn-ghost btn-sm staff-back-link"
          onClick={() => onBackToPlayer ? onBackToPlayer() : setActiveRole('player')}
        >
          <ArrowLeft size={15} /> Player portal
        </button>
      </section>
    </div>
  );
};
