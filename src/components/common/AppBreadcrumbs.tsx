import React from 'react';
import { ChevronRight, ArrowLeft, Home, Shield, DollarSign, User, LayoutDashboard, Coins } from 'lucide-react';
import { UserRole } from '../../types';
import { CardSuit } from './PokerGraphics';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
  onBack?: () => void;
  backLabel?: string;
  activeRole?: UserRole;
  className?: string;
  rightAction?: React.ReactNode;
}

export const AppBreadcrumbs: React.FC<AppBreadcrumbsProps> = ({
  items,
  onBack,
  backLabel = 'Back',
  activeRole,
  className = '',
  rightAction,
}) => {
  const getRoleIcon = (role?: UserRole) => {
    switch (role) {
      case 'player':
        return <User size={13} color="#fda4af" />;
      case 'cashier':
        return <DollarSign size={13} color="#ffffff" />;
      case 'cash':
        return <Coins size={13} color="#fbbf24" />;
      case 'security':
        return <Shield size={13} color="#ffffff" />;
      case 'admin':
        return <LayoutDashboard size={13} color="#ffffff" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'player':
        return 'Player Lounge';
      case 'cashier':
        return 'Cashier Desk';
      case 'cash':
        return 'Cash Vault';
      case 'security':
        return 'Security Door';
      case 'admin':
        return 'Admin Command';
      default:
        return '';
    }
  };

  return (
    <nav className={`app-breadcrumbs-bar ${className}`.trim()} aria-label="Breadcrumbs & Location">
      <div className="breadcrumbs-left">
        {onBack && (
          <button
            type="button"
            className="breadcrumb-back-btn"
            onClick={onBack}
            aria-label={`Go back: ${backLabel}`}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span>{backLabel}</span>
          </button>
        )}

        <ol className="breadcrumb-list">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={index} className={`breadcrumb-item ${isLast ? 'active' : ''}`}>
                {index > 0 && (
                  <span className="breadcrumb-separator" aria-hidden="true">
                    <ChevronRight size={13} />
                  </span>
                )}

                {isLast || !item.onClick ? (
                  <span className="breadcrumb-current" aria-current={isLast ? 'page' : undefined}>
                    {item.icon && <span className="breadcrumb-item-icon">{item.icon}</span>}
                    <span>{item.label}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="breadcrumb-link"
                    onClick={item.onClick}
                  >
                    {item.icon && <span className="breadcrumb-item-icon">{item.icon}</span>}
                    <span>{item.label}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="breadcrumbs-right">
        {activeRole && (
          <span className={`breadcrumb-role-pill role-${activeRole}`}>
            {getRoleIcon(activeRole)}
            <span>{getRoleLabel(activeRole)}</span>
          </span>
        )}
        {rightAction}
      </div>
    </nav>
  );
};
