import React from 'react';

interface DesktopPortalHeaderProps {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  subtitle: React.ReactNode;
  actions?: React.ReactNode;
  notice?: React.ReactNode;
}

export const DesktopPortalHeader: React.FC<DesktopPortalHeaderProps> = ({
  icon,
  eyebrow,
  title,
  subtitle,
  actions,
  notice,
}) => (
  <section className="desktop-portal-header" aria-labelledby={`portal-title-${eyebrow.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className="desktop-portal-heading">
      <span className="desktop-portal-icon" aria-hidden="true">{icon}</span>
      <span className="desktop-portal-heading-copy">
        <span className="desktop-portal-eyebrow">{eyebrow}</span>
        <h1 id={`portal-title-${eyebrow.toLowerCase().replace(/\s+/g, '-')}`}>{title}</h1>
        <span className="desktop-portal-subtitle">{subtitle}</span>
      </span>
    </div>

    {(notice || actions) && (
      <div className="desktop-portal-controls">
        {notice && <div className="desktop-portal-notice">{notice}</div>}
        {actions && <div className="desktop-portal-actions">{actions}</div>}
      </div>
    )}
  </section>
);
