import React from 'react';
import { KYCStatus, EntryVerificationStatus, MembershipTier, TournamentStatus, CashFlowType } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'default';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '', dot = true }) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
};

export const KYCBadge: React.FC<{ status: KYCStatus }> = ({ status }) => {
  switch (status) {
    case 'verified':
      return <Badge variant="success">KYC Verified</Badge>;
    case 'pending':
      return <Badge variant="warning">KYC Pending</Badge>;
    case 'rejected':
      return <Badge variant="danger">KYC Rejected</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

export const EntryBadge: React.FC<{ status: EntryVerificationStatus }> = ({ status }) => {
  switch (status) {
    case 'approved':
      return <Badge variant="success">Entry Approved</Badge>;
    case 'pending':
      return <Badge variant="warning">Awaiting Security</Badge>;
    case 'rejected':
      return <Badge variant="danger">Entry Denied</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

export const TierBadge: React.FC<{ tier: MembershipTier }> = ({ tier }) => {
  let className = 'tier-standard';
  if (tier === 'VIP' || tier === 'High Roller') className = 'tier-vip';
  else if (tier === 'Gold') className = 'tier-gold';
  else if (tier === 'Silver') className = 'tier-silver';

  return <span className={`badge ${className}`}>{tier}</span>;
};

export const TournamentStatusBadge: React.FC<{ status: TournamentStatus }> = ({ status }) => {
  switch (status) {
    case 'Registering':
      return <Badge variant="success">Registering</Badge>;
    case 'Running':
      return <Badge variant="purple">Live / Running</Badge>;
    case 'Upcoming':
      return <Badge variant="info">Upcoming</Badge>;
    case 'Completed':
      return <Badge variant="default">Completed</Badge>;
    case 'Cancelled':
      return <Badge variant="danger">Cancelled</Badge>;
  }
};

export const CashFlowBadge: React.FC<{ type: CashFlowType }> = ({ type }) => {
  if (type === 'in') {
    return <Badge variant="success">+ Cash In</Badge>;
  }
  return <Badge variant="danger">- Cash Out</Badge>;
};
